import { isConnected, getAddress, setAllowed, requestAccess, getPublicKey, signTransaction } from '@stellar/freighter-api';

export type WalletState = 'idle' | 'connecting' | 'connected' | 'rejected' | 'not_found';

/**
 * Explicitly requests wallet permission from Freighter extension using setAllowed and requestAccess.
 */
export async function requestWalletPermissions(): Promise<void> {
  await setAllowed();
  await requestAccess();
}

/**
 * Retrieves the connected wallet public key via getAddress or getPublicKey.
 */
export async function retrieveWalletAddress(): Promise<string> {
  const addressObj = await getAddress();
  let key = typeof addressObj === 'string' ? addressObj : (addressObj as any)?.address || (addressObj as any)?.publicKey || '';
  if (!key) {
    const pubKeyObj = await getPublicKey();
    key = typeof pubKeyObj === 'string' ? pubKeyObj : (pubKeyObj as any)?.publicKey || (pubKeyObj as any)?.address || '';
  }
  return key;
}

/**
 * Connects Freighter by explicitly executing permission requests, address retrieval, and state validation.
 */
export async function connectFreighter(): Promise<{ publicKey: string; state: WalletState }> {
  try {
    const connectedResult = await isConnected();
    const installed = typeof connectedResult === 'boolean' ? connectedResult : Boolean((connectedResult as any)?.isConnected || (connectedResult as any)?.isAvailable);
    
    if (!installed) {
      throw new Error('Freighter wallet extension not detected. Please install Freighter.');
    }

    // Explicitly request permissions via setAllowed & requestAccess
    await requestWalletPermissions().catch(() => {});

    // Explicitly retrieve public address
    const publicKey = await retrieveWalletAddress();
    
    if (!publicKey) {
      throw new Error('Wallet connection rejected.');
    }

    return { publicKey, state: 'connected' };
  } catch (error: any) {
    throw new Error(error?.message || 'Wallet connection rejected.');
  }
}

export { setAllowed, requestAccess, getAddress, getPublicKey, signTransaction };
