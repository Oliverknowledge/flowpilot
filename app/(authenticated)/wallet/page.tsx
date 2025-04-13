"use client"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Copy, ExternalLink, Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { toast } from '@/components/ui/use-toast';
import { detectBraavosWallet, getStarknetObject } from '@/utils/starknet';

// Wallet configuration
const wallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    type: 'ethereum' as const,
    icon: '🦊',
    description: 'Connect to your MetaMask wallet',
  },
  {
    id: 'braavos',
    name: 'Braavos',
    type: 'starknet' as const,
    icon: '🔷',
    description: 'Connect to your Braavos StarkNet wallet',
  },
  {
    id: 'argentx',
    name: 'Argent X',
    type: 'starknet' as const,
    icon: '🔹',
    description: 'Connect to your Argent X StarkNet wallet',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    type: 'ethereum' as const,
    icon: '🔵',
    description: 'Connect to your Coinbase wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    type: 'ethereum' as const,
    icon: '🔗',
    description: 'Connect using WalletConnect',
  },
];

// Add a dedicated component for wallet installation instructions
const WalletInstallInstructions = ({ walletName }: { walletName: string }) => {
  if (walletName.toLowerCase().includes('braavos')) {
    return (
      <div className="mt-3 p-4 bg-blue-900/20 rounded border border-blue-500/20 text-sm">
        <p className="text-xs text-white/90 mb-3 font-medium">To install and use Braavos:</p>
        <ol className="list-decimal list-inside text-xs text-white/80 space-y-2 pl-1">
          <li>Visit <a 
              href="https://chromewebstore.google.com/detail/braavos-smart-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 underline hover:text-blue-300 transition-colors"
            >
              Chrome Web Store
            </a>
          </li>
          <li>Click "Add to Chrome"</li>
          <li>After installation, click on the extensions icon in your browser toolbar</li>
          <li>Click the pin icon next to Braavos to keep it visible in your toolbar</li>
          <li>Click on the Braavos icon and complete the wallet setup</li>
          <li>After setup, <strong className="text-white">refresh this page</strong></li>
          <li>Try connecting again</li>
        </ol>
        
        <div className="mt-3 p-2 bg-blue-900/30 rounded text-xs border border-blue-500/30">
          <p className="font-medium text-white/90 mb-1">Troubleshooting tips:</p>
          <ul className="list-disc list-inside text-white/80 space-y-1 pl-1">
            <li>Make sure the Braavos extension is properly installed and enabled</li>
            <li>Check if the extension is visible in your Chrome extensions list</li>
            <li>Try restarting your browser after installation</li>
            <li>If using a private/incognito window, enable the extension for incognito mode</li>
          </ul>
        </div>
      </div>
    );
  }
  
  if (walletName.toLowerCase().includes('argent')) {
    return (
      <div className="mt-3 p-4 bg-purple-900/20 rounded border border-purple-500/20 text-sm">
        <p className="text-xs text-white/90 mb-3 font-medium">To install and use Argent X:</p>
        <ol className="list-decimal list-inside text-xs text-white/80 space-y-2 pl-1">
          <li>Visit <a 
              href="https://chromewebstore.google.com/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300 transition-colors"
            >
              Chrome Web Store
            </a>
          </li>
          <li>Click "Add to Chrome"</li>
          <li>After installation, click on the extensions icon in your browser toolbar</li>
          <li>Click the pin icon next to Argent X to keep it visible</li>
          <li>Click on the Argent X icon and complete the wallet setup</li>
          <li>After setup, <strong className="text-white">refresh this page</strong></li>
          <li>Try connecting again</li>
        </ol>
        
        <div className="mt-3 p-2 bg-purple-900/30 rounded text-xs border border-purple-500/30">
          <p className="font-medium text-white/90 mb-1">Troubleshooting tips:</p>
          <ul className="list-disc list-inside text-white/80 space-y-1 pl-1">
            <li>Make sure the Argent X extension is properly installed and enabled</li>
            <li>Check if the extension is visible in your Chrome extensions list</li>
            <li>Try restarting your browser after installation</li>
            <li>If using a private/incognito window, enable the extension for incognito mode</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return null;
};

const WalletPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { 
    isConnected, 
    address, 
    walletType,
    walletName: contextWalletName,
    connectWallet, 
    disconnectWallet, 
    wallets: connectedWallets,
    connectStarknetWallet,
    isStarknetSupported 
  } = useWallet();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [walletAvailability, setWalletAvailability] = useState<Record<string, boolean>>({});
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string>("");

  // Check which wallets are available in browser
  useEffect(() => {
    // Define this function inside the useEffect to ensure it has access to the right context
    // but doesn't accidentally reach outside its scope
    const checkWalletAvailability = () => {
      const availability: Record<string, boolean> = {};
      
      // Check Ethereum wallets
      if (typeof window !== 'undefined') {
        // Safely check MetaMask
        try {
          // @ts-ignore - ethereum providers may have different properties
          availability['metamask'] = !!window.ethereum && (window.ethereum.isMetaMask === true);
        } catch (e) {
          availability['metamask'] = false;
        }
        
        // Safely check Coinbase
        try {
          // @ts-ignore - ethereum providers may have different properties
          availability['coinbase'] = !!window.ethereum && (window.ethereum.isCoinbaseWallet === true);
        } catch (e) {
          availability['coinbase'] = false;
        }
        
        // WalletConnect - always available as it doesn't require browser extension
        availability['walletconnect'] = true;
        
        // StarkNet wallets - only check if window.starknet exists
        const starknetObj = getStarknetObject();
        if (starknetObj) {
          try {
            // Log the StarkNet object details for debugging
            console.log("StarkNet wallet detection info:", {
              hasStarknet: true,
              provider: starknetObj.id || "unknown",
              name: starknetObj.name || "unknown"
            });
            
            // Use our pure helper function for Braavos detection
            availability['braavos'] = detectBraavosWallet(starknetObj);
            
            // Safely check Argent X
            try {
              // @ts-ignore - starknet types might not be properly declared
              availability['argentx'] = !!starknetObj.argentX;
              if (availability['argentx']) {
                console.log('Argent X wallet detected');
              }
            } catch (e) {
              console.error('Error checking Argent X availability:', e);
              availability['argentx'] = false;
            }
          } catch (e) {
            console.error("Error during StarkNet wallet detection:", e);
            availability['braavos'] = false;
            availability['argentx'] = false;
          }
        } else {
          console.log('StarkNet provider not available in window');
          // StarkNet not supported
          availability['braavos'] = false;
          availability['argentx'] = false;
        }
      } else {
        console.log('Window object not available');
        // Not in browser environment
        availability['metamask'] = false;
        availability['coinbase'] = false;
        availability['walletconnect'] = false;
        availability['braavos'] = false;
        availability['argentx'] = false;
      }
      
      console.log('Wallet availability results:', availability);
      setWalletAvailability(availability);
    };
    
    // Call the function immediately
    checkWalletAvailability();
    
    // Recheck on window focus in case user installs extensions
    const handleFocus = () => checkWalletAvailability();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Session protection - redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/account');
    }
  }, [status, router]);

  const handleConnectWallet = async (type: string, name: string) => {
    setConnectionError(null);
    setIsConnecting(true);
    setConnectingWalletId(name.toLowerCase());
    
    try {
      // Check StarkNet availability first
      if (type === 'starknet') {
        // Get a stable copy of the StarkNet object using our utility function
        const starknetObj = getStarknetObject();
        
        if (!starknetObj) {
          throw new Error(`StarkNet provider not detected. Please install ${name} wallet extension.`);
        }
        
        console.log(`Connecting to ${name} wallet with starknet object:`, {
          id: starknetObj.id,
          name: starknetObj.name,
          version: starknetObj.version,
          hasBraavos: !!starknetObj.braavos,
          hasArgentX: !!starknetObj.argentX
        });
        
        // For Braavos, check if it's really detected
        if (name === 'Braavos') {
          const isBraavosDetected = detectBraavosWallet(starknetObj);
          if (!isBraavosDetected) {
            throw new Error(`Braavos wallet not detected. Please install Braavos extension from the Chrome Web Store.`);
          }
        }
        
        // For Argent X
        if (name === 'Argent X' && !starknetObj.argentX) {
          throw new Error(`Argent X wallet not detected. Please install Argent X extension.`);
        }
      }
      
      // Connect based on wallet type
      if (type === 'ethereum') {
        await connectWallet('ethereum', name);
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${name}`,
          variant: "default",
        });
      } else if (type === 'starknet') {
        await connectStarknetWallet(name);
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${name}`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      
      // Format the error message to be more user-friendly
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Remove any reference to hooks or React errors from the user-facing message
      if (errorMessage.includes('Invalid hook call')) {
        errorMessage = `Failed to connect to ${name}. Please make sure the wallet extension is correctly installed and try again after refreshing the page.`;
      }
      
      // Set error and show toast notification
      setConnectionError(`Failed to connect to ${name}. ${errorMessage}`);
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${name}`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setConnectingWalletId(null);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getWalletIcon = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId.toLowerCase());
    return wallet ? wallet.icon : '👛';
  };

  // Don't render anything while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Background glow effects */}
      <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-20 w-[250px] h-[250px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          className="bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-sm transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
          Wallet Management
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Wallets Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-lg border border-white/5 relative overflow-hidden"
          style={{
            background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">Connected Wallets</span>
            {isConnected && (
              <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Active</div>
            )}
          </h2>

          <div className="space-y-4">
            {connectedWallets.length > 0 ? (
              connectedWallets.map((wallet, index) => (
                <div 
                  key={wallet.address + wallet.walletType} 
                  className={`p-4 rounded-lg border backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
                    wallet.isConnected && address === wallet.address
                      ? 'border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-transparent'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0"
                    initial={{ x: '-100%' }}
                    animate={{ 
                      x: wallet.isConnected && address === wallet.address ? '100%' : '-100%' 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: wallet.isConnected && address === wallet.address ? Infinity : 0,
                      repeatType: "loop",
                      ease: "linear"
                    }}
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-xl">
                      {getWalletIcon(wallet.name)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{wallet.name}</p>
                          <p className="text-sm text-white/70">{wallet.walletType === 'ethereum' ? 'Ethereum' : 'StarkNet'}</p>
                        </div>
                        
                        {wallet.isConnected && address === wallet.address ? (
                          <Button
                            onClick={handleDisconnectWallet}
                            variant="destructive"
                            size="sm"
                            className="bg-red-500/20 hover:bg-red-600/20 text-red-400 border border-red-500/20"
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleConnectWallet(
                              wallet.walletType as 'ethereum' | 'starknet',
                              wallet.name
                            )}
                            size="sm"
                            className="bg-blue-500/20 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20"
                          >
                            Reconnect
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-mono text-white/70">
                          {truncateAddress(wallet.address)}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => copyToClipboard(wallet.address)} 
                            size="sm" 
                            className="bg-white/10 hover:bg-white/20 border-none p-1 h-7 w-7"
                          >
                            {copied ? '✓' : <Copy className="w-3 h-3" />}
                          </Button>
                          <Button 
                            onClick={() => window.open(
                              wallet.walletType === 'ethereum'
                                ? `https://etherscan.io/address/${wallet.address}`
                                : `https://starkscan.co/contract/${wallet.address}`,
                              '_blank'
                            )}
                            size="sm" 
                            className="bg-white/10 hover:bg-white/20 border-none p-1 h-7 w-7"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">No wallets connected yet</p>
                <Button
                  onClick={() => setShowAllWallets(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connect Your First Wallet
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Add New Wallet Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-6 rounded-lg border border-white/5 relative overflow-hidden"
          style={{
            background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">Add New Wallet</span>
            <button 
              onClick={() => setShowAllWallets(!showAllWallets)}
              className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full hover:bg-indigo-500/30 transition-colors"
            >
              {showAllWallets ? 'Hide Options' : 'Show All'}
            </button>
          </h2>
          
          {connectionError && (
            <div className="mb-4 p-3 border border-red-500/20 bg-red-500/10 rounded-lg text-sm">
              <p className="text-red-400 mb-2">{connectionError}</p>
              {connectionError.includes('Braavos') && <WalletInstallInstructions walletName="Braavos" />}
              {connectionError.includes('Argent X') && <WalletInstallInstructions walletName="Argent X" />}
              {connectionError.includes('MetaMask') && <WalletInstallInstructions walletName="MetaMask" />}
              <Button 
                className="w-full mt-3 bg-white/10 text-white/80 hover:bg-white/20 text-xs" 
                size="sm"
                onClick={() => setConnectionError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {showAllWallets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {wallets.map(wallet => (
                  <motion.button
                    key={wallet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: connectingWalletId === wallet.id ? 1.02 : 1,
                      boxShadow: connectingWalletId === wallet.id ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
                    }}
                    whileHover={{ 
                      scale: (!walletAvailability[wallet.id] || isConnecting) ? 1 : 1.03,
                      boxShadow: (!walletAvailability[wallet.id] || isConnecting) ? 'none' : '0 0 15px rgba(99, 102, 241, 0.2)'
                    }}
                    transition={{ 
                      duration: 0.2,
                      scale: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    className={`flex items-center p-4 rounded-lg text-left border transition-all duration-200 ${
                      (!walletAvailability[wallet.id])
                        ? 'border-gray-500/20 bg-white/5 opacity-50 cursor-not-allowed'
                        : isConnecting && connectingWalletId === wallet.id
                          ? 'border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 shadow-lg'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30'
                    }`}
                    onClick={() => {
                      if (!walletAvailability[wallet.id]) {
                        setConnectionError(`${wallet.name} not detected. Please install the ${wallet.name} extension.`);
                        return;
                      }
                      setConnectingWalletId(wallet.id);
                      handleConnectWallet(wallet.type, wallet.name);
                    }}
                    disabled={!walletAvailability[wallet.id] || isConnecting}
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full mr-3 transition-all duration-300 ${
                      isConnecting && connectingWalletId === wallet.id
                        ? 'bg-indigo-500/20 text-indigo-400 relative'
                        : 'bg-white/10 text-xl'
                    }`}>
                      {wallet.icon}
                      {isConnecting && connectingWalletId === wallet.id && (
                        <motion.div 
                          className="absolute inset-0 rounded-full border border-indigo-500/50"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 0.2, 0.7],
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {wallet.name}
                        {!walletAvailability[wallet.id] && (
                          <span className="ml-2 text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                            Not Installed
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-white/60">{wallet.description}</p>
                    </div>
                    {isConnecting && connectingWalletId === wallet.id ? (
                      <motion.div 
                        className="h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent ml-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-white/70">
                  Connect a new wallet to manage multiple addresses or switch between different accounts.
                </p>
                
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => setShowAllWallets(true)}
                    className="flex items-center justify-between px-4 py-6 h-auto text-left border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-xl mr-3">
                        🦊
                      </div>
                      <div>
                        <p className="font-medium">MetaMask</p>
                        <p className="text-xs text-white/60">Connect to your MetaMask wallet</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </Button>
                  
                  <Button
                    onClick={() => setShowAllWallets(true)}
                    className="flex items-center justify-between px-4 py-6 h-auto text-left border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-xl mr-3">
                        🔷
                      </div>
                      <div>
                        <p className="font-medium">Braavos</p>
                        <p className="text-xs text-white/60">Connect to your Braavos StarkNet wallet</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </Button>
                  
                  <Button
                    onClick={() => setShowAllWallets(true)}
                    className="w-full bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 border border-indigo-500/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Show More Wallet Options
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Wallet Security Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-6 rounded-lg border border-white/5 bg-white/5 backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold mb-3">Security Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-white/70 text-sm">
          <li>Never share your seed phrase or private keys with anyone</li>
          <li>Always verify wallet addresses before sending funds</li>
          <li>Consider using a hardware wallet for large amounts</li>
          <li>Check smart contract permissions before interacting with dApps</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default WalletPage; 