import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "18-micropay",
  "title": "MicroPay Hub",
  "short": "MicroPay",
  "useCase": "Streaming Micro-Payments",
  "audience": "Metered API builders",
  "primary": "#f59e0b",
  "secondary": "#a855f7",
  "surface": "#020617",
  "action": "Stream Micro-Payment Channel"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Console Overview', icon: '📊' },
  { id: 'wallet', label: 'Stream Nodes', icon: '⚡' },
  { id: 'send', label: 'Launch Stream', icon: '💸' },
  { id: 'activity', label: 'On-chain Logs', icon: '📜' },
] as const;

const checklist = [
  { title: 'Freighter Stream Gateway', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Horizon Ledger Node', desc: 'Real-time query of account states on testnet.' },
  { title: 'Balance Asset Metrics', desc: 'Fetch XLM balances on command.' },
  { title: 'Cryptographic Channel Lock', desc: 'Lock payment channels via signed transactions.' },
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
    throw new Error('Freighter wallet was not found. Please install the Freighter extension.');
  }

  if (freighter.setAllowed) await freighter.setAllowed();
  if (freighter.requestAccess) await freighter.requestAccess();

  const addressResult = freighter.getAddress ? await freighter.getAddress() : await freighter.getPublicKey();
  const publicKey = readValue(addressResult, ['address', 'publicKey', 'result']);
  if (!publicKey) throw new Error('Wallet connection was rejected.');
  return publicKey as string;
}

async function fetchNativeBalance(publicKey: string) {
  const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Channel node not activated. Run Friendbot from Stream Nodes.' : 'Horizon error.');
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
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('5');
  const [memo, setMemo] = useState('Stream Lock');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Gateway node disconnected.');
  const [txHash, setTxHash] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Offline';

  async function connectWallet() {
    setState('connecting');
    setMessage('Opening Freighter handshake portal...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Channel handshaked. Resolving asset balance...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Channel synchronized with Stellar Ledger.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Handshake rejected.');
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxHash('');
    setState('idle');
    setMessage('Channel closed locally.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Initialize freighter handshake first.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Latest balance state pulled.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Query failed.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Initialize freighter handshake first.');
    setState('loading');
    setMessage('Requesting assets from Friendbot...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Activation failed.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Activated: 10K XLM added to node.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Activation failed.');
    }
  }

  async function executeStream() {
    if (!publicKey) return setMessage('Initialize freighter handshake first.');
    if (!destination || !amount) return setMessage('Destination node and stream amount required.');
    setState('submitting');
    setTxHash('');
    setMessage('Waiting for Freighter multi-sig authorization...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Stream channel transaction confirmed.');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Channel authorization rejected.');
      setPage('activity');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative overflow-hidden cyber-grid">
      {/* Glow shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-amber-500/10 z-40">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="MicroPay Logo" className="w-8 h-8 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="font-bold text-sm tracking-widest text-amber-500 uppercase font-mono-tech">{project.title}</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-xs px-3 py-1.5 border border-slate-700 font-mono text-slate-300"
        >
          {sidebarOpen ? 'CLOSE' : 'MENU'}
        </button>
      </div>

      {/* Sidebar Navigation - LEFT SIDE */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-[260px] bg-slate-900/90 md:bg-slate-900/55 backdrop-blur-md border-r border-amber-500/10 flex flex-col justify-between py-8 px-6 transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="MicroPay Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            <div>
              <h1 className="font-extrabold text-md tracking-wider text-amber-400 font-mono-tech uppercase">
                {project.title.toUpperCase()}
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold block mt-0.5 font-mono">White Belt MVP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            {pages.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`flex items-center gap-4 px-4 py-3 border font-semibold text-xs tracking-wider uppercase font-mono-tech transition-all ${
                  page === item.id 
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Wallet Node */}
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
          <div className="font-mono text-[10px] flex justify-between items-center text-slate-500">
            <span>NODE STATUS</span>
            <span className={`w-1.5 h-1.5 rounded-full ${publicKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
          <div className="p-3 bg-slate-950/60 border border-amber-500/10 rounded-lg">
            <p className="text-[10px] font-mono text-slate-400 truncate">{shortKey}</p>
            {publicKey && <p className="text-[10px] font-mono font-bold text-amber-400 mt-1">{balance} XLM</p>}
          </div>
          <button 
            onClick={publicKey ? disconnectWallet : connectWallet}
            className={`w-full py-2.5 border font-semibold text-xs tracking-wider uppercase font-mono-tech transition-all ${
              publicKey 
                ? 'border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/15' 
                : 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/25'
            }`}
          >
            {publicKey ? 'Disconnect' : 'Open Gateway'}
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full px-6 md:px-8 py-8 md:py-12 z-30">
        <div className="flex flex-col gap-8 w-full">
          {/* Console State Log */}
          <div className="amber-glow-panel p-4 rounded-xl flex items-center justify-between gap-4 border-l-2 border-l-amber-500 shadow-md">
            <div className="flex items-center gap-3 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <p className="text-xs text-slate-400 uppercase font-mono-tech">State: <span className="normal-case text-amber-300 ml-1 font-bold">{message}</span></p>
            </div>
          </div>

          {/* Dynamic page content */}
          <AnimatePresence mode="wait">
            {page === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid md:grid-cols-5 gap-8 items-start"
              >
                <div className="md:col-span-3 flex flex-col gap-6">
                  <span className="text-xs uppercase tracking-widest text-purple-400 font-bold font-mono">Fast Metered Payments</span>
                  <h2 className="text-3xl font-extrabold tracking-wider text-slate-100 uppercase font-mono-tech leading-tight glow-text-amber">
                    Stream High-Speed Micro-Payments
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    MicroPay enables high-frequency, near-zero cost metered payment tunnels on the Stellar network, designed specifically for programmatic pay-per-use APIs and micro-services.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPage('wallet')}
                      className="px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono-tech uppercase tracking-wider transition-all"
                    >
                      Configure Node
                    </button>
                    <button 
                      onClick={() => setPage('send')}
                      className="px-5 py-3 border border-slate-700 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 text-xs font-bold font-mono-tech uppercase tracking-wider transition-all"
                    >
                      Open Stream
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="amber-glow-panel p-6 rounded-xl flex flex-col gap-6">
                    <h3 className="font-bold text-sm text-amber-400 uppercase tracking-widest font-mono-tech">Milestones</h3>
                    <div className="flex flex-col gap-4 font-mono">
                      {checklist.map((item, index) => (
                        <div className="flex gap-4 items-start" key={index}>
                          <div className="w-5 h-5 bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-amber-500/30">
                            0{index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 text-xs uppercase font-mono-tech">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {page === 'wallet' && (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="amber-glow-panel p-8 rounded-xl flex flex-col gap-6">
                  <div className="text-center flex flex-col gap-2 font-mono-tech">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">Stream Node Node</h2>
                    <p className="text-xs text-slate-500">Configure connection to Freighter Gateway.</p>
                  </div>

                  <div className="bg-slate-950/60 border border-amber-500/10 p-6 rounded-lg flex flex-col gap-4 font-mono text-xs">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-slate-500 font-mono-tech uppercase">Tunnel Connection</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider ${
                        publicKey ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {publicKey ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-slate-500 font-mono-tech uppercase">Node Key</span>
                      <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 border border-slate-900 text-slate-300 max-w-[150px] truncate">
                        {publicKey ? publicKey : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-mono-tech uppercase">Liquidity Assets</span>
                      <strong className="text-sm font-bold text-amber-400">
                        {balance} XLM
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 font-mono-tech">
                    {!publicKey ? (
                      <button 
                        onClick={connectWallet}
                        className="w-full py-3.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
                      >
                        OPEN FREIGHTER GATEWAY
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={refreshBalance}
                          className="py-3.5 border border-slate-700 hover:border-amber-500/30 font-bold text-slate-300 hover:text-amber-400 text-xs tracking-wider uppercase transition-all"
                        >
                          REFRESH
                        </button>
                        <button 
                          onClick={fundWallet}
                          className="py-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs tracking-wider uppercase transition-all"
                        >
                          ACTIVATE NODE
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {page === 'send' && (
              <motion.div 
                key="send"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="amber-glow-panel p-8 rounded-xl flex flex-col gap-6">
                  <div className="text-center flex flex-col gap-2 font-mono-tech">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">Launch Stream Channel</h2>
                    <p className="text-xs text-slate-500">Lock payment deposits into the stream channel.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400 uppercase font-mono-tech tracking-wider">Recipient Node Key</label>
                      <input 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)} 
                        placeholder="e.g. G..."
                        className="cyber-input px-4 py-3 rounded-lg text-xs w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400 uppercase font-mono-tech tracking-wider">Stream Lock Amount (XLM)</label>
                      <input 
                        type="number"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="cyber-input px-4 py-3 rounded-lg text-xs w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400 uppercase font-mono-tech tracking-wider">Reference Memo</label>
                      <input 
                        value={memo} 
                        onChange={(e) => setMemo(e.target.value)} 
                        maxLength={28}
                        className="cyber-input px-4 py-3 rounded-lg text-xs w-full"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={executeStream}
                    disabled={state === 'submitting'}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 font-mono-tech"
                  >
                    {state === 'submitting' ? 'AUTHORIZING SIGNATURE...' : 'LOCK STREAM ON TESTNET'}
                  </button>
                </div>
              </motion.div>
            )}

            {page === 'activity' && (
              <motion.div 
                key="activity"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="amber-glow-panel p-8 rounded-xl flex flex-col gap-6">
                  <h2 className="text-2xl font-bold font-mono-tech text-center uppercase tracking-wider">Ledger Result</h2>

                  <div className="bg-slate-950/60 border border-amber-500/10 p-6 rounded-lg flex flex-col gap-4 text-center">
                    <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold ${
                      state === 'success' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {state === 'success' ? '✔' : 'i'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase font-mono-tech">{state === 'success' ? 'Channel Locked' : 'Console logs'}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{message}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Horizon Ledger Hash</label>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-[10px] p-4 rounded-lg bg-slate-950 hover:bg-slate-900 border border-amber-500/10 text-amber-400 hover:text-amber-300 transition-all text-center block break-all"
                      >
                        {txHash}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="py-6 mt-8 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono-tech uppercase tracking-widest">
          © 2026 {project.title.toUpperCase()} - Streaming Micropayments
        </footer>
      </div>
    </div>
  );
}
