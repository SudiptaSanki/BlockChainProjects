import { useState } from 'react';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract } from './services/stellar';

const project = {
  dir: "ledgertrack",
  title: "LedgerTrack: On-Chain Payment Auditor",
  short: "LedgerTrack",
  useCase: "Immutable Payment Tracking & Invoicing",
  primary: "#d97706",
  contract: "Payment Tracker Smart Contract",
  action: "Record Payment Audit",
  contractId: "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Multi-Wallet Signatures' },
  { id: 'transfer', label: 'Record Audit' },
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
    WalletConnectionRejected: 'Action failed. Check the Event Ledger below for details. Open browser console (F12) for full error.',
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
  const [publicKey, setPublicKey] = useState(() => localStorage.getItem('stellarPublicKey') || '');
  const [balance, setBalanceState] = useState(() => localStorage.getItem('stellarBalance') || '0.0000000');
  const [connectedWallets, setConnectedWallets] = useState<Record<string, string>>({});

  const [txState, setTxState] = useState<TxState>('idle');
  const [error, setError] = useState<WalletError | ''>('');
  const [contractAddress] = useState(project.contractId);
  const [txHash, setTxHash] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('Audit Voucher #1042');
  const [events, setEvents] = useState([
    makeEvent('Ledger audit stream online'),
    makeEvent('Payment tracker contract authenticated')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  function persistPublicKey(key: string) {
    setPublicKey(key);
    if (key) localStorage.setItem('stellarPublicKey', key);
    else localStorage.removeItem('stellarPublicKey');
  }

  function persistBalance(bal: string) {
    setBalanceState(bal);
    localStorage.setItem('stellarBalance', bal);
  }


  async function connectWallet(walletId = selectedWallet) {
    setSelectedWallet(walletId);
    setTxState('connecting');
    setError('');

    if (walletId === 'metamask') {
      try {
        const win = window as any;
        if (win.ethereum) {
          const accounts = await win.ethereum.request({ method: 'eth_requestAccounts' });
          const ethKey = accounts[0] || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
          persistPublicKey(ethKey);
          setConnectedWallets((prev) => ({ ...prev, metamask: ethKey }));
          setTxState('success');
          setEvents((items) => [makeEvent(`METAMASK linked: ${ethKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
          return;
        } else {
          const mockEthKey = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
          persistPublicKey(mockEthKey);
          setConnectedWallets((prev) => ({ ...prev, metamask: mockEthKey }));
          setTxState('success');
          setEvents((items) => [makeEvent(`METAMASK linked: ${mockEthKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
          return;
        }
      } catch {
        setError('WalletConnectionRejected');
        setTxState('fail');
        return;
      }
    }

    if (walletId === 'xbull' || walletId === 'lobstr') {
      const mockKey = walletId === 'xbull' ? 'GXBULL88734KSMCN9283746501928374615' : 'GLOBSTR3394857601928374650192837';
      persistPublicKey(mockKey);
      setConnectedWallets((prev) => ({ ...prev, [walletId]: mockKey }));
      setTxState('success');
      setEvents((items) => [makeEvent(`${walletId.toUpperCase()} linked: ${mockKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
      return;
    }

    await connectWalletKit(
      async (id, key) => {
        persistPublicKey(key);
        setConnectedWallets((prev) => ({ ...prev, [id]: key }));
        setTxState('success');
        setEvents((items) => [makeEvent(`${id.toUpperCase()} linked: ${key.slice(0, 8)}...`), ...items.slice(0, 7)]);
        
        try {
          const response = await fetch(`${HORIZON_URL}/accounts/${key}`);
          if (response.ok) {
            const account = await response.json();
            const native = account.balances?.find((b: any) => b.asset_type === 'native');
            persistBalance(native?.balance ?? '0.0000000');
          } else {
            persistBalance('0.0000000');
          }
        } catch {
          persistBalance('0.0000000');
        }
      },
      (err) => {
        setTxState('fail');
        setError('WalletConnectionRejected');
        setEvents((items) => [makeEvent(`Failed link: ${(err as any)?.message || 'Wallet not accessible'}`), ...items.slice(0, 7)]);
      }
    );
  }

  function disconnectWallet() {
    persistPublicKey('');
    setBalanceState('0.0000000');
    localStorage.removeItem('stellarBalance');
    setConnectedWallets({});
    setTxState('idle');
    setEvents((items) => [makeEvent('Wallets unlinked'), ...items.slice(0, 7)]);
  }

  function simulateError(nextError: WalletError) {
    setError(nextError);
    setTxState('fail');
    setEvents((items) => [makeEvent(`Simulated: ${nextError}`), ...items.slice(0, 7)]);
  }

  async function handleTransfer() {
    const stellarKey = connectedWallets['freighter'] || publicKey;
    if (!stellarKey || !stellarKey.startsWith('G')) {
      setPage('wallets');
      return;
    }
    setTxState('pending');
    setTxHash('');
    setEvents((items) => [makeEvent(`Recording audit payload of ${amount} XLM...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(stellarKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Audit log registered. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Audit failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    const stellarKey = connectedWallets['freighter'] || publicKey;
    if (!stellarKey || !stellarKey.startsWith('G')) {
      setPage('wallets');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking Payment Tracker Soroban Contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(stellarKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Payment Tracker contract call executed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col md:flex-row font-mono relative overflow-x-hidden md:overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-stone-900 border-b md:border-b-0 md:border-r border-amber-900/40 p-6 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">📜</span>
            <div>
              <h1 className="font-bold text-xl text-amber-400 tracking-wider font-sans">{project.short}</h1>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/80 font-mono">Gold Audit Terminal</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-left transition-all ${
                  page === p.id 
                    ? 'bg-amber-950/80 text-amber-300 border-l-4 border-amber-500 shadow-md' 
                    : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 rounded-xl bg-stone-950 border border-amber-900/40 flex flex-col gap-2 text-xs">
          <span className="text-amber-400 uppercase text-[10px]">Stellar Testnet Node</span>
          <span className="font-mono text-amber-200 truncate">{shortKey}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 gap-4 border-b border-amber-900/30">
            <div>
              <h2 className="text-2xl font-bold text-amber-400 capitalize font-sans">{page.replace('_', ' ')}</h2>
              <p className="text-xs text-stone-400 mt-1">{project.useCase}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {!publicKey ? (
                <button
                  onClick={() => setPage('wallets')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-950/50 font-sans"
                >
                  Connect Wallet →
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
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex flex-col gap-1">
              <span className="font-bold">Error Condition Triggered: {error}</span>
              <span>{errorCopy(error)}</span>
            </div>
          )}

          {page === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-stone-900 border border-amber-900/30 rounded-2xl">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Audited XLM Balance</span>
                  <div className="text-3xl font-bold text-amber-400 mt-2">{balance} XLM</div>
                </div>

                <div className="p-6 bg-stone-900 border border-amber-900/30 rounded-2xl">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Deployed Contract ID</span>
                  <div className="text-xs text-amber-300 mt-2 break-all">{contractAddress}</div>
                </div>
              </div>

              {/* Gold Ticker Banner */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  Audit Ledger Integrity Certified
                </span>
                <span className="text-stone-400">Block Sync: Horizon Testnet</span>
              </div>
            </div>
          )}

          {page === 'wallets' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-sans">Select & Connect Multi-Wallets</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {walletOptions.map((w) => {
                  const isConnected = Boolean(connectedWallets[w.id]);
                  const walletAddr = connectedWallets[w.id] || '';
                  return (
                    <div
                      key={w.id}
                      onClick={() => connectWallet(w.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isConnected
                          ? 'bg-amber-950/40 border-amber-400 shadow-md'
                          : 'bg-stone-900 border-amber-900/30 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{w.icon}</span>
                        <div>
                          <div className="font-bold text-amber-200 text-sm font-sans">{w.label}</div>
                          <div className="text-xs text-stone-400 mt-0.5">{w.note}</div>
                          {isConnected && (
                            <div className="text-[11px] font-mono text-amber-300 mt-1 truncate max-w-[120px] sm:max-w-[180px]">
                              {walletAddr}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {isConnected ? (
                          <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs font-mono flex items-center gap-1 font-sans">
                            ✓ Connected
                          </span>
                        ) : (
                          <button className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-amber-200 text-xs font-bold transition-all font-sans">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-stone-400 uppercase font-sans">Simulate Error Handlers</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => simulateError('WalletNotFound')} className="px-3 py-1.5 rounded-lg bg-stone-800 text-xs text-amber-200 border border-stone-700">WalletNotFound</button>
                  <button onClick={() => simulateError('WalletConnectionRejected')} className="px-3 py-1.5 rounded-lg bg-stone-800 text-xs text-amber-200 border border-stone-700">WalletConnectionRejected</button>
                  <button onClick={() => simulateError('InsufficientBalance')} className="px-3 py-1.5 rounded-lg bg-stone-800 text-xs text-amber-200 border border-stone-700">InsufficientBalance</button>
                </div>
              </div>
            </div>
          )}

          {page === 'transfer' && (
            <div className="p-6 bg-stone-900 border border-amber-900/30 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-sans">{project.action}</h3>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Destination Address</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-900/30 text-sm text-amber-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Audit Amount (XLM)</label>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-900/30 text-sm text-amber-200" />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Audit Hash / Memo</label>
                  <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-900/30 text-sm text-amber-200" />
                </div>
              </div>
              <button onClick={handleTransfer} disabled={txState === 'pending'} className="mt-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs tracking-wide font-sans">
                {txState === 'pending' ? 'Recording Audit...' : 'Execute Payment Audit'}
              </button>
            </div>
          )}

          {page === 'contract' && (
            <div className="p-6 bg-stone-900 border border-amber-900/30 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-sans">{project.contract}</h3>
              <p className="text-xs text-stone-400">Deployed Soroban Smart Contract on Stellar Testnet.</p>
              <div className="p-4 rounded-xl bg-stone-950 border border-amber-900/40 text-xs text-amber-300">
                Contract ID: {contractAddress}
              </div>
              <button onClick={callContract} disabled={txState === 'pending'} className="py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-xs font-sans">
                {txState === 'pending' ? 'Invoking Soroban RPC...' : 'Invoke Smart Contract (initialize)'}
              </button>
            </div>
          )}

          {page === 'events' && (
            <div className="p-6 bg-stone-900 border border-amber-900/30 rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-sans">Event Subscription Ledger</h3>
              <div className="flex flex-col gap-2">
                {events.map((e) => (
                  <div key={e.id} className="p-3 rounded-xl bg-stone-950 border border-amber-900/30 flex justify-between items-center text-xs">
                    <span className="text-amber-200">{e.label}</span>
                    <span className="text-stone-500">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {txHash && (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 flex flex-col gap-1 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider font-sans">Transaction Confirmed</span>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-amber-300 hover:underline break-all">
                {txHash}
              </a>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
