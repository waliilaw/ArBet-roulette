import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Roulette numbers configuration
export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]

// Get the color of a roulette number
export function getNumberColor(number: number): "red" | "black" | "green" {
  if (number === 0) return "green"
  
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
  return redNumbers.includes(number) ? "red" : "black"
}

// Format AR amounts
export function formatArAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(4)
}

// Calculate bet payout
export function calculateBetPayout(betAmount: number, betType: string): number {
  const payouts: Record<string, number> = {
    'straight': 35,     // Single number: 35:1
    'split': 17,        // Two numbers: 17:1
    'street': 11,       // Three numbers: 11:1
    'corner': 8,        // Four numbers: 8:1
    'sixline': 5,       // Six numbers: 5:1
    'dozen': 2,         // Dozen: 2:1
    'column': 2,        // Column: 2:1
    'red': 1,           // Red: 1:1
    'black': 1,         // Black: 1:1
    'even': 1,          // Even: 1:1
    'odd': 1,           // Odd: 1:1
    'high': 1,          // 19-36: 1:1
    'low': 1            // 1-18: 1:1
  }

  const multiplier = payouts[betType] || 0
  return betAmount * multiplier
}

// Generate a random session ID
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  const start = address.substring(0, chars);
  const end = address.substring(address.length - chars);
  return `${start}...${end}`;
} 