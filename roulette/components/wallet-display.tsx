"use client"

import { useState } from 'react'
import { truncateAddress, formatArAmount } from '@/lib/utils'

interface WalletDisplayProps {
  address: string;
  balance: string;
  disconnect: () => Promise<void>;
}

export function WalletDisplay({ address, balance, disconnect }: WalletDisplayProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="pixel-panel flex items-center justify-between p-2 md:p-3 bg-gray-900 mb-4">
      <div className="flex flex-col text-xs md:text-sm">
        <div className="flex items-center text-white">
          <span className="font-pixel mr-2 text-yellow-400">ADDRESS:</span>
          <span className="font-pixel">{truncateAddress(address, 6)}</span>
        </div>
        <div className="flex items-center mt-1">
          <span className="font-pixel mr-2 text-yellow-400">BALANCE:</span>
          <span className="font-pixel text-white">{formatArAmount(balance)} AR</span>
        </div>
      </div>
      
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="font-pixel text-xs py-1 px-2 h-auto bg-red-700 hover:bg-red-600 text-white pixel-button"
      >
        {isDisconnecting ? "..." : "DISCONNECT"}
      </button>
    </div>
  );
} 