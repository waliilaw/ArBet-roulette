/**
 * This file contains a mock implementation of AO randomness for demo purposes
 * No real AO or Arweave interactions are made
 */

import { ROULETTE_NUMBERS } from "./utils"

/**
 * Generates a random roulette result using AO (mock implementation)
 * @returns Random roulette number
 */
export async function generateRouletteResult(): Promise<number> {
  return generateLocalRandomness();
}

/**
 * Generates a random roulette result locally
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
 * Verifies a game result (mock implementation)
 * @param gameId Game ID
 * @param result Roulette result
 * @returns Boolean indicating if the result is valid
 */
export async function verifyGameResult(
  gameId: string,
  result: number
): Promise<boolean> {
  // Local verification - no interaction with AO
  // In real implementation, this would verify the result with the AO process
  return ROULETTE_NUMBERS.includes(result);
} 