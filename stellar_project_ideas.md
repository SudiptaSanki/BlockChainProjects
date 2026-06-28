# 💡 20 High-Potential Stellar & Soroban Hackathon Project Ideas

This document contains 20 highly creative and viable project ideas for the Stellar Soroban Hackathon. These ideas are categorized by their **Hackathon Positioning** and are designed to perfectly fit the **3-Level Belt Development Structure** (White Belt MVP -> Yellow Belt Smart Contracts -> Orange Belt Production App).

---

## 💸 Category 1: Payments & Stablecoins

### 1. **Vesta Payroll (Salary Streaming)**
*   **Concept:** A decentralized payroll platform where employers stream stablecoin (USDC/EURC) salaries to employees dynamically (per minute or second) instead of monthly lump sums.
*   **Level 1 (White Belt):** Simple portal to connect wallet, view balance, and send a one-off payment to an employee.
*   **Level 2 (Yellow Belt):** Soroban smart contract where an employer deposits funds and initiates a stream to an employee's address. The employee can withdraw their accrued salary in real-time.
*   **Level 3 (Orange Belt):** Production dashboard showing live animated streams, historical paystubs, CSV export, and a CI/CD-tested contract for pausing/resuming streams.

### 2. **Splitwise Web3 (On-chain Expense Splitter)**
*   **Concept:** A group expense manager where friends or roommates log shared costs and settle debts instantly using Stellar stablecoins.
*   **Level 1 (White Belt):** Simple UI to add group members, input bills, calculate splits, and send XLM/USDC directly to settle a single balance.
*   **Level 2 (Yellow Belt):** Soroban smart contract to pool group funds, track active ledgers on-chain, and record settlement events.
*   **Level 3 (Orange Belt):** Multi-wallet support (Freighter & MetaMask), real-time activity feed showing who paid what, automated notification of balances, and unit tests checking debt-settlement math.

### 3. **AutoDCA (Decentralized Dollar-Cost Averaging)**
*   **Concept:** A decentralized investment tool that automatically swaps stablecoins into XLM (or other Stellar assets) at regular intervals to minimize volatility risk.
*   **Level 1 (White Belt):** App showing asset balances with a manual swap panel utilizing Stellar SDK.
*   **Level 2 (Yellow Belt):** Soroban smart contract where the user deposits USDC and sets a buying frequency. Relayer executes swaps using automated contract calls.
*   **Level 3 (Orange Belt):** Rich analytics dashboard showing average buy price, historical portfolio ROI, multi-wallet connectivity, and CI/CD-integrated testing for swap slippage limits.

### 4. **Milestone Crowdfund (Decentralized Kickstarter)**
*   **Concept:** A crowdfunding platform where funds pledged to a creator are locked in escrow and only released incrementally as project milestones are completed and voted on by backers.
*   **Level 1 (White Belt):** UI to list projects, pledge XLM/USDC to a project, and transfer funds.
*   **Level 2 (Yellow Belt):** Escrow contract on Soroban holding funds. Creator submits milestone completion requests; backers vote on-chain to release the next portion of funds.
*   **Level 3 (Orange Belt):** Dynamic project pages, real-time vote streaming, automated refund mechanism if a milestone fails, and contract tests for voting edge cases.

---

## 🌍 Category 2: Cross-Border Finance & Remittances

### 5. **DirectRemit (Simplified Remittance Interface)**
*   **Concept:** A hyper-simple portal designed for migrant workers to send money home using Stellar Anchors (SEP-24/SEP-31) for instant local fiat cash-out.
*   **Level 1 (White Belt):** Frontend simulating the connection to a fiat-on/off-ramp, executing a direct XLM transfer to a recipient's address.
*   **Level 2 (Yellow Belt):** Soroban contract that automatically converts incoming USDC to local currency tokens (e.g., Brazilian Real/Nigerian Naira tokens) using liquidity pools on-chain.
*   **Level 3 (Orange Belt):** Premium mobile-responsive UI with dual-language support, live transaction trackers, integrated receipt generator, and GitHub Actions-based automated build pipeline.

### 6. **AnchorStream (Merchant Mobile Money Gateway)**
*   **Concept:** A gateway integrating local mobile money APIs (like M-Pesa, Pix, GCash) with Stellar stablecoins to let unbanked merchants accept global digital payments.
*   **Level 1 (White Belt):** Mock checkout page showing a QR code that triggers a wallet prompt to pay a merchant.
*   **Level 2 (Yellow Belt):** Soroban escrow contract that locks stablecoins and emits payment events for the mobile money API gateway to release physical cash.
*   **Level 3 (Orange Belt):** Full merchant dashboard, webhooks integration, live transactions logs, error states for failed conversions, and 3+ unit tests for escrow timeout returns.

---

## 🔒 Category 3: Wallet Infrastructure & Account Abstraction

### 7. **SafeKeep (Social Recovery Vault)**
*   **Concept:** A smart contract wallet on Soroban that allows users to protect high-value assets by appointing trusted friends, family, or other devices as "guardians" to recover access to their keys.
*   **Level 1 (White Belt):** Dashboard connecting to a basic wallet, displaying balances, and allowing key export/import.
*   **Level 2 (Yellow Belt):** Soroban contract representing a smart wallet. If the main key is lost, guardians sign a contract transaction to update the owner address.
*   **Level 3 (Orange Belt):** Guardian management interface, step-by-step interactive recovery wizard, robust fallback states, and testing for multi-signature threshold calculations.

### 8. **KidVault (Time-Locked Allowance Contract)**
*   **Concept:** A child-friendly savings vault where parents lock stablecoins or XLM, releasing them strictly at set time intervals (e.g., weekly allowance) or when the child hits specific targets.
*   **Level 1 (White Belt):** Parental portal to view locked assets and perform manual transfers to a child's address.
*   **Level 2 (Yellow Belt):** Soroban time-lock contract enforcing lock periods and automatic release schedules.
*   **Level 3 (Orange Belt):** Gamified kid dashboard (showing savings goals and countdowns), parent dashboard to adjust parameters, automated alerts on release, and CI/CD testing.

### 9. **TeamVault (Multi-Sig Asset Manager)**
*   **Concept:** A shared treasury vault for Web3 teams requiring M-of-N signatures to approve and execute outgoing payments.
*   **Level 1 (White Belt):** UI to propose a payment and sign it manually using Freighter.
*   **Level 2 (Yellow Belt):** Multi-sig smart contract on Soroban that accepts transaction proposals, collects signatures, and executes when threshold is met.
*   **Level 3 (Orange Belt):** Rich proposal feed, pending signature notifications, history of executed deals, and thorough unit tests verifying threshold overrides and invalid signature rejections.

---

## 🛠 Category 4: Financial Tooling & B2B SaaS

### 10. **Invoic3 (Cryptographic Invoicing)**
*   **Concept:** A freelancing invoice generator where clients pay cryptographic invoices that automatically routes splits (e.g., platforms fees, taxes) on-chain.
*   **Level 1 (White Belt):** Invoice generator UI. Client connects wallet and pays the invoice amount via a direct transaction.
*   **Level 2 (Yellow Belt):** Invoicing smart contract that locks payment in escrow, emits `InvoicePaid` events, and splits funds between the freelancer and tax/platform wallets.
*   **Level 3 (Orange Belt):** Automated PDF receipt generation, dispute/refund arbitration states, live status updates, and contract tests for split math correctness.

### 11. **TokenVest (Token Vesting & Lockups)**
*   **Concept:** A B2B dashboard for Web3 startups to lock company tokens or stablecoins and vest them to team members, advisors, and investors dynamically.
*   **Level 1 (White Belt):** Portal to view vesting schedules and claim unlocked tokens.
*   **Level 2 (Yellow Belt):** Vesting contract on Soroban supporting custom cliffs, linear unlock rates, and emergency revocations by the admin.
*   **Level 3 (Orange Belt):** Dynamic charts showing locked vs. vested vs. claimed tokens, admin manager panel, multi-wallet authentication, and CI/CD-validated tests.

### 12. **StellarEscrow (Trustless P2P Escrow)**
*   **Concept:** A secure escrow portal for freelance services or OTC trades. Funds are held safely in a contract until both sides mark a milestone complete.
*   **Level 1 (White Belt):** UI to initiate a trade, deposit funds, and transfer them manually.
*   **Level 2 (Yellow Belt):** Soroban escrow contract with dual-party consent and a 3rd party arbitrator address to handle disputes.
*   **Level 3 (Orange Belt):** Active disputes chat/evidence upload dashboard, live terminal logs, complete error handling, and robust contract test coverage.

---

## 🤖 Category 5: AI Billing & Agentic Payments

### 13. **AgentPay (Gasless Smart Accounts for AI)**
*   **Concept:** A billing platform providing pre-funded, API-controlled smart accounts for AI agents, allowing agents to pay for API keys, cloud credits, or databases autonomously within set limits.
*   **Level 1 (White Belt):** API dashboard to check credit balances and request manual refills.
*   **Level 2 (Yellow Belt):** Soroban budget contract enforcing daily or monthly spend limits per agent API key.
*   **Level 3 (Orange Belt):** AI agent SDK, live spend graphs, automated warning alerts, and contract tests for budget-limit breaches.

### 14. **BillSplitter AI (Intelligent Trip Billing)**
*   **Concept:** Upload a photo of a group trip receipt; an AI splits the items among participants and immediately sends Freighter payment prompts to settle on Stellar.
*   **Level 1 (White Belt):** Basic receipt uploader that displays calculated splits and lets you request payments manually.
*   **Level 2 (Yellow Belt):** Soroban contract managing active group debts and settling balances automatically as users pay.
*   **Level 3 (Orange Belt):** AI receipt parsing integration, live status logs, fully mobile-responsive design, and automated CI/CD builds.

### 15. **StellarScribe (AI-Driven Expense Auditor)**
*   **Concept:** An AI agent scans and audits company expenses, automatically triggering stablecoin reimbursements via a Soroban contract if the audit passes.
*   **Level 1 (White Belt):** Portal to submit expense receipts and track reimbursement statuses.
*   **Level 2 (Yellow Belt):** Soroban multi-signature treasury contract executing payouts once an authorized auditor address (the AI agent) signs off.
*   **Level 3 (Orange Belt):** Real-time audit logs, automated Slack/Discord integrations, premium dark-mode interface, and unit tests verifying only authorized agents can trigger payouts.

---

## ⚓ Category 6: Stellar Anchors & Real-World Assets (RWA)

### 16. **EcoFund (Tokenized Carbon Offsets)**
*   **Concept:** A platform where companies and individuals buy tokenized carbon credits, locking and retiring them on-chain to offset their footprint.
*   **Level 1 (White Belt):** Storefront to buy carbon offset tokens using Stellar Testnet XLM.
*   **Level 2 (Yellow Belt):** Soroban contract that locks carbon tokens permanently (retiring them) and mints a dynamic non-transferable certificate (SBT) for the buyer.
*   **Level 3 (Orange Belt):** Impact dashboard showing total carbon offset on-chain, SVG-generated dynamic certificate cards, and GitHub Actions test coverage.

### 17. **YieldAnchor (DeFi Savings Account)**
*   **Concept:** A savings account that automatically routes stablecoin deposits to Soroban-based liquidity pools or money markets to optimize yield for users.
*   **Level 1 (White Belt):** UI to deposit stablecoins and view yield estimators.
*   **Level 2 (Yellow Belt):** Yield optimizer contract that integrates with Stellar AMM/Liquidity Pools to auto-compound interest.
*   **Level 3 (Orange Belt):** Live APY trackers, historical yield graphs, multi-wallet support, and CI/CD-tested contract deposit/withdraw pathways.

### 18. **Micropay (Pay-Per-View Content Gateway)**
*   **Concept:** A payment gateway for media outlets. Instead of monthly subscriptions, users pay tiny fractions of a cent (using XLM/USDC) instantly per article read or minute streamed.
*   **Level 1 (White Belt):** Demo blog/video site where connecting a wallet and sending a micro-payment unlocks an article.
*   **Level 2 (Yellow Belt):** Soroban state channel contract allowing rapid, off-chain micropayment signing with single-transaction settlement on Stellar.
*   **Level 3 (Orange Belt):** Premium media UI, live paywall animations, content dashboard, and 3+ passing unit tests for payment channel states.

### 19. **Gift3r (Crypto Gift Cards & Vouchers)**
*   **Concept:** Mint custom NFTs that represent pre-paid stablecoin balances, which can be sent to friends as Web3 gift cards redeemable at participating merchants.
*   **Level 1 (White Belt):** Card designer portal where users load XLM/USDC to a gift card and send it to a wallet.
*   **Level 2 (Yellow Belt):** Soroban NFT/Vault contract locking the stablecoin value; only the holder of the NFT can trigger the contract to release the funds.
*   **Level 3 (Orange Belt):** Beautiful virtual card animations, merchant redemption scanner, and full unit tests for unauthorized withdrawal attempts.

### 20. **Collateralize (P2P Crypto Loans)**
*   **Concept:** A decentralized lending protocol where users can lock their XLM as collateral to borrow USDC stablecoins at customizable interest rates and terms.
*   **Level 1 (White Belt):** Portal showing borrowing capacities and a deposit interface.
*   **Level 2 (Yellow Belt):** Soroban lending smart contract managing collaterals, loan limits, and liquidation thresholds.
*   **Level 3 (Orange Belt):** Real-time liquidation tracker, health factor indicator, complete error management, and unit tests checking loan-to-value calculations.
