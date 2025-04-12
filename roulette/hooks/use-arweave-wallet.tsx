"use client"

import { useState, useEffect, useCallback } from 'react';
import { connectWallet, disconnectWallet, fetchArweaveBalance, isArweaveWalletInstalled } from '@/lib/arweave-integration';

export function useArweaveWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isBraveBrowser, setIsBraveBrowser] = useState(false);

  // Detect browser type
  useEffect(() => {
    const detectBrave = async () => {
      try {
        // @ts-ignore - Brave exposes this property
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        setIsBraveBrowser(!!isBrave);
      } catch (e) {
        // Fallback detection
        setIsBraveBrowser(window.navigator.userAgent.includes('Brave'));
      }
    };
    
    detectBrave();
  }, []);

  // Check wallet state on startup
  useEffect(() => {
    const checkWalletState = async () => {
      const installed = isArweaveWalletInstalled();
      setIsWalletInstalled(installed);
      
      if (!installed) {
        const errorMsg = 'Arweave wallet extension not found';
        setWalletError(errorMsg);
        return;
      }
      
      try {
        // Check if there's already an active connection
        const wallet = window.arweaveWallet;
        if (!wallet) {
          return;
        }
        
        const activeAddress = await wallet.getActiveAddress().catch(() => null);
        
        if (activeAddress) {
          setConnected(true);
          setAddress(activeAddress);
          
          try {
            const balance = await fetchArweaveBalance(activeAddress);
            setBalance(balance);
          } catch (balanceError) {
            console.error('Error fetching initial balance:', balanceError);
          }
        } else {
          setConnected(false);
          setAddress('');
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWalletError('Error checking wallet connection');
      }
    };

    checkWalletState();
    
    // Refresh wallet state every 10 seconds if not connected
    const intervalId = setInterval(() => {
      if (!connected) {
        checkWalletState();
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [connected]);

  // Update balance periodically when connected
  useEffect(() => {
    if (!connected || !address) return;
    
    const updateBalance = async () => {
      try {
        const balance = await fetchArweaveBalance(address);
        setBalance(balance);
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    };
    
    updateBalance();
    
    const intervalId = setInterval(updateBalance, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [connected, address]);

  // Connect to wallet
  const connect = useCallback(async () => {
    setWalletError(null);
    setIsConnecting(true);
    
    if (!isArweaveWalletInstalled()) {
      const errorMsg = 'Arweave wallet extension not found';
      setWalletError(errorMsg);
      setIsConnecting(false);
      throw new Error('WALLET_NOT_INSTALLED');
    }
    
    try {
      const walletAddress = await connectWallet();
      
      setConnected(true);
      setAddress(walletAddress);
      
      try {
        const balanceValue = await fetchArweaveBalance(walletAddress);
        setBalance(balanceValue);
      } catch (balanceError) {
        console.error('Error fetching balance:', balanceError);
      }
      
      return walletAddress;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error instanceof Error) {
        if (error.message === 'WALLET_NOT_INSTALLED') {
          setWalletError('Arweave wallet extension not found');
        } else if (error.message.includes('rejected')) {
          setWalletError('Connection rejected by user');
        } else {
          setWalletError(error.message);
        }
      } else {
        setWalletError('Failed to connect to wallet');
      }
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    try {
      setConnected(false);
      setAddress('');
      setBalance('0.0');
      
      if (isArweaveWalletInstalled()) {
        await disconnectWallet();
      }
      
      localStorage.removeItem('arweave-wallet-address');
      sessionStorage.removeItem('arweave-wallet-connected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }, []);

  // Return hook values
  return {
    connected,
    address,
    balance,
    isConnecting,
    isWalletInstalled,
    isBraveBrowser,
    walletError,
    connect,
    disconnect
  };
} 