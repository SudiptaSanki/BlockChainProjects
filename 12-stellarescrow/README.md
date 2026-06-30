# 🚀 StellarEscrow: Secure On-Chain Arbitration & Holding Vaults

StellarEscrow is a premium trustless escrow and arbitration system built on the Stellar network and Soroban smart contracts. It allows buyers and sellers to lock digital collateral into secure vaults, with multi-signature verification and arbitration options for release and refunds.

---

## 📁 Project Structure
The repository is organized into progressive levels:
- `level-1-white-belt/frontend/`: React + Vite frontend implementing wallet connection, balance retrieval, and basic escrow lockups.
- `level-2-yellow-belt/`:
  - `contracts/`: Soroban Rust smart contracts managing escrow parameters and disputes.
  - `frontend/`: React + Vite multi-wallet arbitration console and escrow dashboard.

---

## ⚙️ StellarEscrow Protocol

```mermaid
graph TD
    A[Depositor / Buyer] -->|Lock XLM Collateral| B(StellarEscrow Interface)
    B -->|Submit Signed Transaction| C{Escrow Vault Contract}
    C -->|Hold Capital Securely| D[Escrow State: Locked]
    D -->|Consent Release / Multi-sig| E[Funds Disbursed to Seller]
    D -->|Dispute / Arbitrator Invoked| F[Refund or Arbitration Split]
    E -->|Horizon Event Synced| G[Real-Time Ledger Sync]
    F -->|Horizon Event Synced| G
```

---

## 🥋 Level 1: White Belt (MVP Foundation)

### 📝 Requirements & Features
- **Wallet Setup & Connection:** Secure integration using `@stellar/freighter-api` and `@creit.tech/stellar-wallets-kit` on Stellar Testnet.
- **Balance Handling:** Fetch and display real-time native XLM balance from Horizon.
- **Transaction Submission:** Submit signed XLM payments to lock escrow collateral on-chain.
- **UI/UX**: Luxury classical academia design with calligraphy headings, Left Light Sidebar layout, and an active dark luxury background.

### 💻 How to Run Locally
1. Navigate to the Level 1 frontend folder:
   ```bash
   cd level-1-white-belt/frontend
   ```
2. Install dependencies:
   ```bash
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

### 📸 Submission Screenshots

#### Wallet Connection, Balance Display, & Successful Testnet Transaction
![Level 1 Submission Screenshot](./screenshots/level1_StellarEscrow.png)

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
Soroban contract ID - CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH

Transaction Hash: d7067c29deaea5d8397d2d974d117b2cbb91e68f1b774541816e69ec86235405

### 📸 Submission Screenshots

#### Available Wallet Options (Freighter, MetaMask, xBull, LOBSTR)
![Level 2 Available Wallets](./screenshots/level2_StellarEscrow.png)

#### Deployed Contract Called & Transaction Result
![Level 2 Contract Call](./screenshots/level2_transaction_StellarEscrow.png)
