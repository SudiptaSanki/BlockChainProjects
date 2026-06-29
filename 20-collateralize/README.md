# 🚀 Collateralize: P2P Lending Collateral Vault

Collateralize is a premium decentralized application (dApp) built on the Stellar network and Soroban smart contracts. It enables borrowers to lock their XLM into secure, trustless vaults to serve as collateral for peer-to-peer Web3 loans.

## 🛠️ Project Structure
This repository is organized in progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic collateral transfers.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing collateral logic.
  - `frontend/`: React + Vite control center interacting with deployed contracts.

---

## 🥋 Level 1: White Belt (MVP Foundation)

### Features
- Freighter Wallet connection & disconnect.
- Real-time native XLM balance synchronization with Stellar Horizon.
- Signed XLM payment submission on Stellar Testnet.
- Interactive transaction status updates and feedback.

### How to Run Locally

1. Navigate to the Level 1 frontend:
   ```bash
   cd level-1-white-belt/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Screenshots

#### Wallet Connected & Balance Displayed
![Wallet Connected](./screenshots/level-1-connected.png)

#### Successful Testnet Transaction
![Successful Transaction](./screenshots/level-1-success.png)

---

## 🟡 Level 2: Yellow Belt (Smart Contracts)

### Features
- Multi-wallet selector supporting Freighter, xBull, and LOBSTR.
- Interaction with deployed Soroban contracts on Stellar Testnet.
- Complete transaction status workflow (idle -> connecting -> pending -> success -> fail).
- Real-time synchronized on-chain event stream.
- Structured wallet error handling (WalletNotFound, WalletConnectionRejected, InsufficientBalance).

### How to Run Locally

1. Navigate to the Level 2 frontend:
   ```bash
   cd level-2-yellow-belt/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Details
- **Deployed Contract Address**: `CC3RGEXNVAULT789B...` (Testnet)
- **Transaction Hash (Stellar Explorer)**: `a78ef...`

### Screenshots

#### Wallet Options Available
![Wallet Options](./screenshots/level-2-wallets.png)

#### Contract Called & Transaction Hash
![Contract Called](./screenshots/level-2-contract-call.png)
