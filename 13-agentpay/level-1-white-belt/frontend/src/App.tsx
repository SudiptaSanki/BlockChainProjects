import { connectFreighter } from './services/freighter';
import { fetchXlmBalance, submitPayment as submitStellarPayment } from './services/stellar';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "13-agentpay",
  "title": "AgentPay",
  "short": "AgentPay",
  "useCase": "AI agent payment budgets",
  "audience": "Automation Teams",
  "primary": "#111827",
  "secondary": "#a855f7",
  "surface": "#18181b",
  "action": "Approve Agent Budget"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Agent Budgets' },
  { id: 'wallet', label: 'Admin Identity' },
  { id: 'send', label: 'Approve Spend' },
  { id: 'activity', label: 'Audit Trail' },
] as const;

const checklist = [
  { title: 'Freighter Admin Link', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Stellar Node Sync', desc: 'Verify budget allocations directly from Horizon Testnet.' },
  { title: 'Identity balance check', desc: 'Fetch on-chain native XLM balance.' },
  { title: 'On-chain Budget Limit Lock', desc: 'Commit spend permissions to agent public keys.' },
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
  const [memo, setMemo] = useState('Budget Approval');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('AgentPay CLI engine online.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Connecting to admin cryptographic keys...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Admin session open. Sourcing native balances...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Horizon assets successfully cataloged.');
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
    setMessage('Admin session closed.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Handshake Freighter before checking balances.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balances refreshed.');
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
      setMessage('Identity active: 10K XLM loaded.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Activation failed.');
    }
  }

  async function approveSpend() {
    if (!publicKey) return setMessage('Handshake Freighter first.');
    if (!destination || !amount) return setMessage('Agent address and budget limit required.');
    setState('submitting');
    setTxHash('');
    setMessage('Authorizing spend limits on-chain...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Spend limits successfully locked on Stellar!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Authorization rejected.');
      setPage('activity');
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d10] text-zinc-300 flex flex-col justify-between relative overflow-hidden terminal-grid">
      {/* Glow effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="terminal-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[#0e0e12]/95 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="AgentPay Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
          <div>
            <h1 className="font-bold text-xl leading-none text-emerald-400 font-heading tracking-wider">
              {project.title.toUpperCase()}
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-[#14b8a6] font-bold block mt-0.5 font-mono">White Belt MVP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-[#09090b] p-1 border border-emerald-500/10 rounded-lg">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-250 ${
                page === item.id 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md shadow-sm' 
                  : 'text-zinc-500 hover:text-emerald-450 hover:bg-emerald-500/5'
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={publicKey ? disconnectWallet : connectWallet}
          className={`px-5 py-2.5 rounded-md font-bold text-xs tracking-wider uppercase transition-all duration-300 font-mono ${
            publicKey 
              ? 'bg-rose-950/20 border border-rose-900 text-rose-400 hover:bg-rose-950/40' 
              : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          {publicKey ? shortKey : 'LINK ADMIN'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-10 z-30">
        
        {/* Status log */}
        <div className="terminal-card p-4 rounded-md flex items-center justify-between gap-4 border-l-2 border-l-emerald-500 bg-[#121216]">
          <div className="flex items-center gap-3 font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs text-emerald-400 font-mono uppercase">Console log: <span className="normal-case text-zinc-300 ml-1 font-bold">{message}</span></p>
          </div>
          {publicKey && (
            <div className="text-xs font-mono font-bold px-3 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 rounded-md">
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
                <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-bold font-mono">Autonomous AI budget allocations</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-emerald-100 font-heading leading-tight">
                  Fund and Limit AI Agent Budgets
                </h2>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  AgentPay provides secure tools to allocate budget spending limits to autonomous agent nodes. Establish budget gates and authorize spend limits directly on Stellar.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPage('wallet')}
                    className="px-5 py-3 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider transition-all"
                  >
                    Open Wallet
                  </button>
                  <button 
                    onClick={() => setPage('send')}
                    className="px-5 py-3 rounded-md border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-200 text-xs font-bold font-mono uppercase tracking-wider transition-all"
                  >
                    Allocate Budget
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="terminal-card p-6 rounded-md flex flex-col gap-6 bg-[#121216]">
                  <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-widest font-mono">Specifications</h3>
                  <div className="flex flex-col gap-4">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-5 h-5 bg-[#09090b] text-emerald-450 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-emerald-900/50">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-100 text-xs font-mono">{item.title}</h4>
                          <p className="text-[10px] text-zinc-450 mt-0.5">{item.desc}</p>
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
              <div className="terminal-card p-8 rounded-md flex flex-col gap-6 bg-[#121216]">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-heading text-emerald-400">Admin Identity Gateway</h2>
                  <p className="text-xs text-zinc-500">Configure connection to Freighter.</p>
                </div>

                <div className="bg-[#09090b] border border-emerald-900/30 p-6 rounded-md flex flex-col gap-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500 uppercase">Admin Session</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wider ${
                      publicKey ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-red-950/20 text-red-400 border-red-500/30'
                    }`}>
                      {publicKey ? 'Linked' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500 uppercase">Gateway Node</span>
                    <span className="text-[10px] bg-[#121216] px-2 py-1 border border-zinc-850 text-emerald-350 truncate max-w-[150px]">
                      {publicKey ? publicKey : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase">Identity Assets</span>
                    <strong className="text-sm font-bold text-emerald-400">
                      {balance} XLM
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3 font-mono">
                  {!publicKey ? (
                    <button 
                      onClick={connectWallet}
                      className="w-full py-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-450 hover:bg-emerald-500/20 font-bold text-xs tracking-wider uppercase transition-all"
                    >
                      ESTABLISH ADMIN TUNNEL
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={refreshBalance}
                        className="py-3.5 border border-zinc-700 hover:border-zinc-650 rounded-md font-bold text-zinc-350 text-xs tracking-wider uppercase transition-all"
                      >
                        REFRESH
                      </button>
                      <button 
                        onClick={fundWallet}
                        className="py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-md font-bold text-xs tracking-wider uppercase transition-all"
                      >
                        ACTIVATE ASSETS
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
              <div className="terminal-card p-8 rounded-md flex flex-col gap-6 bg-[#121216]">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold font-heading text-emerald-400">Approve spend limits</h2>
                  <p className="text-xs text-zinc-550">Settle budget limits permanently on the ledger.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400">Agent Node Key</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. G..."
                      className="terminal-input px-3 py-2.5 rounded-md text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400">Approved Budget (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="terminal-input px-3 py-2.5 rounded-md text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400">Budget Memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)} 
                      maxLength={28}
                      className="terminal-input px-3 py-2.5 rounded-md text-sm w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={approveSpend}
                  disabled={state === 'submitting'}
                  className="w-full py-4 rounded-md bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 font-bold text-emerald-400 text-xs tracking-wider uppercase transition-all disabled:opacity-50"
                >
                  {state === 'submitting' ? 'LOCKING SPEND BUDGET...' : 'APPROVE BUDGET ON TESTNET'}
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
              <div className="terminal-card p-8 rounded-md flex flex-col gap-6 bg-[#121216]">
                <h2 className="text-2xl font-bold font-heading text-center text-emerald-400">Budget Log</h2>

                <div className="bg-[#09090b] border border-[#22c55e]/25 p-6 rounded-md flex flex-col gap-4 text-center">
                  <div className={`w-10 h-10 rounded-md mx-auto flex items-center justify-center font-bold border ${
                    state === 'success' ? 'bg-[#22c55e]/10 text-emerald-400 border-emerald-500/30' : 'bg-red-950/20 text-red-400 border-red-500/30'
                  }`}>
                    {state === 'success' ? '✔' : 'i'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-zinc-200">{state === 'success' ? 'Settled' : 'Log Feed'}</h3>
                    <p className="text-xs text-zinc-450 mt-1">{message}</p>
                  </div>
                </div>

                {txHash && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Horizon Ledger Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] p-4 rounded-md bg-[#09090b] hover:bg-[#121216] border border-emerald-900/30 text-emerald-400 hover:text-emerald-350 transition-all text-center block break-all"
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
      <footer className="py-6 border-t border-zinc-900 text-center text-[10px] text-zinc-650 uppercase tracking-widest">
        © 2026 {project.title.toUpperCase()} - AI Budget Engine
      </footer>
    </div>
  );
}
