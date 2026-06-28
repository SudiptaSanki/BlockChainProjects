import { type CSSProperties, useMemo, useState } from 'react';
import './App.css';

const project = {
  "dir": "20-collateralize",
  "title": "Collateralize",
  "short": "Collateral",
  "useCase": "P2P lending collateral",
  "audience": "borrowers and lenders",
  "primary": "#1e3a5f",
  "secondary": "#00b4d8",
  "accent": "#ffb703",
  "paper": "#edf7fb",
  "ink": "#14243a",
  "surface": "#ffffff",
  "layout": "layout-credit",
  "nav": "creditline",
  "contract": "P2P lending contract",
  "action": "Lock collateral",
  "contractId": "TODO_COLLATERALIZE_CONTRACT_ID"
};

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
  const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
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

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Not connected';

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
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
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
    <main className={`level-app level-one ${project.layout} ${project.nav}`} style={themeStyle}>
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setPage('overview')} aria-label={`${project.title} home`}>
          <span>{project.short}</span>
          <small>White Belt</small>
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Menu</button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
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
              {txHash && <a className="hash-link" href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>}
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
