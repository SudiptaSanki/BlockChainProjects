import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';

export const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
});

export async function connectWalletKit(
  onWalletSelected: (walletId: string, publicKey: string) => void,
  onConnectionError: (err: any) => void
) {
  try {
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
