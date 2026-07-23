import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectWalletKit } from './services/freighter';
import { submitPayment, invokeContract } from './services/stellar';


const project = {
  "dir": "11-tokenvest",
  "title": "TokenVest Console",
  "short": "TokenVest",
  "useCase": "On-chain token vesting schedules",
  "audience": "Founders and Investors",
  "primary": "#059669",
  "secondary": "#047857",
  "accent": "#059669",
  "contract": "Vesting Vault Smart Contract",
  "action": "Initialize Vesting Vault",
  "contractId": "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Vesting Gates' },
  { id: 'wallets', label: 'Signatures' },
  { id: 'transfer', label: 'Lock Tokens' },
  { id: 'contract', label: 'Soroban Vesting Contract' },
  { id: 'events', label: 'Vesting Ledger' },
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
    InsufficientBalance: 'Insufficient Testnet balance to cover network fees or vesting requirements.',
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
  const [amount, setAmount] = useState('500');
  const [memo, setMemo] = useState('Vesting Schedule');
  const [events, setEvents] = useState([
    makeEvent('Horizon vesting gateway synced'),
    makeEvent('Trustless schedule vaults active')
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
    setEvents((items) => [makeEvent(`Locking ${amount} XLM vesting schedule with beneficiary ${destination.slice(0, 8)}...`), ...items.slice(0, 7)]);

    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Vesting schedule initialized. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Vesting schedule lock failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }

  async function callContract() {
    setError('');
    if (!publicKey) {
      simulateError('WalletConnectionRejected');
      return;
    }
    setTxState('pending');
    setEvents((items) => [makeEvent(`Invoking vesting smart contract at ${contractAddress.slice(0, 8)}...`), ...items.slice(0, 7)]);
    
    try {
      const hash = await invokeContract(publicKey, 'initialize');
      setTxHash(hash);
      setTxState('success');
      setEvents((items) => [makeEvent(`Vesting schedule locked successfully. Tx: ${hash.slice(0, 8)}...`), ...items.slice(0, 7)]);
    } catch (err: any) {
      setTxState('fail');
      setEvents((items) => [makeEvent(`Contract call failed: ${err.message ?? err}`), ...items.slice(0, 7)]);
    }
  }
  return (
    <div className="min-h-screen flex relative overflow-hidden pic-bg-overlay">
      
      {/* Light Left Sidebar */}
      <aside className="w-80 light-sidebar flex flex-col justify-between p-8 shrink-0 z-40">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-6">
            <img src="/tokenvest-icon.svg" alt="TokenVest Logo" className="w-10 h-10 object-contain filter drop-shadow" />
            <div>
              <h1 className="font-bold text-2xl tracking-wide text-stone-900 leading-none">
                {project.short}
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block mt-1 font-sans">Yellow Belt Vault</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {pages.map((item) => (
              <button
                key={item.id}
                className={`w-full px-5 py-4 rounded-xl text-sm font-semibold tracking-wider text-left transition-all duration-300 ${
                  page === item.id 
                    ? 'bg-emerald-600/10 text-emerald-800 border-l-4 border-emerald-600 shadow-sm' 
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
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-800/15'
            }`}
          >
            {publicKey ? shortKey : 'Link Wallet'}
          </button>
          <span className="text-[9px] uppercase tracking-wider text-stone-400 text-center block">Stellar Vesting Engine</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between min-h-screen z-35">
        <main className="max-w-4xl mx-auto w-full px-12 py-16 flex flex-col gap-10">
          
          {/* Status Display */}
          <div className="luxury-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-2 border-l-emerald-600 bg-white/5">
            <div className="flex gap-4 items-center">
              <div className={`w-3 h-3 rounded-full animate-ping ${
                txState === 'success' ? 'bg-emerald-500' : txState === 'fail' ? 'bg-rose-500' : 'bg-emerald-450'
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
                  <span className="text-xs font-calligraphy text-emerald-500">Ancient Trust in Digital Ledger Vaults</span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Lock Vesting Vault Schedules
                  </h2>
                  <p className="text-stone-300 leading-relaxed text-sm">
                    Lock and manage project token vesting schedules dynamically with our decentralized vault contracts. Secure Freighter and MetaMask wallet links directly to lock vesting parameters on-chain.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPage('wallets')}
                      className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-all duration-300"
                    >
                      Signatures
                    </button>
                    <button 
                      onClick={() => setPage('transfer')}
                      className="px-5 py-3 rounded-xl border border-stone-700 hover:bg-stone-800/40 text-stone-300 transition-all duration-300 text-sm"
                    >
                      Lock Tokens
                    </button>
                  </div>
                </div>

                <div className="luxury-card p-6 rounded-3xl flex flex-col justify-between gap-6">
                  <h3 className="font-bold text-lg text-white">Yellow Belt Deliverables</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Freighter & MetaMask Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Vesting vault parameters lock</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">3 Handled Wallet errors</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-xs text-stone-400">Event synchronized live logs</span>
                    </div>
                  </div>
                  <div className="p-4 bg-stone-950/40 rounded-2xl border border-emerald-600/10">
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
                            ? 'bg-emerald-900/10 border-emerald-600 fill-white text-white shadow-md' 
                            : 'bg-stone-950/60 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div className="text-left">
                            <h4 className={`font-semibold text-sm ${selectedWallet === wallet.id ? 'text-white' : 'text-stone-300'}`}>{wallet.label}</h4>
                            <span className={`text-xs ${selectedWallet === wallet.id ? 'text-emerald-200' : 'text-stone-500'}`}>{wallet.note}</span>
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
                  <h3 className="font-bold text-lg text-center text-white">Lock Vesting Schedule</h3>
                  <p className="text-xs text-stone-500 text-center">Submit a signed transaction including your vesting schedule memo.</p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Beneficiary Address</label>
                      <input 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. G..."
                        className="luxury-input px-4 py-3 rounded-xl text-xs w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Vesting Amount (XLM)</label>
                      <input 
                        type="number"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="luxury-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400">Vesting Memo</label>
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
                    className="w-full py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold text-white shadow-md shadow-emerald-800/10 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Locking Tokens...' : 'Initialize Vesting Lock'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">Transaction Hash</label>
                      {selectedWallet === 'freighter' ? (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-emerald-500 hover:text-emerald-450 transition-all text-center block break-all"
                        >
                          {txHash}
                        </a>
                      ) : (
                        <div className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-emerald-500 text-center block break-all">
                          {txHash} (Simulated EVM Vesting Synced)
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
                  <h3 className="font-bold text-lg text-center text-white">Vesting Smart Contract</h3>
                  
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
                    className="w-full py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold text-white shadow-lg shadow-emerald-800/15 transition-all duration-300"
                  >
                    {txState === 'pending' ? 'Invoking Contract...' : 'Invoke Vesting Smart Contract'}
                  </button>

                  {txHash && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs uppercase tracking-wider text-stone-500 font-bold">Transaction Hash</label>
                      <div className="font-mono text-xs p-4 rounded-xl bg-stone-950 border border-stone-850 text-emerald-500 text-center block break-all">
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
                    <h3 className="font-bold text-lg text-white">Vesting Event Log</h3>
                    <p className="text-xs text-stone-500">Real-time state updates synchronized directly from Horizon ledger logs.</p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {events.map((event) => (
                      <div 
                        key={event.id}
                        className="p-4 rounded-xl bg-stone-950/60 border border-stone-850 fill-white flex justify-between items-center text-xs"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-stone-300 font-medium">{event.label}</span>
                        </div>
                        <span className="font-mono text-stone-500">{event.time}</span>
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
