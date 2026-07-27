import * as FreighterApi from '@stellar/freighter-api';

export type WalletState = 'idle' | 'connecting' | 'connected' | 'rejected' | 'not_found';

export async function requestWalletPermissions(): Promise<void> {
  const f = FreighterApi as any;
  if (f.setAllowed) await f.setAllowed();
  if (f.requestAccess) await f.requestAccess();
}

export async function retrieveWalletAddress(): Promise<string> {
  const f = FreighterApi as any;
  let key = '';
  if (f.getAddress) {
    const res = await f.getAddress();
    key = typeof res === 'string' ? res : res?.address || res?.publicKey || '';
  }
  if (!key && f.getPublicKey) {
    const res = await f.getPublicKey();
    key = typeof res === 'string' ? res : res?.publicKey || res?.address || '';
  }
  return key;
}

export async function connectFreighter(): Promise<{ publicKey: string; state: WalletState }> {
  try {
    const f = FreighterApi as any;
    const connectedResult = f.isConnected ? await f.isConnected() : true;
    const installed = typeof connectedResult === 'boolean' ? connectedResult : Boolean(connectedResult?.isConnected || connectedResult?.isAvailable);
    
    if (!installed && !f.getAddress && !f.getPublicKey) {
      throw new Error('Freighter wallet extension not detected. Please install Freighter.');
    }

    await requestWalletPermissions().catch(() => {});
    const publicKey = await retrieveWalletAddress();
    
    if (!publicKey) {
      throw new Error('Wallet connection rejected.');
    }

    return { publicKey, state: 'connected' };
  } catch (error: any) {
    throw new Error(error?.message || 'Wallet connection rejected.');
  }
}
