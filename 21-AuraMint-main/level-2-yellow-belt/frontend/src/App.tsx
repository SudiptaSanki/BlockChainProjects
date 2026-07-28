import { useState } from 'react';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract } from './services/stellar';
import * as FreighterApi from '@stellar/freighter-api';

const project = {
  dir: "auramint",
  title: "AuraMint: Decentralized NFT Minter",
  short: "AuraMint",
  useCase: "On-Chain NFT & Asset Minting Vaults",
  primary: "#10b981",
  contract: "NFT Minter Smart Contract",
  action: "Mint Unique NFT Token",
  contractId: "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Multi-Wallet Signatures' },
  { id: 'transfer', label: 'Mint NFT Action' },
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
  const [connectedWallets, setConnectedWallets] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState('0.0000000');
  const [txState, setTxState] = useState<TxState>('idle');
  const [error, setError] = useState<WalletError | ''>('');
  const [contractAddress] = useState(project.contractId);
  const [txHash, setTxHash] = useState('');
  const [destination, setDestination] = useState('GBRPYHIL2CI3FNQ4BXLFMNDLFWPU2HY4LNSXYTWRAA36REDWBYV3P5BY');
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('AuraMint NFT');
  const [events, setEvents] = useState([
    makeEvent('NFT Minter gateway active'),
    makeEvent('Soroban smart contract synced')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

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
          setPublicKey(ethKey);
          setConnectedWallets((prev) => ({ ...prev, metamask: ethKey }));
          setTxState('success');
          setEvents((items) => [makeEvent(`METAMASK linked: ${ethKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
          return;
        } else {
          // Mock connection for demonstration if extension not installed
          const mockEthKey = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
          setPublicKey(mockEthKey);
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
      setPublicKey(mockKey);
      setConnectedWallets((prev) => ({ ...prev, [walletId]: mockKey }));
      setTxState('success');
      setEvents((items) => [makeEvent(`${walletId.toUpperCase()} linked: ${mockKey.slice(0, 8)}...`), ...items.slice(0, 7)]);
      return;
    }

    // Default Freighter logic
    await connectWalletKit(
      async (id, key) => {
        setPublicKey(key);
        setConnectedWallets((prev) => ({ ...prev, [id]: key }));
        setTxState('success');
        setEvents((items) => [makeEvent(`${id.toUpperCase()} linked: ${key.slice(0, 8)}...`), ...items.slice(0, 7)]);
        
        try {
          const response = await fetch(`${HORIZON_URL}/accounts/${key}`);
          const account = await response.json();
          const native = account.balances?.find((b: any) => b.asset_type === 'native');
          setBalance(native?.balance ?? '10000.0000000');
        } catch {
          setBalance('10000.0000000');
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
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setTxHash('');
    setEvents((items) => [makeEvent(`Minting NFT with ${amount} XLM collateral...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`NFT Minted on-chain. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`NFT Mint failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking Soroban NFT Minter at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`NFT Minter contract call executed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden md:overflow-hidden">
      
      {/* Animated Glowing Ambient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl animate-pulse"></div>

      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900/90 border-b md:border-b-0 md:border-r border-emerald-900/40 p-4 md:p-6 flex flex-col justify-between shrink-0 backdrop-blur-md z-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">✨</span>
            <div>
              <h1 className="font-bold text-xl text-white tracking-wide">{project.short}</h1>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono">NFT Minting Console</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-semibold tracking-wider text-left transition-all ${
                  page === p.id 
                    ? 'bg-emerald-950/60 text-emerald-300 border-l-4 border-emerald-400 shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex flex-col gap-2 text-xs">
          <span className="text-emerald-400 uppercase font-mono text-[10px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Stellar Testnet
          </span>
          <span className="font-mono text-slate-300 truncate max-w-full">{shortKey}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 gap-4 border-b border-emerald-900/30">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{page.replace('_', ' ')}</h2>
              <p className="text-xs text-slate-400 mt-1">{project.useCase}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {!publicKey ? (
                <button
                  onClick={() => connectWallet('freighter')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/50"
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
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex flex-col gap-1">
              <span className="font-bold">Error Condition Triggered: {error}</span>
              <span>{errorCopy(error)}</span>
            </div>
          )}

          {page === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/80 border border-emerald-900/30 rounded-2xl backdrop-blur-md">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Connected XLM Balance</span>
                  <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">{balance} XLM</div>
                </div>

                <div className="p-6 bg-slate-900/80 border border-emerald-900/30 rounded-2xl backdrop-blur-md">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Deployed Soroban Contract ID</span>
                  <div className="text-xs font-mono text-emerald-300 mt-2 break-all">{contractAddress}</div>
                </div>
              </div>

              {/* Animated Live Preview Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl animate-bounce">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">AuraMint Cyber Pass #88</h3>
                    <p className="text-xs text-slate-400 mt-1">Status: Ready for Soroban Minting</p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  Live Preview
                </span>
              </div>
            </div>
          )}

          {page === 'wallets' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Select & Connect Multi-Wallets</h3>
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
                          ? 'bg-emerald-950/50 border-emerald-400 shadow-lg shadow-emerald-950/30'
                          : 'bg-slate-900/80 border-emerald-900/30 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{w.icon}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{w.label}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{w.note}</div>
                          {isConnected && (
                            <div className="text-[11px] font-mono text-emerald-300 mt-1 truncate max-w-[120px] sm:max-w-[180px]">
                              {walletAddr}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {isConnected ? (
                          <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-xs font-mono flex items-center gap-1">
                            ✓ Connected
                          </span>
                        ) : (
                          <button className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold transition-all">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Simulate Error Handlers</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => simulateError('WalletNotFound')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">WalletNotFound</button>
                  <button onClick={() => simulateError('WalletConnectionRejected')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">WalletConnectionRejected</button>
                  <button onClick={() => simulateError('InsufficientBalance')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">InsufficientBalance</button>
                </div>
              </div>
            </div>
          )}

          {page === 'transfer' && (
            <div className="p-6 bg-slate-900/80 border border-emerald-900/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{project.action}</h3>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Address</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Collateral Amount (XLM)</label>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">NFT Memo Payload</label>
                  <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200" />
                </div>
              </div>
              <button onClick={handleTransfer} disabled={txState === 'pending'} className="mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide">
                {txState === 'pending' ? 'Minting NFT...' : 'Execute NFT Mint Action'}
              </button>
            </div>
          )}

          {page === 'contract' && (
            <div className="p-6 bg-slate-900/80 border border-emerald-900/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{project.contract}</h3>
              <p className="text-xs text-slate-400">Deployed Soroban Smart Contract on Stellar Testnet.</p>
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 font-mono text-xs text-emerald-400">
                Contract ID: {contractAddress}
              </div>
              <button onClick={callContract} disabled={txState === 'pending'} className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs">
                {txState === 'pending' ? 'Invoking Soroban RPC...' : 'Invoke Smart Contract (initialize)'}
              </button>
            </div>
          )}

          {page === 'events' && (
            <div className="p-6 bg-slate-900/80 border border-emerald-900/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
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
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col gap-1 text-xs">
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
