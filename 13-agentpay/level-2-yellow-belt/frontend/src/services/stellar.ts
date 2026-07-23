import * as StellarSdk from '@stellar/stellar-sdk';
import { kit } from './freighter';
import { Networks } from '@creit.tech/stellar-wallets-kit';

export const CONTRACT_ID = 'CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

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

  const signedResult = await kit.signTx({
    xdr: transaction.toXDR(),
    publicKey: publicKey,
    network: Networks.TESTNET,
  });

  const signedTxXdr = signedResult.signedTxXdr || signedResult.signedXDR || signedResult;
  const signedTransaction = new StellarSdk.Transaction(signedTxXdr, NETWORK_PASSPHRASE);
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

  const signedResult = await kit.signTx({
    xdr: assembledTx.toXDR(),
    publicKey: publicKey,
    network: Networks.TESTNET,
  });

  const signedTxXdr = signedResult.signedTxXdr || signedResult.signedXDR || signedResult;
  const signedTx = new StellarSdk.Transaction(signedTxXdr, NETWORK_PASSPHRASE);

  const sendResult = await rpcClient.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error('Transaction submission failed');
  }

  let statusResult = await rpcClient.getTransaction(sendResult.hash);
  while (statusResult.status === 'NOT_FOUND') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    statusResult = await rpcClient.getTransaction(sendResult.hash);
  }

  if (statusResult.status === 'FAILED') {
    throw new Error('Transaction failed on-chain');
  }

  return sendResult.hash;
}
