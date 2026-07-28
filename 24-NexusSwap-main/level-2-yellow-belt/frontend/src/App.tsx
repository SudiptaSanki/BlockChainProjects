import { useState } from 'react';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract } from './services/stellar';

const project = {
  dir: "nexusswap",
  title: "NexusSwap: Decentralized Token Swap Portal",
  short: "NexusSwap",
  useCase: "Instant Cross-Asset Token Swaps",
  primary: "#6366f1",
  contract: "Token Swap Smart Contract",
  action: "Execute Asset Swap",
  contractId: "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Multi-Wallet Signatures' },
  { id: 'transfer', label: 'Token Swap' },
  { id: 'contract', label: 'Soroban Smart Contract' },
  { id: 'events', label: 'Event Ledger' },
] as const;

const walletOptions = [
  { id: 'freighter', label: 'Freighter Wallet', note: 'Stellar Extension', icon: '⚓' },
  { id: 'metamask', label: 'MetaMask Wallet', note: 'EVM / Snap Integration', icon: '🦊' },
  { id: 'xbull', label: 'xBull Wallet', note: 'Browser Extension', icon: '🐂' },
  { id: 'lobstr', label: 'LOBSTR Wallet', note: 'WalletConnect Path', icon: '🦞' },
];

type PageId = (typeof pages)[number]['id'];
type TxState = 'idle' | 'connecting' | 'pending' | 'success' | 'fail';
type WalletError = 'WalletNotFound' | 'WalletConnectionRejected' | 'InsufficientBalance';

function errorCopy(error: WalletError) {
  const copy: Record<WalletError, string> = {
    WalletNotFound: 'Wallet extension not detected. Please install the extension or ensure it is enabled.',
    WalletConnectionRejected: 'Connection rejected. Please grant permissions inside the wallet prompt.',
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or execution requirements.',
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
  const [contractAddress] = useState(project.contractId);
  const [txHash, setTxHash] = useState('');
  const [destination, setDestination] = useState('GBRPYHIL2CI3FNQ4BXLFMNDLFWPU2HY4LNSXYTWRAA36REDWBYV3P5BY');
  const [amount, setAmount] = useState('150');
  const [memo, setMemo] = useState('NexusSwap Liquidity');
  const [events, setEvents] = useState([
    makeEvent('Cross-Asset Swap Engine initialized'),
    makeEvent('Soroban Token Swap contract online')
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
    setEvents((items) => [makeEvent(`Swapping ${amount} XLM...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Swap executed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Swap failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking Token Swap Soroban Contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Swap contract call executed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Electric Glows */}
      <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP NAVIGATION BAR */}
      <header className="bg-slate-900/90 border-b border-indigo-500/30 px-8 py-4 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between shadow-xl shadow-indigo-950/20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-cyan-400">⚡</span>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wide">{project.short}</h1>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono block">Top Nav Electric Portal</span>
            </div>
          </div>

          {/* Top Horizontal Page Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  page === p.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="text-[10px] uppercase font-mono text-cyan-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> Stellar Testnet
            </span>
            <span className="font-mono text-slate-300 truncate max-w-[140px]">{shortKey}</span>
          </div>

          {!publicKey ? (
            <button
              onClick={() => connectWallet('freighter')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-950/50"
            >
              Connect Multi-Wallet
            </button>
          ) : (
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold"
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* Mobile Nav Sub-Bar */}
      <div className="md:hidden flex overflow-x-auto gap-2 p-4 bg-slate-900 border-b border-slate-800">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              page === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex flex-col gap-1 shadow-lg">
              <span className="font-bold">Error Condition Triggered: {error}</span>
              <span>{errorCopy(error)}</span>
            </div>
          )}

          {page === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                  <span className="text-xs text-indigo-300 uppercase tracking-widest font-mono">Available XLM Balance</span>
                  <div className="text-3xl font-bold text-cyan-400 mt-2 font-mono">{balance} XLM</div>
                </div>

                <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl">
                  <span className="text-xs text-indigo-300 uppercase tracking-widest font-mono">Soroban Contract ID</span>
                  <div className="text-xs font-mono text-indigo-200 mt-2 break-all">{contractAddress}</div>
                </div>
              </div>

              {/* Electric Swap Flow Visual Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-bold">
                  <span className="px-4 py-2 rounded-xl bg-indigo-950 border border-indigo-400 text-indigo-200 font-mono shadow-md">
                    XLM
                  </span>
                  <span className="text-cyan-400 text-lg animate-pulse">⚡ ⇄ ⚡</span>
                  <span className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-200 font-mono shadow-md">
                    USDC / Token
                  </span>
                </div>
                <span className="text-xs text-indigo-300 font-mono px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                  Electric Top-Nav Router
                </span>
              </div>
            </div>
          )}

          {page === 'wallets' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Select Wallet Gateway</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {walletOptions.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => connectWallet(w.id)}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 hover:border-cyan-400 transition-all flex items-center gap-4 text-left shadow-lg"
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{w.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{w.note}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-indigo-900 flex flex-col gap-2">
                <span className="text-xs font-bold text-indigo-300/70 uppercase">Simulate Error Handlers</span>
                <div className="flex gap-2">
                  <button onClick={() => simulateError('WalletNotFound')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-indigo-200 border border-indigo-700">WalletNotFound</button>
                  <button onClick={() => simulateError('WalletConnectionRejected')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-indigo-200 border border-indigo-700">WalletConnectionRejected</button>
                  <button onClick={() => simulateError('InsufficientBalance')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-indigo-200 border border-indigo-700">InsufficientBalance</button>
                </div>
              </div>
            </div>
          )}

          {page === 'transfer' && (
            <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider">{project.action}</h3>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Swap Counterparty / Pool Address</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Swap Amount (XLM)</label>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Memo Tag</label>
                  <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
              </div>
              <button onClick={handleTransfer} disabled={txState === 'pending'} className="mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg">
                {txState === 'pending' ? 'Swapping Tokens...' : 'Execute Asset Swap'}
              </button>
            </div>
          )}

          {page === 'contract' && (
            <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider">{project.contract}</h3>
              <p className="text-xs text-slate-400">Deployed Soroban Smart Contract on Stellar Testnet.</p>
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900 font-mono text-xs text-cyan-400 font-bold">
                Contract ID: {contractAddress}
              </div>
              <button onClick={callContract} disabled={txState === 'pending'} className="py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg">
                {txState === 'pending' ? 'Invoking Soroban RPC...' : 'Invoke Smart Contract (initialize)'}
              </button>
            </div>
          )}

          {page === 'events' && (
            <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Event Subscription Ledger</h3>
              <div className="flex flex-col gap-2">
                {events.map((e) => (
                  <div key={e.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300">{e.label}</span>
                    <span className="text-slate-500">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {txHash && (
            <div className="p-4 rounded-xl bg-indigo-950/60 border border-cyan-500/40 flex flex-col gap-1 text-xs shadow-xl">
              <span className="font-bold text-cyan-400 uppercase tracking-wider">Transaction Confirmed</span>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-indigo-300 hover:underline break-all">
                {txHash}
              </a>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
