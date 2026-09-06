import psutil
import time
import logging
from prometheus_client import start_http_server, Gauge

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='server_overload.log'
)

# Prometheus Metrics
CPU_USAGE = Gauge('server_cpu_usage_percent', 'CPU usage in percent')
RAM_USAGE = Gauge('server_ram_usage_percent', 'RAM usage in percent')
DISK_USAGE = Gauge('server_disk_usage_percent', 'Disk usage in percent')
NET_SENT = Gauge('server_network_sent_bytes', 'Network bytes sent')
NET_RECV = Gauge('server_network_recv_bytes', 'Network bytes received')

# Thresholds for overload logging
CPU_THRESHOLD = 80.0
RAM_THRESHOLD = 80.0
DISK_THRESHOLD = 90.0

def get_server_metrics():
    """Retrieves current server resource usage."""
    metrics = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "net_io": psutil.net_io_counters()
    }
    
    # Update Prometheus gauges
    CPU_USAGE.set(metrics["cpu_percent"])
    RAM_USAGE.set(metrics["ram_percent"])
    DISK_USAGE.set(metrics["disk_percent"])
    NET_SENT.set(metrics["net_io"].bytes_sent)
    NET_RECV.set(metrics["net_io"].bytes_recv)
    
    return metrics

def check_overload(metrics):
    """Logs warnings if resource usage exceeds thresholds."""
    if metrics["cpu_percent"] > CPU_THRESHOLD:
        logging.warning(f"CRITICAL: CPU Overload detected! Current: {metrics['cpu_percent']}%")
        
    if metrics["ram_percent"] > RAM_THRESHOLD:
        logging.warning(f"CRITICAL: RAM Overload detected! Current: {metrics['ram_percent']}%")
        
    if metrics["disk_percent"] > DISK_THRESHOLD:
        logging.warning(f"CRITICAL: Disk Space Low! Current: {metrics['disk_percent']}%")

def start_monitoring(port=8000):
    """Starts the Prometheus exporter and monitoring loop."""
    start_http_server(port)
    print(f"Monitoring exporter started on port {port}")
    
    while True:
        try:
            metrics = get_server_metrics()
            check_overload(metrics)
            time.sleep(5) # Collect every 5 seconds
        except Exception as e:
            print(f"Monitoring error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    start_monitoring()
