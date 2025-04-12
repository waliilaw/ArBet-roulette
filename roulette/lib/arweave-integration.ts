/**
 * Real Arweave integration for roulette game with AO support
 */

import Arweave from 'arweave';

// Initialize Arweave client
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

// Contract ID for the roulette game - this should be updated after deployment
const ROULETTE_CONTRACT_ID = process.env.NEXT_PUBLIC_ROULETTE_CONTRACT_ID || '';

// Add Arweave wallet type definition
declare global {
  interface Transaction {
    id?: string;
    owner?: string;
    tags: { name: string; value: string }[];
    target?: string;
    quantity?: string;
    reward?: string;
    data?: string | Uint8Array;
    addTag: (name: string, value: string) => void;
    [key: string]: any; // Allow for other properties from Arweave transactions
  }

  // Define wallet interface type to avoid duplication
  interface ArweaveWalletInterface {
    connect: (permissions: string[]) => Promise<void>;
    disconnect: () => Promise<void>;
    getActiveAddress: () => Promise<string>;
    sign: (transaction: Transaction) => Promise<Transaction>;
    dispatch: (transaction: Transaction) => Promise<{ id: string }>;
  }

  interface Window {
    arweaveWallet?: ArweaveWalletInterface;
  }
}

/**
 * Checks if Arweave wallet is installed
 * @returns Boolean indicating if any compatible wallet is available
 */
export function isArweaveWalletInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.arweaveWallet;
}

/**
 * Gets the active wallet interface
 * @returns The wallet interface or null if none available
 */
function getWalletInterface() {
  if (typeof window === 'undefined') return null;
  return window.arweaveWallet || null;
}

/**
 * Connects to Arweave wallet
 * @returns Connected wallet address
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  const wallet = getWalletInterface();
  if (!wallet) {
    throw new Error('WALLET_NOT_INSTALLED');
  }

  try {
    await wallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
    const address = await wallet.getActiveAddress();
    
    if (!address) {
      throw new Error('Failed to get wallet address');
    }

    console.log('Connected to Arweave wallet:', address);
    return address;
  } catch (error) {
    console.error('Error during wallet connection:', error);
    
    // If the error is user rejecting the connection, provide a clearer message
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Connection rejected by user');
      }
    }
    
    throw new Error('Failed to connect to Arweave wallet. Please try again.');
  }
}

/**
 * Disconnects from Arweave wallet
 */
export async function disconnectWallet(): Promise<void> {
  const wallet = getWalletInterface();
  if (!wallet) {
    throw new Error('Arweave wallet not available');
  }

  try {
    await wallet.disconnect();
    console.log('Wallet disconnected');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
}

/**
 * Places a bet using Arweave transaction
 * @param amount Bet amount in AR
 * @param betType Type of bet (e.g., 'red', 'black', 'straight', etc.)
 * @param betValue Value associated with the bet type (e.g., the number for a straight bet)
 * @returns Transaction ID and game ID
 */
export async function placeBet(
  amount: string,
  betType: string,
  betValue: number | string
): Promise<{ txId: string, gameId: string }> {
  const wallet = getWalletInterface();
  if (!wallet) {
    throw new Error('Arweave wallet not connected');
  }

  if (!ROULETTE_CONTRACT_ID) {
    throw new Error('Roulette contract ID not set');
  }

  try {
    // Create transaction
    const transaction = await arweave.createTransaction({
      target: ROULETTE_CONTRACT_ID,
      quantity: arweave.ar.arToWinston(amount),
      data: JSON.stringify({
        function: 'placeBet',
        betType,
        betValue,
        timestamp: Date.now()
      })
    });

    // Add tags
    transaction.addTag('App-Name', 'Roulette-Game');
    transaction.addTag('App-Version', '1.0.0');
    transaction.addTag('Contract', ROULETTE_CONTRACT_ID);
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('Action', 'placeBet');

    // Sign and post transaction
    await wallet.sign(transaction);
    const response = await wallet.dispatch(transaction);

    return {
      txId: response.id,
      gameId: response.id // Using transaction ID as game ID
    };
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
}

/**
 * Claims winnings using Arweave transaction
 * @param gameId Game ID
 * @param amount Win amount in AR
 * @param result Roulette result (number that came up)
 * @returns Transaction ID
 */
export async function claimWinnings(
  gameId: string, 
  amount: string, 
  result: number
): Promise<string> {
  const wallet = getWalletInterface();
  if (!wallet) {
    throw new Error('Arweave wallet not connected');
  }

  if (!ROULETTE_CONTRACT_ID) {
    throw new Error('Roulette contract ID not set');
  }

  try {
    // Create transaction
    const transaction = await arweave.createTransaction({
      target: ROULETTE_CONTRACT_ID,
      data: JSON.stringify({
        function: 'claimWinnings',
        gameId,
        result,
        amount,
        timestamp: Date.now()
      })
    });

    // Add tags
    transaction.addTag('App-Name', 'Roulette-Game');
    transaction.addTag('App-Version', '1.0.0');
    transaction.addTag('Contract', ROULETTE_CONTRACT_ID);
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('Action', 'claimWinnings');
    transaction.addTag('Game-ID', gameId);

    // Sign and post transaction
    await wallet.sign(transaction);
    const response = await wallet.dispatch(transaction);

    return response.id;
  } catch (error) {
    console.error('Error claiming winnings:', error);
    throw error;
  }
}

/**
 * Fetches user balance from Arweave
 * @param address Wallet address
 * @returns Balance in AR
 */
export async function fetchArweaveBalance(address: string): Promise<string> {
  try {
    const wallet = getWalletInterface();
    if (wallet) {
      const addressToCheck = address || await wallet.getActiveAddress();
      const winstonBalance = await arweave.wallets.getBalance(addressToCheck);
      const arBalance = arweave.ar.winstonToAr(winstonBalance);
      return arBalance;
    }
    return '0.0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0.0';
  }
} 