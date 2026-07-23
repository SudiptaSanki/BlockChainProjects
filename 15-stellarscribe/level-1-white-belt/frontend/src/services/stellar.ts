import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

export const STELLAR_NETWORK = 'TESTNET';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

export async function fetchXlmBalance(publicKey: string): Promise<string> {
  const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Vault account not funded. Run Friendbot activation.' : 'Could not query balance.');
  }
  const account = await response.json();
  const native = account.balances?.find((balance: any) => balance.asset_type === 'native');
  return native?.balance ?? '0.0000000';
}

export async function submitPayment(publicKey: string, destination: string, amount: string, memo: string): Promise<string> {
  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const source = await server.loadAccount(publicKey);
  const fee = String(await server.fetchBaseFee());
  
  const builder = new StellarSdk.TransactionBuilder(source, {
    fee,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  }).addOperation(
    StellarSdk.Operation.payment({
      destination: destination.trim(),
      asset: StellarSdk.Asset.native(),
      amount: amount.trim(),
    })
  );

  if (memo && memo.trim()) {
    builder.addMemo(StellarSdk.Memo.text(memo.trim().slice(0, 28)));
  }

  const transaction = builder.setTimeout(60).build();
  const xdr = transaction.toXDR();

  // Mandatory Step 3: Unconditional Freighter transaction signing
  const signedResult = await signTransaction(xdr, {
    networkPassphrase: StellarSdk.Networks.TESTNET,
    network: 'TESTNET',
    accountToSign: publicKey,
  });

  const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any)?.signedTxXdr || (signedResult as any)?.signedXDR || (signedResult as any)?.result;
  if (!signedXdr) {
    throw new Error('Freighter transaction signing failed: No signed XDR returned.');
  }

  const signedTransaction = new StellarSdk.Transaction(signedXdr, StellarSdk.Networks.TESTNET);
  const submitted = await server.submitTransaction(signedTransaction);
  return submitted.hash;
}
