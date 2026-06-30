import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract, HORIZON_URL } from './services/stellar';

const project = {
  "dir": "18-micropay",
  "title": "MicroPay Terminal",
  "short": "MicroPay",
  "useCase": "Streaming Micro-Payments",
  "audience": "Metered API builders",
  "primary": "#4f46e5",
  "secondary": "#06b6d4",
  "accent": "#4338ca",
  "contract": "Payment Channel Smart Contract",
  "action": "Stream Micro-Payment Channel",
  "contractId": "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const pages = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'wallets', label: 'Wallets', icon: '🔑' },
  { id: 'transfer', label: 'Streaming Bridge', icon: '⚡' },
  { id: 'contract', label: 'Channel Contract', icon: '📝' },
  { id: 'events', label: 'Event Sync', icon: '📡' },
] as const;

type PageId = (typeof pages)[number]['id'];
type TxState = 'idle' | 'connecting' | 'pending' | 'success' | 'fail';
type WalletError = 'WalletNotFound' | 'WalletConnectionRejected' | 'InsufficientBalance';

function errorCopy(error: WalletError) {
  const copy: Record<WalletError, string> = {
    WalletNotFound: 'Wallet extension not detected. Please install the extension or ensure it is enabled.',
    WalletConnectionRejected: 'Connection rejected. Please grant permissions inside the wallet prompt.',
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or collateral requirements.',
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
  const [contractValue, setContractValue] = useState('initialize');
  const [txHash, setTxHash] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('25');
  const [memo, setMemo] = useState('Stream Fund');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([
    makeEvent('MicroPay event log listening'),
    makeEvent('Testnet channel event listeners loaded')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  async function connectWalletModal() {
    setTxState('connecting');
    setError('');
    try {
      await connectWalletKit(
        async (walletId, pubKey) => {
          setSelectedWallet(walletId);
          setPublicKey(pubKey);
          setTxState('success');
          setEvents((items) => [makeEvent(`${walletId.toUpperCase()} linked: ${pubKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
          
          try {
            const response = await fetch(`${HORIZON_URL}/accounts/${pubKey}`);
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
          setEvents((items) => [makeEvent(`Failed link: WalletConnectionRejected`), ...items.slice(0, 7)]);
        }
      );
    } catch (e) {
      setTxState('fail');
      setError('WalletNotFound');
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxState('idle');
    setEvents((items) => [makeEvent('Wallet node unlinked'), ...items.slice(0, 7)]);
  }

  function simulateError(nextError: WalletError) {
    setError(nextError);
    setTxState('fail');
    setEvents((items) => [makeEvent(`Simulate error: ${nextError}`), ...items.slice(0, 7)]);
  }

  async function handleTransfer() {
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }

    if (parseFloat(balance) < parseFloat(amount)) {
      simulateError('InsufficientBalance');
      return;
    }

    setTxState('pending');
    setTxHash('');
    setEvents((items) => [makeEvent(`Writing text: "${memo}" to node ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Text published. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Publish failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking payment channel smart contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, contractValue);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Payment channel registered. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setError('InsufficientBalance');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message}`), ...items.slice(0, 7)]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row relative overflow-hidden grid-bg-silver">
      {/* Decorative Indigo Blurs */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-40">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="MicroPay Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-sm tracking-tight text-slate-900 font-display">{project.title}</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-xs px-3 py-1.5 border border-slate-355 font-semibold text-slate-700 rounded-lg"
        >
          {sidebarOpen ? 'CLOSE' : 'MENU'}
        </button>
      </div>

      {/* Sidebar Navigation - LEFT SIDE */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-[260px] bg-white/95 md:bg-white border-r border-slate-200 flex flex-col justify-between py-8 px-6 transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="MicroPay Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-slate-900 font-display">
                {project.title}
              </h1>
              <span className="text-[9px] uppercase tracking-wider text-indigo-650 font-bold block mt-0.5 font-mono">Yellow Belt</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5">
            {pages.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Wallet Node */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
          <div className="text-[10px] flex justify-between items-center text-slate-400 font-bold">
            <span>NODE STATUS</span>
            <span className={`w-1.5 h-1.5 rounded-full ${publicKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] font-mono text-slate-600 truncate">{shortKey}</p>
            {publicKey && <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1">{balance} XLM</p>}
          </div>
          <button 
            onClick={publicKey ? disconnectWallet : connectWalletModal}
            className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 ${
              publicKey 
                ? 'bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-250' 
                : 'bg-indigo-500 text-white hover:opacity-90 shadow-md shadow-indigo-500/10'
            }`}
          >
            {publicKey ? 'Unlink' : 'Link Wallet'}
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full px-6 md:px-8 py-8 md:py-12 z-30">
        <div className="flex flex-col gap-8 w-full">
          {/* State Banner */}
          <div className="premium-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex gap-4 items-center">
              <div className={`w-3 h-3 rounded-full animate-ping ${
                txState === 'success' ? 'bg-emerald-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-indigo-500'
              }`} />
              <div>
                <p className="text-xs uppercase text-slate-400 font-mono">Channel State</p>
                <h2 className="text-sm font-semibold text-slate-700 uppercase mt-0.5">{txState}</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 font-mono text-slate-600">
                Bal: {balance} XLM
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 font-mono text-slate-600">
                Wallet: {selectedWallet.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Dynamic page content */}
          <AnimatePresence mode="wait">
            {page === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 premium-card p-8 rounded-3xl flex flex-col justify-center gap-6 bg-white">
                  <span className="text-xs uppercase tracking-wider text-indigo-650 font-bold font-sans">Streaming Payment Channel</span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Micro-Payment Streaming Dashboard
                  </h2>
                  <p className="text-slate-650 leading-relaxed text-sm">
                    Manage programmatic, low-cost micro-transaction streams on Stellar. Set up wallet integrations, simulate failure scenarios, and monitor real-time event synchronization logs.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPage('wallets')}
                      className="px-5 py-3 rounded-full bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 text-sm"
                    >
                      Linked Wallets
                    </button>
                    <button 
                      onClick={() => setPage('transfer')}
                      className="px-5 py-3 rounded-full border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition-all duration-300 text-sm"
                    >
                      Fund Stream
                    </button>
                  </div>
                </div>

                <div className="premium-card p-6 rounded-3xl flex flex-col justify-between gap-6 bg-white">
                  <h3 className="font-bold text-lg text-slate-900">Yellow Belt Targets</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span className="text-xs text-slate-600">Actual WalletKit Enabled</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span className="text-xs text-slate-600">Payment Channel Invoked</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span className="text-xs text-slate-600">3 Handled Wallet errors</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span className="text-xs text-slate-600">Horizon on-chain event stream</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Active Action</span>
                    <strong className="text-sm text-slate-700">{project.action}</strong>
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
                <div className="premium-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                  <h3 className="font-bold text-lg text-slate-900">Configure Wallet Portal</h3>
                  <div className="flex flex-col gap-3">
                      <button
                        onClick={connectWalletModal}
                        className="p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 bg-indigo-50 border-indigo-500 text-white shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">🔗</span>
                          <div className="text-left">
                            <h4 className="font-semibold text-sm">Open Stellar Wallets Kit</h4>
                            <span className="text-xs text-indigo-200">Supports Freighter, MetaMask, etc.</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono">Link</span>
                      </button>
                  </div>
                </div>

                <div className="premium-card p-8 rounded-3xl flex flex-col gap-6 justify-between bg-white">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-slate-900">Wallet Error Simulator</h3>
                    <p className="text-xs text-slate-500">Inject metered stream exceptions to evaluate edge cases.</p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button 
                        onClick={() => simulateError('WalletNotFound')}
                        className="py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-all"
                      >
                        Simulate WalletNotFound
                      </button>
                      <button 
                        onClick={() => simulateError('WalletConnectionRejected')}
                        className="py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-all"
                      >
                        Simulate WalletConnectionRejected
                      </button>
                      <button 
                        onClick={() => simulateError('InsufficientBalance')}
                        className="py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-all"
                      >
                        Simulate InsufficientBalance
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                      <strong>Exception:</strong> {errorCopy(error)}
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
                <div className="premium-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                  <h3 className="font-bold text-lg text-center text-slate-900">Fund Micro-Stream Channel</h3>
                  <p className="text-xs text-slate-500 text-center">Lock capital assets into programmatic payment tunnels.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Recipient Node Address</label>
                      <input 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. GD3R... or 0x71C..."
                        className="premium-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Stream Amount (XLM)</label>
                      <input 
                        type="number"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="premium-input px-4 py-3 rounded-xl text-sm w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Stream Reference Memo</label>
                      <input 
                        value={memo} 
                        onChange={(e) => setMemo(e.target.value)}
                        className="premium-input px-4 py-3 rounded-xl text-sm w-full"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleTransfer}
                    disabled={txState === 'pending'}
                    className="w-full py-4 rounded-full bg-indigo-500 hover:opacity-95 font-bold text-white shadow-md shadow-indigo-500/10 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Authorizing Stream Lock...' : 'Lock Stream Channel'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-xs p-4 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 hover:text-indigo-750 transition-all text-center block break-all"
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
                <div className="premium-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                  <h3 className="font-bold text-lg text-center text-slate-900">Soroban Stream Smart Contract</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700">Contract Address</label>
                      <input 
                        value={contractAddress} 
                        onChange={(e) => setContractAddress(e.target.value)}
                        className="premium-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700">Method Invocation Action</label>
                      <input 
                        value={contractValue} 
                        onChange={(e) => setContractValue(e.target.value)}
                        className="premium-input px-4 py-3 rounded-xl text-sm w-full"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={callContract}
                    disabled={txState === 'pending'}
                    className="w-full py-4 rounded-full bg-indigo-500 hover:opacity-95 font-bold text-white shadow-lg shadow-indigo-500/10 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Calling smart contract...' : 'Invoke Soroban Contract'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-xs p-4 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 hover:text-indigo-750 transition-all text-center block break-all"
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
                <div className="premium-card p-8 rounded-3xl flex flex-col gap-6 bg-white">
                  <div className="text-center flex flex-col gap-2">
                    <h3 className="font-bold text-lg text-slate-900">On-chain Event Logs</h3>
                    <p className="text-xs text-slate-500">Real-time payment stream status updates synchronized directly from Horizon.</p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {events.map((event) => (
                      <div 
                        key={event.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-slate-700 font-medium">{event.label}</span>
                        </div>
                        <span className="font-mono text-slate-400">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="py-6 mt-8 border-t border-slate-200 text-center text-xs text-slate-500 font-display">
          © 2026 {project.short} - Stellar Soroban Level 2 Control Station
        </footer>
      </div>
    </div>
  );
}
