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
  const f = FreighterApi as any;

  // Step 1: silently request permission - ignore any errors here
  try { if (f.setAllowed) await f.setAllowed(); } catch {}
  try { if (f.requestAccess) await f.requestAccess(); } catch {}

  // Step 2: try every possible method to get the public key
  let key = '';

  try {
    if (f.getAddress) {
      const res = await f.getAddress();
      key = typeof res === 'string' ? res : (res?.address || res?.publicKey || '');
    }
  } catch {}

  if (!key) {
    try {
      if (f.getPublicKey) {
        const res = await f.getPublicKey();
        key = typeof res === 'string' ? res : (res?.publicKey || res?.address || '');
      }
    } catch {}
  }

  // Step 3: check for the Freighter extension object as last resort
  if (!key) {
    try {
      const win = window as any;
      const ext = win.freighter || win.FreighterApi;
      if (ext?.getPublicKey) {
        key = await ext.getPublicKey();
      } else if (ext?.getAddress) {
        const res = await ext.getAddress();
        key = typeof res === 'string' ? res : (res?.address || '');
      }
    } catch {}
  }

  if (key) {
    try { kit.setWallet('freighter'); } catch {}
    onWalletSelected('freighter', key);
  } else {
    onConnectionError(new Error('Could not retrieve wallet address. Please approve the Freighter popup and try again.'));
  }
}
