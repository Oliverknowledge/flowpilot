"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Add type declaration for window.ethereum
interface Ethereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (accounts: string[]) => void) => void;
  removeListener: (event: string, callback: (accounts: string[]) => void) => void;
  send: (method: string, params?: any[]) => Promise<any>;
}

// Define the context type
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  chainId: number | null;
  switchNetwork: (chainId: number) => Promise<void>;
  showWalletOptions: boolean;
  setShowWalletOptions: (show: boolean) => void;
  error: string | null;
}

// Create the context with default values
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Check if the wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Get the connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAddress(currentAccount);
            setIsConnected(true);
            
            // Get network ID
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(parseInt(chainIdHex, 16));
            
            // Get balance
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(currentAccount);
            setBalance(ethers.formatEther(balance));
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAddress(null);
          setIsConnected(false);
          setBalance('0');
        } else {
          // Account changed
          setAddress(accounts[0]);
          setIsConnected(true);
          
          // Update balance
          const updateBalance = async () => {
            try {
              const provider = new ethers.BrowserProvider(window.ethereum);
              const balance = await provider.getBalance(accounts[0]);
              setBalance(ethers.formatEther(balance));
            } catch (error) {
              console.error("Error updating balance:", error);
            }
          };
          
          updateBalance();
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Check if window.ethereum exists
  const checkEthereum = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return true;
    }
    setError('Please install MetaMask or another Web3 wallet');
    return false;
  };

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (!checkEthereum()) return;

      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });
        
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setError(null);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
      throw error;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async () => {
    try {
      setAddress(null);
      setIsConnected(false);
      setBalance('0');
      setError(null);
      // Note: MetaMask doesn't actually disconnect, we just clear our state
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
      throw error;
    }
  };

  // Switch network function
  const switchNetwork = async (targetChainId: number) => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Convert chain ID to hexadecimal
        const chainIdHex = `0x${targetChainId.toString(16)}`;
        
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        
        // Chain ID will be updated by the chainChanged event listener
      } catch (switchError: any) {
        // This error code means the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log("Network not available in wallet");
          // Here you could implement logic to add the chain
        } else {
          console.error("Error switching network:", switchError);
        }
        throw switchError;
      }
    } else {
      throw new Error('No Ethereum wallet detected');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        balance,
        connectWallet,
        disconnectWallet,
        chainId,
        switchNetwork,
        showWalletOptions,
        setShowWalletOptions,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Declare ethereum property on window object for TypeScript
declare global {
  interface Window {
    ethereum?: Ethereum;
  }
} 