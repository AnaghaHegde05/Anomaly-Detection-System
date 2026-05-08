# Blockchain Consensus & Anomaly Detection System

This project is a decentralized anomaly monitoring and logging system. It uses a machine learning ensemble on the backend to detect anomalies in website performance and logs confirmed events on a local Ethereum-compatible blockchain for immutability and transparency.

## Project Structure

- **/blockchain**: Hardhat-based smart contract project.
- **/backend**: Python/Flask API for anomaly detection and blockchain interaction.
- **/frontend**: Vite/React application for visualizing logs and monitoring status.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Python 3.x](https://www.python.org/)
- [Git](https://git-scm.com/)

---

## Getting Started

Follow these steps to run the entire stack locally.

### 1. Setup and Run the Blockchain

Navigate to the `blockchain` directory, install dependencies, and start a local node.

```bash
cd blockchain
npm install
npx hardhat node
```

In a **new terminal window**, deploy the smart contract:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

*Note: Take note of the deployed contract address. It is automatically saved to `contract_address.txt` in the root.*

### 2. Setup and Run the Backend

Navigate to the `backend` directory, set up a virtual environment, and install requirements.

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

### 3. Setup and Run the Frontend

Navigate to the `frontend` directory, install dependencies, and start the development server.

```bash
cd frontend
npm install
npm run dev
```

The application should now be running at `http://localhost:5173`.

---

## How it Works

1. **Monitoring**: The backend pings target websites and collects performance metrics.
2. **Detection**: A machine learning ensemble (multiple models) analyzes the metrics to identify anomalies.
3. **Consensus**: A consensus mechanism validates the anomaly detection results.
4. **Logging**: Confirmed anomalies are sent to the local blockchain via the smart contract.
5. **Visualization**: The frontend fetches and displays these logs in real-time.

---

## Troubleshooting

- **Port Conflicts**: Ensure ports `8545` (Blockchain), `5000` (Backend), and `5173` (Frontend) are available.
- **Contract Address**: If you re-deploy the contract, ensure the backend is updated with the new address (it usually reads from `contract_address.txt`).
