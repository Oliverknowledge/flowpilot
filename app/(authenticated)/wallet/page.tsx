"use client"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, Trash2, ArrowLeft, Shield, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

const WalletPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Session protection - redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/account');
    }
  }, [status, router]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      // Show success message or update UI
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Show error message to user
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectWallet();
      // Show success message or update UI
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Show error message to user
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Wallet Section */}
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
          
          <h2 className="text-xl font-bold mb-4">Connected Wallet</h2>
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-white/10 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent" />
                <p className="text-sm text-white/70 relative z-10">Wallet Address</p>
                <div className="flex items-center justify-between relative z-10">
                  <p className="font-medium">{address}</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={copyToClipboard} 
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 border-none p-1 h-8 w-8"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button 
                      onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 border-none p-1 h-8 w-8"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-white/70">MetaMask</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleDisconnectWallet}
                className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 border border-red-500/20"
                disabled={isDisconnecting}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-blue-400" />
                </div>
              </motion.div>
              <p className="text-white/70 mb-6">No wallet connected</p>
              <Button
                onClick={handleConnectWallet}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
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
          
          <h2 className="text-xl font-bold mb-4">Add New Wallet</h2>
          <div className="space-y-6">
            <p className="text-white/70">
              Connect a new wallet to manage multiple addresses or switch between different accounts.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "MetaMask", icon: "🦊" },
                { name: "Coinbase", icon: "🔵" },
                { name: "WalletConnect", icon: "🔗" },
                { name: "Ledger", icon: "🛡️" }
              ].map(wallet => (
                <motion.button
                  key={wallet.name}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="text-sm">{wallet.name}</span>
                </motion.button>
              ))}
            </div>
            
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              disabled={isConnecting}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect New Wallet'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Additional Information */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-6 rounded-lg border border-white/5 relative overflow-hidden"
        style={{
          background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}
      >
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] -z-10" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold">About Wallets</h2>
        </div>
        
        <div className="space-y-4 text-white/70">
          <p>
            Your wallet is your gateway to the blockchain. It allows you to:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Securely store and manage your cryptocurrencies",
              "Connect to decentralized applications",
              "Sign transactions and messages",
              "Manage multiple addresses from different networks"
            ].map((item, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-4 p-3 rounded-lg border border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
            <p className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              We never store your private keys. All wallet operations are performed locally in your browser.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletPage; 