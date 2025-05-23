import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Backtesting = () => {
  const [backtestData, setBacktestData] = useState([]);
  const [strategy, setStrategy] = useState('buy-hold');
  
  useEffect(() => {
    // Mock backtest data
    const mockData = [
      { date: '2020-01', strategy: 15000, benchmark: 14500 },
      { date: '2020-06', strategy: 18500, benchmark: 17200 },
      { date: '2021-01', strategy: 22000, benchmark: 20800 },
      { date: '2021-06', strategy: 26500, benchmark: 24300 },
      { date: '2022-01', strategy: 24800, benchmark: 23100 },
      { date: '2022-06', strategy: 21200, benchmark: 19800 },
      { date: '2023-01', strategy: 28900, benchmark: 26400 },
      { date: '2023-06', strategy: 34200, benchmark: 31800 },
      { date: '2024-01', strategy: 38700, benchmark: 35200 },
      { date: '2024-06', strategy: 42300, benchmark: 38900 }
    ];
    setBacktestData(mockData);
  }, [strategy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Backtesting</h2>
        <select 
          value={strategy} 
          onChange={(e) => setStrategy(e.target.value)}
          className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="buy-hold">Buy & Hold</option>
          <option value="dca">Dollar Cost Average</option>
          <option value="momentum">Momentum Strategy</option>
        </select>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">+180.2%</div>
          <div className="text-gray-600">Strategy Return</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">+158.9%</div>
          <div className="text-gray-600">Benchmark Return</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">+21.3%</div>
          <div className="text-gray-600">Alpha Generated</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Historical Performance</h3>
        <div className="w-full overflow-x-auto">
          <LineChart width={800} height={400} data={backtestData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="strategy" stroke="#8884d8" name="Your Strategy" strokeWidth={2} />
            <Line type="monotone" dataKey="benchmark" stroke="#82ca9d" name="Benchmark" strokeWidth={2} />
          </LineChart>
        </div>
      </div>

      {/* Strategy Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Strategy Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">1.23</div>
            <div className="text-gray-600">Sharpe Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">-12.4%</div>
            <div className="text-gray-600">Max Drawdown</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">15.8%</div>
            <div className="text-gray-600">Volatility</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">0.89</div>
            <div className="text-gray-600">Beta</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backtesting;