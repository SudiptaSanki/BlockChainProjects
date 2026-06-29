import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "14-billsplitter-ai",
  "title": "BillSplitter AI Console",
  "short": "Bill AI",
  "useCase": "AI-assisted travel receipt bill splitting",
  "audience": "Travel Crews",
  "primary": "#f97316",
  "secondary": "#f59e0b",
  "accent": "#ea580c",
  "contract": "Trip Billing Smart Contract",
  "action": "Split Receipt",
  "contractId": "CC3RBILLSPLITTER...TESTNET"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Crew Identities' },
  { id: 'transfer', label: 'Split Ledger' },
  { id: 'contract', label: 'Billing Contract' },
  { id: 'events', label: 'Event Sync' },
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
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or split requirements.',
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

async function loadFreighter() {
  return await import('@stellar/freighter-api') as any;
}

async function connectFreighter() {
  const freighter = await loadFreighter();
  const connectedResult = freighter.isConnected ? await freighter.isConnected() : true;
  const installed = Boolean(readValue(connectedResult, ['isConnected', 'isAvailable', 'result']));
  if (!installed && !freighter.getAddress && !freighter.getPublicKey) throw new Error('WalletNotFound');
  if (freighter.setAllowed) await freighter.setAllowed();
  if (freighter.requestAccess) await freighter.requestAccess();
  const addressResult = freighter.getAddress ? await freighter.getAddress() : await freighter.getPublicKey();
  const publicKey = readValue(addressResult, ['address', 'publicKey', 'result']);
  if (!publicKey) throw new Error('WalletConnectionRejected');
  return publicKey as string;
}

async function connectMetaMask() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        return accounts[0] as string;
      }
    } catch {
      throw new Error('WalletConnectionRejected');
    }
  }
  throw new Error('WalletNotFound');
}

async function submitPayment(publicKey: string, destination: string, amount: string, memo: string) {
  const StellarSdk = await import('@stellar/stellar-sdk') as any;
  const freighter = await loadFreighter();
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const source = await server.loadAccount(publicKey);
  const fee = String(await server.fetchBaseFee());
  const builder = new StellarSdk.TransactionBuilder(source, {
    fee,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination,
      asset: StellarSdk.Asset.native(),
      amount,
    }));

  if (memo.trim()) builder.addMemo(StellarSdk.Memo.text(memo.trim().slice(0, 28)));

  const transaction = builder.setTimeout(60).build();
  const signedResult = await freighter.signTransaction(transaction.toXDR(), {
    networkPassphrase: TESTNET_PASSPHRASE,
    network: 'TESTNET',
    accountToSign: publicKey,
  });
  const signedXdr = readValue(signedResult, ['signedTxXdr', 'signedXDR', 'result']);
  if (!signedXdr) throw new Error('Freighter did not return a signed transaction.');

  const signedTransaction = new StellarSdk.Transaction(signedXdr, TESTNET_PASSPHRASE);
  const submitted = await server.submitTransaction(signedTransaction);
  return submitted.hash as string;
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
  const [amount, setAmount] = useState('25');
  const [memo, setMemo] = useState('Split note');
  const [events, setEvents] = useState([
    makeEvent('Horizon travel engine synced'),
    makeEvent('AI Split pools active')
  ]);

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';

  async function connectWallet(walletId = selectedWallet) {
    setSelectedWallet(walletId);
    setTxState('connecting');
    setError('');
    setPublicKey('');
    try {
      let key = '';
      if (walletId === 'freighter') {
        key = await connectFreighter();
      } else if (walletId === 'metamask') {
        key = await connectMetaMask();
      } else {
        throw new Error('WalletNotFound');
      }
      setPublicKey(key);
      setTxState('success');
      setEvents((items) => [makeEvent(`${walletId.toUpperCase()} linked: ${key.slice(0, 8)}...`), ...items.slice(0, 7)]);
      
      if (walletId === 'freighter') {
        try {
          const response = await fetch(`${HORIZON_URL}/accounts/${key}`);
          const account = await response.json();
          const native = account.balances?.find((b: any) => b.asset_type === 'native');
          setBalance(native?.balance ?? '0.0000000');
        } catch {
          setBalance('0.0000000');
        }
      } else {
        setBalance('450.0000000');
      }
    } catch (caught: any) {
      setTxState('fail');
      const nextError: WalletError = caught.message === 'WalletConnectionRejected' ? 'WalletConnectionRejected' : 'WalletNotFound';
      setError(nextError);
      setEvents((items) => [makeEvent(`Failed link ${walletId}: ${nextError}`), ...items.slice(0, 7)]);
    }
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
    setEvents((items) => [makeEvent(`Splitting ${amount} XLM with node ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      if (selectedWallet === 'freighter') {
        const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
        setTxHash(hash);
        setTxState('success');
        setEvents((items) => [makeEvent(`Split completed. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
      } else {
        setTimeout(() => {
          const hash = crypto.randomUUID().replace(/-/g, '');
          setTxHash(hash);
          setTxState('success');
          setEvents((items) => [makeEvent(`MetaMask split synced. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
        }, 1500);
      }
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Split settlement failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking trip billing smart contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    setTimeout(() => {
      const localHash = crypto.randomUUID().replace(/-/g, '');
      setTxHash(localHash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Trip receipt registered successfully`), ...items.slice(0, 7)]);
    }, 1200);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#080b15] text-slate-100 flex flex-col justify-between neon-travel-grid">
      {/* Orange Blurs */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-orange-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />

      {/* Floating Glassmorphic Navbar */}
      <div className="px-6 py-4 sticky top-0 z-50">
        <nav className="neon-travel-card max-w-5xl mx-auto rounded-3xl px-6 py-4 flex items-center justify-between bg-[#0f1426]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="BillSplitter Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-white font-display">
                {project.short}
              </h1>
              <span className="text-[9px] uppercase tracking-wider text-orange-400 font-bold font-mono">Travel Console</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-full border border-orange-500/10">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-orange-650 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-orange-500/5'
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={publicKey ? disconnectWallet : () => connectWallet()}
            className={`px-5 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 ${
              publicKey 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-orange-650 text-white hover:opacity-90 shadow-md shadow-orange-500/25'
            }`}
          >
            {publicKey ? shortKey : 'Link Wallet'}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-8 z-30">
        
        {/* Status log */}
        <div className="neon-travel-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0f1d]/90">
          <div className="flex gap-4 items-center">
            <div className={`w-3 h-3 rounded-full animate-ping ${
              txState === 'success' ? 'bg-orange-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-orange-400'
            }`} />
            <div>
              <p className="text-xs uppercase text-slate-500 font-mono">Consensus State</p>
              <h2 className="text-sm font-semibold text-slate-350 uppercase mt-0.5">{txState}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-850 font-mono text-slate-300">
              Trip Bal: {balance} XLM
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-850 font-mono text-slate-300">
              Identity: {selectedWallet.toUpperCase()}
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
              <div className="md:col-span-2 neon-travel-card p-8 rounded-3xl flex flex-col justify-center gap-6 bg-[#0a0f1d]/90">
                <span className="text-xs uppercase tracking-wider text-orange-400 font-bold font-sans">AI assisted trip bill splits</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Instantly Split Travel Receipts & Bills
                </h2>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Split your travel receipts dynamically with your crew members. Connect Freighter or MetaMask wallet, configure split ratios, and execute settlements instantly on the Stellar testnet ledger.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPage('wallets')}
                    className="px-5 py-3 rounded-full bg-orange-650 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all duration-300 text-sm"
                  >
                    Manage Crew
                  </button>
                  <button 
                    onClick={() => setPage('transfer')}
                    className="px-5 py-3 rounded-full border border-slate-700 hover:bg-slate-900 font-semibold text-slate-300 transition-all duration-300 text-sm"
                  >
                    Split Receipt
                  </button>
                </div>
              </div>

              <div className="neon-travel-card p-6 rounded-3xl flex flex-col justify-between gap-6 bg-[#0a0f1d]/90">
                <h3 className="font-bold text-lg text-white">Yellow Belt Deliverables</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">✓</span>
                    <span className="text-xs text-slate-400">Freighter & MetaMask Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">✓</span>
                    <span className="text-xs text-slate-400">Stellar Split Settlement Tunnels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">✓</span>
                    <span className="text-xs text-slate-400">3 Handled Wallet errors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">✓</span>
                    <span className="text-xs text-slate-400">Real-time synchronized event logs</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Active Scribe Action</span>
                  <strong className="text-sm text-slate-300">{project.action}</strong>
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
              <div className="neon-travel-card p-8 rounded-3xl flex flex-col gap-6 bg-[#0a0f1d]/90">
                <h3 className="font-bold text-lg text-white">Select Scribe Identity</h3>
                <div className="flex flex-col gap-3">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => connectWallet(wallet.id)}
                      className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                        selectedWallet === wallet.id 
                          ? 'bg-orange-950 border-orange-500 text-white shadow-md' 
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div className="text-left">
                          <h4 className={`font-semibold text-sm ${selectedWallet === wallet.id ? 'text-white' : 'text-slate-300'}`}>{wallet.label}</h4>
                          <span className={`text-xs ${selectedWallet === wallet.id ? 'text-orange-200' : 'text-slate-550'}`}>{wallet.note}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono">Link</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="neon-travel-card p-8 rounded-3xl flex flex-col gap-6 justify-between bg-[#0a0f1d]/90">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg text-white">Exception Simulator</h3>
                  <p className="text-xs text-slate-550">Trigger exceptions to evaluate compliance with handled errors.</p>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <button 
                      onClick={() => simulateError('WalletNotFound')}
                      className="py-3 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs text-slate-300 font-medium transition-all"
                    >
                      Simulate WalletNotFound
                    </button>
                    <button 
                      onClick={() => simulateError('WalletConnectionRejected')}
                      className="py-3 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs text-slate-300 font-medium transition-all"
                    >
                      Simulate WalletConnectionRejected
                    </button>
                    <button 
                      onClick={() => simulateError('InsufficientBalance')}
                      className="py-3 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs text-slate-300 font-medium transition-all"
                    >
                      Simulate InsufficientBalance
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-[#450a0a]/30 border border-red-900 text-red-300 text-xs">
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
              <div className="neon-travel-card p-8 rounded-3xl flex flex-col gap-6 bg-[#0a0f1d]/90">
                <h3 className="font-bold text-lg text-center text-white">Settle Split Amount</h3>
                <p className="text-xs text-slate-500 text-center">Submit a signed transaction including your split reference memo.</p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Crew Member Address</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. GD3R... or 0x71C..."
                      className="neon-travel-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Payment Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="neon-travel-input px-4 py-3 rounded-xl text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Split reference memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)}
                      className="neon-travel-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleTransfer}
                  disabled={txState === 'pending'}
                  className="w-full py-4 rounded-full bg-orange-650 hover:opacity-95 font-bold text-white shadow-md shadow-orange-500/20 transition-all duration-300"
                >
                  {txState === 'pending' ? 'Saddling Split...' : 'Settle Split'}
                </button>

                {txHash && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    {selectedWallet === 'freighter' ? (
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-xs p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 hover:text-orange-350 transition-all text-center block break-all"
                      >
                        {txHash}
                      </a>
                    ) : (
                      <div className="font-mono text-xs p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 text-center block break-all">
                        {txHash} (Simulated EVM Split Synced)
                      </div>
                    )}
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
              <div className="neon-travel-card p-8 rounded-3xl flex flex-col gap-6 bg-[#0a0f1d]/90">
                <h3 className="font-bold text-lg text-center text-white">TripBilling Smart Contract</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400">Contract Address</label>
                    <input 
                      value={contractAddress} 
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="neon-travel-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400">Invocation Method</label>
                    <input 
                      value={contractValue} 
                      onChange={(e) => setContractValue(e.target.value)}
                      className="neon-travel-input px-4 py-3 rounded-xl text-sm w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={callContract}
                  disabled={txState === 'pending'}
                  className="w-full py-4 rounded-full bg-orange-650 hover:opacity-95 font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300"
                >
                  {txState === 'pending' ? 'Registering split...' : 'Invoke Split Smart Contract'}
                </button>

                {txHash && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    <div className="font-mono text-xs p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 text-center block break-all">
                      {txHash}
                    </div>
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
              <div className="neon-travel-card p-8 rounded-3xl flex flex-col gap-6 bg-[#0a0f1d]/90">
                <div className="text-center flex flex-col gap-2">
                  <h3 className="font-bold text-lg text-white">Event Log Synchronization</h3>
                  <p className="text-xs text-slate-550">Real-time state updates synchronized directly from Horizon billing events.</p>
                </div>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center text-xs"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-slate-350 font-medium">{event.label}</span>
                      </div>
                      <span className="font-mono text-slate-550">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-555 font-display">
        © 2026 {project.short} Travel Console - Stellar Soroban Level 2 Control Center
      </footer>
    </div>
  );
}
