"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';

interface WalletConnectionProps {
  onConnect: () => void;
}

const WalletConnection = ({ onConnect }: WalletConnectionProps) => {
  const { connectWallet, error, isConnected } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      onConnect();
    } catch (err) {
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-flow bg-flow-size animate-flow rounded-full flex items-center justify-center">
        <Wallet className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <p className="text-white/70 mb-8 max-w-md mx-auto">
        To use FlowPilot's AI features, please connect your wallet. This allows us to analyze your portfolio and provide personalized recommendations.
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      <Button
        onClick={handleConnect}
        disabled={isConnecting || isConnected}
        className="bg-gradient-flow bg-flow-size animate-flow text-white px-8 py-6 text-lg"
      >
        {isConnecting ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Connecting...
          </div>
        ) : isConnected ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Connected
          </div>
        ) : (
          <div className="flex items-center gap-2">
            Connect Wallet
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </Button>

      <p className="text-white/50 text-sm mt-4">
        We support MetaMask, WalletConnect, and other popular wallets
      </p>
    </motion.div>
  );
};

export default WalletConnection; 