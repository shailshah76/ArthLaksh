import React, { useState } from 'react';

const GoalWizard = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [goalData, setGoalData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    riskTolerance: 'moderate',
    monthlyContribution: ''
  });

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSave = () => {
    onSave(goalData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Investment Goal</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`flex-1 h-2 ${step > 1 ? 'bg-blue-500' : 'bg-gray-200'} rounded`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>2</div>
            <div className={`flex-1 h-2 ${step > 2 ? 'bg-blue-500' : 'bg-gray-200'} rounded`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>3</div>
          </div>
        </div>

        {/* Step 1: Goal Details */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Goal Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Name</label>
                <input
                  type="text"
                  value={goalData.name}
                  onChange={(e) => setGoalData({...goalData, name: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Retirement Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Amount</label>
                <input
                  type="number"
                  value={goalData.targetAmount}
                  onChange={(e) => setGoalData({...goalData, targetAmount: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalData.targetDate}
                  onChange={(e) => setGoalData({...goalData, targetDate: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button 
              onClick={handleNext} 
              disabled={!goalData.name || !goalData.targetAmount || !goalData.targetDate}
              className="w-full mt-6 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Risk Tolerance */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Risk Tolerance</h3>
            <div className="space-y-3">
              {['conservative', 'moderate', 'aggressive'].map((risk) => (
                <label key={risk} className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="riskTolerance"
                    value={risk}
                    checked={goalData.riskTolerance === risk}
                    onChange={(e) => setGoalData({...goalData, riskTolerance: e.target.value})}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="font-medium capitalize">{risk}</div>
                    <div className="text-sm text-gray-600">
                      {risk === 'conservative' && 'Lower risk, steady returns'}
                      {risk === 'moderate' && 'Balanced risk and growth'}
                      {risk === 'aggressive' && 'Higher risk, higher potential returns'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex space-x-2 mt-6">
              <button onClick={handlePrev} className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button onClick={handleNext} className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Monthly Contribution */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Contribution</h3>
            <div>
              <label className="block text-sm font-medium mb-1">How much can you invest monthly?</label>
              <input
                type="number"
                value={goalData.monthlyContribution}
                onChange={(e) => setGoalData({...goalData, monthlyContribution: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="500"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Based on your inputs, you're on track to reach your goal with a monthly contribution of ${goalData.monthlyContribution}.
              </p>
            </div>
            <div className="flex space-x-2 mt-6">
              <button onClick={handlePrev} className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button 
                onClick={handleSave} 
                disabled={!goalData.monthlyContribution}
                className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalWizard;