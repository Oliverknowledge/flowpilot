"use client";
import LiquidityPoolCard from './LiquidityPoolCard';
import PortfolioChart from './PortfolioChart';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, BarChart4, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const poolData = [
  {
    poolName: 'Uniswap V3',
    token1: 'ETH',
    token2: 'USDC',
    balance: '$8,240',
    apr: '4.2%',
    aprChange: 0.8,
    ilRisk: 'Medium' as const,
    recommendation: 'Reduce position by 30% to minimize impermanent loss risk.'
  },
  {
    poolName: 'Curve',
    token1: 'USDT',
    token2: 'USDC',
    balance: '$5,680',
    apr: '2.8%',
    aprChange: -0.3,
    ilRisk: 'Low' as const,
  },
  {
    poolName: 'Balancer',
    token1: 'wBTC',
    token2: 'ETH',
    balance: '$3,920',
    apr: '5.1%',
    aprChange: 1.2,
    ilRisk: 'High' as const,
    recommendation: 'Increase position by 20% to take advantage of rising APR.'
  },
  {
    poolName: 'Sushiswap',
    token1: 'DAI',
    token2: 'ETH',
    balance: '$2,150',
    apr: '3.7%',
    aprChange: 0.2,
    ilRisk: 'Medium' as const,
  }
];

const LiquidityDashboard = () => {
  return (
    <section id="dashboard" className="py-20">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Intelligent <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Liquidity Dashboard</span>
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Visualize your liquidity positions across multiple protocols and receive
          AI-powered recommendations to optimize yield and reduce impermanent loss.
        </p>
      </motion.div>
      
      <motion.div 
        className="p-6 rounded-lg border border-white/5 relative overflow-hidden"
        style={{
          background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <motion.div 
                className="flex-1 p-4 rounded-lg border border-white/5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  backdropFilter: "blur(10px)"
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px] -z-10 opacity-20 bg-blue-500" />
                <div className="flex items-center mb-2">
                  <Wallet className="mr-2 text-blue-400" size={20} />
                  <h3 className="font-medium">Total Value</h3>
                </div>
                <div className="text-2xl font-bold font-mono">$19,990</div>
                <div className="text-green-400 text-sm mt-1">+2.4% (24h)</div>
              </motion.div>
              
              <motion.div 
                className="flex-1 p-4 rounded-lg border border-white/5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  backdropFilter: "blur(10px)"
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px] -z-10 opacity-20 bg-green-500" />
                <div className="flex items-center mb-2">
                  <BarChart4 className="mr-2 text-green-400" size={20} />
                  <h3 className="font-medium">Avg APR</h3>
                </div>
                <div className="text-2xl font-bold font-mono">3.8%</div>
                <div className="text-green-400 text-sm mt-1">+0.6% from prev month</div>
              </motion.div>
              
              <motion.div 
                className="flex-1 p-4 rounded-lg border border-white/5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  backdropFilter: "blur(10px)"
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px] -z-10 opacity-20 bg-yellow-500" />
                <div className="flex items-center mb-2">
                  <ArrowRightLeft className="mr-2 text-yellow-400" size={20} />
                  <h3 className="font-medium">IL Saved</h3>
                </div>
                <div className="text-2xl font-bold font-mono">$842</div>
                <div className="text-green-400 text-sm mt-1">Last 30 days</div>
              </motion.div>
            </div>
            
            <PortfolioChart />
          </div>
          
          <div className="lg:w-1/3 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Your Liquidity Pools</h3>
              <Button 
                variant="outline" 
                className="text-xs h-8 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              >
                View All
              </Button>
            </div>
            
            <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4">
              {poolData.map((pool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                >
                  <LiquidityPoolCard {...pool} />
                </motion.div>
              ))}
            </div>
            
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg">
              Rebalance All
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default LiquidityDashboard;
