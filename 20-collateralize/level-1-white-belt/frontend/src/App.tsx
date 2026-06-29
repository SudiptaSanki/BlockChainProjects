import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "20-collateralize",
  "title": "Collateralize",
  "short": "Collateral",
  "useCase": "P2P Lending Collateral Vault",
  "audience": "Borrowers and Lenders",
  "primary": "#6366f1",
  "secondary": "#ec4899",
  "accent": "#f59e0b",
  "surface": "#0f172a",
  "action": "Lock Collateral Vault"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'Wallet Vault' },
  { id: 'send', label: 'Lock Collateral' },
  { id: 'activity', label: 'Transactions' },
] as const;

const checklist = [
  { title: 'Freighter Wallet Setup', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Stellar Testnet Integration', desc: 'Operating on secure Stellar Testnet blockchain.' },
  { title: 'Address & Balance Sync', desc: 'Fetch real-time XLM balances instantly from Horizon.' },
  { title: 'Signed Collateral Transfer', desc: 'Cryptographically lock assets via Freighter transaction signing.' },
];

type PageId = (typeof pages)[number]['id'];
type FlowState = 'idle' | 'connecting' | 'connected' | 'loading' | 'submitting' | 'success' | 'failure';

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

async function getFreighterPublicKey() {
  const freighter = await loadFreighter();
  const connectedResult = freighter.isConnected ? await freighter.isConnected() : true;
  const installed = Boolean(readValue(connectedResult, ['isConnected', 'isAvailable', 'result']));
  if (!installed && !freighter.getAddress && !freighter.getPublicKey) {
    throw new Error('Freighter wallet was not found. Please install the Freighter extension.');
  }

  if (freighter.setAllowed) await freighter.setAllowed();
  if (freighter.requestAccess) await freighter.requestAccess();

  const addressResult = freighter.getAddress ? await freighter.getAddress() : await freighter.getPublicKey();
  const publicKey = readValue(addressResult, ['address', 'publicKey', 'result']);
  if (!publicKey) throw new Error('Wallet connection was rejected.');
  return publicKey as string;
}

async function fetchNativeBalance(publicKey: string) {
  const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Account not funded. Use Friendbot on the Wallet page.' : 'Could not fetch balance from Horizon.');
  }
  const account = await response.json();
  const native = account.balances?.find((balance: any) => balance.asset_type === 'native');
  return native?.balance ?? '0.0000000';
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

export default function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('10');
  const [memo, setMemo] = useState(project.action);
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Freighter is idle.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Not connected';

  async function connectWallet() {
    setState('connecting');
    setMessage('Connecting to Freighter...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Loading native XLM balance...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('Balance loaded successfully.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Wallet connection failed.');
    }
  }

  function disconnectWallet() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxHash('');
    setState('idle');
    setMessage('Wallet disconnected.');
  }

  async function refreshBalance() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balance updated.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Failed to update balance.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    setState('loading');
    setMessage('Requesting 10,000 XLM from Friendbot...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Friendbot could not fund this account.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Account funded successfully!');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Funding failed.');
    }
  }

  async function lockCollateral() {
    if (!publicKey) return setMessage('Please connect Freighter first.');
    if (!destination || !amount) return setMessage('Enter a valid destination address and amount.');
    setState('submitting');
    setTxHash('');
    setMessage('Awaiting signature in Freighter...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage('Collateral locked successfully!');
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Transaction signing failed.');
      setPage('activity');
    }
  }

  return (
    <div className="min-height-screen relative overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Collateralize Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <div>
            <h1 className="font-bold text-xl leading-none tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {project.title}
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">White Belt MVP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                page === item.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={publicKey ? disconnectWallet : connectWallet}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            publicKey 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20'
          }`}
        >
          {publicKey ? shortKey : 'Connect Freighter'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
        
        {/* Status Toast */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border-l-4 border-l-indigo-500 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-sm font-medium text-slate-300">{message}</p>
              </div>
              {publicKey && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                  {balance} XLM
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab view */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-5 gap-8"
            >
              <div className="md:col-span-3 flex flex-col justify-center gap-6">
                <span className="text-xs uppercase tracking-wider text-pink-500 font-bold">Introduction</span>
                <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                  Smart Collateralization For Web3 Loans
                </h2>
                <p className="text-slate-400 leading-relaxed text-lg">
                  Instantly lock your XLM collateral into secure, trustless vaults to power peer-to-peer smart contract lending. Simple wallet connection, fast execution, and cryptographic certainty.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPage('wallet')}
                    className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300"
                  >
                    Setup Wallet
                  </button>
                  <button 
                    onClick={() => setPage('send')}
                    className="px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-slate-300 hover:text-white transition-all duration-300"
                  >
                    Lock Assets
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
                  <h3 className="font-bold text-lg text-slate-200">White Belt Milestones</h3>
                  <div className="flex flex-col gap-4">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-indigo-500/20">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-300 text-sm">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {page === 'wallet' && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-8 glow-primary">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold">Wallet Dashboard</h2>
                  <p className="text-sm text-slate-400">Connect and manage your Freighter testnet wallet.</p>
                </div>

                <div className="bg-slate-950/60 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm text-slate-400">Status</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      publicKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {publicKey ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm text-slate-400">Public Key</span>
                    <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded border border-white/5 text-slate-300">
                      {publicKey ? publicKey : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Native Balance</span>
                    <strong className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                      {balance} XLM
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {!publicKey ? (
                    <button 
                      onClick={connectWallet}
                      className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-300"
                    >
                      Connect Freighter
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={refreshBalance}
                        className="py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 font-semibold text-slate-300 hover:text-white transition-all duration-300"
                      >
                        Refresh Balance
                      </button>
                      <button 
                        onClick={fundWallet}
                        className="py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all duration-300 shadow-lg shadow-indigo-500/10"
                      >
                        Fund Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {page === 'send' && (
            <motion.div 
              key="send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6 glow-accent">
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-bold">Lock Collateral</h2>
                  <p className="text-sm text-slate-400">Lock XLM assets securely into the contract address.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-300">Destination Address</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. GD3R..."
                      className="glass-input px-4 py-3.5 rounded-xl text-slate-200 outline-none text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-300">Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="10"
                      className="glass-input px-4 py-3.5 rounded-xl text-slate-200 outline-none text-sm w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-300">Memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)} 
                      maxLength={28}
                      className="glass-input px-4 py-3.5 rounded-xl text-slate-200 outline-none text-sm w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={lockCollateral}
                  disabled={state === 'submitting'}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:opacity-90 font-bold text-white transition-all duration-300 shadow-lg shadow-pink-500/20 disabled:opacity-55"
                >
                  {state === 'submitting' ? 'Submitting Vault Tx...' : 'Lock Collateral on Testnet'}
                </button>
              </div>
            </motion.div>
          )}

          {page === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full"
            >
              <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-center">Transaction Feedback</h2>

                <div className="bg-slate-950/60 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                    state === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {state === 'success' ? '✓' : 'ℹ'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{state === 'success' ? 'Success' : 'Transaction Status'}</h3>
                    <p className="text-sm text-slate-400 mt-1">{message}</p>
                  </div>
                </div>

                {txHash && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-xs p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-indigo-400 hover:text-indigo-300 transition-all text-center block break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-600">
        © 2026 {project.title} - Stellar Soroban Hackathon Submission
      </footer>
    </div>
  );
}
