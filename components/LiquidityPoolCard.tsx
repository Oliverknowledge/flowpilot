import { ArrowUp, ArrowDown } from 'lucide-react';

interface LiquidityPoolCardProps {
  poolName: string;
  token1: string;
  token2: string;
  balance: string;
  apr: string;
  aprChange: number;
  ilRisk: 'Low' | 'Medium' | 'High';
  recommendation?: string;
}

const LiquidityPoolCard = ({
  poolName,
  token1,
  token2,
  balance,
  apr,
  aprChange,
  ilRisk,
  recommendation
}: LiquidityPoolCardProps) => {
  return (
    <div className="glassmorphism rounded-xl p-4 card-shine">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium font-mono">{poolName}</h3>
          <div className="flex items-center mt-1">
            <div className="bg-white/10 text-xs px-2 py-1 rounded flex items-center mr-2">
              {token1}
            </div>
            <div className="bg-white/10 text-xs px-2 py-1 rounded flex items-center">
              {token2}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono">{balance}</div>
          <div className="flex items-center justify-end mt-1">
            <span className="text-sm mr-1">{apr} APR</span>
            {aprChange > 0 ? (
              <div className="flex items-center text-green-400 text-xs">
                <ArrowUp size={12} />
                {aprChange}%
              </div>
            ) : (
              <div className="flex items-center text-red-400 text-xs">
                <ArrowDown size={12} />
                {Math.abs(aprChange)}%
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3 text-sm">
        <div className="flex items-center">
          <div className="mr-2">IL Risk:</div>
          <div className={`px-2 py-0.5 rounded text-xs ${
            ilRisk === 'Low' ? 'bg-green-500/20 text-green-400' :
            ilRisk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {ilRisk}
          </div>
        </div>
      </div>
      
      {recommendation && (
        <div className="mt-3 p-2 border border-flow-purple/30 bg-flow-indigo/20 rounded-lg text-xs">
          <div className="font-medium text-flow-teal mb-1">AI Recommendation:</div>
          <p className="text-white/80">{recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default LiquidityPoolCard;
