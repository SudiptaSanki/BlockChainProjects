import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "15-stellarscribe",
  "title": "StellarScribe",
  "short": "Scribe",
  "useCase": "Decentralized Publishing & Expense Audits",
  "audience": "Publishers & Bookkeepers",
  "primary": "#3f51b5",
  "secondary": "#81b29a",
  "surface": "#fcfbf7",
  "action": "Publish Audit Note"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Library' },
  { id: 'wallet', label: 'Identity Node' },
  { id: 'send', label: 'Write Note' },
  { id: 'activity', label: 'Ledger Index' },
] as const;

const checklist = [
  { title: 'Freighter Scribe Identity', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Stellar Ledger Connection', desc: 'Sync audit logs directly from Horizon Testnet.' },
  { title: 'Identity balance check', desc: 'Fetch on-chain native XLM balance.' },
  { title: 'Permanently record note', desc: 'Lock memo notes permanently in transaction payloads.' },
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
    throw new Error(response.status === 404 ? 'Identity not funded. Run Friendbot from the Identity Node tab.' : 'Could not query balance.');
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
  const [amount, setAmount] = useState('1');
  const [memo, setMemo] = useState('Scribe Lock');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Writer portal offline.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Opening Freighter identity interface...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Identity linked. Loading native assets...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Identity balance synced from testnet.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Link rejected.');
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxHash('');
    setState('idle');
    setMessage('Identity disconnected.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Link Freighter before querying assets.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balance updated.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Refresh failed.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Link Freighter before activating identity.');
    setState('loading');
    setMessage('Requesting Friendbot XLM assets...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Friendbot activation failed.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Identity activated: 10K XLM funded.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Funding failed.');
    }
  }

  async function publishNote() {
    if (!publicKey) return setMessage('Link Freighter before writing notes.');
    if (!destination || !amount) return setMessage('Valid node destination and network allocation required.');
    setState('submitting');
    setTxHash('');
    setMessage('Waiting for cryptographic scribe authorization...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Scribe note permanently written to the ledger!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Publish authorization rejected.');
      setPage('activity');
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-stone-800 flex flex-col justify-between relative overflow-hidden parchment-bg">
      {/* Navigation */}
      <nav className="notebook-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[#fcfbf7]/90 border-b border-indigo-500/10">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="StellarScribe Logo" className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(63,81,181,0.15)]" />
          <div>
            <h1 className="font-bold text-xl leading-none text-[#2c2d3c] font-serif-display">
              {project.title}
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-indigo-650 font-bold block mt-0.5 font-mono">White Belt MVP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-indigo-50/50 p-1 border border-indigo-500/10 rounded-lg">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-250 ${
                page === item.id 
                  ? 'bg-[#3f51b5] text-white rounded-md shadow-sm' 
                  : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50'
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={publicKey ? disconnectWallet : connectWallet}
          className={`px-5 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 ${
            publicKey 
              ? 'bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-350' 
              : 'bg-[#3f51b5] text-white hover:opacity-90 shadow-md shadow-indigo-500/10'
          }`}
        >
          {publicKey ? shortKey : 'LINK SCRIBE'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-10 z-30">
        
        {/* Status log */}
        <div className="notebook-card p-4 rounded-xl flex items-center justify-between gap-4 border-l-2 border-l-indigo-600 shadow-sm bg-white">
          <div className="flex items-center gap-3 font-mono">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <p className="text-xs text-stone-600 font-mono uppercase">Writer Log: <span className="normal-case text-indigo-900 ml-1 font-bold">{message}</span></p>
          </div>
          {publicKey && (
            <div className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
              {balance} XLM
            </div>
          )}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-5 gap-8 items-start"
            >
              <div className="md:col-span-3 flex flex-col justify-center gap-6">
                <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold font-mono">Immutable publishing & audit ledger</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2d3c] font-serif-display leading-tight">
                  Write Immutable Notes on Stellar
                </h2>
                <p className="text-stone-600 leading-relaxed text-sm">
                  StellarScribe allows publishers and bookkeepers to permanently lock auditing notes into transaction memos. Your texts are securely recorded on-chain.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPage('wallet')}
                    className="px-5 py-3 rounded-full bg-[#3f51b5] text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10"
                  >
                    Open Identity
                  </button>
                  <button 
                    onClick={() => setPage('send')}
                    className="px-5 py-3 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs uppercase tracking-wider transition-all"
                  >
                    Write Note
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="notebook-card p-6 rounded-2xl flex flex-col gap-6 bg-white">
                  <h3 className="font-bold text-sm text-[#3f51b5] uppercase tracking-widest font-mono">Checklist</h3>
                  <div className="flex flex-col gap-4">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-5 h-5 bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 rounded-full border border-indigo-100">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-850 text-xs font-mono">{item.title}</h4>
                          <p className="text-[10px] text-stone-500 mt-0.5">{item.desc}</p>
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="notebook-card p-8 rounded-2xl flex flex-col gap-6 bg-white">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-serif-display">Identity Gateway</h2>
                  <p className="text-xs text-stone-500">Configure connection to Freighter.</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-6 rounded-xl flex flex-col gap-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <span className="text-slate-500 uppercase">Scribe Node</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                      publicKey ? 'bg-indigo-55/20 text-[#3f51b5] border-[#3f51b5]/30' : 'bg-red-55/20 text-red-500 border-red-500/30'
                    }`}>
                      {publicKey ? 'Linked' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <span className="text-slate-500 uppercase">Address Node</span>
                    <span className="text-[10px] bg-stone-100 px-2 py-1 border border-stone-250 text-stone-700 truncate max-w-[150px]">
                      {publicKey ? publicKey : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase">Identity Assets</span>
                    <strong className="text-sm font-bold text-indigo-700">
                      {balance} XLM
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3 font-mono">
                  {!publicKey ? (
                    <button 
                      onClick={connectWallet}
                      className="w-full py-3.5 rounded-full bg-[#3f51b5] text-white hover:opacity-95 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-indigo-500/10"
                    >
                      LINK IDENTITY TUNNEL
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={refreshBalance}
                        className="py-3.5 border border-stone-300 hover:bg-stone-100 rounded-full font-bold text-stone-700 text-xs tracking-wider uppercase transition-all"
                      >
                        REFRESH
                      </button>
                      <button 
                        onClick={fundWallet}
                        className="py-3.5 bg-indigo-55/20 hover:bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-bold text-xs tracking-wider uppercase transition-all"
                      >
                        ACTIVATE IDENTITY
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="notebook-card p-8 rounded-2xl flex flex-col gap-6 bg-white">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-serif-display">Write On-chain Note</h2>
                  <p className="text-xs text-stone-500">Record auditing text directly inside transaction memo payload.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-700">Audit Vault Target</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. G..."
                      className="notebook-input px-2 py-3 rounded-md text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-700">Audit Fee Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="notebook-input px-2 py-3 rounded-md text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-stone-700">Memo note (max 28 chars)</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)} 
                      maxLength={28}
                      className="notebook-input px-2 py-3 rounded-md text-sm w-full font-mono"
                    />
                  </div>
                </div>

                <button 
                  onClick={publishNote}
                  disabled={state === 'submitting'}
                  className="w-full py-4 rounded-full bg-[#3f51b5] hover:opacity-95 font-bold text-white text-xs tracking-wider uppercase transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50"
                >
                  {state === 'submitting' ? 'WRITING IMMUTABLE NOTE...' : 'PUBLISH NOTE ON TESTNET'}
                </button>
              </div>
            </motion.div>
          )}

          {page === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="notebook-card p-8 rounded-2xl flex flex-col gap-6 bg-white">
                <h2 className="text-2xl font-bold font-serif-display text-center">Ledger Index</h2>

                <div className="bg-stone-50 border border-stone-200 p-6 rounded-xl flex flex-col gap-4 text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold ${
                    state === 'success' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-red-50/50 text-red-500 border border-red-100'
                  }`}>
                    {state === 'success' ? '✔' : 'i'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase font-mono">{state === 'success' ? 'Publish success' : 'Writer console'}</h3>
                    <p className="text-xs text-stone-500 mt-1 font-mono">{message}</p>
                  </div>
                </div>

                {txHash && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Horizon Ledger Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-[10px] p-4 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-250 text-indigo-700 hover:text-indigo-900 transition-all text-center block break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-indigo-500/10 text-center text-[10px] text-stone-400 font-mono uppercase tracking-widest">
        © 2026 {project.title.toUpperCase()} - Immutable publishing rails
      </footer>
    </div>
  );
}
