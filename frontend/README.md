# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.




Terminal 1 — Start the Hardhat Blockchain Node
powershell
cd d:\blockchain_consensus\blockchain
npx hardhat node
This starts a local Ethereum node on http://127.0.0.1:8545. Keep this running.

Terminal 2 — Start the Flask Backend
powershell
cd d:\blockchain_consensus
.\venv\Scripts\Activate.ps1
cd backend
python app.py
This starts the Flask API on http://localhost:5000. It connects to the Hardhat node and loads the ML models.

Note: The contract is already deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 (saved in contract_address.txt), so no re-deployment needed.

Terminal 3 — Start the React Frontend
powershell
cd d:\blockchain_consensus\frontend
npm run dev
This starts the Vite dev server, usually at http://localhost:5173.

Quick Checklist
Step	Service	Port	Status Check
1	Hardhat Node	8545	Should show "Started HTTP and WebSocket JSON-RPC server"
2	Flask API	5000	Visit http://localhost:5000/api/anomalies
3	React Frontend	5173	Opens in browser automatically