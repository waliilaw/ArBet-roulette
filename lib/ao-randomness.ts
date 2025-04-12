/**
 * This file contains the AO process integration for randomness in the roulette game
 */

import { createDataItemSigner, message } from '@permaweb/aoconnect';
import { ROULETTE_NUMBERS } from "./utils"

// Get the AO Process ID from environment variables
const AO_PROCESS_ID = process.env.NEXT_PUBLIC_AO_PROCESS_ID;

// Type definitions for wallet interfaces
interface ArweaveWalletInterface {
  connect: (permissions: string[]) => Promise<void>;
  disconnect: () => Promise<void>;
  getActiveAddress: () => Promise<string>;
  sign: (transaction: any) => Promise<any>;
  dispatch: (transaction: any) => Promise<{ id: string }>;
}

// Add type declaration for window
declare global {
  interface Window {
    wander?: ArweaveWalletInterface;
    arweaveWallet: ArweaveWalletInterface;
  }
}

/**
 * Generates a random roulette result using AO process
 * @returns Random roulette number
 */
export async function generateRouletteResult(): Promise<number> {
  // If no process ID is configured, fall back to local randomness
  if (!AO_PROCESS_ID) {
    console.warn('AO_PROCESS_ID not configured. Using local randomness as fallback.');
    return generateLocalRandomness();
  }

  console.log(`Requesting randomness from AO process (ID: ${AO_PROCESS_ID})...`);

  try {
    // Get wallet interface for signing (if available)
    const wallet = typeof window !== 'undefined' ? 
      (window.wander || window.arweaveWallet) : null;
    
    if (!wallet) {
      console.warn('No wallet detected for signing AO messages. This may affect functionality.');
    } else {
      console.log('Wallet found for signing AO messages.');
    }
    
    // Create a data item signer if we have a wallet
    const signer = wallet ? createDataItemSigner(wallet) : undefined;
    
    // Generate a unique game ID
    const gameId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
    console.log(`Generated game ID: ${gameId}`);
    
    // Prepare the message to the AO process
    const result = await message({
      process: AO_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'GetRandomness' },
        { name: 'Type', value: 'Roulette' },
        { name: 'GameId', value: gameId }
      ],
      signer
    });

    console.log('Received response from AO process:', result);

    // Parse the response - we need to handle different response formats
    let responseData;
    try {
      // First try treating it as a string response
      if (typeof result === 'string') {
        responseData = JSON.parse(result);
        console.log('Parsed string response:', responseData);
      }
      // Then try accessing the first message if it's an object with Messages array
      else if (result && typeof result === 'object') {
        // Use type assertion to bypass TypeScript's strict checking
        const resultObj = result as any;
        if (resultObj.Messages && Array.isArray(resultObj.Messages) && resultObj.Messages.length > 0) {
          responseData = JSON.parse(resultObj.Messages[0].Data);
          console.log('Parsed Messages[0].Data response:', responseData);
        }
      }
      
      if (!responseData || !responseData.success) {
        throw new Error((responseData && responseData.error) || 'Failed to get randomness from AO process');
      }
      
      // The AO process should return a single number for roulette
      if (responseData.number !== undefined && ROULETTE_NUMBERS.includes(responseData.number)) {
        console.log(`Successfully obtained randomness from AO process. Result: ${responseData.number}`);
        return responseData.number;
      } else if (responseData.positions && Array.isArray(responseData.positions) && responseData.positions.length > 0) {
        // If we get positions array instead, use the first one as an index
        const index = responseData.positions[0] % ROULETTE_NUMBERS.length;
        const number = ROULETTE_NUMBERS[index];
        console.log(`Converted position to roulette number: ${number}`);
        return number;
      } else {
        throw new Error('Invalid response format from AO process for roulette game');
      }
    } catch (parseError) {
      console.error('Error parsing AO process response:', parseError);
      throw new Error('Invalid response from AO process');
    }
  } catch (error) {
    console.error('Error getting randomness from AO process:', error);
    
    // Fall back to local randomness if AO process call fails
    console.warn('Falling back to local randomness due to AO process error');
    return generateLocalRandomness();
  }
}

/**
 * Generates a random roulette result locally (fallback method)
 * @returns Random roulette number
 */
function generateLocalRandomness(): number {
  console.log(`Using local randomness fallback for roulette game.`);
  
  // Use a cryptographically secure random number generator if available
  const getRandomValue = () => {
    if (typeof window !== 'undefined' && window.crypto) {
      // Generate random values using Web Crypto API
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / 4294967296; // Convert to number between 0 and 1
    } else {
      // Fallback to Math.random
      return Math.random();
    }
  };
  
  // Get a random index from the ROULETTE_NUMBERS array
  const randomIndex = Math.floor(getRandomValue() * ROULETTE_NUMBERS.length);
  const result = ROULETTE_NUMBERS[randomIndex];
  console.log('Generated local random roulette number:', result);
  return result;
}

/**
 * Verifies a game result using AO process
 * @param gameId Game ID
 * @param result Roulette result
 * @returns Boolean indicating if the result is valid
 */
export async function verifyGameResult(
  gameId: string,
  result: number
): Promise<boolean> {
  // If no process ID is configured, fall back to local verification
  if (!AO_PROCESS_ID) {
    console.warn('AO_PROCESS_ID not configured. Using local verification as fallback.');
    return localVerifyResult(result);
  }

  console.log(`Verifying roulette result with AO process (ID: ${AO_PROCESS_ID})...`);
  console.log(`GameId: ${gameId}, Result: ${result}`);

  try {
    // Get wallet interface for signing
    const wallet = typeof window !== 'undefined' ? 
      (window.wander || window.arweaveWallet) : null;
    
    // Create a data item signer if we have a wallet
    const signer = wallet ? createDataItemSigner(wallet) : undefined;

    // Prepare the message to the AO process
    const response = await message({
      process: AO_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'VerifyGameResult' },
        { name: 'GameId', value: gameId }
      ],
      data: JSON.stringify({ result }),
      signer
    });

    console.log('Received verification response from AO process:', response);

    // Parse the response - we need to handle different response formats
    let responseData;
    try {
      // First try treating it as a string response
      if (typeof response === 'string') {
        responseData = JSON.parse(response);
        console.log('Parsed string verification response:', responseData);
      }
      // Then try accessing the first message if it's an object with Messages array
      else if (response && typeof response === 'object') {
        // Use type assertion to bypass TypeScript's strict checking
        const resultObj = response as any;
        if (resultObj.Messages && Array.isArray(resultObj.Messages) && resultObj.Messages.length > 0) {
          responseData = JSON.parse(resultObj.Messages[0].Data);
          console.log('Parsed Messages[0].Data verification response:', responseData);
        }
      }
      
      if (!responseData || !responseData.success) {
        throw new Error((responseData && responseData.error) || 'Failed to verify game result with AO process');
      }
      
      console.log(`Game result verification: ${responseData.isValid ? 'VALID' : 'INVALID'}`);
      return responseData.isValid;
    } catch (parseError) {
      console.error('Error parsing AO process verification response:', parseError);
      throw new Error('Invalid response from AO process');
    }
  } catch (error) {
    console.error('Error verifying game result with AO process:', error);
    
    // Fall back to local verification if AO process call fails
    console.warn('Falling back to local verification due to AO process error');
    return localVerifyResult(result);
  }
}

/**
 * Local verification function (fallback method)
 * @param result Roulette result
 * @returns Boolean indicating if the result is valid
 */
function localVerifyResult(result: number): boolean {
  console.log(`Using local verification for roulette result: ${result}`);
  const isValid = ROULETTE_NUMBERS.includes(result);
  console.log(`Local verification result: ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
} 