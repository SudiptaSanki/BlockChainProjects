import * as StellarSdk from '@stellar/stellar-sdk';
import * as FreighterApi from '@stellar/freighter-api';

export const CONTRACT_ID = 'CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

async function signWithFreighter(xdr: string, publicKey: string): Promise<string> {
  const f = FreighterApi as any;
  // Use same pattern as Level 1 which is proven to work
  const signFn = f.signTransaction || f.signTx;
  if (!signFn) {
    throw new Error('Freighter signTransaction not available.');
  }
  const result = await signFn(xdr, {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    network: 'TESTNET',
    accountToSign: publicKey,
  });
  const signed = typeof result === 'string' ? result : result?.signedTxXdr || result?.signedXDR || result?.result;
  if (!signed) throw new Error('Freighter transaction signing failed.');
  return signed;
}

export async function submitPayment(publicKey: string, destination: string, amount: string, memo: string) {
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const source = await server.loadAccount(publicKey);
  const fee = String(await server.fetchBaseFee());

  const builder = new StellarSdk.TransactionBuilder(source, {
    fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: destination.trim(),
      asset: StellarSdk.Asset.native(),
      amount: amount.trim(),
    }));

  if (memo.trim()) {
    builder.addMemo(StellarSdk.Memo.text(memo.trim().slice(0, 28)));
  }

  const transaction = builder.setTimeout(60).build();
  const signedXdr = await signWithFreighter(transaction.toXDR(), publicKey);
  const signedTransaction = new StellarSdk.Transaction(signedXdr, NETWORK_PASSPHRASE);
  const submitted = await server.submitTransaction(signedTransaction);
  return submitted.hash;
}

export async function invokeContract(
  publicKey: string,
  method: string
) {
  const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
  const rpcClient = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

  const account = await horizon.loadAccount(publicKey);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method))
    .setTimeout(30)
    .build();

  const simulated = await rpcClient.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error || 'Transaction simulation failed');
  }

  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulated).build();
  const signedXdr = await signWithFreighter(assembledTx.toXDR(), publicKey);
  const signedTx = new StellarSdk.Transaction(signedXdr, NETWORK_PASSPHRASE);

  const sendResult = await rpcClient.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error('Transaction submission failed');
  }

  let statusResult = await rpcClient.getTransaction(sendResult.hash);
  let attempts = 0;
  while (statusResult.status === 'NOT_FOUND' && attempts < 15) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    statusResult = await rpcClient.getTransaction(sendResult.hash);
    attempts++;
  }

  if (statusResult.status === 'FAILED') {
    throw new Error('Transaction failed on-chain');
  }

  return sendResult.hash;
}
