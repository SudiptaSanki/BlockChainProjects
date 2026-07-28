import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import * as FreighterApi from '@stellar/freighter-api';

export const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [new FreighterModule()],
});

export async function connectWalletKit(
  onWalletSelected: (walletId: string, publicKey: string) => void,
  onConnectionError: (err: any) => void
) {
  try {
    kit.setWallet('freighter');
    const publicKey = await kit.getPublicKey();
    onWalletSelected('freighter', publicKey);
  } catch (e) {
    onConnectionError(e);
  }
}
