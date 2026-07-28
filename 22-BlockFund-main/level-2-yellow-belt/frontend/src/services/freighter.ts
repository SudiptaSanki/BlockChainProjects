import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import * as FreighterApi from '@stellar/freighter-api';

export const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
});

export async function connectWalletKit(
  onWalletSelected: (walletId: string, publicKey: string) => void,
  onConnectionError: (err: any) => void
) {
  try {
    // Try native Freighter API first for direct instant connection
    const f = FreighterApi as any;
    if (f.setAllowed) await f.setAllowed().catch(() => {});
    if (f.requestAccess) await f.requestAccess().catch(() => {});
    
    let key = '';
    if (f.getAddress) {
      const res = await f.getAddress().catch(() => {});
      key = typeof res === 'string' ? res : res?.address || res?.publicKey || '';
    }
    if (!key && f.getPublicKey) {
      const res = await f.getPublicKey().catch(() => {});
      key = typeof res === 'string' ? res : res?.publicKey || res?.address || '';
    }

    if (key) {
      onWalletSelected('freighter', key);
      return;
    }

    // Fallback to StellarWalletsKit Modal
    await kit.openModal({
      onWalletSelected: async (option: any) => {
        try {
          kit.setWallet(option.id);
          const publicKey = await kit.getPublicKey();
          onWalletSelected(option.id, publicKey);
        } catch (e) {
          onConnectionError(e);
        }
      },
    });
  } catch (e) {
    onConnectionError(e);
  }
}
