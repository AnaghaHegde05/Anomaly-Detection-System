from flask import Flask, request, jsonify
from flask_cors import CORS
from monitor import check_website
from ensemble import run_prediction
from blockchain import log_anomaly_to_blockchain, get_anomalies
import time
import json
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from server_stats import start_monitoring, get_server_metrics

app = Flask(__name__)
CORS(app)

def generate_reasoning(metrics, prediction):
    reasons = []
    
    # 1. Status Code Analysis
    if metrics['status_code'] >= 400:
        reasons.append({
            "id": "status",
            "label": f"HTTP Error {metrics['status_code']}",
            "severity": "high",
            "description": "The server returned an error status, indicating a service failure."
        })
    
    # 2. Performance Analysis
    if metrics['response_time_ms'] > 2000:
        reasons.append({
            "id": "latency",
            "label": "Extreme Latency",
            "severity": "high",
            "description": f"Response time ({metrics['response_time_ms']:.0f}ms) is significantly above the performance threshold."
        })
    elif metrics['response_time_ms'] > 800:
        reasons.append({
            "id": "latency",
            "label": "Elevated Latency",
            "severity": "medium",
            "description": "Higher than normal response time detected by the models."
        })
        
    # 3. Throughput Analysis
    if metrics['throughput_kbps'] < 10:
        reasons.append({
            "id": "throughput",
            "label": "Critical Throughput Drop",
            "severity": "medium",
            "description": "Extremely low data transfer rate detected."
        })
        
    # 4. Consensus Weight
    if prediction['anomaly_votes'] == 3:
        reasons.append({
            "id": "consensus",
            "label": "Full Model Consensus",
            "severity": "info",
            "description": "All 3 ML models (RF, XGB, Meta) confirmed this anomaly independently."
        })
        
    return reasons

@app.route('/api/monitor', methods=['POST'])
def monitor_url():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"error": "URL is required"}), 400
        
    # 1. Extract metrics & synthesize features
    metrics, features = check_website(url)
    
    # 2. Run Ensemble ML Models
    try:
        prediction_results = run_prediction(features)
    except Exception as e:
        return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500
        
    # 3. Blockchain Logging if anomaly confirmed
    blockchain_receipt = None
    if prediction_results['consensus_anomaly']:
        # Hash the data to maintain privacy
        data_to_hash = json.dumps({
            "metrics": metrics,
            "features": features
        }, sort_keys=True)
        data_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
        
        timestamp = int(time.time())
        
        blockchain_receipt = log_anomaly_to_blockchain(url, data_hash, timestamp)
        
    # Generate transparency reasoning
    reasoning = generate_reasoning(metrics, prediction_results)
        
    return jsonify({
        "url": url,
        "metrics": metrics,
        "prediction": prediction_results,
        "reasoning": reasoning,
        "blockchain_log": blockchain_receipt
    })

def monitor_single_url(url):
    """Runs the full monitoring pipeline for a single URL and returns structured result."""
    try:
        metrics, features = check_website(url)
        try:
            prediction_results = run_prediction(features)
        except Exception as e:
            return {"url": url, "error": f"Model prediction failed: {str(e)}"}

        blockchain_receipt = None
        if prediction_results['consensus_anomaly']:
            data_to_hash = json.dumps({"metrics": metrics, "features": features}, sort_keys=True)
            data_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
            timestamp = int(time.time())
            blockchain_receipt = log_anomaly_to_blockchain(url, data_hash, timestamp)

        reasoning = generate_reasoning(metrics, prediction_results)
        return {
            "url": url,
            "metrics": metrics,
            "prediction": prediction_results,
            "reasoning": reasoning,
            "blockchain_log": blockchain_receipt
        }
    except Exception as e:
        return {"url": url, "error": str(e)}

@app.route('/api/monitor-bulk', methods=['POST'])
def monitor_bulk():
    data = request.json
    urls = data.get('urls', [])

    if not urls or not isinstance(urls, list):
        return jsonify({"error": "A list of URLs is required"}), 400

    if len(urls) > 10:
        return jsonify({"error": "Maximum 10 URLs allowed per batch"}), 400

    results = [None] * len(urls)
    with ThreadPoolExecutor(max_workers=min(len(urls), 10)) as executor:
        future_to_index = {executor.submit(monitor_single_url, url): i for i, url in enumerate(urls)}
        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            results[idx] = future.result()

    return jsonify({"results": results})

@app.route('/api/anomalies', methods=['GET'])
def fetch_anomalies():
    anomalies = get_anomalies()
    return jsonify(anomalies)

@app.route('/api/server-stats', methods=['GET'])
def fetch_server_stats():
    stats = get_server_metrics()
    # Format for frontend
    return jsonify({
        "cpu": stats["cpu_percent"],
        "ram": stats["ram_percent"],
        "disk": stats["disk_percent"],
        "network": {
            "sent": stats["net_io"].bytes_sent,
            "recv": stats["net_io"].bytes_recv
        }
    })

if __name__ == '__main__':
    # Start server resource monitoring in a background thread
    monitor_thread = threading.Thread(target=start_monitoring, daemon=True)
    monitor_thread.start()
    
    app.run(debug=True, port=5000, use_reloader=False)
