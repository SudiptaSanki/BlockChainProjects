import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
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
    const f = FreighterApi as any;
    
    // Explicitly request permissions like Level 1
    if (f.setAllowed) await f.setAllowed().catch(() => {});
    if (f.requestAccess) await f.requestAccess().catch(() => {});
    
    let key = '';
    if (f.getAddress) {
      const res = await f.getAddress();
      key = typeof res === 'string' ? res : res?.address || res?.publicKey || '';
    }
    if (!key && f.getPublicKey) {
      const res = await f.getPublicKey();
      key = typeof res === 'string' ? res : res?.publicKey || res?.address || '';
    }

    if (!key) {
      throw new Error('Wallet connection rejected');
    }

    kit.setWallet('freighter');
    onWalletSelected('freighter', key);
  } catch (e) {
    onConnectionError(e);
  }
}
