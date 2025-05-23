import React from 'react';
import { Target, BarChart3, PieChart, Activity } from 'lucide-react';

const Navigation = ({ currentView, onViewChange }) => {
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'backtesting', label: 'Backtesting', icon: Activity }
  ];

  return (
    <nav className="bg-white rounded-lg shadow p-4">
      <ul className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;