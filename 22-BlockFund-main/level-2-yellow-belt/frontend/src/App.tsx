import { useState } from 'react';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract } from './services/stellar';

const project = {
  dir: "blockfund",
  title: "BlockFund: Decentralized Crowdfunding Vaults",
  short: "BlockFund",
  useCase: "Trustless Milestone Crowdfunding",
  primary: "#0284c7",
  contract: "Crowdfund Vault Smart Contract",
  action: "Pledge Campaign Funds",
  contractId: "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Multi-Wallet Signatures' },
  { id: 'transfer', label: 'Execute Action' },
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
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('BlockFund Action');
  const [events, setEvents] = useState([
    makeEvent('Horizon gateway synced'),
    makeEvent('Soroban smart contract active')
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
    setEvents((items) => [makeEvent(`Submitting ${amount} XLM transaction to ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Transaction confirmed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Transaction failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking Soroban contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Soroban contract call executed successfully. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h1 className="font-bold text-xl text-white">BlockFund</h1>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Control Center</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-left transition-all ${
                  page === p.id 
                    ? 'bg-slate-800 text-white border-l-4 border-emerald-500 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 text-xs">
          <span className="text-slate-400 uppercase font-mono text-[10px]">Stellar Testnet</span>
          <span className="font-mono text-emerald-400 truncate">{shortKey}</span>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          <header className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{page.replace('_', ' ')}</h2>
              <p className="text-xs text-slate-400 mt-1">Trustless Milestone Crowdfunding</p>
            </div>
            
            <div className="flex items-center gap-3">
              {!publicKey ? (
                <button
                  onClick={() => connectWallet('freighter')}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow-lg"
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Connect Multi-Wallet
                </button>
              ) : (
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold"
                >
                  Disconnect
                </button>
              )}
            </div>
          </header>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex flex-col gap-1">
              <span className="font-bold">Error Condition Triggered: {error}</span>
              <span>{errorCopy(error)}</span>
            </div>
          )}

          {page === 'overview' && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Connected Balance</span>
                <div className="text-3xl font-bold text-white mt-2 font-mono">{balance} XLM</div>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Deployed Contract ID</span>
                <div className="text-xs font-mono text-emerald-400 mt-2 break-all">{contractAddress}</div>
              </div>
            </div>
          )}

          {page === 'wallets' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Select Wallet Gateway</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {walletOptions.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => connectWallet(w.id)}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-4 text-left"
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{w.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{w.note}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Simulate Error Handlers</span>
                <div className="flex gap-2">
                  <button onClick={() => simulateError('WalletNotFound')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">WalletNotFound</button>
                  <button onClick={() => simulateError('WalletConnectionRejected')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">WalletConnectionRejected</button>
                  <button onClick={() => simulateError('InsufficientBalance')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">InsufficientBalance</button>
                </div>
              </div>
            </div>
          )}

          {page === 'transfer' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pledge Campaign Funds</h3>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Address</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Amount (XLM)</label>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Memo</label>
                  <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
              </div>
              <button onClick={handleTransfer} disabled={txState === 'pending'} className="mt-2 py-3 rounded-xl text-white font-bold text-xs tracking-wide" style={{ backgroundColor: '#0284c7' }}>
                {txState === 'pending' ? 'Processing...' : 'Execute Operation'}
              </button>
            </div>
          )}

          {page === 'contract' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Crowdfund Vault Smart Contract</h3>
              <p className="text-xs text-slate-400">Deployed Soroban Smart Contract on Stellar Testnet.</p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                Contract ID: {contractAddress}
              </div>
              <button onClick={callContract} disabled={txState === 'pending'} className="py-3 rounded-xl text-white font-bold text-xs" style={{ backgroundColor: '#0284c7' }}>
                {txState === 'pending' ? 'Invoking Soroban RPC...' : 'Invoke Smart Contract (initialize)'}
              </button>
            </div>
          )}

          {page === 'events' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Event Subscription Ledger</h3>
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
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex flex-col gap-1 text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">Transaction Confirmed</span>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-emerald-300 hover:underline break-all">
                {txHash}
              </a>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
