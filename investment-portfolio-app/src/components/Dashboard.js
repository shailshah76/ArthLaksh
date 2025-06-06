import React, { useEffect, useState, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, Target, TrendingUp } from 'lucide-react';
import axios from '../services/axiosConfig';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { authenticated } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [goalsRes, portfolioRes, performanceRes, profileRes] = await Promise.all([
          axios.get('/goals'),
          axios.get('/portfolio'),
          axios.get('/performance'),
          axios.get('/user/profile')
        ]);
        setGoals(goalsRes.data);
        setPortfolio(portfolioRes.data);
        setPerformanceData(performanceRes.data);
        setProfile(profileRes.data);
      } catch (error) {
        console.error('Error loading ArthLaksh data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated) fetchData();
  }, [authenticated]);

  const totalPortfolioValue = portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-blue-600">ArthLaksh</h2>
          {profile && (
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-800">Welcome, {profile.firstName} {profile.lastName}</h3>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</div>
                <div className="text-gray-600">Portfolio Value</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{goals.length}</div>
                <div className="text-gray-600">Active Goals</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">+12.5%</div>
                <div className="text-gray-600">YTD Return</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Performance vs S&P 500</h3>
            <LineChart width={400} height={250} data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="portfolio" stroke="#8884d8" name="Your Portfolio" />
              <Line type="monotone" dataKey="sp500" stroke="#82ca9d" name="S&P 500" />
            </LineChart>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Goal Progress</h3>
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>${goal.currentAmount?.toLocaleString() ?? '0'}</span>
                      <span>${goal.targetAmount?.toLocaleString() ?? '0'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
