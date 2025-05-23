import React from 'react';
import { Plus, Calendar } from 'lucide-react';

const GoalsView = ({ goals, onShowWizard }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Investment Goals</h2>
        <button
          onClick={onShowWizard}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = goal.currentAmount && goal.targetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';

          
          return (
            <div key={goal.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  goal.riskTolerance === 'conservative' ? 'bg-green-100 text-green-800' :
                  goal.riskTolerance === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {goal.riskTolerance}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
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
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{daysLeft} days left</span>
                  </div>
                  <span className="text-gray-600">{new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        
        {goals.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-500 mb-4">Start by creating your first investment goal.</p>
            <button
              onClick={onShowWizard}
              className="inline-flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsView;