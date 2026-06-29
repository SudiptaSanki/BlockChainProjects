import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const project = {
  "dir": "16-ecofund",
  "title": "EcoFund",
  "short": "EcoFund",
  "useCase": "Carbon Credit Retirement Pool",
  "audience": "Climate Contributors",
  "primary": "#22c55e",
  "secondary": "#10b981",
  "surface": "#05110e",
  "action": "Retire Carbon Credit"
};

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const pages = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'wallet', label: 'Wallet Hub' },
  { id: 'send', label: 'Retire Credits' },
  { id: 'activity', label: 'Audit Trail' },
] as const;

const checklist = [
  { title: 'Freighter Wallet Access', desc: 'Secure connection via Freighter browser extension.' },
  { title: 'Testnet Ledger Node', desc: 'Query and sync offset metrics from Horizon Testnet.' },
  { title: 'Fund & Balance Tracker', desc: 'Real-time XLM balance fetch.' },
  { title: 'On-chain Credit Retirement', desc: 'Permanently lock credit retirements via payment transactions.' },
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
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('Carbon Offset');
  const [state, setState] = useState<FlowState>('idle');
  const [message, setMessage] = useState('Stellar eco-bridge is offline.');
  const [txHash, setTxHash] = useState('');

  const shortKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'Disconnected';
  const carbonOffsetCo2 = (Number(amount) * 0.12).toFixed(2); // Mock CO2 offset calculation: 1 XLM = 0.12 tonnes CO2

  async function connectWallet() {
    setState('connecting');
    setMessage('Opening Freighter wallet portal...');
    try {
      const key = await getFreighterPublicKey();
      setPublicKey(key);
      setState('connected');
      setMessage('Synced. Querying available balance...');
      const nextBalance = await fetchNativeBalance(key);
      setBalance(nextBalance);
      setMessage('XLM balances synchronized successfully.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Handshake rejected.');
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
    if (!publicKey) return setMessage('Connect Freighter first.');
    setState('loading');
    try {
      setBalance(await fetchNativeBalance(publicKey));
      setState('connected');
      setMessage('Balance refreshed.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Refresh failed.');
    }
  }

  async function fundWallet() {
    if (!publicKey) return setMessage('Connect Freighter first.');
    setState('loading');
    setMessage('Requesting assets from Friendbot...');
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error('Activation failed.');
      setBalance(await fetchNativeBalance(publicKey));
      setState('success');
      setMessage('Activated: 10K XLM added to wallet.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Activation failed.');
    }
  }

  async function executeRetirement() {
    if (!publicKey) return setMessage('Connect Freighter first.');
    if (!destination || !amount) return setMessage('Offset vault and retirement amount required.');
    setState('submitting');
    setTxHash('');
    setMessage('Waiting for cryptographic offset authorization...');
    try {
      const hash = await submitPayment(publicKey, destination.trim(), amount.trim(), memo);
      setTxHash(hash);
      setState('success');
      setMessage(`Carbon credit retired successfully! Offsetted ${carbonOffsetCo2} tonnes of CO2.`);
      setBalance(await fetchNativeBalance(publicKey));
      setPage('activity');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Authorization rejected.');
      setPage('activity');
    }
  }

  return (
    <div className="min-h-screen bg-[#05110e] text-emerald-50 flex flex-col justify-between relative overflow-hidden eco-grid">
      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-eco-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[#05110e]/90">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="EcoFund Logo" className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <div>
            <h1 className="font-bold text-lg leading-none tracking-wider text-emerald-400 font-heading">
              {project.title.toUpperCase()}
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-teal-400 font-bold font-mono">White Belt MVP</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-emerald-950/40 p-1 border border-emerald-500/10">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-heading transition-all duration-200 ${
                page === item.id 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                  : 'text-emerald-300/60 hover:text-emerald-250 hover:bg-emerald-500/5'
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={publicKey ? disconnectWallet : connectWallet}
          className={`px-4 py-2.5 border font-semibold text-xs tracking-wider uppercase transition-all duration-200 ${
            publicKey 
              ? 'border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/15' 
              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 shadow-lg shadow-emerald-500/5'
          }`}
        >
          {publicKey ? shortKey : 'CONNECT WALLET'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-8 z-30">
        
        {/* Status log */}
        <div className="glass-eco-card p-4 rounded-xl flex items-center justify-between gap-4 border-l-2 border-l-emerald-500 shadow-md">
          <div className="flex items-center gap-3 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs text-emerald-300/80 font-heading uppercase">Console: <span className="normal-case text-emerald-300 ml-1 font-bold">{message}</span></p>
          </div>
          {publicKey && (
            <div className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {balance} XLM
            </div>
          )}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-5 gap-8"
            >
              <div className="md:col-span-3 flex flex-col justify-center gap-6">
                <span className="text-xs uppercase tracking-widest text-teal-400 font-bold font-mono">Decentralized Green Finance</span>
                <h2 className="text-3xl font-extrabold tracking-wider text-emerald-100 uppercase font-heading leading-tight eco-glow-text">
                  Permanently Retire Carbon Credits
                </h2>
                <p className="text-emerald-350 leading-relaxed text-sm">
                  EcoFund provides on-chain climate finance rails on Stellar. Securely retire carbon credits by locking XLM offsets to claim verified ecological impact certificates.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPage('wallet')}
                    className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-heading uppercase tracking-wider transition-all"
                  >
                    Open Wallet
                  </button>
                  <button 
                    onClick={() => setPage('send')}
                    className="px-5 py-3 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-300 hover:text-emerald-400 text-xs font-bold font-heading uppercase tracking-wider transition-all"
                  >
                    Retire Offset
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="glass-eco-card p-6 rounded-xl flex flex-col gap-6">
                  <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-widest font-heading">Milestones</h3>
                  <div className="flex flex-col gap-4 font-mono">
                    {checklist.map((item, index) => (
                      <div className="flex gap-4 items-start" key={index}>
                        <div className="w-5 h-5 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-emerald-500/30">
                          0{index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-200 text-xs uppercase font-heading">{item.title}</h4>
                          <p className="text-[10px] text-emerald-455 mt-0.5">{item.desc}</p>
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="glass-eco-card p-8 rounded-xl flex flex-col gap-6">
                <div className="text-center flex flex-col gap-2 font-heading">
                  <h2 className="text-2xl font-bold uppercase tracking-wider">Climate Wallet Hub</h2>
                  <p className="text-xs text-emerald-500">Configure connection to Freighter.</p>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/10 p-6 rounded-lg flex flex-col gap-4 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-emerald-950/50 pb-3">
                    <span className="text-emerald-500 font-heading uppercase">Connection Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider ${
                      publicKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {publicKey ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-950/50 pb-3">
                    <span className="text-emerald-500 font-heading uppercase">Climate Address</span>
                    <span className="text-[10px] font-mono bg-emerald-950/60 px-2 py-1 border border-emerald-900/50 text-emerald-300 truncate max-w-[150px]">
                      {publicKey ? publicKey : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-heading uppercase">Offset Assets</span>
                    <strong className="text-sm font-bold text-emerald-400">
                      {balance} XLM
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3 font-heading">
                  {!publicKey ? (
                    <button 
                      onClick={connectWallet}
                      className="w-full py-3.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10"
                    >
                      OPEN WALLET TUNNEL
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={refreshBalance}
                        className="py-3.5 border border-slate-700 hover:border-emerald-500/30 font-bold text-emerald-300 hover:text-emerald-400 text-xs tracking-wider uppercase transition-all"
                      >
                        REFRESH
                      </button>
                      <button 
                        onClick={fundWallet}
                        className="py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs tracking-wider uppercase transition-all"
                      >
                        ACTIVATE NODE
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="glass-eco-card p-8 rounded-xl flex flex-col gap-6">
                <div className="text-center flex flex-col gap-2 font-heading">
                  <h2 className="text-2xl font-bold uppercase tracking-wider">Retire Carbon Credits</h2>
                  <p className="text-xs text-emerald-500">Submit payment to permanently burn credits in the carbon vault.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase font-heading tracking-wider">Retirement Vault Address</label>
                    <input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. G..."
                      className="eco-input px-4 py-3 rounded-lg text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase font-heading tracking-wider">Offset Amount (XLM)</label>
                    <input 
                      type="number"
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="eco-input px-4 py-3 rounded-lg text-xs w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase font-heading tracking-wider">Reference Memo</label>
                    <input 
                      value={memo} 
                      onChange={(e) => setMemo(e.target.value)} 
                      maxLength={28}
                      className="eco-input px-4 py-3 rounded-lg text-xs w-full"
                    />
                  </div>

                  {Number(amount) > 0 && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-xs rounded-lg font-mono text-emerald-300 text-center">
                      Estimated Carbon Retired: <strong>{carbonOffsetCo2} tonnes CO₂</strong>
                    </div>
                  )}
                </div>

                <button 
                  onClick={executeRetirement}
                  disabled={state === 'submitting'}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 font-heading"
                >
                  {state === 'submitting' ? 'RETIRING CREDITS...' : 'RETIRE CREDITS ON TESTNET'}
                </button>
              </div>
            </motion.div>
          )}

          {page === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="glass-eco-card p-8 rounded-xl flex flex-col gap-6">
                <h2 className="text-2xl font-bold font-heading text-center uppercase tracking-wider">Retirement Audit Log</h2>

                <div className="bg-emerald-950/60 border border-emerald-500/10 p-6 rounded-lg flex flex-col gap-4 text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold ${
                    state === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {state === 'success' ? '✔' : 'i'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase font-heading">{state === 'success' ? 'Credits Retired' : 'Console logs'}</h3>
                    <p className="text-xs text-emerald-450 mt-1 font-mono">{message}</p>
                  </div>
                </div>

                {txHash && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Horizon Ledger Hash</label>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-[10px] p-4 rounded-lg bg-slate-950 hover:bg-slate-900 border border-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-all text-center block break-all"
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
      <footer className="py-6 border-t border-emerald-950/30 text-center text-[10px] text-emerald-600 font-heading uppercase tracking-widest">
        © 2026 {project.title.toUpperCase()} - Carbon Offset Bridge
      </footer>
    </div>
  );
}
