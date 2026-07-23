import { connectFreighter } from './services/freighter';
import { fetchXlmBalance, submitPayment as submitStellarPayment } from './services/stellar';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "10-invoic3",
  "title": "Invoic3 System",
  "short": "Invoic3",
  "useCase": "On-chain invoice factoring vaults",
  "audience": "Businesses and Clients",
  "primary": "#2563eb",
  "secondary": "#1d4ed8",
  "action": "Initialize Invoice Lock"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Invoice Gates' },
  { id: 'wallet', label: 'Signatures' },
  { id: 'send', label: 'Settle Invoice' },
  { id: 'activity', label: 'Invoice Ledger' },
] as const;

const checklist = [
  { title: 'Trustless Invoice Factoring', desc: 'Secure invoice payment lockups via Freighter multi-sig vaults.' },
  { title: 'Horizon Ledger Sync', desc: 'Dynamic balance check and invoice payment status updates.' },
  { title: 'Immutable Invoice Seal', desc: 'Commit invoice codes directly into transaction memo payloads.' },
  { title: 'Arbitration Gating', desc: 'Multi-party signature checks for escrow release approvals.' },
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

async function getFreighterPublicKey() {
  const res = await connectFreighter();
  return res.publicKey;
}

async function fetchNativeBalance(publicKey: string) {
  return await fetchXlmBalance(publicKey);
}

async function submitPayment(publicKey: string, destination: string, amount: string, memo: string) {
  return await submitStellarPayment(publicKey, destination, amount, memo);
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('150');
  const [memo, setMemo] = useState('Invoice Settle');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Invoic3 initialization console ready.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Initiating cryptographic handshake...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Identity signature verified. Pulling balances...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Horizon trustless synchronization completed.');
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
    setMessage('Session disconnected.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Handshake Freighter before checking balances.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balances updated.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Horizon query failed.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Handshake Freighter first.');
    setState('loading');
    setMessage('Requesting Friendbot XLM assets...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Activation failed.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Vault funded: 10K XLM received.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Activation failed.');
    }
  }

  async function initiateEscrow() {
    if (!publicKey) return setMessage('Handshake Freighter first.');
    if (!destination || !amount) return setMessage('Recipient address and lock amount required.');
    setState('submitting');
    setTxHash('');
    setMessage('Locking funds on-chain...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Invoice funds successfully locked on-chain!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Invoice Settle lock rejected.');
      setPage('activity');
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden pic-bg-overlay">
      
      {/* Light Left Sidebar */}
      <aside className="w-80 light-sidebar flex flex-col justify-between p-8 shrink-0 z-40">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-6">
            <img src="/invoic3-icon.svg" alt="Invoic3 Logo" className="w-10 h-10 object-contain filter drop-shadow" />
            <div>
              <h1 className="font-bold text-2xl tracking-wide text-stone-900 leading-none">
                {project.short}
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-blue-700 font-bold block mt-1 font-sans">White Belt Vault</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`w-full px-5 py-4 rounded-xl text-sm font-semibold tracking-wider text-left transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-blue-600/10 text-blue-800 border-l-4 border-blue-600 shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={publicKey ? disconnectWallet : connectWallet}
            className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-sm ${
              publicKey 
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-800' 
                : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-800/10'
            }`}
          >
            {publicKey ? shortKey : 'Handshake keys'}
          </button>
          <span className="text-[9px] uppercase tracking-wider text-stone-400 text-center block">Stellar Invoice Engine</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between min-h-screen z-30">
        <main className="max-w-4xl mx-auto w-full px-12 py-16 flex flex-col gap-10">
          
          {/* Status Message Display */}
          <div className="luxury-card p-6 rounded-2xl flex items-center justify-between gap-4 border-l-2 border-l-blue-600">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-650 bg-blue-600 animate-pulse" />
              <p className="text-sm text-stone-300">
                <span className="font-calligraphy text-blue-500 mr-2">System Status:</span> 
                {message}
              </p>
            </div>
            {publicKey && (
              <div className="text-sm font-semibold px-4 py-2 bg-blue-600/10 text-blue-450 text-blue-400 border border-blue-900/35 rounded-xl">
                {balance} XLM
              </div>
            )}
          </div>

          {/* Dynamic Sections */}
          <AnimatePresence mode="wait">
            {page === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid md:grid-cols-5 gap-8 items-stretch"
              >
                <div className="md:col-span-3 luxury-card p-10 rounded-3xl flex flex-col justify-center gap-6">
                  <span className="text-sm font-calligraphy text-blue-500">Ancient Trust in Digital Ledger Vaults</span>
                  <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
                    Secure Invoice Vault Settlements
                  </h2>
                  <p className="text-stone-300 leading-relaxed text-base">
                    Welcome to Invoic3. Lock and manage secure invoice settlements with trustless smart vaults. Connect Freighter to allocate payments, define targets, and settle invoice gates.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPage('wallet')}
                      className="px-6 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold tracking-wider text-xs uppercase shadow-lg shadow-blue-800/10 transition-all duration-300"
                    >
                      Authenticate keys
                    </button>
                    <button 
                      onClick={() => setPage('send')}
                      className="px-6 py-3.5 rounded-xl border border-stone-700 hover:bg-stone-800/40 text-stone-300 hover:text-stone-150 font-bold tracking-wider text-xs uppercase transition-all duration-300"
                    >
                      Settle Invoice
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 luxury-card p-8 rounded-3xl flex flex-col justify-between gap-6">
                  <h3 className="font-bold text-xl text-blue-500 border-b border-blue-600/10 pb-4">Invoice Specifications</h3>
                  <div className="flex flex-col gap-5">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-500 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-blue-750/20">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-200 text-sm">{item.title}</h4>
                          <p className="text-xs text-stone-400 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {page === 'wallet' && (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="luxury-card p-10 rounded-3xl flex flex-col gap-6">
                  <div className="text-center flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-blue-500">Vault Handshake</h2>
                    <p className="text-xs text-stone-400">Configure connection to Freighter keys.</p>
                  </div>

                  <div className="bg-stone-900/40 border border-stone-800 p-6 rounded-2xl flex flex-col gap-4 font-mono text-xs text-stone-300">
                    <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                      <span className="text-stone-500 uppercase tracking-wider text-[10px]">Vault Status</span>
                      <span className={`text-[9px] font-bold px-2.5 py-1 border rounded-xl uppercase tracking-widest ${
                        publicKey ? 'bg-blue-900/10 text-blue-400 border-blue-600/30' : 'bg-rose-950/20 text-rose-455 border-rose-500/30'
                      }`}>
                        {publicKey ? 'Synchronized' : 'Locked'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                      <span className="text-stone-500 uppercase tracking-wider text-[10px]">Public Address</span>
                      <span className="text-[10px] bg-stone-900/60 px-3 py-1.5 border border-stone-800 text-blue-400/90 rounded-lg truncate max-w-[160px]">
                        {publicKey ? publicKey : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 uppercase tracking-wider text-[10px]">Available Collateral</span>
                      <strong className="text-base font-bold text-blue-400">
                        {balance} XLM
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {!publicKey ? (
                      <button 
                        onClick={connectWallet}
                        className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300"
                      >
                        Handshake keys
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={refreshBalance}
                          className="py-4 border border-stone-700 hover:bg-stone-800/40 rounded-xl font-bold text-stone-300 text-xs tracking-wider uppercase transition-all duration-300"
                        >
                          Refresh Vault
                        </button>
                        <button 
                          onClick={fundWallet}
                          className="py-4 bg-blue-750/15 hover:bg-blue-750/30 border border-blue-600/30 text-blue-450 text-blue-400 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300"
                        >
                          Activate Vault
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="luxury-card p-10 rounded-3xl flex flex-col gap-6">
                  <div className="text-center flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-blue-500">Lock Invoice Settlements</h2>
                    <p className="text-xs text-stone-400">Submit secure payment with lock parameters.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Client / Vendor Public Key</label>
                      <input 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)} 
                        placeholder="e.g. G..."
                        className="luxury-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Invoice Amount (XLM)</label>
                      <input 
                        type="number"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">Invoice Code Memo</label>
                      <input 
                        value={memo} 
                        onChange={(e) => setMemo(e.target.value)} 
                        maxLength={28}
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={initiateEscrow}
                    disabled={state === 'submitting'}
                    className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 disabled:opacity-50"
                  >
                    {state === 'submitting' ? 'locking vault...' : 'LOCK INVOICE FUNDS'}
                  </button>
                </div>
              </motion.div>
            )}

            {page === 'activity' && (
              <motion.div 
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="luxury-card p-10 rounded-3xl flex flex-col gap-6">
                  <h2 className="text-3xl font-bold text-center text-blue-500">Invoice Ledger Logs</h2>

                  <div className="bg-stone-950/40 border border-blue-600/10 p-6 rounded-2xl flex flex-col gap-4 text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold border ${
                      state === 'success' ? 'bg-blue-600/10 text-blue-500 border-blue-600/30' : 'bg-rose-955/20 text-rose-455 border-rose-500/30'
                    }`}>
                      {state === 'success' ? '✓' : 'ℹ'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-stone-200">{state === 'success' ? 'Vault Confirmed' : 'Transactions Log'}</h3>
                      <p className="text-xs text-stone-400 mt-2 leading-relaxed">{message}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Stellar Explorer Seal</label>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] p-4 rounded-xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800 text-blue-500 hover:text-blue-400 transition-all text-center block break-all font-mono"
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
        <footer className="py-8 border-t border-stone-800/40 text-center text-xs text-stone-500">
          Stellar Soroban Developer Sandbox — Testing & Verification Environment
        </footer>
      </div>
    </div>
  );
}
