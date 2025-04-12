import React, { useState, useRef, useEffect } from "react";
import { Send, Shield, ExternalLink, Copy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  signature?: string;
  verified?: boolean;
  txHash?: string;
}

interface ChatProps {
  chatId?: string | null;
}

// Simple notification function to replace toast
const showNotification = (message: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
  console.log(`${message.title}${message.description ? ': ' + message.description : ''}`);
};

export function Chat({ chatId }: ChatProps) {
  const { data: session } = useSession();
  const { isConnected, address, connectWallet } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [saveOnChain, setSaveOnChain] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch ENS name when address changes
  useEffect(() => {
    if (address && isValidAddress(address)) {
      fetchEnsName(address);
    } else {
      setEnsName(null);
    }
  }, [address]);

  // Check if string is a valid Ethereum address
  const isValidAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      console.error("Error validating address:", error);
      return false;
    }
  };

  // Fetch chat history when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchChatHistory(chatId);
    } else {
      // Reset to empty chat if no chatId is provided
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch ENS name for the connected wallet
  const fetchEnsName = async (walletAddress: string) => {
    try {
      // Use a public provider with a proper API key or handle errors gracefully
      // Many providers require API keys for production use
      
      // Option 1: Use window.ethereum if available (user's own connected provider)
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const name = await provider.lookupAddress(walletAddress);
          setEnsName(name);
          return;
        } catch (browserProviderError) {
          console.log("Could not use browser provider for ENS lookup, falling back to public provider");
          // Continue to fallback options
        }
      }
      
      // Option 2: Try a public provider with fallback
      try {
        // Only attempt ENS lookup if we have a proper provider URL
        const providerUrl = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL;
        
        // If no provider URL is available, just use the address
        if (!providerUrl) {
          console.log("No Ethereum RPC URL provided for ENS lookup");
          setEnsName(null);
          return;
        }
        
        const provider = new ethers.JsonRpcProvider(providerUrl);
        const name = await provider.lookupAddress(walletAddress);
        setEnsName(name);
      } catch (publicProviderError) {
        console.error("Error with public provider ENS lookup:", publicProviderError);
        setEnsName(null);
      }
    } catch (error) {
      // Catch all possible errors and fail gracefully
      console.error("Error fetching ENS name:", error);
      setEnsName(null);
    }
  };

  // Fetch chat history from the API
  const fetchChatHistory = async (id: string) => {
    if (!session) return;
    
    try {
      setIsFetchingHistory(true);
      
      // Use the proper API endpoint now that it's available
      try {
        const response = await fetch(`/api/chat-history/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chat: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.chatHistory && data.chatHistory.messages) {
          // Format the data to match our Message interface
          const formattedMessages: Message[] = data.chatHistory.messages.map((msg: any) => ({
            id: msg.id || `${id}-${Date.now()}`,
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'ai',
            timestamp: new Date(msg.timestamp || Date.now()),
            signature: msg.signature,
            verified: msg.verified,
            txHash: msg.txHash
          }));
          
          setMessages(formattedMessages);
        } else {
          // If no messages yet, show a welcome message
          setMessages([
            {
              id: `welcome-${Date.now()}`,
              content: "Welcome to FlowPilot AI! How can I help you today?",
              sender: "ai",
              timestamp: new Date(),
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        // Fallback to a welcome message
        setMessages([
          {
            id: `welcome-${Date.now()}`,
            content: "Hello! I'm FlowPilot AI. How can I assist you with DeFi today?",
            sender: "ai",
            timestamp: new Date(),
          }
        ]);
      }
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Sign a message using the user's wallet
  const signMessage = async (message: string): Promise<string | undefined> => {
    if (!address || !window.ethereum) return undefined;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      showNotification({
        title: "Failed to sign message",
        description: "Please check your wallet connection and try again.",
        variant: "destructive",
      });
      return undefined;
    }
  };

  // Verify a message signature
  const verifySignature = (message: string, signature: string, signerAddress: string): boolean => {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  };

  // Save message to the blockchain
  const saveMessageOnChain = async (message: string): Promise<string | undefined> => {
    if (!address || !window.ethereum) return undefined;
    
    try {
      // This function simulates a blockchain operation and returns a mock transaction hash
      // In a real app, this would interact with a smart contract
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      
      // Simulate a blockchain operation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock transaction hash
      return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    } catch (error) {
      console.error("Error saving message to blockchain:", error);
      return undefined;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session) return;
    
    let signature: string | undefined = undefined;
    let txHash: string | undefined = undefined;
    let currentChatId = chatId;
    
    // Get message signature if wallet is connected
    if (isConnected && address) {
      signature = await signMessage(input);
    }
    
    // Save message on chain if option is selected
    if (saveOnChain && isConnected && address) {
      txHash = await saveMessageOnChain(input);
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      signature,
      verified: signature ? true : undefined,
      txHash
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Create a new chat if there isn't a chatId yet
      if (!currentChatId) {
        try {
          // Generate a new unique chat ID
          const newChatId = `chat-${Date.now()}`;
          currentChatId = newChatId;
          
          const createChatResponse = await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: newChatId,
              walletAddress: address,
              message: {
                content: input,
                role: 'user',
                signature,
                verified: signature ? true : undefined,
                txHash
              }
            })
          });
          
          const createChatData = await createChatResponse.json();
          
          if (!createChatResponse.ok) {
            throw new Error(createChatData.error || "Failed to create chat");
          }
          
          // Update the URL to include the new chatId without refreshing the page
          if (window.history) {
            window.history.pushState(
              { chatId: newChatId },
              '',
              `/chat/${newChatId}`
            );
          }
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      } else {
        // Add message to existing chat
        try {
          const addMessageResponse = await fetch(`/api/chat-history/${currentChatId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: input,
              role: 'user',
              signature,
              verified: signature ? true : undefined,
              txHash
            })
          });
          
          if (!addMessageResponse.ok) {
            const errorData = await addMessageResponse.json();
            throw new Error(errorData.error || "Failed to save message");
          }
        } catch (error) {
          console.error("Error saving message:", error);
        }
      }
      
      // Call the advice API for AI response
      const adviceResponse = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          chatId: currentChatId,
          walletAddress: address
        }),
      });
      
      if (!adviceResponse.ok) {
        const errorData = await adviceResponse.json();
        throw new Error(errorData.error || "Failed to get response");
      }
      
      const adviceData = await adviceResponse.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: adviceData.response || "I couldn't generate a response. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openEtherscan = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white/5 border-white/10">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">FlowPilot AI Assistant</h2>
          <p className="text-sm text-white/70">
            Ask me anything about crypto markets, DeFi strategies, and risk management
          </p>
        </div>
        
        {/* Wallet Connection Status */}
        <div className="flex items-center">
          {isConnected && address ? (
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm truncate max-w-[150px]">
                {ensName || `${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
              </span>
            </div>
          ) : (
            <Button 
              onClick={connectWallet} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              size="sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isFetchingHistory ? (
              <motion.div 
                key="loading-history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-40"
              >
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-8 w-8 border-3 border-blue-500 rounded-full border-t-transparent mb-3"></div>
                  <p className="text-white/50">Loading chat history...</p>
                </div>
              </motion.div>
            ) : messages.length === 0 ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-40"
              >
                <p className="text-white/50 text-center">
                  No messages yet. Start a conversation!
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="messages-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {messages.map((message) => (
                  <motion.div
                    key={`chat-message-${message.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex",
                      message.sender === "user" ? "justify-end" : "justify-start" 
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3 relative",
                        message.sender === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : "bg-white/10 text-white"
                      )}
                    >
                      {/* Message verification badge */}
                      {message.sender === "user" && message.verified && (
                        <div 
                          className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                          title="Message verified with wallet signature"
                        >
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      <div className="break-words">{message.content}</div>
                      
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        {/* Transaction hash link */}
                        {message.txHash && (
                          <div className="flex items-center">
                            <button 
                              onClick={() => openEtherscan(message.txHash!)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              title="View on Etherscan"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => copyToClipboard(message.txHash!)}
                              className="ml-1 text-xs text-white/50 hover:text-white/70 transition-colors"
                              title="Copy transaction hash"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {isLoading && (
              <motion.div
                key="loading-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="max-w-[80%] rounded-lg p-3 bg-white/10 text-white">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/50"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/50"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/50"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-white/70 text-sm">FlowPilot is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            {isVerifying && (
              <motion.div
                key="verifying-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="bg-gray-900 p-6 rounded-lg border border-white/10 text-center">
                  <div className="animate-spin h-10 w-10 border-3 border-blue-500 rounded-full border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-lg font-medium mb-2">Please sign the message</p>
                  <p className="text-sm text-white/70">Check your wallet to complete the signature...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-white/10">
        {/* Web3 Options */}
        {isConnected && address && (
          <div className="flex items-center justify-end mb-2">
            <label className="flex items-center text-xs text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={saveOnChain}
                onChange={() => setSaveOnChain(!saveOnChain)}
                className="mr-2 h-3 w-3"
              />
              Store on-chain
            </label>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !session}
            className={`rounded-full p-3 flex items-center justify-center min-w-[40px] h-10 ${
              isLoading || !input.trim() || !session 
                ? 'opacity-50 bg-white/10' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
            }`}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
} 