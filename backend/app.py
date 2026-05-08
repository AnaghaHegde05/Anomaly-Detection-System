from flask import Flask, request, jsonify
from flask_cors import CORS
from monitor import check_website
from ensemble import run_prediction
from blockchain import log_anomaly_to_blockchain, get_anomalies
import time
import json
import hashlib

app = Flask(__name__)
CORS(app)

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
        
    return jsonify({
        "url": url,
        "metrics": metrics,
        "prediction": prediction_results,
        "blockchain_log": blockchain_receipt
    })

@app.route('/api/anomalies', methods=['GET'])
def fetch_anomalies():
    anomalies = get_anomalies()
    return jsonify(anomalies)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
