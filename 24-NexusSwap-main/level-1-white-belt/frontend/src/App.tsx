import { useState } from 'react';
import { connectFreighter } from './services/freighter';
import { fetchXlmBalance, submitPayment, FRIENDBOT_URL } from './services/stellar';

export default function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0.0000000');
  const [destination, setDestination] = useState('GBRPYHIL2CI3FNQ4BXLFMNDLFWPU2HY4LNSXYTWRAA36REDWBYV3P5BY');
  const [amount, setAmount] = useState('10');
  const [memo, setMemo] = useState('NexusSwap Action');
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'loading' | 'submitting' | 'success' | 'failure'>('idle');
  const [message, setMessage] = useState('NexusSwap: Decentralized Token Swap Portal ready.');
  const [txHash, setTxHash] = useState('');

  async function handleConnect() {
    setState('connecting');
    setMessage('Connecting to Freighter extension...');
    try {
      const res = await connectFreighter();
      setPublicKey(res.publicKey);
      setState('connected');
      setMessage('Wallet connected. Fetching XLM balance...');
      const bal = await fetchXlmBalance(res.publicKey);
      setBalance(bal);
      setMessage('Horizon Testnet balance synchronized.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Wallet connection failed.');
    }
  }

  function handleDisconnect() {
    setPublicKey('');
    setBalance('0.0000000');
    setTxHash('');
    setState('idle');
    setMessage('Wallet disconnected.');
  }

  async function handleRefreshBalance() {
    if (!publicKey) return setMessage('Please connect wallet first.');
    setState('loading');
    try {
      const bal = await fetchXlmBalance(publicKey);
      setBalance(bal);
      setState('connected');
      setMessage('XLM balance updated.');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Balance query failed.');
    }
  }

  async function handleFundFriendbot() {
    if (!publicKey) return setMessage('Please connect wallet first.');
    setState('loading');
    setMessage('Requesting Testnet XLM from Friendbot...');
    try {
      const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!res.ok) throw new Error('Friendbot funding failed.');
      const bal = await fetchXlmBalance(publicKey);
      setBalance(bal);
      setState('success');
      setMessage('Successfully funded 10,000 Testnet XLM!');
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Friendbot funding failed.');
    }
  }

  async function handleSubmitAction() {
    if (!publicKey) return setMessage('Please connect wallet first.');
    if (!destination || !amount) return setMessage('Destination and amount required.');
    setState('submitting');
    setTxHash('');
    setMessage('Submitting signed transaction to Stellar Testnet...');
    try {
      const hash = await submitPayment(publicKey, destination, amount, memo);
      setTxHash(hash);
      setState('success');
      setMessage('Transaction successfully confirmed on-chain!');
      const bal = await fetchXlmBalance(publicKey);
      setBalance(bal);
    } catch (error: any) {
      setState('failure');
      setMessage(error.message ?? 'Transaction submission failed.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center p-6 sm:p-12">
      <div className="max-w-3xl w-full flex flex-col gap-8">
        
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">NexusSwap: Decentralized Token Swap Portal</h1>
              <p className="text-xs text-slate-400 mt-1">Instant Cross-Asset Token Swaps</p>
            </div>
          </div>
          {!publicKey ? (
            <button
              onClick={handleConnect}
              disabled={state === 'connecting'}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50"
              style={{ backgroundColor: '#9333ea' }}
            >
              {state === 'connecting' ? 'Connecting...' : 'Connect Freighter'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto overflow-hidden">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono truncate max-w-full">
                {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold"
              >
                Disconnect
              </button>
            </div>
          )}
        </header>

        <div className={`p-4 rounded-xl text-sm border font-medium transition-all ${
          state === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
          state === 'failure' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' :
          state === 'connecting' || state === 'loading' || state === 'submitting' ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' :
          'bg-slate-900/50 border-slate-800 text-slate-300'
        }`}>
          <span>{message}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Native XLM Balance</span>
              <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                {balance} <span className="text-base font-normal text-slate-400">XLM</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefreshBalance}
                disabled={!publicKey || state === 'loading'}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                onClick={handleFundFriendbot}
                disabled={!publicKey || state === 'loading'}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 disabled:opacity-50"
              >
                Fund Friendbot
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Network Target</span>
              <div className="text-lg font-bold text-slate-200 mt-2">Stellar Testnet</div>
              <p className="text-xs text-slate-400 mt-1">Horizon RPC: horizon-testnet.stellar.org</p>
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-2 mt-4 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Network Active
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white tracking-wide">Execute Asset Swap</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Destination Address</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (XLM)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Memo (Optional)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitAction}
              disabled={!publicKey || state === 'submitting'}
              className="mt-2 w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide disabled:opacity-50 transition-all shadow-lg"
              style={{ backgroundColor: '#9333ea' }}
            >
              {state === 'submitting' ? 'Signing & Submitting...' : 'Execute Asset Swap'}
            </button>
          </div>

          {txHash && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Transaction Hash Confirmed</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-300 hover:underline break-all"
              >
                {txHash}
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
