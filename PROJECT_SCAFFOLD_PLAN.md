# Stellar Soroban 20 Project Scaffold Plan

This workspace is organized as 20 independent Stellar/Soroban hackathon projects. Each project follows the required three-level belt progression from `stellar_hackathon_prompt.md` and maps to one idea from `stellar_project_ideas.md`.

## Shared Folder Structure

Each project folder uses this structure:

```text
project-name/
  .github/
    workflows/
      level3-ci.yml
  README.md
  .gitignore
  run.bat
  level-1-white-belt/
    firebase.json
    index.html
    package.json
    preview.html
    README.md
    vite.config.ts
    public/
      favicon.svg
    screenshots/
    src/
      App.css
      App.tsx
      index.css
      main.tsx
      services/
        freighter.ts
        stellar.ts
  level-2-yellow-belt/
    firebase.json
    index.html
    package.json
    preview.html
    README.md
    test.cjs
    test2.cjs
    test3.cjs
    vite.config.ts
    contracts/
      project_contract/
        Cargo.toml
        src/
          lib.rs
    screenshots/
    src/
      App.tsx
      main.tsx
      services/
        stellar.ts
        wallet.ts
  level-3-orange-belt/
    preview.html
    README.md
    contracts/
      project_contract/
        Cargo.toml
        src/
          lib.rs
          test.rs
        test_snapshots/
    frontend/
      firebase.json
      index.html
      package.json
      tailwind.config.js
      vite.config.ts
      src/
      public/
        favicon.svg
      src/
        App.tsx
        services/
          contract.ts
          wallet.ts
    relayer/
      index.js
      package.json
  production-grade/
    index.html
    package.json
    preview.html
    tailwind.config.js
    vite.config.ts
    src/
      App.tsx
      firebase.ts
      main.tsx
  docs/
    architecture/
    deployment/
    screenshots/
  assets/
    brand/
    ui-references/
  .github/
    workflows/
```

## Project List And UI Palettes

| Folder | Project | Product Direction | Unique UI Palette |
| --- | --- | --- | --- |
| `01-vesta-payroll` | Vesta Payroll | Salary streaming dashboard with live accruals, employer controls, and employee withdrawals. | Midnight navy `#07111F`, payroll green `#2AE98A`, warm gold `#F7C948`, mist `#EAF2F8`. |
| `02-splitwise-web3` | Splitwise Web3 | Shared expense groups, balance cards, settlement prompts, and activity feed. | Ink `#15151C`, coral `#FF6B6B`, aqua `#4ECDC4`, ivory `#FFF8E7`. |
| `03-autodca` | AutoDCA | Investment automation panel with schedule setup, asset balances, and ROI analytics. | Graphite `#101418`, electric blue `#2F80ED`, lime `#B6F23A`, cloud `#F4F7FB`. |
| `04-milestone-crowdfund` | Milestone Crowdfund | Creator project pages, pledge flows, milestone voting, and refund status. | Charcoal `#1E2028`, campaign orange `#FF8A3D`, violet `#7C5CFF`, parchment `#FFF3DD`. |
| `05-directremit` | DirectRemit | Mobile-first remittance flow with recipient, exchange estimate, receipt, and tracker. | Deep teal `#073B3A`, signal cyan `#00B8D9`, mango `#FFB000`, rice `#FAF7EF`. |
| `06-anchorstream` | AnchorStream | Merchant payment gateway with QR checkout, conversion status, and logs. | Night `#0C1020`, pix green `#00C853`, royal purple `#6C63FF`, slate `#EEF2F6`. |
| `07-safekeep` | SafeKeep | Social recovery vault with guardians, recovery wizard, and protected balance view. | Carbon `#111827`, trust blue `#38BDF8`, alert amber `#F59E0B`, frost `#F8FAFC`. |
| `08-kidvault` | KidVault | Parent allowance setup plus kid savings goals, countdowns, and rewards. | Plum `#3B164F`, candy pink `#FF5DA2`, mint `#8EF6D1`, cream `#FFF7E8`. |
| `09-teamvault` | TeamVault | Multi-sig treasury proposals, approvals, signature progress, and execution history. | Black `#0B0D12`, institutional blue `#2563EB`, approval green `#22C55E`, silver `#E5E7EB`. |
| `10-invoic3` | Invoic3 | Freelancer invoice builder, client payment screen, split routing, and PDF receipt. | Espresso `#1B1715`, invoice red `#E11D48`, tax gold `#D6A23A`, paper `#FBFAF7`. |
| `11-tokenvest` | TokenVest | Vesting schedule manager with cliffs, claims, revoke actions, and charts. | Aubergine `#251238`, token cyan `#06B6D4`, emerald `#10B981`, pearl `#F7F2FF`. |
| `12-stellarescrow` | StellarEscrow | P2P trade rooms with deposit state, dual consent, dispute evidence, and arbitrator controls. | Steel `#182230`, escrow yellow `#FACC15`, dispute red `#EF4444`, fog `#F1F5F9`. |
| `13-agentpay` | AgentPay | AI-agent billing dashboard with spend limits, API keys, refills, and usage graphs. | Void `#080A12`, neon magenta `#F43FBD`, circuit green `#39FF88`, porcelain `#F6F7FB`. |
| `14-billsplitter-ai` | BillSplitter AI | Receipt upload, participant matching, AI split review, and payment requests. | Navy `#101828`, receipt blue `#4F46E5`, tomato `#F97316`, linen `#FFF8F0`. |
| `15-stellarscribe` | StellarScribe | Expense audit queue with AI decisions, reimbursement status, and audit logs. | Obsidian `#0F1115`, audit violet `#8B5CF6`, compliance green `#34D399`, ash `#ECEFF3`. |
| `16-ecofund` | EcoFund | Carbon offset storefront, retirement flow, impact totals, and certificate gallery. | Forest `#063B2E`, leaf `#3DDC84`, sky `#7DD3FC`, recycled white `#F5FFF9`. |
| `17-yieldanchor` | YieldAnchor | DeFi savings app with deposit controls, APY trackers, auto-compounding, and history. | Deep blue `#061A40`, yield teal `#14B8A6`, sunrise `#FBBF24`, ice `#F0FDFA`. |
| `18-micropay` | Micropay | Premium media paywall, tiny payment unlocks, channel status, and creator dashboard. | Newspaper black `#111111`, link blue `#1D4ED8`, highlight yellow `#FDE047`, newsprint `#F8F5EF`. |
| `19-gift3r` | Gift3r | Gift card designer, wallet loading, send flow, and merchant redemption scanner. | Ruby `#7F1D1D`, gift pink `#FB7185`, festive green `#16A34A`, snow `#FFF7F7`. |
| `20-collateralize` | Collateralize | P2P crypto loan dashboard with collateral, borrow capacity, health factor, and liquidations. | Space black `#09090B`, risk red `#F43F5E`, lender cyan `#22D3EE`, marble `#F4F4F5`. |

## Build Order

1. Start every project with `level-1-white-belt`: React, Vite, TypeScript, wallet connection, Testnet balance, and direct XLM transfer.
2. Add `level-2-yellow-belt/contracts/<contract-name>` and matching frontend contract calls: Soroban Rust contract, contract state reads, transaction submission, and error handling.
3. Finish `level-3-orange-belt`: advanced contract logic, at least three Rust unit tests, event streaming, real Testnet transaction flow, relayer scripts where useful, CI workflow, screenshots, deployment notes, and final README.

## Launchers

- Open `PROJECT_BROWSER.html` or double-click `open-project-browser.bat` to browse all 20 projects and all levels immediately.
- Double-click any project `run.bat` to open a menu.
- Use menu options `1` through `4` to open offline previews without installing dependencies.
- Use `run.bat level1`, `run.bat level2`, `run.bat level3`, or `run.bat prod` to open those same previews directly.
- Use `run.bat dev1`, `run.bat dev2`, `run.bat dev3`, or `run.bat devprod` only when you want the real Vite dev server. Those commands require Node.js and npm dependencies.

## Belt Requirements

### Level 1 White Belt

- Set up Freighter wallet on Stellar Testnet.
- Implement wallet connect and disconnect.
- Fetch and clearly display connected wallet XLM balance.
- Send an XLM transaction on Stellar Testnet.
- Show success or failure feedback plus transaction hash or confirmation message.
- Include clean UI setup, wallet integration, balance fetch, transaction logic, and error handling.

### Level 2 Yellow Belt

- Implement StellarWalletsKit multi-wallet support.
- Handle at least 3 error types: wallet not found, wallet rejected, insufficient balance.
- Deploy a Soroban contract on Testnet.
- Call contract functions from the frontend.
- Read/write contract data.
- Listen to events and synchronize frontend state.
- Show transaction status: pending, success, fail.
- Include minimum 2+ meaningful commits in the final repository history.
- README proof should include wallet options screenshot, deployed contract address, and a verifiable transaction hash.

### Level 3 Orange Belt

- Add advanced smart contract development.
- Prepare inter-contract communication architecture.
- Add event streaming and real-time updates.
- Set up CI/CD with `.github/workflows/level3-ci.yml`.
- Document smart contract deployment workflow.
- Build a mobile responsive production frontend.
- Include loading states and complete error handling.
- Write contract and frontend tests, with proof of 3+ passing contract tests.
- Include complete documentation and demo presentation assets.
- Final submission should include public GitHub repo, live demo link, contract address, contract interaction transaction hash, mobile UI screenshot, CI/CD screenshot, and test output screenshot.

## Frontend Baseline

Every frontend should use:

- React + Vite + TypeScript.
- Tailwind CSS with a project-specific palette.
- `vite-plugin-node-polyfills` for Stellar SDK browser support.
- `@stellar/freighter-api`, `stellar-wallets-kit`, and Stellar SDK utilities.
- Premium responsive UI with explicit states for building transaction, awaiting signature, submitting, success, and failure.
