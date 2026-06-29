# 🚀 MicroPay: High-Frequency streaming payments

MicroPay is a premium decentralized micropayments streaming platform built on the Stellar network and Soroban smart contracts. It enables developers to construct metered pay-as-you-go tunnels for API services, content monetization, and high-frequency IoT streaming payments.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic stream allocations.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts locking channel collateral and verifying channel settlement.
  - `frontend/`: React + Vite metered streaming console and multi-wallet settle manager.

---

## ⚙️ MicroPay Stream Channel Workflow

```mermaid
graph TD
    A[API Client] -->|Deposit Collateral| B[Stellar MicroPay Contract]
    B -->|Collateral Locked| C[Channel Established]
    C -->|Programmatic Off-chain streams| D{Validate Metered API Usage}
    D -->|0.001 XLM / Request| E[Off-chain State Signed]
    E -->|Cumulative balance increments| F[Latest Valid State]
    F -->|Submit Close Channel| G[On-chain Settlement]
    G -->|Disburse earned value| H[Provider Wallet]
    G -->|Refund unused collateral| I[Client Wallet]
```

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` and `@creit.tech/stellar-wallets-kit` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payments to lock stream channel capital.
- **UI/UX:** Cyberpunk amber and deep purple theme featuring an elegant fixed left-side sidebar navigation.

### 💻 How to Run Locally
1. Navigate to the Level 1 frontend folder:
   ```bash
   cd level-1-white-belt/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

### 📸 Submission Screenshots

#### Wallet Connection, Balance Display, & Successful Testnet Transaction
![Level 1 Submission Screenshot](./screenshots/MicroPay_Level_1.png)

---

## 🟡 Level 2: Yellow Belt (Smart Contracts & Event Sync)

### 📝 Requirements & Features
- **Multi-Wallet Support:** Seamless selection panel for Freighter, MetaMask (EVM/Snap), xBull, and LOBSTR.
- **Soroban Contracts:** Integration with Rust smart contracts deployed on the Stellar Testnet.
- **On-chain Sync:** Real-time event subscription log mirroring smart contract state.
- **Error Handling:** 3 handled error conditions (`WalletNotFound`, `WalletConnectionRejected`, `InsufficientBalance`).
- **Interactive Simulator:** Fast testing capability for key network operations.

### 💻 How to Run Locally
1. Navigate to the Level 2 frontend folder:
   ```bash
   cd level-2-yellow-belt/frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```

### ⚙️ Verification Details
- **Deployed Contract Address:** `CC3RMICROPAY...`
- **Transaction Hash (Stellar Explorer):** `a88ef97cbd983b618991c0b39e6a0d2f1be7399a9b6c161cd5d7f12e88a38b8c`

### 📸 Submission Screenshots

#### Available Wallet Options (Freighter, MetaMask, xBull, LOBSTR)
![Level 2 Available Wallets](./screenshots/MicroPay_1_Level_2.png)

#### Deployed Contract Called & Transaction Result
![Level 2 Contract Call](./screenshots/MicroPay_transaction_Level_2.png)
