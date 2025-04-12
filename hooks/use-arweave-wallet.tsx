"use client"

import { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet, fetchArweaveBalance, isWanderWalletInstalled } from '@/lib/arweave-integration';

/**
 * Custom hook for Arweave wallet interaction
 * Supports both test mode with mock tokens and real wallet mode
 */
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
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
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

  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    // Check if wallet is installed and already connected
    const checkWalletState = async () => {
      const installed = isWanderWalletInstalled();
      setIsWalletInstalled(installed);
      console.log('Wallet installed check:', installed);
      
      if (!installed) {
        const errorMsg = isBraveBrowser 
          ? 'Arweave wallet extension not found. Please check browser extensions.'
          : 'Arweave wallet extension not found';
        setWalletError(errorMsg);
        return;
      }
      
      try {
        // Use the global to get access to either window.wander or window.arweaveWallet
        const win = window as any;
        const wallet = win.wander || win.arweaveWallet;
        if (!wallet) {
          console.log('No wallet interface found despite being "installed"');
          return;
        }
        
        console.log('Checking for active address...');
        const activeAddress = await wallet.getActiveAddress().catch((err: Error) => {
          console.error('Error in getActiveAddress:', err);
          return null;
        });
        
        console.log('Active address check result:', activeAddress);
        
        if (activeAddress) {
          console.log('Found active address, setting connected state');
          setConnected(true);
          setAddress(activeAddress);
          
          try {
            const balance = await fetchArweaveBalance(activeAddress);
            console.log('Fetched balance:', balance);
            setBalance(balance);
          } catch (balanceError) {
            console.error('Error fetching initial balance:', balanceError);
          }
        } else {
          console.log('No active address found');
          setConnected(false);
          setAddress('');
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWalletError('Error checking wallet connection');
      }
    };

    checkWalletState();
    
    // Force recheck of connection status after a delay
    // This helps detect wallet state changes outside the app
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined') {
        console.log('Running periodic wallet connection check');
        checkWalletState();
      }
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isBraveBrowser]);

  const handleConnect = async () => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    setIsConnecting(true);
    setWalletError(null);
    try {
      const address = await connectWallet();
      if (address) {
        setConnected(true);
        setAddress(address);
        const balance = await fetchArweaveBalance(address);
        setBalance(balance);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      // Handle rejection by user
      if (error.message.includes('User rejected')) {
        setWalletError('Connection rejected by user');
      } else {
        setWalletError(error.message || 'Failed to connect to wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    try {
      await disconnectWallet();
      setConnected(false);
      setAddress('');
      setBalance('0.0');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      setWalletError(error.message || 'Failed to disconnect from wallet');
    }
  };

  const refreshBalance = async () => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    if (address) {
      try {
        const balance = await fetchArweaveBalance(address);
        setBalance(balance);
        return balance;
      } catch (error) {
        console.error('Error refreshing balance:', error);
        return balance;
      }
    }
    return balance;
  };

  return {
    connected,
    address,
    balance,
    isConnecting,
    isWalletInstalled,
    walletError,
    handleConnect,
    handleDisconnect,
    refreshBalance,
  };
} 