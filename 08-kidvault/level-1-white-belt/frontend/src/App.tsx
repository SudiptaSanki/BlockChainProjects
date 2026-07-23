import { connectFreighter } from './services/freighter';
import { fetchXlmBalance, submitPayment as submitStellarPayment } from './services/stellar';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "08-kidvault",
  "title": "KidVault",
  "short": "KidVault",
  "useCase": "allowance wallets for families",
  "audience": "parents and young savers",
  "primary": "#5f4b8b",
  "secondary": "#ff9f1c",
  "action": "Send allowance"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'Signatures' },
  { id: 'send', label: 'Send allowance' },
  { id: 'activity', label: 'Ledger' },
] as const;

const checklist = [
  { title: 'Wallet Integration', desc: 'Secure Freighter cryptographic handshake.' },
  { title: 'Horizon Ledger Sync', desc: 'Dynamic balance check and account synchronization.' },
  { title: 'Payment Seal', desc: 'Commit payloads directly into transaction memo fields.' },
  { title: 'Responsive Workspace', desc: 'Optimized layout built with custom luxury color tokens.' },
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
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('Send allowance');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('KidVault console ready.');
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
    setMessage('Submitting signed transaction on-chain...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Transaction successfully finalized on-chain!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Transaction submission rejected.');
      setPage('activity');
    }
  }

  function renderPageContent() {
    switch (page) {
      case 'overview':
        return (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid md:grid-cols-5 gap-8 items-stretch"
          >
            <div className="md:col-span-3 cyber-panel p-10 rounded flex flex-col justify-center gap-6">
              <span className="text-sm font-calligraphy text-pink-400">Ancient Trust in Digital Ledger Vaults</span>
              <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
                {project.title}
              </h2>
              <p className="text-stone-300 leading-relaxed text-base font-mono text-sm">
                Welcome to {project.title}. A secure decentralized terminal built for {project.audience} to execute {project.useCase}. Link Freighter keys, allocate test assets, and broadcast signed operations.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPage('wallet')}
                  className="px-6 py-3.5 cyber-button"
                >
                  Authenticate keys
                </button>
                <button 
                  onClick={() => setPage('send')}
                  className="px-6 py-3.5 cyber-button"
                >
                  {project.action}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 cyber-panel p-8 rounded flex flex-col justify-between gap-6">
              <h3 className="font-bold text-xl text-pink-400 border-b border-stone-800 pb-4">Specifications</h3>
              <div className="flex flex-col gap-5">
                {checklist.map((item, index) => (
                  <div className="flex gap-4 items-start" key={index}>
                    <div className="w-6 h-6 rounded bg-pink-550/10 bg-pink-950/20 text-pink-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-pink-500/30">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-200 text-sm uppercase font-mono">{item.title}</h4>
                      <p className="text-xs text-stone-400 mt-1 font-mono">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 'wallet':
        return (
          <motion.div 
            key="wallet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto w-full"
          >
            <div className="cyber-panel p-10 rounded flex flex-col gap-6">
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-pink-400">Vault Handshake</h2>
                <p className="text-xs text-stone-500 font-mono">[ CONFIGURE_CONNECTION_PARAMETERS ]</p>
              </div>

              <div className="bg-black/80 border border-stone-800 p-6 rounded flex flex-col gap-4 font-mono text-xs text-stone-350">
                <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px]">Vault Status</span>
                  <span className={`text-[9px] font-bold px-2.5 py-1 border rounded uppercase tracking-widest ${
                    publicKey ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-rose-950/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {publicKey ? 'Synchronized' : 'Locked'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-900 pb-3">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px]">Public Address</span>
                  <span className="text-[10px] bg-stone-950 px-3 py-1.5 border border-stone-800 text-pink-400/90 rounded truncate max-w-[160px]">
                    {publicKey ? publicKey : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px]">Available Collateral</span>
                  <strong className="text-base font-bold text-pink-400">
                    {balance} XLM
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!publicKey ? (
                  <button 
                    onClick={connectWallet}
                    className="w-full py-4 cyber-button"
                  >
                    Handshake keys
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={refreshBalance}
                      className="py-4 cyber-button"
                    >
                      Refresh Vault
                    </button>
                    <button 
                      onClick={fundWallet}
                      className="py-4 cyber-button"
                    >
                      Activate Vault
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 'send':
        return (
          <motion.div 
            key="send"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto w-full"
          >
            <div className="cyber-panel p-10 rounded flex flex-col gap-6">
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-pink-400">{project.action}</h2>
                <p className="text-xs text-stone-500 font-mono">[ BROADCAST_ON_CHAIN_TRANSACTION ]</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">Destination Public Key</label>
                  <input 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)} 
                    placeholder="e.g. G..."
                    className="cyber-input px-4 py-3 rounded text-xs w-full font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">Amount (XLM)</label>
                  <input 
                    type="number"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="cyber-input px-4 py-3 rounded text-sm w-full font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">Reference Memo</label>
                  <input 
                    value={memo} 
                    onChange={(e) => setMemo(e.target.value)} 
                    maxLength={28}
                    className="cyber-input px-4 py-3 rounded text-sm w-full font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={initiateEscrow}
                disabled={state === 'submitting'}
                className="w-full py-4 cyber-button disabled:opacity-50"
              >
                {state === 'submitting' ? 'Submitting...' : project.action.toUpperCase()}
              </button>
            </div>
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div 
            key="activity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md mx-auto w-full"
          >
            <div className="cyber-panel p-10 rounded flex flex-col gap-6">
              <h2 className="text-3xl font-bold text-center text-pink-400">Ledger Logs</h2>

              <div className="bg-black/80 border border-pink-500/20 p-6 rounded flex flex-col gap-4 text-center font-mono">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold border ${
                  state === 'success' ? 'bg-pink-550/10 bg-pink-950/20 text-pink-400 border-pink-500/30' : 'bg-rose-950/20 text-rose-400 border-rose-500/30'
                }`}>
                  {state === 'success' ? '✓' : 'ℹ'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-200">{state === 'success' ? 'Vault Confirmed' : 'Transactions Log'}</h3>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">{message}</p>
                </div>
              </div>

              {txHash && (
                <div className="flex flex-col gap-2 font-mono">
                  <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Stellar Explorer Seal</label>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] p-4 rounded bg-stone-950 hover:bg-black border border-stone-800 text-pink-400 hover:text-pink-300 transition-all text-center block break-all font-mono"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        );
    }
  }

  return (
    
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Top Navbar - Right aligned links */}
      <header className="w-full bg-black/90 px-8 py-4 flex justify-between items-center z-40 border-b border-pink-500/20">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8 object-contain filter drop-shadow" />
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white leading-none">
              {project.short}
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-pink-400 font-bold block mt-1 font-mono">[ WHITE_BELT_VAULT ]</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`px-4 py-2 text-sm font-semibold tracking-wider transition-all duration-300 ${
                  page === item.id 
                    ? 'text-pink-400 border-b-2 border-pink-500' 
                    : 'text-stone-400 hover:text-white'
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button 
            onClick={publicKey ? disconnectWallet : connectWallet}
            className="px-5 py-2.5 cyber-button"
          >
            {publicKey ? shortKey : 'LINK WALLET'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between z-30">
        <main className="max-w-4xl mx-auto w-full px-12 py-16 flex flex-col gap-10">
          
          {/* Status Message Display */}
          <div className="cyber-panel p-6 flex items-center justify-between gap-4 border-l-4 border-l-pink-500">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
              <p className="text-sm font-mono text-stone-300">
                <span className="text-pink-400 mr-2">SYS_CONSOLE //</span> 
                {message}
              </p>
            </div>
            {publicKey && (
              <div className="text-sm font-semibold px-4 py-2 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded font-mono">
                {balance} XLM
              </div>
            )}
          </div>

          {/* Dynamic Sections */}
          <AnimatePresence mode="wait">
            {renderPageContent()}
          </AnimatePresence>
        </main>

        <footer className="py-8 border-t border-stone-900/60 text-center text-xs text-stone-600 font-mono">
          STELLAR SOROBAN PROTOCOL // ALLOWANCE DISTRIBUTION NODE
        </footer>
      </div>
    </div>
        
  );
}
