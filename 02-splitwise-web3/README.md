# 🚀 Splitwise Web3: On-Chain Shared Expense Settlement

Splitwise Web3 is a premium decentralized application (dApp) built on the Stellar network and Soroban smart contracts. It enables users to split expenses and settle debts trustlessly on-chain.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic expense transfers on-chain.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing expense splitting logic.
  - `frontend/`: React + Vite control center interacting with deployed contracts and supporting multi-wallet signatures.

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payment transactions to split and settle expenses.
- **UI/UX:** Responsive, premium interface featuring a **Neon Syndicate** cyberpunk theme with Hot Pink neon accents and scanlines.

### 💻 How to Run Locally
1. Navigate to the Level 1 frontend folder:
   ```bash
   cd level-1-white-belt/frontend
   ```
2. Install dependencies (ignoring lifecycle scripts if on Windows):
   ```bash
   npm install --ignore-scripts
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

### 📸 Submission Screenshots

#### Wallet Connection, Balance Display, & Successful Testnet Transaction
![Level 1 Submission Screenshot](./screenshots/level1_splitwise_web3.png)

---

## 🟡 Level 2: Yellow Belt (Smart Contracts & Event Sync)

### 📝 Requirements & Features
- **Multi-Wallet Support:** Seamless selection panel supporting Freighter, MetaMask (via EVM-to-Stellar Snaps), xBull, and LOBSTR.
- **Soroban Contracts:** Integration with Rust smart contracts deployed on the Stellar Testnet.
- **On-chain Sync:** Real-time event subscription log mirroring smart contract state and split settlements.
- **Error Handling:** 3 handled error conditions (`WalletNotFound`, `WalletConnectionRejected`, `InsufficientBalance`).
- **Interactive Simulator:** Fast testing capability for key network operations and error compliance.

### 💻 How to Run Locally
1. Navigate to the Level 2 frontend folder:
   ```bash
   cd level-2-yellow-belt/frontend
   ```
2. Install the necessary dependencies (ignoring lifecycle scripts if on Windows):
   ```bash
   npm install --ignore-scripts
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```

### 📸 Submission Screenshots

#### 1. Wallet Options Available (MetaMask, Freighter, etc.)
![Level 2 Contract Call](./screenshots/level2_transaction_splitwise_web3.png)

#### 2. Deployed Contract Address
- **Contract ID:** `CC3RSPLITWISEVAULT...TESTNET` (Replace with your actual contract)

#### 3. Transaction Hash (MetaMask Testnet Transaction)
- **Tx Hash:** *(Replace with your hash)*

#### 4. Live Demo Link
- **Live Demo:** *(Replace with Vercel/Netlify link)*
