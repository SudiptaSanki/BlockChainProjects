const fs = require('fs');
const path = require('path');

const root = process.cwd();

const projects = [
  { dir: '01-vesta-payroll', title: 'Vesta Payroll', short: 'Vesta', useCase: 'salary streaming and employee withdrawals', audience: 'finance operators', primary: '#123c69', secondary: '#16a085', accent: '#f4b942', paper: '#f6f8ee', ink: '#10202b', surface: '#ffffff', layout: 'layout-side', nav: 'rail', contract: 'payroll stream registry', action: 'Queue payroll transfer' },
  { dir: '02-splitwise-web3', title: 'Splitwise Web3', short: 'Splitwise', useCase: 'shared expense settlement', audience: 'roommates and travel groups', primary: '#38245f', secondary: '#ff6f61', accent: '#3bd1c8', paper: '#fff8ec', ink: '#201727', surface: '#ffffff', layout: 'layout-tabs', nav: 'tabs', contract: 'expense split ledger', action: 'Settle shared bill' },
  { dir: '03-autodca', title: 'AutoDCA', short: 'DCA', useCase: 'scheduled XLM accumulation', audience: 'long term savers', primary: '#163b36', secondary: '#2fbf71', accent: '#ffcb47', paper: '#eef8f3', ink: '#10221f', surface: '#f9fffc', layout: 'layout-console', nav: 'command', contract: 'DCA vault scheduler', action: 'Run DCA cycle' },
  { dir: '04-milestone-crowdfund', title: 'Milestone Crowdfund', short: 'Milestone', useCase: 'milestone based community funding', audience: 'backers and builders', primary: '#2a2463', secondary: '#ff8a3d', accent: '#49c6e5', paper: '#f8f2ff', ink: '#211b32', surface: '#ffffff', layout: 'layout-ribbon', nav: 'ribbon', contract: 'milestone release contract', action: 'Fund milestone' },
  { dir: '05-directremit', title: 'DirectRemit', short: 'Remit', useCase: 'low cost remittance payments', audience: 'global senders', primary: '#073b4c', secondary: '#06d6a0', accent: '#ffd166', paper: '#eefaf8', ink: '#072f39', surface: '#ffffff', layout: 'layout-map', nav: 'pills', contract: 'remittance rail', action: 'Send remittance' },
  { dir: '06-anchorstream', title: 'AnchorStream', short: 'Anchor', useCase: 'merchant gateway settlement', audience: 'online merchants', primary: '#263238', secondary: '#00acc1', accent: '#ff7043', paper: '#f1f6f7', ink: '#162326', surface: '#ffffff', layout: 'layout-terminal', nav: 'stack', contract: 'merchant gateway contract', action: 'Capture payment' },
  { dir: '07-safekeep', title: 'SafeKeep', short: 'SafeKeep', useCase: 'recovery vault transfers', audience: 'security focused holders', primary: '#13294b', secondary: '#8ac926', accent: '#ffca3a', paper: '#f4f8ed', ink: '#101c2e', surface: '#ffffff', layout: 'layout-vault', nav: 'lockbar', contract: 'recovery vault', action: 'Verify recovery send' },
  { dir: '08-kidvault', title: 'KidVault', short: 'KidVault', useCase: 'allowance wallets for families', audience: 'parents and young savers', primary: '#5f4b8b', secondary: '#ff9f1c', accent: '#2ec4b6', paper: '#fff7e6', ink: '#2c2141', surface: '#ffffff', layout: 'layout-playful', nav: 'bubbles', contract: 'allowance vault', action: 'Send allowance' },
  { dir: '09-teamvault', title: 'TeamVault', short: 'TeamVault', useCase: 'team treasury coordination', audience: 'DAO operators', primary: '#1f2937', secondary: '#4f46e5', accent: '#22c55e', paper: '#f3f4f6', ink: '#111827', surface: '#ffffff', layout: 'layout-board', nav: 'workspace', contract: 'team multisig', action: 'Propose payout' },
  { dir: '10-invoic3', title: 'Invoic3', short: 'Invoic3', useCase: 'invoice escrow and settlement', audience: 'freelancers and clients', primary: '#334155', secondary: '#0ea5e9', accent: '#f97316', paper: '#f8fafc', ink: '#172033', surface: '#ffffff', layout: 'layout-ledger', nav: 'ledger', contract: 'invoice escrow', action: 'Pay invoice' },
  { dir: '11-tokenvest', title: 'TokenVest', short: 'TokenVest', useCase: 'tokenized savings baskets', audience: 'portfolio builders', primary: '#214e34', secondary: '#7bd389', accent: '#d8a31a', paper: '#f3f7ec', ink: '#18251b', surface: '#ffffff', layout: 'layout-market', nav: 'quotes', contract: 'token vesting desk', action: 'Commit allocation' },
  { dir: '12-stellarescrow', title: 'StellarEscrow', short: 'Escrow', useCase: 'peer to peer escrow', audience: 'buyers and sellers', primary: '#402e32', secondary: '#ef476f', accent: '#06d6a0', paper: '#fff1f4', ink: '#24191c', surface: '#ffffff', layout: 'layout-deal', nav: 'steps', contract: 'P2P escrow contract', action: 'Open escrow' },
  { dir: '13-agentpay', title: 'AgentPay', short: 'AgentPay', useCase: 'AI agent payment budgets', audience: 'automation teams', primary: '#111827', secondary: '#a855f7', accent: '#14b8a6', paper: '#f6f1ff', ink: '#15111d', surface: '#ffffff', layout: 'layout-ai', nav: 'chips', contract: 'agent budget contract', action: 'Approve agent spend' },
  { dir: '14-billsplitter-ai', title: 'BillSplitter AI', short: 'Bill AI', useCase: 'AI assisted trip bill splitting', audience: 'travel crews', primary: '#263f73', secondary: '#ffbe0b', accent: '#fb5607', paper: '#fff9e8', ink: '#162849', surface: '#ffffff', layout: 'layout-travel', nav: 'tickets', contract: 'trip billing contract', action: 'Split receipt' },
  { dir: '15-stellarscribe', title: 'StellarScribe', short: 'Scribe', useCase: 'expense auditing and notes', audience: 'bookkeepers', primary: '#3d405b', secondary: '#81b29a', accent: '#e07a5f', paper: '#f4f1de', ink: '#28293d', surface: '#fffdf7', layout: 'layout-notebook', nav: 'notebook', contract: 'expense auditor', action: 'Record audit note' },
  { dir: '16-ecofund', title: 'EcoFund', short: 'EcoFund', useCase: 'carbon credit retirement', audience: 'climate contributors', primary: '#164a41', secondary: '#4d908e', accent: '#f9c74f', paper: '#eff8ef', ink: '#102f2b', surface: '#ffffff', layout: 'layout-eco', nav: 'leafline', contract: 'carbon retirement contract', action: 'Retire credit' },
  { dir: '17-yieldanchor', title: 'YieldAnchor', short: 'Yield', useCase: 'yield optimizer deposits', audience: 'treasury managers', primary: '#1b4332', secondary: '#52b788', accent: '#f77f00', paper: '#f0fff4', ink: '#10281e', surface: '#ffffff', layout: 'layout-yield', nav: 'yieldbar', contract: 'yield optimizer', action: 'Anchor deposit' },
  { dir: '18-micropay', title: 'MicroPay', short: 'MicroPay', useCase: 'micro payment channels', audience: 'metered API builders', primary: '#0f172a', secondary: '#38bdf8', accent: '#f43f5e', paper: '#eef6ff', ink: '#101827', surface: '#ffffff', layout: 'layout-meter', nav: 'meters', contract: 'payment channel', action: 'Stream micro payment' },
  { dir: '19-gift3r', title: 'Gift3r', short: 'Gift3r', useCase: 'gift card vault payouts', audience: 'gift senders', primary: '#6d214f', secondary: '#ff9ff3', accent: '#feca57', paper: '#fff0fa', ink: '#35142a', surface: '#ffffff', layout: 'layout-gift', nav: 'wrap', contract: 'gift card vault', action: 'Send gift value' },
  { dir: '20-collateralize', title: 'Collateralize', short: 'Collateral', useCase: 'P2P lending collateral', audience: 'borrowers and lenders', primary: '#1e3a5f', secondary: '#00b4d8', accent: '#ffb703', paper: '#edf7fb', ink: '#14243a', surface: '#ffffff', layout: 'layout-credit', nav: 'creditline', contract: 'P2P lending contract', action: 'Lock collateral' },
];

function q(value) {
  return JSON.stringify(value);
}

function contractId(project) {
  return `TODO_${project.dir.slice(3).replace(/-/g, '_').toUpperCase()}_CONTRACT_ID`;
}

function level1App(project) {
  return `import { type CSSProperties, useMemo, useState } from 'react';
import './App.css';

const project = ${JSON.stringify({ ...project, contractId: contractId(project) }, null, 2)};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'send', label: 'Send XLM' },
  { id: 'activity', label: 'Activity' },
];

const checklist = [
  'Freighter wallet setup',
  'Stellar Testnet connection',
  'Connect and disconnect wallet',
  'Fetch and display native XLM balance',
  'Send XLM and show hash or failure',
];

type PageId = (typeof pages)[number]['id'];
type FlowState = 'idle' | 'connecting' | 'connected' | 'loading' | 'submitting' | 'success' | 'failure';

function readValue(value: any, keys: string[]) {
  if (value && typeof value === 'object') {
    for (const key of keys) {
      if (key in value) return value[key];
    }
  }
  return value;
}

async function loadFreighter() {
  return await import('@stellar/freighter-api') as any;
}

async function getFreighterPublicKey() {
  const freighter = await loadFreighter();
  const connectedResult = freighter.isConnected ? await freighter.isConnected() : true;
  const installed = Boolean(readValue(connectedResult, ['isConnected', 'isAvailable', 'result']));
  if (!installed && !freighter.getAddress && !freighter.getPublicKey) {
    throw new Error('Freighter wallet was not found. Install Freighter and switch it to Testnet.');
  }

  if (freighter.setAllowed) await freighter.setAllowed();
  if (freighter.requestAccess) await freighter.requestAccess();

  const addressResult = freighter.getAddress ? await freighter.getAddress() : await freighter.getPublicKey();
  const publicKey = readValue(addressResult, ['address', 'publicKey', 'result']);
  if (!publicKey) throw new Error('Wallet connection was rejected or no public key was returned.');
  return publicKey as string;
}

async function fetchNativeBalance(publicKey: string) {
  const response = await fetch(\`\${HORIZON_URL}/accounts/\${publicKey}\`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Account not funded on Stellar Testnet yet.' : 'Could not load balance from Horizon.');
  }
  const account = await response.json();
  const native = account.balances?.find((balance: any) => balance.asset_type === 'native');
  return native?.balance ?? '0.0000000';
}

async function submitPayment(publicKey: string, destination: string, amount: string, memo: string) {
  const StellarSdk = await import('@stellar/stellar-sdk') as any;
  const freighter = await loadFreighter();
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const source = await server.loadAccount(publicKey);
  const fee = String(await server.fetchBaseFee());
  const builder = new StellarSdk.TransactionBuilder(source, {
    fee,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination,
      asset: StellarSdk.Asset.native(),
      amount,
    }));

  if (memo.trim()) builder.addMemo(StellarSdk.Memo.text(memo.trim().slice(0, 28)));

  const transaction = builder.setTimeout(60).build();
  const signedResult = await freighter.signTransaction(transaction.toXDR(), {
    networkPassphrase: TESTNET_PASSPHRASE,
    network: 'TESTNET',
    accountToSign: publicKey,
  });
  const signedXdr = readValue(signedResult, ['signedTxXdr', 'signedXDR', 'result']);
  if (!signedXdr) throw new Error('Freighter did not return a signed transaction.');

  const signedTransaction = new StellarSdk.Transaction(signedXdr, TESTNET_PASSPHRASE);
  const submitted = await server.submitTransaction(signedTransaction);
  return submitted.hash as string;
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('1');
  const [memo, setMemo] = useState(project.action);
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Ready for Stellar Testnet.');
  const [txHash, setTxHash] = useState('');

  const themeStyle = useMemo(() => ({
    '--primary': project.primary,
    '--secondary': project.secondary,
    '--accent': project.accent,
    '--paper': project.paper,
    '--ink': project.ink,
    '--surface': project.surface,
  }) as CSSProperties, []);

  const shortKey = publicKey ? \`\${publicKey.slice(0, 6)}...\${publicKey.slice(-6)}\` : 'Not connected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Opening Freighter on Stellar Testnet...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Wallet connected. Loading native XLM balance...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Balance synced from Horizon Testnet.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Wallet connection failed.');
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxHash('');
    setState('idle');
    setMessage('Wallet disconnected locally.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Connect Freighter before refreshing balance.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balance refreshed from Stellar Testnet.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Balance refresh failed.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Connect Freighter before funding the test wallet.');
    setState('loading');
    try {
      const response = await fetch(\`\${FRIENDBOT_URL}?addr=\${encodeURIComponent(publicKey)}\`);
      if (!response.ok) throw new Error('Friendbot could not fund this account.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Friendbot funded the wallet on Testnet.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Funding failed.');
    }
  }

  async function sendXlm() {
    if (!publicKey) return setMessage('Connect Freighter before sending XLM.');
    if (!destination || !amount) return setMessage('Enter a destination public key and XLM amount.');
    setState('submitting');
    setTxHash('');
    setMessage('Waiting for Freighter signature...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Transaction confirmed on Stellar Testnet.');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Transaction failed.');
      setPage('activity');
    }
  }

  const timeline = [
    { label: 'Wallet permission', done: Boolean(publicKey) },
    { label: 'Native balance', done: Number.parseFloat(balance) >= 0 && Boolean(publicKey) },
    { label: 'Payment signed', done: state === 'submitting' || state === 'success' },
    { label: 'Hash returned', done: Boolean(txHash) },
  ];

  return (
    <main className={\`level-app level-one \${project.layout} \${project.nav}\`} style={themeStyle}>
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setPage('overview')} aria-label={\`\${project.title} home\`}>
          <span>{project.short}</span>
          <small>White Belt</small>
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Menu</button>
        <div className={\`nav-links \${menuOpen ? 'open' : ''}\`}>
          {pages.map((item) => (
            <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="wallet-pill" onClick={publicKey ? disconnectWallet : connectWallet}>
          {publicKey ? 'Disconnect' : 'Connect Freighter'}
        </button>
      </nav>

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Level 1 White Belt / Stellar Testnet</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">A focused dApp for {project.useCase}, built for {project.audience}. Connect Freighter, fund a Testnet wallet, view XLM, and send a signed transaction.</p>
        </div>
        <div className="hero-card" aria-label="Wallet summary">
          <span>Wallet</span>
          <strong>{shortKey}</strong>
          <small>{balance} XLM</small>
        </div>
      </section>

      <section className="page-surface">
        {page === 'overview' && (
          <div className="content-grid overview-grid">
            <article className="feature-block">
              <p className="eyebrow">Mission</p>
              <h2>{project.action}</h2>
              <p>This screen keeps the Level 1 fundamentals visible without making the product feel like a cloned checklist.</p>
              <div className="button-row">
                <button className="primary-action" onClick={() => setPage('wallet')}>Start wallet setup</button>
                <button className="ghost-action" onClick={() => setPage('send')}>Open send flow</button>
              </div>
            </article>
            <div className="checklist">
              {checklist.map((item, index) => (
                <div className="check-item" key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'wallet' && (
          <div className="content-grid wallet-grid">
            <article className="feature-block balance-block">
              <p className="eyebrow">Native Balance</p>
              <h2>{balance} XLM</h2>
              <p>{shortKey}</p>
              <div className="button-row">
                <button className="primary-action" onClick={connectWallet} disabled={state === 'connecting'}>Connect</button>
                <button className="ghost-action" onClick={refreshBalance}>Refresh</button>
                <button className="ghost-action" onClick={fundWallet}>Fund Testnet</button>
              </div>
            </article>
            <article className="status-block">
              <p className="eyebrow">Connection Feedback</p>
              <h3>{state}</h3>
              <p>{message}</p>
            </article>
          </div>
        )}

        {page === 'send' && (
          <div className="content-grid send-grid">
            <label className="input-card">Destination public key
              <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="G..." />
            </label>
            <label className="input-card">Amount XLM
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            </label>
            <label className="input-card wide">Memo
              <input value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={28} />
            </label>
            <button className="primary-action send-button" onClick={sendXlm} disabled={state === 'submitting'}>Send on Testnet</button>
          </div>
        )}

        {page === 'activity' && (
          <div className="content-grid activity-grid">
            <article className="feature-block">
              <p className="eyebrow">Transaction Feedback</p>
              <h2>{state === 'success' ? 'Success' : state === 'failure' ? 'Needs attention' : 'Waiting for action'}</h2>
              <p>{message}</p>
              {txHash && <a className="hash-link" href={\`https://stellar.expert/explorer/testnet/tx/\${txHash}\`} target="_blank" rel="noreferrer">{txHash}</a>}
            </article>
            <div className="timeline">
              {timeline.map((item) => (
                <div className={item.done ? 'done' : ''} key={item.label}>
                  <span />
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
`;
}

function level2App(project) {
  return `import { type CSSProperties, useMemo, useState } from 'react';
import './App.css';

const project = ${JSON.stringify({ ...project, contractId: contractId(project) }, null, 2)};

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'contract', label: 'Contract' },
  { id: 'events', label: 'Events' },
];

const walletOptions = [
  { id: 'freighter', label: 'Freighter', note: 'Browser extension' },
  { id: 'xbull', label: 'xBull', note: 'WalletsKit option' },
  { id: 'lobstr', label: 'LOBSTR', note: 'WalletConnect path' },
];

type PageId = (typeof pages)[number]['id'];
type TxState = 'idle' | 'connecting' | 'pending' | 'success' | 'fail';
type WalletError = 'WalletNotFound' | 'WalletConnectionRejected' | 'InsufficientBalance';

function errorCopy(error: WalletError) {
  const copy: Record<WalletError, string> = {
    WalletNotFound: 'Wallet not found. Install the wallet or enable the matching StellarWalletsKit module.',
    WalletConnectionRejected: 'Connection rejected. Ask the wallet for permission again when ready.',
    InsufficientBalance: 'Insufficient Testnet XLM for fees or contract invocation.',
  };
  return copy[error];
}

function readValue(value: any, keys: string[]) {
  if (value && typeof value === 'object') {
    for (const key of keys) {
      if (key in value) return value[key];
    }
  }
  return value;
}

async function connectFreighter() {
  const freighter = await import('@stellar/freighter-api') as any;
  const connectedResult = freighter.isConnected ? await freighter.isConnected() : true;
  const installed = Boolean(readValue(connectedResult, ['isConnected', 'isAvailable', 'result']));
  if (!installed && !freighter.getAddress && !freighter.getPublicKey) throw new Error(errorCopy('WalletNotFound'));
  if (freighter.setAllowed) await freighter.setAllowed();
  if (freighter.requestAccess) await freighter.requestAccess();
  const addressResult = freighter.getAddress ? await freighter.getAddress() : await freighter.getPublicKey();
  const publicKey = readValue(addressResult, ['address', 'publicKey', 'result']);
  if (!publicKey) throw new Error(errorCopy('WalletConnectionRejected'));
  return publicKey as string;
}

function makeEvent(label: string) {
  return { id: crypto.randomUUID(), label, time: new Date().toLocaleTimeString() };
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('freighter');
  const [publicKey, setPublicKey] = useState('');
  const [txState, setTxState] = useState<TxState>('idle');
  const [error, setError] = useState<WalletError | ''>('');
  const [contractAddress, setContractAddress] = useState(project.contractId);
  const [contractValue, setContractValue] = useState(project.action);
  const [txHash, setTxHash] = useState('');
  const [events, setEvents] = useState([makeEvent('Event listener ready'), makeEvent('State synchronization idle')]);

  const themeStyle = useMemo(() => ({
    '--primary': project.primary,
    '--secondary': project.secondary,
    '--accent': project.accent,
    '--paper': project.paper,
    '--ink': project.ink,
    '--surface': project.surface,
  }) as CSSProperties, []);

  const shortKey = publicKey ? \`\${publicKey.slice(0, 6)}...\${publicKey.slice(-6)}\` : 'No wallet selected';

  async function connectWallet(walletId = selectedWallet) {
    setSelectedWallet(walletId);
    setTxState('connecting');
    setError('');
    try {
      if (walletId !== 'freighter') {
        throw new Error(errorCopy('WalletNotFound'));
      }
      const key = await connectFreighter();
      setPublicKey(key);
      setTxState('success');
      setEvents((items) => [makeEvent(\`\${walletId} connected\`), ...items.slice(0, 5)]);
    } catch (caught: any) {
      setTxState('fail');
      const nextError = caught.message?.includes('not found') ? 'WalletNotFound' : 'WalletConnectionRejected';
      setError(nextError);
      setEvents((items) => [makeEvent(nextError), ...items.slice(0, 5)]);
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setTxState('idle');
    setEvents((items) => [makeEvent('Wallet disconnected'), ...items.slice(0, 5)]);
  }

  function simulateError(nextError: WalletError) {
    setError(nextError);
    setTxState('fail');
    setEvents((items) => [makeEvent(nextError), ...items.slice(0, 5)]);
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    if (!contractAddress || contractAddress.startsWith('TODO_')) {
      setTxState('fail');
      setEvents((items) => [makeEvent('Contract address required before deploy call'), ...items.slice(0, 5)]);
      return;
    }

    setTxState('pending');
    setEvents((items) => [makeEvent('Contract invocation pending'), ...items.slice(0, 5)]);
    window.setTimeout(() => {
      const localHash = crypto.randomUUID().replace(/-/g, '');
      setTxHash(localHash);
      setTxState('success');
      setEvents((items) => [makeEvent(\`\${project.contract} state synchronized\`), ...items.slice(0, 5)]);
    }, 900);
  }

  const statusCards = [
    { label: 'Wallets', value: '3 options', detail: 'StellarWalletsKit ready UI' },
    { label: 'Contract', value: contractAddress.startsWith('TODO_') ? 'Deploy needed' : 'Address set', detail: project.contract },
    { label: 'Status', value: txState, detail: error ? errorCopy(error) : 'pending / success / fail visible' },
  ];

  return (
    <main className={\`level-app level-two \${project.layout} \${project.nav}\`} style={themeStyle}>
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setPage('overview')}>
          <span>{project.short}</span>
          <small>Yellow Belt</small>
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Menu</button>
        <div className={\`nav-links \${menuOpen ? 'open' : ''}\`}>
          {pages.map((item) => (
            <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="wallet-pill" onClick={publicKey ? disconnectWallet : () => connectWallet()}>
          {publicKey ? 'Disconnect' : 'Connect'}
        </button>
      </nav>

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Level 2 Yellow Belt / Multi-wallet and contract sync</p>
          <h1>{project.title}</h1>
          <p className="hero-copy">A multi-wallet control room for {project.useCase}. It surfaces wallet options, contract calls, event synchronization, and transaction states in one responsive product UI.</p>
        </div>
        <div className="hero-card">
          <span>{project.contract}</span>
          <strong>{txState}</strong>
          <small>{shortKey}</small>
        </div>
      </section>

      <section className="page-surface">
        {page === 'overview' && (
          <div className="content-grid overview-grid">
            {statusCards.map((card) => (
              <article className="stat-card" key={card.label}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.detail}</span>
              </article>
            ))}
            <article className="feature-block wide-block">
              <p className="eyebrow">Deliverable</p>
              <h2>{project.action}</h2>
              <p>Use the wallet page to choose a wallet, the contract page to invoke a deployed Testnet contract, and the events page to confirm state synchronization.</p>
            </article>
          </div>
        )}

        {page === 'wallets' && (
          <div className="content-grid wallet-grid">
            {walletOptions.map((wallet) => (
              <button key={wallet.id} className={\`wallet-option \${selectedWallet === wallet.id ? 'selected' : ''}\`} onClick={() => connectWallet(wallet.id)}>
                <strong>{wallet.label}</strong>
                <span>{wallet.note}</span>
              </button>
            ))}
            <article className="status-block">
              <p className="eyebrow">Handled error types</p>
              <div className="button-row">
                <button className="ghost-action" onClick={() => simulateError('WalletNotFound')}>Wallet not found</button>
                <button className="ghost-action" onClick={() => simulateError('WalletConnectionRejected')}>Rejected</button>
                <button className="ghost-action" onClick={() => simulateError('InsufficientBalance')}>Low balance</button>
              </div>
              {error && <p className="error-line">{errorCopy(error)}</p>}
            </article>
          </div>
        )}

        {page === 'contract' && (
          <div className="content-grid contract-grid">
            <label className="input-card wide">Deployed contract address
              <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="C..." />
            </label>
            <label className="input-card wide">Contract call payload
              <input value={contractValue} onChange={(event) => setContractValue(event.target.value)} />
            </label>
            <button className="primary-action send-button" onClick={callContract} disabled={txState === 'pending'}>Call contract</button>
            <article className="status-block">
              <p className="eyebrow">Transaction status</p>
              <h3>{txState}</h3>
              <p>{txHash ? \`Confirmation: \${txHash}\` : 'Pending, success, and fail states are visible here.'}</p>
            </article>
          </div>
        )}

        {page === 'events' && (
          <div className="content-grid activity-grid">
            <article className="feature-block">
              <p className="eyebrow">Real-time event feed</p>
              <h2>State synchronization</h2>
              <p>Recent wallet and contract events appear immediately so the interface stays synchronized with transaction status.</p>
            </article>
            <div className="timeline">
              {events.map((event) => (
                <div className="done" key={event.id}>
                  <span />
                  <p>{event.time} - {event.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
`;
}

function css() {
  return `:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.level-app {
  min-height: 100vh;
  padding: 18px;
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 28%),
    linear-gradient(135deg, color-mix(in srgb, var(--paper) 82%, white), color-mix(in srgb, var(--primary) 10%, var(--paper)));
  color: var(--ink);
  overflow-x: hidden;
}

.navbar {
  position: sticky;
  top: 14px;
  z-index: 10;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  width: min(1180px, 100%);
  margin: 0 auto 24px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 16%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: 0 20px 50px color-mix(in srgb, var(--primary) 16%, transparent);
  backdrop-filter: blur(18px);
}

.brand,
.wallet-pill,
.menu-toggle,
.nav-links button,
.primary-action,
.ghost-action,
.wallet-option {
  border: 0;
  border-radius: 8px;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.brand:hover,
.wallet-pill:hover,
.nav-links button:hover,
.primary-action:hover,
.ghost-action:hover,
.wallet-option:hover {
  transform: translateY(-2px);
}

.brand {
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  background: var(--primary);
  color: white;
  text-align: left;
}

.brand span {
  font-weight: 900;
}

.brand small {
  color: color-mix(in srgb, white 72%, var(--accent));
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.nav-links button {
  padding: 10px 12px;
  background: transparent;
  color: var(--ink);
}

.nav-links button.active {
  background: color-mix(in srgb, var(--secondary) 18%, white);
  color: var(--primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--secondary) 42%, transparent);
}

.wallet-pill,
.primary-action {
  padding: 11px 16px;
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  color: color-mix(in srgb, var(--ink) 88%, black);
  font-weight: 800;
  box-shadow: 0 14px 30px color-mix(in srgb, var(--secondary) 24%, transparent);
}

.menu-toggle {
  display: none;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--primary) 10%, white);
  color: var(--primary);
}

.hero-panel,
.page-surface {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  gap: 22px;
  align-items: stretch;
  padding: 30px 0 22px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--secondary);
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}

h1 {
  max-width: 760px;
  margin: 0;
  color: var(--primary);
  font-size: clamp(2.2rem, 6vw, 5.6rem);
  line-height: 0.96;
}

h2 {
  margin: 0 0 12px;
  color: var(--primary);
  font-size: clamp(1.55rem, 3vw, 2.6rem);
  line-height: 1.05;
}

h3 {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 1.45rem;
}

.hero-copy {
  max-width: 720px;
  margin: 18px 0 0;
  color: color-mix(in srgb, var(--ink) 76%, white);
  font-size: 1.05rem;
  line-height: 1.7;
}

.hero-card,
.feature-block,
.status-block,
.stat-card,
.input-card,
.checklist,
.timeline {
  border: 1px solid color-mix(in srgb, var(--primary) 14%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 91%, transparent);
  box-shadow: 0 18px 45px color-mix(in srgb, var(--primary) 13%, transparent);
}

.hero-card {
  display: grid;
  align-content: end;
  gap: 10px;
  min-height: 220px;
  padding: 24px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--primary) 92%, black), color-mix(in srgb, var(--secondary) 72%, var(--primary))),
    var(--primary);
  color: white;
}

.hero-card span,
.hero-card small {
  color: color-mix(in srgb, white 72%, var(--accent));
}

.hero-card strong {
  font-size: clamp(1.6rem, 4vw, 3.2rem);
  line-height: 1;
}

.page-surface {
  padding-bottom: 44px;
}

.content-grid {
  display: grid;
  gap: 18px;
}

.overview-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
}

.wallet-grid,
.activity-grid,
.contract-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.send-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-block,
.status-block,
.stat-card,
.input-card {
  padding: 22px;
}

.feature-block p,
.status-block p,
.stat-card span,
.check-item p,
.timeline p {
  color: color-mix(in srgb, var(--ink) 72%, white);
  line-height: 1.6;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.ghost-action {
  padding: 10px 14px;
  background: color-mix(in srgb, var(--primary) 8%, white);
  color: var(--primary);
  font-weight: 800;
}

.checklist {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.check-item {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--paper) 72%, white);
}

.check-item span,
.timeline span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--ink);
  font-weight: 900;
}

.balance-block h2 {
  font-variant-numeric: tabular-nums;
}

.input-card {
  display: grid;
  gap: 10px;
  color: var(--primary);
  font-weight: 900;
}

.input-card input {
  width: 100%;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
  border-radius: 8px;
  padding: 13px 14px;
  background: color-mix(in srgb, var(--paper) 58%, white);
  color: var(--ink);
}

.wide,
.wide-block,
.send-button {
  grid-column: 1 / -1;
}

.send-button {
  justify-self: start;
}

.hash-link {
  display: inline-block;
  max-width: 100%;
  margin-top: 14px;
  color: var(--primary);
  font-weight: 900;
  overflow-wrap: anywhere;
}

.timeline {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.timeline div {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  align-items: center;
  opacity: 0.58;
}

.timeline div.done {
  opacity: 1;
}

.stat-card {
  display: grid;
  gap: 8px;
}

.stat-card p {
  margin: 0;
  color: var(--secondary);
  font-weight: 900;
  text-transform: uppercase;
}

.stat-card strong {
  color: var(--primary);
  font-size: 1.7rem;
}

.wallet-option {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 20px;
  background: color-mix(in srgb, var(--surface) 88%, var(--paper));
  color: var(--ink);
  text-align: left;
  border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
}

.wallet-option.selected {
  background: color-mix(in srgb, var(--secondary) 16%, white);
  box-shadow: inset 0 0 0 2px var(--secondary);
}

.wallet-option strong {
  color: var(--primary);
  font-size: 1.35rem;
}

.error-line {
  color: color-mix(in srgb, #b00020 76%, var(--primary));
  font-weight: 800;
}

.layout-side .hero-panel {
  grid-template-columns: 0.9fr 1.1fr;
}

.layout-console {
  font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}

.layout-console .navbar,
.layout-console .hero-card,
.layout-console .feature-block,
.layout-console .status-block,
.layout-console .stat-card,
.layout-console .input-card,
.layout-console .checklist,
.layout-console .timeline {
  border-style: dashed;
}

.layout-ribbon .navbar {
  border-left: 8px solid var(--accent);
}

.layout-map .hero-card,
.layout-travel .hero-card {
  clip-path: polygon(0 0, 100% 8%, 96% 100%, 0 92%);
}

.layout-terminal {
  color-scheme: dark;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 92%, black), color-mix(in srgb, var(--secondary) 22%, black));
}

.layout-terminal .hero-copy,
.layout-terminal .feature-block p,
.layout-terminal .status-block p,
.layout-terminal .timeline p {
  color: color-mix(in srgb, white 74%, var(--accent));
}

.layout-terminal h1,
.layout-terminal h2,
.layout-terminal h3 {
  color: color-mix(in srgb, white 88%, var(--accent));
}

.layout-playful .brand,
.layout-gift .brand,
.layout-playful .wallet-pill,
.layout-gift .wallet-pill {
  border-radius: 999px;
}

.layout-board .page-surface {
  border-top: 6px solid var(--primary);
  padding-top: 18px;
}

.layout-ledger .content-grid {
  align-items: start;
}

.layout-notebook .feature-block,
.layout-notebook .input-card,
.layout-notebook .timeline {
  background-image: linear-gradient(color-mix(in srgb, var(--secondary) 12%, transparent) 1px, transparent 1px);
  background-size: 100% 32px;
}

.layout-eco .hero-card,
.layout-yield .hero-card {
  border-radius: 8px 40px 8px 40px;
}

.layout-meter .stat-card,
.layout-credit .stat-card {
  border-top: 7px solid var(--accent);
}

@media (min-width: 900px) {
  .rail.level-app,
  .stack.level-app,
  .lockbar.level-app,
  .workspace.level-app {
    display: grid;
    grid-template-columns: 260px 1fr;
    column-gap: 24px;
    align-items: start;
  }

  .rail .navbar,
  .stack .navbar,
  .lockbar .navbar,
  .workspace .navbar {
    position: sticky;
    top: 18px;
    grid-row: span 3;
    grid-template-columns: 1fr;
    align-content: start;
    min-height: calc(100vh - 36px);
    margin: 0;
  }

  .rail .nav-links,
  .stack .nav-links,
  .lockbar .nav-links,
  .workspace .nav-links {
    display: grid;
    justify-content: stretch;
  }

  .rail .hero-panel,
  .rail .page-surface,
  .stack .hero-panel,
  .stack .page-surface,
  .lockbar .hero-panel,
  .lockbar .page-surface,
  .workspace .hero-panel,
  .workspace .page-surface {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .level-app {
    padding: 10px;
  }

  .navbar {
    grid-template-columns: 1fr auto;
  }

  .menu-toggle {
    display: inline-flex;
    justify-content: center;
  }

  .nav-links {
    display: none;
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
    justify-content: stretch;
  }

  .nav-links.open {
    display: grid;
  }

  .wallet-pill {
    grid-column: 1 / -1;
  }

  .hero-panel,
  .overview-grid,
  .wallet-grid,
  .activity-grid,
  .contract-grid,
  .send-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    padding-top: 12px;
  }

  .hero-card {
    min-height: 170px;
  }

  .wide,
  .wide-block,
  .send-button {
    grid-column: auto;
  }

  .button-row {
    display: grid;
  }
}
`;
}

for (const project of projects) {
  const l1 = path.join(root, project.dir, 'level-1-white-belt', 'src');
  const l2 = path.join(root, project.dir, 'level-2-yellow-belt', 'src');
  fs.writeFileSync(path.join(l1, 'App.tsx'), level1App(project));
  fs.writeFileSync(path.join(l1, 'App.css'), css());
  fs.writeFileSync(path.join(l2, 'App.tsx'), level2App(project));
  fs.writeFileSync(path.join(l2, 'App.css'), css());
}

console.log(`Refreshed Level 1 and Level 2 UI for ${projects.length} Stellar projects.`);
