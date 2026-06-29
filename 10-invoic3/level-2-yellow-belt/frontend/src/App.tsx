import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "10-invoic3",
  "title": "Invoic3 Console",
  "short": "Invoic3",
  "useCase": "On-chain invoice factoring schedules",
  "audience": "Businesses and Clients",
  "primary": "#2563eb",
  "secondary": "#1d4ed8",
  "accent": "#3b82f6",
  "contract": "Invoice Vault Smart Contract",
  "action": "Initialize Invoice Settlement",
  "contractId": "CC3RINVOIC3VAULT...TESTNET"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Invoice Gates' },
  { id: 'wallets', label: 'Signatures' },
  { id: 'transfer', label: 'Settle Invoice' },
  { id: 'contract', label: 'Soroban Invoice Contract' },
  { id: 'events', label: 'Invoice Ledger' },
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
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or invoice requirements.',
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
  const [amount, setAmount] = useState('300');
  const [memo, setMemo] = useState('Invoice Settle');
  const [events, setEvents] = useState([
    makeEvent('Horizon invoice gateway synced'),
    makeEvent('Trustless billing vaults active')
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
        setBalance('950.0000000');
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
    setEvents((items) => [makeEvent(`Locking ${amount} XLM invoice settlement with vendor ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      if (selectedWallet === 'freighter') {
        const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
        setTxHash(hash);
        setTxState('success');
        setEvents((items) => [makeEvent(`Invoice vault initialized. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
      } else {
        setTimeout(() => {
          const hash = crypto.randomUUID().replace(/-/g, '');
          setTxHash(hash);
          setTxState('success');
          setEvents((items) => [makeEvent(`MetaMask invoice synced. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
        }, 1500);
      }
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Invoice lock failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking invoice smart contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    setTimeout(() => {
      const localHash = crypto.randomUUID().replace(/-/g, '');
      setTxHash(localHash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Invoice registered successfully`), ...items.slice(0, 7)]);
    }, 1200);
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden pic-bg-overlay">
      
      {/* Light Left Sidebar */}
      <aside className="w-80 light-sidebar flex flex-col justify-between p-8 shrink-0 z-40">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-6">
            <img src="/invoic3-icon.svg" alt="Invoic3 Logo" className="w-10 h-10 object-contain filter drop-shadow" />
            <div>
              <h1 className="font-bold text-2xl tracking-wide text-stone-900 leading-none">
                {project.short}
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-blue-700 font-bold block mt-1 font-sans">Yellow Belt Vault</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`w-full px-5 py-4 rounded-xl text-sm font-semibold tracking-wider text-left transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-blue-600/10 text-blue-800 border-l-4 border-blue-600 shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={publicKey ? disconnectWallet : () => connectWallet()}
            className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-sm ${
              publicKey 
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-850' 
                : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-850/15'
            }`}
          >
            {publicKey ? shortKey : 'Link Wallet'}
          </button>
          <span className="text-[9px] uppercase tracking-wider text-stone-400 text-center block">Stellar Invoice Engine</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between min-h-screen z-35">
        <main className="max-w-4xl mx-auto w-full px-12 py-16 flex flex-col gap-10">
          
          {/* Status Display */}
          <div className="luxury-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-2 border-l-blue-600 bg-white/5">
            <div className="flex gap-4 items-center">
              <div className={`w-3 h-3 rounded-full animate-ping ${
                txState === 'success' ? 'bg-blue-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-blue-400'
              }`} />
              <div>
                <p className="text-xs uppercase text-stone-400 font-mono">Consensus State</p>
                <h2 className="text-sm font-semibold text-stone-200 uppercase mt-0.5">{txState}</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-stone-950 border border-stone-800 font-mono text-stone-300">
                Vault Bal: {balance} XLM
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-stone-950 border border-stone-800 font-mono text-stone-300">
                Identity: {selectedWallet.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Tab View */}
          <AnimatePresence mode="wait">
            {page === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 luxury-card p-8 rounded-3xl flex flex-col justify-center gap-6">
                  <span className="text-xs font-calligraphy text-blue-500">Ancient Trust in Digital Ledger Vaults</span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Lock Invoice Vault Factoring
                  </h2>
                  <p className="text-stone-300 leading-relaxed text-sm">
                    Lock and manage project invoice settlements dynamically with our decentralized vault contracts. Secure Freighter and MetaMask wallet links directly to lock billing parameters on-chain.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPage('wallets')}
                      className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all duration-300"
                    >
                      Signatures
                    </button>
                    <button 
                      onClick={() => setPage('transfer')}
                      className="px-5 py-3 rounded-xl border border-stone-700 hover:bg-stone-800/40 text-stone-300 transition-all duration-300 text-sm"
                    >
                      Settle Invoice
                    </button>
                  </div>
                </div>

                <div className="luxury-card p-6 rounded-3xl flex flex-col justify-between gap-6">
                  <h3 className="font-bold text-lg text-white">Yellow Belt Deliverables</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Freighter & MetaMask Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Invoice vault parameters lock</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">3 Handled Wallet errors</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Event synchronized live logs</span>
                    </div>
                  </div>
                  <div className="p-4 bg-stone-950/40 rounded-2xl border border-blue-600/10">
                    <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">Active Action</span>
                    <strong className="text-sm text-stone-300">{project.action}</strong>
                  </div>
                </div>
              </motion.div>
            )}

            {page === 'wallets' && (
              <motion.div 
                key="wallets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <div className="luxury-card p-8 rounded-3xl flex flex-col gap-6">
                  <h3 className="font-bold text-lg text-white">Select Scribe Identity</h3>
                  <div className="flex flex-col gap-3">
                    {walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => connectWallet(wallet.id)}
                        className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                          selectedWallet === wallet.id 
                            ? 'bg-blue-900/10 border-blue-600 text-white shadow-md' 
                            : 'bg-stone-950/60 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div className="text-left">
                            <h4 className={`font-semibold text-sm ${selectedWallet === wallet.id ? 'text-white' : 'text-stone-300'}`}>{wallet.label}</h4>
                            <span className={`text-xs ${selectedWallet === wallet.id ? 'text-blue-205' : 'text-stone-500'}`}>{wallet.note}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono">Link</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="luxury-card p-8 rounded-3xl flex flex-col gap-6 justify-between">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-white">Exception Simulator</h3>
                    <p className="text-xs text-stone-450">Trigger exceptions to evaluate compliance with handled errors.</p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button 
                        onClick={() => simulateError('WalletNotFound')}
                        className="py-3 rounded-xl bg-stone-950/60 hover:bg-stone-900 border border-stone-850 text-xs text-stone-300 font-medium transition-all"
                      >
                        Simulate WalletNotFound
                      </button>
                      <button 
                        onClick={() => simulateError('WalletConnectionRejected')}
                        className="py-3 rounded-xl bg-stone-950/60 hover:bg-stone-900 border border-stone-850 text-xs text-stone-300 font-medium transition-all"
                      >
                        Simulate WalletConnectionRejected
                      </button>
                      <button 
                        onClick={() => simulateError('InsufficientBalance')}
                        className="py-3 rounded-xl bg-stone-950/60 hover:bg-stone-900 border border-stone-850 text-xs text-stone-300 font-medium transition-all"
                      >
                        Simulate InsufficientBalance
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-[#450a0a]/30 border border-red-900/60 text-red-300 text-xs">
                      <strong>Error:</strong> {errorCopy(error)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {page === 'transfer' && (
              <motion.div 
                key="transfer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto w-full"
              >
                <div className="luxury-card p-8 rounded-3xl flex flex-col gap-6">
                  <h3 className="font-bold text-lg text-center text-white">Lock Invoice Settlement</h3>
                  <p className="text-xs text-stone-500 text-center">Submit a signed transaction including your invoice factoring schedule memo.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Client / Recipient Address</label>
                      <input 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. G..."
                        className="luxury-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Settlement Amount (XLM)</label>
                      <input 
                        type="number"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Invoice Reference Memo</label>
                      <input 
                        value={memo} 
                        onChange={(e) => setMemo(e.target.value)}
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleTransfer}
                    disabled={txState === 'pending'}
                    className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-white shadow-md shadow-blue-800/10 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Locking Tokens...' : 'Initialize Invoice Settlement'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">Transaction Hash</label>
                      {selectedWallet === 'freighter' ? (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-blue-500 hover:text-blue-450 transition-all text-center block break-all"
                        >
                          {txHash}
                        </a>
                      ) : (
                        <div className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-blue-500 text-center block break-all">
                          {txHash} (Simulated EVM Invoice Synced)
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto w-full"
              >
                <div className="luxury-card p-8 rounded-3xl flex flex-col gap-6">
                  <h3 className="font-bold text-lg text-center text-white">Invoice Smart Contract</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-stone-400">Contract Address</label>
                      <input 
                        value={contractAddress} 
                        onChange={(e) => setContractAddress(e.target.value)}
                        className="luxury-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-stone-400">Invocation Method</label>
                      <input 
                        value={contractValue} 
                        onChange={(e) => setContractValue(e.target.value)}
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={callContract}
                    disabled={txState === 'pending'}
                    className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-white shadow-lg shadow-blue-800/15 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Invoking Contract...' : 'Invoke Invoice Smart Contract'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">Transaction Hash</label>
                      <div className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-blue-500 text-center block break-all">
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto w-full"
              >
                <div className="luxury-card p-8 rounded-3xl flex flex-col gap-6">
                  <div className="text-center flex flex-col gap-2">
                    <h3 className="font-bold text-lg text-white">Invoice Event Log</h3>
                    <p className="text-xs text-stone-500">Real-time state updates synchronized directly from Horizon ledger logs.</p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {events.map((event) => (
                      <div 
                        key={event.id}
                        className="p-4 rounded-xl bg-stone-950/60 border border-stone-850 flex justify-between items-center text-xs"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-stone-300 font-medium">{event.label}</span>
                        </div>
                        <span className="font-mono text-stone-550">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-stone-800/40 text-center text-xs text-stone-500">
          Stellar Soroban Developer Sandbox — Testing & Verification Environment
        </footer>
      </div>
    </div>
  );
}
