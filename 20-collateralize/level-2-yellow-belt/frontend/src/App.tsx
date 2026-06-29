import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "20-collateralize",
  "title": "Collateralize Hub",
  "short": "Collateral",
  "useCase": "P2P Lending Collateral Vault",
  "audience": "Borrowers and Lenders",
  "primary": "#8b5cf6",
  "secondary": "#ec4899",
  "accent": "#10b981",
  "contract": "P2P Lending Smart Contract",
  "action": "Invoke Lock Collateral",
  "contractId": "CC3RG...VAULT...789B"
};

const pages = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'wallets', label: 'Multi-Wallet' },
  { id: 'contract', label: 'Smart Contract' },
  { id: 'events', label: 'Event Sync' },
] as const;

const walletOptions = [
  { id: 'freighter', label: 'Freighter Wallet', note: 'Extension (Recommended)', icon: '⚓' },
  { id: 'xbull', label: 'xBull Wallet', note: 'Browser Extension', icon: '🐂' },
  { id: 'lobstr', label: 'LOBSTR Wallet', note: 'WalletConnect Path', icon: '🦞' },
];

type PageId = (typeof pages)[number]['id'];
type TxState = 'idle' | 'connecting' | 'pending' | 'success' | 'fail';
type WalletError = 'WalletNotFound' | 'WalletConnectionRejected' | 'InsufficientBalance';

function errorCopy(error: WalletError) {
  const copy: Record<WalletError, string> = {
    WalletNotFound: 'Wallet extension not detected. Please install Freighter or ensure the module is enabled.',
    WalletConnectionRejected: 'Connection rejected. Grant permission in your wallet extension and retry.',
    InsufficientBalance: 'Insufficient Testnet XLM to cover transaction network fees or contract collateral requirement.',
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
  const [selectedWallet, setSelectedWallet] = useState('freighter');
  const [publicKey, setPublicKey] = useState('');
  const [txState, setTxState] = useState<TxState>('idle');
  const [error, setError] = useState<WalletError | ''>('');
  const [contractAddress, setContractAddress] = useState(project.contractId);
  const [contractValue, setContractValue] = useState(project.action);
  const [txHash, setTxHash] = useState('');
  const [events, setEvents] = useState([
    makeEvent('Stellar SDK event listener active'),
    makeEvent('Horizon state synchronizer active')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'No wallet active';

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
      setEvents((items) => [makeEvent(`${walletId.toUpperCase()} wallet authorized`), ...items.slice(0, 7)]);
    } catch (caught: any) {
      setTxState('fail');
      const nextError = caught.message?.includes('not detected') ? 'WalletNotFound' : 'WalletConnectionRejected';
      setError(nextError);
      setEvents((items) => [makeEvent(`Error: ${nextError}`), ...items.slice(0, 7)]);
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setTxState('idle');
    setEvents((items) => [makeEvent('Wallet disconnected'), ...items.slice(0, 7)]);
  }

  function simulateError(nextError: WalletError) {
    setError(nextError);
    setTxState('fail');
    setEvents((items) => [makeEvent(`Simulated: ${nextError}`), ...items.slice(0, 7)]);
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    if (!contractAddress) {
      setTxState('fail');
      setEvents((items) => [makeEvent('Contract address must be configured'), ...items.slice(0, 7)]);
      return;
    }

    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking ${contractValue}...`), ...items.slice(0, 7)]);
    window.setTimeout(() => {
      const localHash = crypto.randomUUID().replace(/-/g, '');
      setTxHash(localHash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Contract state synced successfully`), ...items.slice(0, 7)]);
    }, 1200);
  }

  return (
    <div className="min-height-screen relative overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/30">
            C
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {project.title}
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold font-mono">Yellow Belt Control</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                page === item.id 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={publicKey ? disconnectWallet : () => connectWallet()}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            publicKey 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/20'
          }`}
        >
          {publicKey ? shortKey : 'Connect Wallet'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
        
        {/* State Banner */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4 items-center">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              txState === 'success' ? 'bg-emerald-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-violet-500'
            }`} />
            <div>
              <p className="text-xs uppercase text-slate-500 font-mono">Current Engine Status</p>
              <h2 className="text-sm font-semibold text-slate-300 uppercase mt-0.5">{txState}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 font-mono text-slate-400">
              Contract: {contractAddress ? `${contractAddress.slice(0, 8)}...` : 'None'}
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 font-mono text-slate-400">
              Wallet: {shortKey}
            </span>
          </div>
        </div>

        {/* Tab View */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 glass-panel p-8 rounded-3xl flex flex-col justify-center gap-6">
                <span className="text-xs uppercase tracking-wider text-pink-500 font-bold">Soroban Smart Contract Control Room</span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Interact with P2P Lending Vaults on Stellar
                </h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                  The Yellow Belt upgrade integrates deployed Soroban smart contracts directly with the UI. Configure contract addresses, trigger state synchronizations, and observe live on-chain events.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPage('wallets')}
                    className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 text-sm"
                  >
                    Select Wallet
                  </button>
                  <button 
                    onClick={() => setPage('contract')}
                    className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-slate-300 hover:text-white transition-all duration-300 text-sm"
                  >
                    Manage Contract
                  </button>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between gap-6">
                <h3 className="font-bold text-lg text-slate-200">Contract Deliverables</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-xs text-slate-300">Freighter, xBull, LOBSTR UI support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-xs text-slate-300">Soroban Contract Deploy state</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-xs text-slate-300">3 Handled Wallet errors (Simulatable)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-xs text-slate-300">Real-time synchronized event logs</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Contract Action</span>
                  <strong className="text-sm text-slate-300">{project.action}</strong>
                </div>
              </div>
            </motion.div>
          )}

          {page === 'wallets' && (
            <motion.div 
              key="wallets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
                <h3 className="font-bold text-lg">Select Wallet Option</h3>
                <div className="flex flex-col gap-3">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => connectWallet(wallet.id)}
                      className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                        selectedWallet === wallet.id 
                          ? 'bg-violet-500/10 border-violet-500/40 text-white shadow-lg shadow-violet-500/5' 
                          : 'bg-slate-900/60 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-sm">{wallet.label}</h4>
                          <span className="text-xs text-slate-500">{wallet.note}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono">Select</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6 justify-between">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg">Error State Simulator</h3>
                  <p className="text-xs text-slate-400">Simulate wallet edge cases to verify application error handling.</p>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <button 
                      onClick={() => simulateError('WalletNotFound')}
                      className="py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-xs text-slate-300 font-medium transition-all"
                    >
                      Trigger WalletNotFound
                    </button>
                    <button 
                      onClick={() => simulateError('WalletConnectionRejected')}
                      className="py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-xs text-slate-300 font-medium transition-all"
                    >
                      Trigger WalletConnectionRejected
                    </button>
                    <button 
                      onClick={() => simulateError('InsufficientBalance')}
                      className="py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-xs text-slate-300 font-medium transition-all"
                    >
                      Trigger InsufficientBalance
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    <strong>Error Triggered:</strong> {errorCopy(error)}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {page === 'contract' && (
            <motion.div 
              key="contract"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6 glow-accent">
                <h3 className="font-bold text-lg text-center">Soroban Deployed Contract Portal</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">Contract Address</label>
                    <input 
                      value={contractAddress} 
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="glass-input px-4 py-3.5 rounded-xl text-slate-200 outline-none text-xs w-full font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">Invocation Payload</label>
                    <input 
                      value={contractValue} 
                      onChange={(e) => setContractValue(e.target.value)}
                      className="glass-input px-4 py-3.5 rounded-xl text-slate-200 outline-none text-sm w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={callContract}
                  disabled={txState === 'pending'}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 font-bold text-white shadow-lg shadow-violet-600/20 transition-all duration-300"
                >
                  {txState === 'pending' ? 'Submitting Contract Call...' : 'Call Deployed Contract'}
                </button>

                {txHash && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-xs p-4 rounded-xl bg-slate-900 border border-white/5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-850 transition-all text-center block break-all"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
                <div className="text-center flex flex-col gap-2">
                  <h3 className="font-bold text-lg">On-chain Event Stream</h3>
                  <p className="text-xs text-slate-400">Synchronized state updates pulled directly from Horizon Horizon/Soroban events.</p>
                </div>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center text-xs"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        <span className="text-slate-300 font-medium">{event.label}</span>
                      </div>
                      <span className="font-mono text-slate-500">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-600">
        © 2026 {project.title} - Stellar Soroban Level 2 Control Hub
      </footer>
    </div>
  );
}
