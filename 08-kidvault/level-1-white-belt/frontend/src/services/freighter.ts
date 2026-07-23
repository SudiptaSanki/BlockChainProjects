import { isConnected, getAddress, setAllowed, requestAccess } from '@stellar/freighter-api';

export type WalletState = 'idle' | 'connecting' | 'connected' | 'rejected' | 'not_found';

export async function connectFreighter(): Promise<{ publicKey: string; state: WalletState }> {
  try {
    const connectedResult = await isConnected();
    const installed = typeof connectedResult === 'boolean' ? connectedResult : Boolean((connectedResult as any)?.isConnected || (connectedResult as any)?.isAvailable);
    
    if (!installed) {
      throw new Error('Freighter wallet extension not detected. Please install Freighter.');
    }

    try {
      await setAllowed();
    } catch (_) {}

    try {
      await requestAccess();
    } catch (_) {}

    const addressResult = await getAddress();
    const publicKey = typeof addressResult === 'string' ? addressResult : (addressResult as any)?.address || (addressResult as any)?.publicKey || (addressResult as any)?.result || '';
    
    if (!publicKey) {
      throw new Error('Wallet connection rejected.');
    }

    return { publicKey, state: 'connected' };
  } catch (error: any) {
    throw new Error(error?.message || 'Wallet connection rejected.');
  }
}
