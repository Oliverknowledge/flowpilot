"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { detectBraavosWallet, getStarknetAccount, getStarknetObject } from '@/utils/starknet';

// Wallet types
export type WalletType = 'ethereum' | 'starknet';

export type ConnectedWallet = {
  address: string;
  walletType: WalletType;
  name: string; // MetaMask, Braavos, Argent X, etc.
  chainId: number | null;
  isConnected: boolean;
  balance: string;
};

// Define the context type
export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: string;
  connectWallet: (walletType?: WalletType, walletName?: string) => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
  switchNetwork: (targetChainId: number) => Promise<void>;
  showWalletOptions: boolean;
  setShowWalletOptions: (show: boolean) => void;
  error: string | null;
  signMessage: (message: string) => Promise<string>;
  saveMessageOnChain: (message: string) => Promise<string>;
  walletType: WalletType | null;
  walletName: string | null;
  wallets: ConnectedWallet[];
  connectStarknetWallet: (walletName: string) => Promise<void>;
  isStarknetSupported: boolean;
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
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [isStarknetSupported, setIsStarknetSupported] = useState(false);

  // Check if StarkNet is supported
  useEffect(() => {
    // Use our utility to check for StarkNet support
    const starknetObj = getStarknetObject();
    setIsStarknetSupported(!!starknetObj);
  }, []);

  // Connect wallet function (for Ethereum wallets)
  const connectWallet = async (type: WalletType = 'ethereum', name: string = 'MetaMask') => {
    try {
      if (type === 'ethereum') {
        // Connect to Ethereum wallet (MetaMask, etc.)
        if (window.ethereum) {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          
          // Get chain ID
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          
          // Get balance
          const balanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest'],
          });
          const balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
          
          setAddress(account);
          setIsConnected(true);
          setBalance(balance);
          setChainId(chainId);
          setWalletType('ethereum');
          setWalletName(name);
          
          // Add to wallets array if not already there
          setWallets(prev => {
            const exists = prev.some(w => w.address.toLowerCase() === account.toLowerCase() && w.walletType === 'ethereum');
            if (!exists) {
              return [...prev, {
                address: account,
                walletType: 'ethereum',
                name,
                chainId,
                isConnected: true,
                balance
              }];
            }
            return prev;
          });
          
          setError(null);
        } else {
          throw new Error('Ethereum wallet not detected. Please install MetaMask.');
        }
      } else {
        throw new Error('Invalid wallet type');
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      return Promise.reject(error);
    }
  };

  // Connect to StarkNet wallet (Braavos, Argent X)
  const connectStarknetWallet = async (walletName: string) => {
    try {
      console.log(`Attempting to connect to ${walletName} wallet...`);
      
      // Use the utility function to get a stable copy of StarkNet object
      const starknetObj = getStarknetObject();
      if (!starknetObj) {
        console.error(`StarkNet not available in window`);
        throw new Error(`StarkNet wallet not detected. Please install ${walletName}.`);
      }

      console.log(`StarkNet object found:`, {
        id: starknetObj.id,
        name: starknetObj.name,
        version: starknetObj.version,
        isPreauthorized: typeof starknetObj.isPreauthorized === 'function' ? 'available' : 'unavailable',
        hasBraavos: !!starknetObj.braavos,
        hasArgentX: !!starknetObj.argentX
      });
      
      // Use pure function detection to check wallet availability
      if (walletName === 'Braavos' && !detectBraavosWallet(starknetObj)) {
        console.error('Braavos wallet not detected in StarkNet object');
        throw new Error('Braavos wallet not detected. Please install Braavos and refresh the page.');
      }
      
      if (walletName === 'Argent X' && !starknetObj.argentX) {
        console.error('Argent X wallet not detected in StarkNet object');
        throw new Error('Argent X wallet not detected. Please install Argent X and refresh the page.');
      }

      // Use a simple approach for getting the account to avoid any reactivity or hook issues
      let starknetAccount = null;
      let accountAddress = null;
      let accountChainId = null;

      console.log(`Enabling ${walletName} wallet...`);
      
      // Handle different wallet types
      if (walletName === 'Braavos') {
        try {
          if (starknetObj.braavos && typeof starknetObj.braavos.enable === 'function') {
            console.log('Using starknetObj.braavos.enable()');
            await starknetObj.braavos.enable();
            
            if (starknetObj.braavos.account) {
              console.log('Using starknetObj.braavos.account');
              starknetAccount = starknetObj.braavos.account;
            }
          } else {
            console.log('Falling back to starknetObj.enable()');
            await starknetObj.enable();
            
            if (starknetObj.account) {
              console.log('Using starknetObj.account');
              starknetAccount = starknetObj.account;
            }
          }
          
          // If we still don't have an account, check again using different methods
          if (!starknetAccount || !starknetAccount.address) {
            console.log('Account not found directly, trying getStarknetAccount helper');
            starknetAccount = getStarknetAccount(starknetObj, 'Braavos');
          }
          
          // Final check with address
          if (!starknetAccount || !starknetAccount.address) {
            console.error('Failed to get Braavos account with address');
            throw new Error('Could not get a valid Braavos account. Please check your wallet connection.');
          }
          
          // Extract account information
          accountAddress = starknetAccount.address;
          accountChainId = starknetAccount.chainId;
          
          console.log(`Braavos account enabled successfully:`, {
            address: accountAddress,
            chainId: accountChainId
          });
        } catch (error) {
          console.error('Error in Braavos connection:', error);
          throw new Error('Failed to connect to Braavos. Please ensure the wallet is properly installed and unlocked.');
        }
      } else if (walletName === 'Argent X') {
        try {
          if (starknetObj.argentX && typeof starknetObj.argentX.enable === 'function') {
            await starknetObj.argentX.enable();
            starknetAccount = starknetObj.argentX.account;
          } else {
            throw new Error('Argent X wallet not properly initialized');
          }
          
          if (!starknetAccount || !starknetAccount.address) {
            throw new Error('Failed to get Argent X account after enabling.');
          }
          
          // Extract account information
          accountAddress = starknetAccount.address;
          accountChainId = starknetAccount.chainId;
        } catch (error) {
          console.error('Error in Argent X connection:', error);
          throw new Error('Failed to connect to Argent X. Please ensure the wallet is properly installed and unlocked.');
        }
      } else {
        // Generic StarkNet wallet
        try {
          await starknetObj.enable();
          starknetAccount = starknetObj.account;
          
          if (!starknetAccount || !starknetAccount.address) {
            throw new Error(`Could not get a valid account from ${walletName}`);
          }
          
          // Extract account information
          accountAddress = starknetAccount.address;
          accountChainId = starknetAccount.chainId;
        } catch (error) {
          console.error(`Error connecting to ${walletName}:`, error);
          throw new Error(`Failed to connect to ${walletName}. Please check your wallet connection.`);
        }
      }
      
      // Update state with the wallet information
      setAddress(accountAddress);
      setIsConnected(true);
      setBalance('Starknet Balance'); // Placeholder balance
      setChainId(accountChainId ? parseInt(accountChainId, 16) : null);
      setWalletType('starknet');
      setWalletName(walletName);
      
      // Add to wallets array
      setWallets(prev => {
        const exists = prev.some(w => 
          w.address.toLowerCase() === accountAddress.toLowerCase() && 
          w.walletType === 'starknet' &&
          w.name === walletName
        );
        
        if (!exists) {
          return [...prev, {
            address: accountAddress,
            walletType: 'starknet',
            name: walletName,
            chainId: accountChainId ? parseInt(accountChainId, 16) : null,
            isConnected: true,
            balance: 'Starknet Balance'
          }];
        }
        return prev;
      });
      
      console.log(`${walletName} wallet connected successfully:`, {
        address: accountAddress,
        chainId: accountChainId
      });
      
      setError(null);
      return Promise.resolve();
    } catch (error) {
      console.error('Error connecting StarkNet wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect StarkNet wallet');
      return Promise.reject(error);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setBalance('0');
    setChainId(null);
    setWalletType(null);
    setWalletName(null);
    setError(null);
    
    // Update wallet in list to disconnected
    if (address) {
      setWallets(prev => prev.map(wallet => 
        wallet.address === address ? { ...wallet, isConnected: false } : wallet
      ));
    }
  };

  // Switch network function
  const switchNetwork = async (targetChainId: number) => {
    try {
      if (walletType === 'ethereum' && window.ethereum) {
        try {
          // Try to switch to the network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // Here you would normally add the chain, but we'll just throw for now
            throw new Error('Network not available in your wallet. Please add it first.');
          } else {
            throw switchError;
          }
        }
        
        setChainId(targetChainId);
      } else if (walletType === 'starknet') {
        // StarkNet wallet switching logic would go here
        // This will depend on the specific StarkNet wallet API
        throw new Error('Network switching not supported for StarkNet wallets yet');
      } else {
        throw new Error('No wallet connected');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error switching network:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch network');
      return Promise.reject(error);
    }
  };

  // Sign message function
  const signMessage = async (message: string): Promise<string> => {
    try {
      if (!isConnected || !address) {
        throw new Error('No wallet connected');
      }
      
      if (walletType === 'ethereum' && window.ethereum) {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
        return signature;
      } else if (walletType === 'starknet') {
        // StarkNet signing logic
        // Get a stable StarkNet object with our utility
        const starknetObj = getStarknetObject();
        if (!starknetObj) {
          throw new Error('StarkNet wallet not available');
        }
        
        // Define a local variable for the account (NOT a React hook)
        let starknetAccount = null;
        
        // Get the account based on wallet type - using our imported pure function
        if (walletName === 'Braavos') {
          starknetAccount = getStarknetAccount(starknetObj, 'Braavos');
        } else if (walletName === 'Argent X') {
          starknetAccount = getStarknetAccount(starknetObj, 'Argent X');
        } else {
          starknetAccount = starknetObj.account;
        }
        
        if (!starknetAccount) {
          throw new Error('StarkNet account not available');
        }
        
        // Sign the message (this may vary by wallet)
        // This is just an example - actual implementation may differ
        try {
          // Use a pure function approach
          if (!starknetAccount.signMessage) {
            throw new Error('This wallet does not support message signing');
          }
          
          const typedData = {
            domain: {
              name: 'FlowPilot',
              version: '1',
            },
            types: {
              StarkNetMessage: [
                { name: 'message', type: 'string' }
              ]
            },
            primaryType: 'StarkNetMessage',
            message: {
              message: message
            }
          };
          
          const signature = await starknetAccount.signMessage(typedData);
          return signature.r.toString(16) + signature.s.toString(16);
        } catch (error) {
          console.error('Error signing with StarkNet:', error);
          throw new Error('Failed to sign message with StarkNet wallet');
        }
      } else {
        // Fallback for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "0x" + Array(130).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      }
    } catch (error) {
      console.error('Error signing message:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign message');
      return Promise.reject(error);
    }
  };

  // Save message on-chain function
  const saveMessageOnChain = async (message: string): Promise<string> => {
    try {
      if (!isConnected || !address) {
        throw new Error('No wallet connected');
      }
      
      if (walletType === 'ethereum') {
        // For demonstration, we'll just simulate a transaction
        console.log('Simulating saving message on Ethereum chain:', message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      } else if (walletType === 'starknet') {
        // StarkNet transaction logic
        console.log('Simulating saving message on StarkNet chain:', message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      } else {
        // Fallback
        await new Promise(resolve => setTimeout(resolve, 1500));
        return "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      }
    } catch (error) {
      console.error('Error saving message on chain:', error);
      setError(error instanceof Error ? error.message : 'Failed to save message on chain');
      return Promise.reject(error);
    }
  };

  // Set up event listeners for wallet changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        // Handle account changes
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            // User disconnected their wallet
            if (walletType === 'ethereum') {
              disconnectWallet();
            }
          } else if (accounts[0] !== address && walletType === 'ethereum') {
            // Account changed, update state
            setAddress(accounts[0]);
          }
        };
        
        // Handle network changes - with proper typing
        const handleChainChanged = (chainIdHex: string) => {
          if (walletType === 'ethereum') {
            setChainId(parseInt(chainIdHex, 16));
          }
        };
        
        // Set up event listeners with explicit typing
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // @ts-ignore - The ethereum provider types are not properly defined
        window.ethereum.on('chainChanged', handleChainChanged);
        
        // Clean up event listeners
        return () => {
          if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            // @ts-ignore - The ethereum provider types are not properly defined
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
      
      // StarkNet event listeners would go here if applicable
    }
  }, [address, walletType, disconnectWallet]);

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
        signMessage,
        saveMessageOnChain,
        walletType,
        walletName,
        wallets,
        connectStarknetWallet,
        isStarknetSupported,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 
