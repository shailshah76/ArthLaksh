import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Settings } from 'lucide-react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import GoalWizard from './components/GoalWizard';
import GoalsView from './components/GoalsView';
import Portfolio from './components/Portfolio';
import Backtesting from './components/Backtesting';
import { api } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showGoalWizard, setShowGoalWizard] = useState(false);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [goalsData, portfolioData, perfData] = await Promise.all([
          api.getGoals(),
          api.getPortfolio(),
          api.getPerformanceData()
        ]);
        setGoals(goalsData);
        setPortfolio(portfolioData);
        setPerformanceData(perfData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveGoal = async (goalData) => {
    try {
      const newGoal = await api.createGoal(goalData);
      setGoals([...goals, newGoal]);
      setShowGoalWizard(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard goals={goals} portfolio={portfolio} performanceData={performanceData} />;
      case 'goals':
        return <GoalsView goals={goals} onShowWizard={() => setShowGoalWizard(true)} />;
      case 'portfolio':
        return <Portfolio portfolio={portfolio} />;
      case 'backtesting':
        return <Backtesting />;
      default:
        return <Dashboard goals={goals} portfolio={portfolio} performanceData={performanceData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold">InvestmentPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowGoalWizard(true)}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Goal</span>
              </button>
              <Settings className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <Navigation currentView={currentView} onViewChange={setCurrentView} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderCurrentView()}
          </div>
        </div>
      </div>

      {/* Goal Wizard Modal */}
      {showGoalWizard && (
        <GoalWizard 
          onClose={() => setShowGoalWizard(false)} 
          onSave={handleSaveGoal}
        />
      )}
    </div>
  );
}

export default App;