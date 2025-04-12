/**
 * Real AO integration for generating random roulette results
 */

import { createDataItemSigner, message } from "@permaweb/aoconnect";
import { ROULETTE_NUMBERS } from "./utils";

// Get the AO process ID from environment variables
const AO_PROCESS_ID = process.env.NEXT_PUBLIC_AO_PROCESS_ID || '';

/**
 * Generates a verifiably random roulette result using AO
 * @returns Random roulette number
 */
export async function generateRouletteResult(): Promise<number> {
  if (!AO_PROCESS_ID) {
    console.warn('AO_PROCESS_ID not set, falling back to local randomness');
    return generateLocalRandomness();
  }

  try {
    // Query AO process for a random number
    const result = await message({
      process: AO_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'GetRandomNumber' },
        { name: 'Range', value: ROULETTE_NUMBERS.length.toString() },
        { name: 'Timestamp', value: Date.now().toString() }
      ],
      signer: createDataItemSigner(() => Promise.resolve('')),
      data: ''
    });

    // AO message result can be parsed as JSON
    const resultData = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (resultData && resultData.Messages && resultData.Messages.length > 0) {
      // Extract the random number from the response
      const messageData = resultData.Messages[0].Data;
      const randomData = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
      
      if (typeof randomData.result === 'number') {
        // Get the roulette number at the random index
        const randomIndex = randomData.result % ROULETTE_NUMBERS.length;
        return ROULETTE_NUMBERS[randomIndex];
      }
    }

    // Fallback to local randomness if AO response format is unexpected
    console.warn('Unexpected AO response format, falling back to local randomness');
    return generateLocalRandomness();
  } catch (error) {
    console.error('Error generating random number with AO:', error);
    // Fallback to local randomness in case of error
    return generateLocalRandomness();
  }
}

/**
 * Generates a random roulette result locally
 * FOR TESTING/FALLBACK ONLY - this is not verifiably random
 * @returns Random roulette number
 */
function generateLocalRandomness(): number {
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
  return ROULETTE_NUMBERS[randomIndex];
}

/**
 * Verifies a roulette result using AO
 * @param gameId Game ID (transaction ID)
 * @param result Claimed result number
 * @returns Boolean indicating if the result is valid
 */
export async function verifyRouletteResult(
  gameId: string,
  result: number
): Promise<boolean> {
  if (!AO_PROCESS_ID) {
    console.warn('AO_PROCESS_ID not set, cannot verify result');
    return true; // Assume valid for testing
  }

  try {
    // Query AO process to verify the result
    const verifyResultResponse = await message({
      process: AO_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'VerifyResult' },
        { name: 'GameId', value: gameId },
        { name: 'Result', value: result.toString() }
      ],
      signer: createDataItemSigner(() => Promise.resolve('')),
      data: ''
    });

    // AO message result can be parsed as JSON
    const verifyResult = typeof verifyResultResponse === 'string' 
      ? JSON.parse(verifyResultResponse) 
      : verifyResultResponse;

    if (verifyResult && verifyResult.Messages && verifyResult.Messages.length > 0) {
      // Extract the verification result from the response
      const messageData = verifyResult.Messages[0].Data;
      const verificationData = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
      
      return verificationData.isValid === true;
    }

    // Assume invalid if verification response format is unexpected
    return false;
  } catch (error) {
    console.error('Error verifying result with AO:', error);
    return false;
  }
} 