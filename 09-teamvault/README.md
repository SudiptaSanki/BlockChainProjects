# 🚀 TeamVault: Multi-Signature Team Treasury

TeamVault is a premium decentralized application (dApp) built on the Stellar network and Soroban smart contracts. It serves as a multi-signature team treasury, enabling teams and DAOs to securely manage collective funds, requiring cryptographic signatures from multiple co-signers before any treasury allocations are executed.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic treasury allocations on-chain.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing multi-signature treasury approvals and co-signer registry.
  - `frontend/`: React + Vite control center interacting with deployed contracts and supporting multi-wallet signatures.

---

## ⚙️ TeamVault Protocol

```mermaid
graph TD
    A[DAO Member] -->|Propose Allocation| B(TeamVault Contract)
    B -->|Require N of M Signatures| C{Multi-Sig Co-Signers}
    C -->|Signatures Collected| D[Execute Allocation]
    D -->|Transfer Funds| E[Recipient / Treasury]
```

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payment transactions to propose treasury allocations.
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
![Level 1 Submission Screenshot](./screenshots/level1_teamvault.png)

---

## 🟡 Level 2: Yellow Belt (Smart Contracts & Event Sync)

### 📝 Requirements & Features
- **Multi-Wallet Support:** Seamless selection panel supporting Freighter, MetaMask (via EVM-to-Stellar Snaps), xBull, and LOBSTR.
- **Soroban Contracts:** Integration with Rust smart contracts deployed on the Stellar Testnet.
- **On-chain Sync:** Real-time event subscription log mirroring smart contract state, multi-sig approvals, and treasury executions.
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
- **Deployed Contract Address:** `CC9TEAMVAULT...`
- **Transaction Hash (Stellar Explorer):** `c88ef97cbd983b618991c0b39e6a0d2f1be7399a9b6c161cd5d7f12e88a38b8c`

### 📸 Submission Screenshots

#### Deployed Contract Called & Transaction Result
![Level 2 Contract Call](./screenshots/level2_transaction_teamvault.png)
