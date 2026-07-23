import { connectFreighter } from './services/freighter';
import { fetchXlmBalance, submitPayment as submitStellarPayment } from './services/stellar';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "19-gift3r",
  "title": "Gift3r",
  "short": "Gift3r",
  "useCase": "Crypto Gift Cards & Vouchers",
  "audience": "Gift Senders and Receivers",
  "primary": "#f59e0b",
  "secondary": "#f43f5e",
  "accent": "#10b981",
  "surface": "#fafaf9",
  "action": "Issue Gift Value"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'My Wallet' },
  { id: 'send', label: 'Send Gift Voucher' },
  { id: 'activity', label: 'Activity Logs' },
] as const;

const checklist = [
  { title: 'Freighter Wallet Access', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Stellar Testnet Integration', desc: 'Operating on secure Stellar Testnet blockchain.' },
  { title: 'Address & Balance Sync', desc: 'Fetch real-time XLM balances instantly from Horizon.' },
  { title: 'Signed Gift Value Issue', desc: 'Issue gift cards via cryptographically signed payments.' },
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
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('Gift Card Voucher');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Freighter is idle.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Not connected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Connecting to Freighter...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Loading native XLM balance...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Balance loaded successfully.');
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
    setMessage('Wallet disconnected.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balance updated.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Failed to update balance.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    setState('loading');
    setMessage('Requesting 10,000 XLM from Friendbot...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Friendbot could not fund this account.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Account funded successfully!');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Funding failed.');
    }
  }

  async function issueGiftCard() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    if (!destination || !amount) return setMessage('Enter a valid recipient address and amount.');
    setState('submitting');
    setTxHash('');
    setMessage('Awaiting signature in Freighter...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Gift voucher issued successfully!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Transaction signing failed.');
      setPage('activity');
    }
  }

  return (
    <div className="min-height-screen relative overflow-hidden bg-stone-50 text-stone-900 flex flex-col justify-between grid-bg">
      {/* Decorative Warm Soft Blur Circles */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-rose-500/5 blur-[90px] pointer-events-none" />

      {/* Navigation */}
      <nav className="premium-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-stone-50/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Gift3r Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="font-bold text-2xl leading-none tracking-tight text-stone-950 font-serif">
              {project.title}
            </h1>
            <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold">White Belt MVP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                page === item.id 
                  ? 'bg-amber-500 text-stone-950 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
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
              ? 'bg-stone-200 hover:bg-stone-300 text-stone-800' 
              : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-90 shadow-md shadow-amber-500/20'
          }`}
        >
          {publicKey ? shortKey : 'Connect Freighter'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
        
        {/* Status Toast */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="premium-card p-4 rounded-2xl flex items-center justify-between gap-4 border-l-4 border-l-amber-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">Status: <span className="normal-case font-medium text-stone-600 ml-1">{message}</span></p>
              </div>
              {publicKey && (
                <div className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/10">
                  {balance} XLM
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab view */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-5 gap-8"
            >
              <div className="md:col-span-3 flex flex-col justify-center gap-6">
                <span className="text-xs uppercase tracking-wider text-rose-500 font-bold font-sans">Celebration & Gifting</span>
                <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl text-stone-900 leading-tight">
                  Seamless Web3 Gift Vouchers on Stellar
                </h2>
                <p className="text-stone-600 leading-relaxed text-sm">
                  Send pre-paid cryptocurrency value to friends, family, or colleagues. Lock XLM value into dedicated testnet vaults, and present them with a customized gift voucher code. Simple, secure, and instant.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPage('wallet')}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 font-bold text-white text-xs tracking-wider uppercase shadow-md shadow-amber-500/10 transition-all"
                  >
                    Configure Wallet
                  </button>
                  <button 
                    onClick={() => setPage('send')}
                    className="px-6 py-3 rounded-full border border-stone-300 hover:bg-stone-100 font-bold text-stone-700 text-xs tracking-wider uppercase transition-all"
                  >
                    Issue Voucher
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="premium-card p-6 rounded-3xl flex flex-col gap-6">
                  <h3 className="font-bold text-xl text-stone-950 font-serif">Milestones Checklist</h3>
                  <div className="flex flex-col gap-4">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-amber-500/20">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-800 text-sm">{item.title}</h4>
                          <p className="text-xs text-stone-500 mt-0.5">{item.desc}</p>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="premium-card p-8 rounded-3xl flex flex-col gap-8">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-3xl font-bold font-serif">My Wallet</h2>
                  <p className="text-xs text-stone-500 font-sans">Sync Freighter with Stellar Testnet.</p>
                </div>

                <div className="bg-stone-100/50 border border-stone-200/50 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <span className="text-xs text-stone-500 font-sans">Connection</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      publicKey ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    }`}>
                      {publicKey ? 'Synced' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <span className="text-xs text-stone-500 font-sans">PublicKey</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-stone-200 text-stone-700">
                      {publicKey ? publicKey : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-stone-500 font-sans">Native Balance</span>
                    <strong className="text-xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                      {balance} XLM
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {!publicKey ? (
                    <button 
                      onClick={connectWallet}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 font-bold text-white text-xs tracking-wider uppercase shadow-md shadow-amber-500/10 transition-all"
                    >
                      Connect Freighter
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={refreshBalance}
                        className="py-3.5 rounded-full border border-stone-300 hover:bg-stone-100 font-bold text-stone-700 text-xs tracking-wider uppercase transition-all"
                      >
                        Refresh
                      </button>
                      <button 
                        onClick={fundWallet}
                        className="py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 font-bold text-white text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
                      >
                        Fund Account
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="premium-card p-8 rounded-3xl flex flex-col gap-6">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-3xl font-bold font-serif">Issue Gift Voucher</h2>
                  <p className="text-xs text-stone-500">Lock XLM value into the recipient's gift card.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700">Recipient Public Address</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. GD3R..."
                      className="premium-input px-4 py-3.5 rounded-xl text-stone-800 outline-none text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700">Gift Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="50"
                      className="premium-input px-4 py-3.5 rounded-xl text-stone-800 outline-none text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-700">Personalized Note / Memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)} 
                      maxLength={28}
                      className="premium-input px-4 py-3.5 rounded-xl text-stone-800 outline-none text-xs w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={issueGiftCard}
                  disabled={state === 'submitting'}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 font-bold text-white text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {state === 'submitting' ? 'Submitting Vault Tx...' : 'Create Voucher on Testnet'}
                </button>
              </div>
            </motion.div>
          )}

          {page === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="premium-card p-8 rounded-3xl flex flex-col gap-6">
                <h2 className="text-3xl font-bold font-serif text-center">Transaction Feedback</h2>

                <div className="bg-stone-100/50 border border-stone-200/50 p-6 rounded-2xl flex flex-col gap-4 text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                    state === 'success' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}>
                    {state === 'success' ? '✓' : 'ℹ'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-serif">{state === 'success' ? 'Transaction Confirmed' : 'Action Pending'}</h3>
                    <p className="text-xs text-stone-500 mt-1">{message}</p>
                  </div>
                </div>

                {txHash && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-sans">Transaction Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-[10px] p-4 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-amber-700 hover:text-amber-800 transition-all text-center block break-all shadow-sm"
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
      <footer className="py-6 border-t border-stone-200 text-center text-[10px] text-stone-400 font-sans uppercase tracking-wider font-semibold">
        © 2026 {project.title} - Stellar Soroban Gifting Suite
      </footer>
    </div>
  );
}
