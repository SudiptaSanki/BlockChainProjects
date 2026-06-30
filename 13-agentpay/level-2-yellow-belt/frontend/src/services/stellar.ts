import * as StellarSdk from '@stellar/stellar-sdk';

export const CONTRACT_ID = 'CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

export async function invokeContract(
  publicKey: string, 
  method: string, 
  signTransaction: (xdr: string) => Promise<string>
) {
  const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
  const rpcClient = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

  // 1. Get the source account
  const account = await horizon.loadAccount(publicKey);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // 2. Build the transaction
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100", // The Soroban RPC will calculate the actual fee during simulation
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method))
    .setTimeout(30)
    .build();

  // 3. Simulate the transaction
  const simulated = await rpcClient.simulateTransaction(tx);
  
  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error || 'Transaction simulation failed');
  }

  // 4. Assemble the transaction
  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulated).build();

  // 5. Sign the transaction
  const signedXdr = await signTransaction(assembledTx.toXDR());
  const signedTx = new StellarSdk.Transaction(signedXdr, NETWORK_PASSPHRASE);

  // 6. Send the transaction
  const sendResult = await rpcClient.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error('Transaction submission failed');
  }

  // 7. Poll for completion
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
