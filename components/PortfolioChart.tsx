"use client";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
  } from 'recharts';
  
  const data = [
    { name: 'Jan', value: 12400 },
    { name: 'Feb', value: 15600 },
    { name: 'Mar', value: 14800 },
    { name: 'Apr', value: 16200 },
    { name: 'May', value: 17800 },
    { name: 'Jun', value: 16800 },
    { name: 'Jul', value: 19200 },
  ];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glassmorphism p-3 rounded-lg border border-white/10">
          <p className="text-xs text-white/70">{label}</p>
          <p className="text-sm font-bold font-mono">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
  
    return null;
  };
  
  const PortfolioChart = () => {
    return (
      <div className="glassmorphism rounded-xl p-4 h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Portfolio Value</h3>
          <div className="text-sm text-white/70">
            <span className="text-flow-teal">+14.8%</span> last 6 months
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} 
              tickFormatter={(tick) => `$${tick.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6C63FF" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default PortfolioChart;
  