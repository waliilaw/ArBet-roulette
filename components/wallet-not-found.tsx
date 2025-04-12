"use client"

import { Button } from "./ui/button"

interface WalletNotFoundProps {
  onConnectClick: () => void;
  isBrave?: boolean;
}

export function WalletNotFound({ onConnectClick, isBrave = false }: WalletNotFoundProps) {
  return (
    <div className="pixel-panel p-4 bg-gray-900 mb-4 max-w-md mx-auto">
      <h2 className="font-pixel text-lg text-yellow-400 mb-4 text-center">WALLET NOT FOUND</h2>
      
      <div className="mb-4 bg-gray-800 p-3 border-2 border-gray-700">
        <p className="font-pixel text-xs text-white mb-2">
          {isBrave 
            ? "Arweave wallet extension not detected in Brave Browser." 
            : "Arweave wallet extension not detected."}
        </p>
        <p className="font-pixel text-xs text-white">
          Please install Wander wallet to play.
        </p>
      </div>
      
      <div className="flex flex-col space-y-3">
        <a 
          href="https://www.wander.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full p-2 bg-blue-700 hover:bg-blue-600 text-white text-center text-xs font-pixel pixel-button"
        >
          INSTALL WANDER
        </a>
        
        <Button 
          onClick={onConnectClick}
          className="w-full p-2 bg-green-700 hover:bg-green-600 text-white text-xs font-pixel pixel-button"
        >
          TRY CONNECT AGAIN
        </Button>
      </div>
    </div>
  );
} 