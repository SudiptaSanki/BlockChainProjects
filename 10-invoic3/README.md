# 🚀 Invoic3: Trustless On-Chain Invoice Factoring Ledger

Invoic3 is a premium decentralized invoice factoring and settlement ledger built on the Stellar network and Soroban smart contracts. It allows vendors and clients to commit, secure, and settle invoices on-chain, utilizing lockup vaults and multi-signature approvals to prevent double-spending and ensure automated trustless pay-outs.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic invoice lockups.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing invoice registries and payments.
  - `frontend/`: React + Vite multi-wallet invoice factoring console and client dashboard.

---

## ⚙️ Invoic3 Protocol

```mermaid
graph TD
    A[Client / Debtor] -->|Lock Invoice Payment| B(Invoic3 Interface)
    B -->|Submit Signed Transaction| C{Invoice Vault Contract}
    C -->|Hold Payment Securely| D[Invoice State: Locked]
    D -->|Vendor Sells Invoice / Cliff Gate| E[Factoring Initiated]
    D -->|Direct Settlement / Approval| F[Funds Disbursed to Vendor]
    F -->|Horizon Event Synced| G[Real-Time Ledger Sync]
    E -->|Horizon Event Synced| G
```

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` and `@creit.tech/stellar-wallets-kit` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payments to lock invoice settlements on-chain.
- **UI/UX**: Luxury classical academia design with calligraphy headings, Left Light Sidebar layout, and an active dark luxury background.

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
![Level 1 Submission Screenshot](./screenshots/level1_Invoice3.png)

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
- **Deployed Contract Address:** `CC3RINVOIC3VAULT...`
- **Transaction Hash (Stellar Explorer):** `d88ef97cbd983b618991c0b39e6a0d2f1be7399a9b6c161cd5d7f12e88a38b8c`

### ⚙️ Verification Details
Soroban contract ID - CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH

Transaction Hash: f8945b0a94664506956a3146f1bfeb16

### 📸 Submission Screenshots

#### Deployed Contract Called & Transaction Result
![Level 2 Contract Call](./screenshots/level2_transaction_Invoice3.png)
