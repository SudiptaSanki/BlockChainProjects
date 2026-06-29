# 🚀 Vesta Payroll: Decentralized Salary Streaming & Payroll Dashboard

Vesta Payroll is a premium decentralized application (dApp) built on the Stellar network and Soroban smart contracts. It enables employers to stream salaries to employees in real-time, providing secure, trustless payroll management.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic salary transfers on-chain.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing payroll logic.
  - `frontend/`: React + Vite dashboard interacting with deployed contracts and supporting multi-wallet signatures.

---

## ⚙️ Vesta Payroll Protocol

```mermaid
graph TD
    A[Employer / HR] -->|Deposit Payroll Funds| B(Vesta Payroll Contract)
    B -->|Time-Locked Streaming| C{Employee Accounts}
    C -->|Withdraw Available Salary| D[Employee Wallet]
    D -->|Real-Time On-chain Event| E[Dashboard Sync]
```

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payment transactions to distribute payroll.
- **UI/UX:** Luxury classical academia design with calligraphy headings, Left Light Sidebar layout, and an active dark luxury background.

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
![Level 1 Submission Screenshot](./screenshots/level1_vesta_payroll.png)

---

## 🟡 Level 2: Yellow Belt (Smart Contracts & Event Sync)

### 📝 Requirements & Features
- **Multi-Wallet Support:** Seamless selection panel supporting Freighter, MetaMask (via EVM-to-Stellar Snaps), xBull, and LOBSTR.
- **Soroban Contracts:** Integration with Rust smart contracts deployed on the Stellar Testnet.
- **On-chain Sync:** Real-time event subscription log mirroring smart contract state and transactions.
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

### ⚙️ Verification Details
- **Deployed Contract Address:** `CC1VESTAPAYROLL...`
- **Transaction Hash (Stellar Explorer):** `c88ef97cbd983b618991c0b39e6a0d2f1be7399a9b6c161cd5d7f12e88a38b8c`

### 📸 Submission Screenshots

#### Deployed Contract Called & Transaction Result
![Level 2 Contract Call](./screenshots/level2_transaction_vesta_payroll.png)
