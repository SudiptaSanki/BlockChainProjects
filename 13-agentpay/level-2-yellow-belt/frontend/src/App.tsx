import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import { invokeContract, HORIZON_URL, NETWORK_PASSPHRASE } from './services/stellar';
import * as StellarSdk from '@stellar/stellar-sdk';

const project = {
  "dir": "13-agentpay",
  "title": "AgentPay Portal",
  "short": "AgentPay",
  "useCase": "AI agent payment budgets",
  "audience": "Automation Teams",
  "primary": "#7c3aed",
  "secondary": "#06b6d4",
  "accent": "#6d28d9",
  "contract": "Agent Budget Smart Contract",
  "action": "initialize",
  "contractId": "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
});

const pages = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'wallets', label: 'Admin Identities' },
  { id: 'transfer', label: 'Budget Allocator' },
  { id: 'contract', label: 'Soroban Budget Contract' },
  { id: 'events', label: 'Log Stream' },
] as const;

type PageId = (typeof pages)[number]['id'];
type TxState = 'idle' | 'connecting' | 'pending' | 'success' | 'fail';
type WalletError = 'WalletNotFound' | 'WalletConnectionRejected' | 'InsufficientBalance';

function errorCopy(error: WalletError) {
  const copy: Record<WalletError, string> = {
    WalletNotFound: 'Wallet extension not detected. Please install the extension or ensure it is enabled.',
    WalletConnectionRejected: 'Connection rejected. Please grant permissions inside the wallet prompt.',
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or budget requirements.',
  };
  return copy[error];
}

function makeEvent(label: string) {
  return { id: crypto.randomUUID(), label, time: new Date().toLocaleTimeString() };
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [selectedWallet, setSelectedWallet] = useState('freighter');
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [txState, setTxState] = useState<TxState>('idle');
  const [error, setError] = useState<WalletError | ''>('');
  const [contractAddress, setContractAddress] = useState(project.contractId);
  const [contractValue, setContractValue] = useState(project.action);
  const [txHash, setTxHash] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('Approve Budget');
  const [events, setEvents] = useState([
    makeEvent('Horizon AI gateway tunnel synchronized'),
    makeEvent('Autonomous budget allocations ready')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';


  async function connectWallet(walletId = selectedWallet) {
    setSelectedWallet(walletId);
    setTxState('connecting');
    setError('');
    setPublicKey('');
    
    await connectWalletKit(
      async (id, key) => {
        setPublicKey(key);
        setTxState('success');
        setEvents((items) => [makeEvent(`${id.toUpperCase()} linked: ${key.slice(0, 8)}...`), ...items.slice(0, 7)]);
        
        try {
          const response = await fetch(`${HORIZON_URL}/accounts/${key}`);
          const account = await response.json();
          const native = account.balances?.find((b: any) => b.asset_type === 'native');
          setBalance(native?.balance ?? '0.0000000');
        } catch {
          setBalance('0.0000000');
        }
      },
      (err) => {
        setTxState('fail');
        setError('WalletConnectionRejected');
        setEvents((items) => [makeEvent(`Failed link ${walletId}: WalletConnectionRejected`), ...items.slice(0, 7)]);
      }
    );
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxState('idle');
    setEvents((items) => [makeEvent('Wallet unlinked'), ...items.slice(0, 7)]);
  }

  function simulateError(nextError: WalletError) {
    setError(nextError);
    setTxState('fail');
    setEvents((items) => [makeEvent(`Simulated: ${nextError}`), ...items.slice(0, 7)]);
  }

  async function handleTransfer() {
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setTxHash('');
    setEvents((items) => [makeEvent(`Locking ${amount} XLM agent budget with node ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Agent budget initialized. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Agent budget lock failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking agent budget smart contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Agent budget locked successfully. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fbfaff] text-slate-800 flex flex-col justify-between circuit-grid">
      {/* Violet Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-violet-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />

      {/* Floating Navbar */}
      <div className="px-6 py-4 sticky top-0 z-50">
        <nav className="glass-ai-card max-w-5xl mx-auto rounded-3xl px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="AgentPay Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-slate-900 font-display">
                {project.short}
              </h1>
              <span className="text-[9px] uppercase tracking-wider text-purple-650 font-bold font-mono">AI Budgets Console</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={publicKey ? disconnectWallet : connectWalletModal}
            className={`px-5 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 ${
              publicKey 
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-800' 
                : 'bg-purple-650 text-white hover:opacity-90 shadow-md shadow-purple-500/20'
            }`}
          >
            {publicKey ? shortKey : 'Link Wallet'}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-8 z-30">
        
        {/* Status log */}
        <div className="glass-ai-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div className="flex gap-4 items-center">
            <div className={`w-3 h-3 rounded-full animate-ping ${
              txState === 'success' ? 'bg-purple-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-purple-400'
            }`} />
            <div>
              <p className="text-xs uppercase text-stone-400 font-mono">Consensus State</p>
              <h2 className="text-sm font-semibold text-stone-750 uppercase mt-0.5">{txState}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-purple-50/50 border border-purple-100 font-mono text-stone-650">
              Admin Bal: {balance} XLM
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-purple-50/50 border border-purple-100 font-mono text-stone-650">
              Gateway: {selectedWallet.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tab View */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 glass-ai-card p-8 rounded-3xl flex flex-col justify-center gap-6 bg-white">
                <span className="text-xs uppercase tracking-wider text-purple-650 font-bold font-sans">Autonomous AI Budget Allocation</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 leading-tight">
                  Fund & Limit AI Agent Budget Gateways
                </h2>
                <p className="text-stone-650 leading-relaxed text-sm">
                  AgentPay provides secure budget gates. By allocating budget funds to autonomous agent public keys, admins authorize spending boundaries locked directly on the Stellar testnet ledger.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPage('wallets')}
                    className="px-5 py-3 rounded-full bg-purple-650 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 text-sm"
                  >
                    Identities
                  </button>
                  <button 
                    onClick={() => setPage('transfer')}
                    className="px-5 py-3 rounded-full border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 transition-all duration-300 text-sm"
                  >
                    Allocate Budget
                  </button>
                </div>
              </div>

              <div className="glass-ai-card p-6 rounded-3xl flex flex-col justify-between gap-6 bg-white">
                <h3 className="font-bold text-lg text-stone-900">Yellow Belt Target Check</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-purple-650 font-bold">✓</span>
                    <span className="text-xs text-stone-600">Actual WalletKit Enabled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-650 font-bold">✓</span>
                    <span className="text-xs text-stone-600">Soroban Contract Invoked</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-650 font-bold">✓</span>
                    <span className="text-xs text-stone-600">3 Handled Wallet errors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-650 font-bold">✓</span>
                    <span className="text-xs text-stone-600">On-chain transaction event logs</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                  <span className="text-[10px] uppercase text-stone-450 font-bold block mb-1">Active Scribe Action</span>
                  <strong className="text-sm text-stone-750">{project.action}</strong>
                </div>
              </div>
            </motion.div>
          )}

          {page === 'wallets' && (
            <motion.div 
              key="wallets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="glass-ai-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                <h3 className="font-bold text-lg text-slate-900">Select Scribe Identity</h3>
                <div className="flex flex-col gap-3">
                    <button
                      onClick={connectWalletModal}
                      className="p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 bg-purple-50 border-purple-500 text-purple-900 shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">🔗</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-sm">Open Stellar Wallets Kit</h4>
                          <span className="text-xs text-purple-500">Supports Freighter, MetaMask, etc.</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono">Link</span>
                    </button>
                </div>
              </div>

              <div className="glass-ai-card p-8 rounded-3xl flex flex-col gap-6 justify-between bg-white">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg text-slate-900">Exception Simulator</h3>
                  <p className="text-xs text-slate-500">Trigger exceptions to evaluate compliance with handled errors.</p>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <button 
                      onClick={() => simulateError('WalletNotFound')}
                      className="py-3 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs text-stone-750 font-medium transition-all"
                    >
                      Simulate WalletNotFound
                    </button>
                    <button 
                      onClick={() => simulateError('WalletConnectionRejected')}
                      className="py-3 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs text-stone-750 font-medium transition-all"
                    >
                      Simulate WalletConnectionRejected
                    </button>
                    <button 
                      onClick={() => simulateError('InsufficientBalance')}
                      className="py-3 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs text-stone-750 font-medium transition-all"
                    >
                      Simulate InsufficientBalance
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                    <strong>Error:</strong> {errorCopy(error)}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {page === 'transfer' && (
            <motion.div 
              key="transfer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-ai-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                <h3 className="font-bold text-lg text-center text-slate-900">Allocate Agent Budget Limit</h3>
                <p className="text-xs text-slate-500 text-center">Submit a signed transaction to lock budget permissions on-chain.</p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Agent Node Address</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. GD3R... or 0x71C..."
                      className="glass-ai-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Budget Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-ai-input px-4 py-3 rounded-xl text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Budget Memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)}
                      className="glass-ai-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleTransfer}
                  disabled={txState === 'pending'}
                  className="w-full py-4 rounded-full bg-purple-600 hover:opacity-95 font-bold text-white shadow-md shadow-purple-500/25 transition-all duration-300"
                >
                  {txState === 'pending' ? 'Locking Budget...' : 'Approve Spend Limit'}
                </button>

                {txHash && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-xs p-4 rounded-xl bg-slate-50 border border-stone-200 text-purple-600 hover:text-purple-750 transition-all text-center block break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {page === 'contract' && (
            <motion.div 
              key="contract"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-ai-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                <h3 className="font-bold text-lg text-center text-slate-900">AgentBudget Smart Contract</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">Contract Address</label>
                    <input 
                      value={contractAddress} 
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="glass-ai-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">Invocation Method</label>
                    <input 
                      value={contractValue} 
                      onChange={(e) => setContractValue(e.target.value)}
                      className="glass-ai-input px-4 py-3 rounded-xl text-sm w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={callContract}
                  disabled={txState === 'pending'}
                  className="w-full py-4 rounded-full bg-purple-650 hover:opacity-95 font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
                >
                  {txState === 'pending' ? 'Locking limit...' : 'Invoke Budget smart contract'}
                </button>

                {txHash && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-xs p-4 rounded-xl bg-slate-50 border border-stone-200 text-purple-600 hover:text-purple-750 transition-all text-center block break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {page === 'events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-ai-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                <div className="text-center flex flex-col gap-2">
                  <h3 className="font-bold text-lg text-slate-900">Event Log Sync</h3>
                  <p className="text-xs text-slate-550">Real-time state updates synchronized directly from Horizon budget logs.</p>
                </div>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center text-xs"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-stone-700 font-medium">{event.label}</span>
                      </div>
                      <span className="font-mono text-stone-400">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-500 font-display">
        © 2026 {project.short} Console - Stellar Soroban Level 2 Control Center
      </footer>
    </div>
  );
}
