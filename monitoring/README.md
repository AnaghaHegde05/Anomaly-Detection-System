# Server Resource Monitoring Setup

This directory contains the configuration for Prometheus and Grafana to visualize the server resource metrics collected by the backend.

## Prerequisites

- **Docker & Docker Compose**: Required to run the monitoring stack easily.

## Getting Started

1. **Start the Monitoring Stack**:
   From the root directory or the `monitoring` folder, run:
   ```bash
   docker-compose up -d
   ```

2. **Access the Dashboards**:
   - **Prometheus**: [http://localhost:9090](http://localhost:9090)
   - **Grafana**: [http://localhost:3001](http://localhost:3001) (Default login: `admin` / `admin`)

3. **Configure Grafana**:
   - Go to **Connections** -> **Data Sources** -> **Add Data Source**.
   - Select **Prometheus**.
   - Set the URL to `http://prometheus:9090`.
   - Click **Save & Test**.

4. **Import Dashboard**:
   - Go to **Dashboards** -> **New** -> **Import**.
   - You can create panels for the following metrics:
     - `server_cpu_usage_percent`
     - `server_ram_usage_percent`
     - `server_disk_usage_percent`
     - `server_network_sent_bytes`
     - `server_network_recv_bytes`

## How it works

The Python backend starts a Prometheus exporter on port `8000`. Prometheus is configured in `prometheus.yml` to scrape this endpoint every 5 seconds. Grafana then visualizes this data.

Overload conditions are logged to `backend/server_overload.log` automatically.
