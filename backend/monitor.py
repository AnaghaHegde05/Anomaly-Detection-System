import requests
import time
import math
import socket
from urllib.parse import urlparse

def check_website(url):
    """
    Pings the website and calculates real metrics.
    Then synthesizes the 7 features required by the models.
    """
    # Ensure URL has protocol
    if not url.startswith("http"):
        url = "https://" + url

    def measure_latency(url):
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2)
            st = time.time()
            s.connect((host, port))
            et = time.time()
            s.close()
            return (et - st) * 1000
        except:
            return None

    try:
        latency = measure_latency(url)
        
        start_time = time.time()
        response = requests.get(url, timeout=5)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000 # in ms
        ttfb = response.elapsed.total_seconds() * 1000 # in ms
        if latency is None:
            latency = ttfb / 2 # fallback
            
        page_load_time = response_time
        
        # Throughput in KB/s
        content_length_bytes = len(response.content)
        throughput_kbps = (content_length_bytes / 1024) / max(0.001, (page_load_time / 1000))

        status_code = response.status_code
        error_rate = 0.0 if status_code < 400 else 1.0
        
    except requests.exceptions.RequestException as e:
        response_time = 5000.0 # Timeout or max
        page_load_time = 5000.0
        ttfb = 5000.0
        latency = 5000.0
        throughput_kbps = 0.0
        status_code = 500
        error_rate = 1.0

    # Synthetic mapping to the 7 features expected by models:
    # 1. gas_used: scaled response time
    gas_used = response_time * 10000 
    
    # 2. transaction_count: inverse of response time, bounded
    transaction_count = max(1, int(10000 / max(1, response_time)))
    if error_rate > 0: transaction_count = 0
    
    # 3. log_difficulty: related to status code
    log_difficulty = math.log1p(status_code) * 2
    
    # 4. block_score: 100 for normal, lower for errors
    block_score = 100 - (error_rate * 50) - (response_time / 100)
    
    # 5. gas_transaction_ratio: 
    gas_transaction_ratio = gas_used / max(1, transaction_count)
    
    # 6. log_total_difficulty: 
    log_total_difficulty = log_difficulty * 1.5
    
    # 7. difficulty_gas_interaction
    difficulty_gas_interaction = log_difficulty * gas_used / 10000

    features = {
        'gas_used': gas_used,
        'transaction_count': transaction_count,
        'log_difficulty': log_difficulty,
        'block_score': block_score,
        'gas_transaction_ratio': gas_transaction_ratio,
        'log_total_difficulty': log_total_difficulty,
        'difficulty_gas_interaction': difficulty_gas_interaction
    }
    
    metrics = {
        "response_time_ms": response_time,
        "page_load_time_ms": page_load_time,
        "ttfb_ms": ttfb,
        "latency_ms": latency,
        "throughput_kbps": throughput_kbps,
        "status_code": status_code,
        "error_rate": error_rate
    }
    
    return metrics, features
