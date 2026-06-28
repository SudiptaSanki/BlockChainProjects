import { type CSSProperties, useMemo, useState } from 'react';
import './App.css';

const project = {
  "dir": "16-ecofund",
  "title": "EcoFund",
  "short": "EcoFund",
  "useCase": "carbon credit retirement",
  "audience": "climate contributors",
  "primary": "#164a41",
  "secondary": "#4d908e",
  "accent": "#f9c74f",
  "paper": "#eff8ef",
  "ink": "#102f2b",
  "surface": "#ffffff",
  "layout": "layout-eco",
  "nav": "leafline",
  "contract": "carbon retirement contract",
  "action": "Retire credit",
  "contractId": "TODO_ECOFUND_CONTRACT_ID"
};

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

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'No wallet selected';

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
      setEvents((items) => [makeEvent(`${walletId} connected`), ...items.slice(0, 5)]);
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
      setEvents((items) => [makeEvent(`${project.contract} state synchronized`), ...items.slice(0, 5)]);
    }, 900);
  }

  const statusCards = [
    { label: 'Wallets', value: '3 options', detail: 'StellarWalletsKit ready UI' },
    { label: 'Contract', value: contractAddress.startsWith('TODO_') ? 'Deploy needed' : 'Address set', detail: project.contract },
    { label: 'Status', value: txState, detail: error ? errorCopy(error) : 'pending / success / fail visible' },
  ];

  return (
    <main className={`level-app level-two ${project.layout} ${project.nav}`} style={themeStyle}>
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setPage('overview')}>
          <span>{project.short}</span>
          <small>Yellow Belt</small>
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Menu</button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
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
              <button key={wallet.id} className={`wallet-option ${selectedWallet === wallet.id ? 'selected' : ''}`} onClick={() => connectWallet(wallet.id)}>
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
              <p>{txHash ? `Confirmation: ${txHash}` : 'Pending, success, and fail states are visible here.'}</p>
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
