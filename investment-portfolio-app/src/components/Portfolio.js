import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const Portfolio = ({ portfolio }) => {
  const totalValue = portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Holdings</h3>
          <div className="space-y-4">
            {portfolio.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                  <div className="text-sm">{stock.shares} shares @ ${stock.currentPrice}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${stock.totalValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{stock.allocation}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Allocation</h3>
          <div className="flex justify-center">
            <PieChart width={300} height={200}>
              <Pie
                data={portfolio}
                cx={150}
                cy={100}
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="allocation"
              >
                {portfolio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </div>
          <div className="mt-4 space-y-2">
            {portfolio.map((stock, index) => (
              <div key={stock.symbol} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm">{stock.symbol}: {stock.allocation}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;