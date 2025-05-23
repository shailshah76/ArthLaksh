// Utility functions for formatting data
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export const calculateProgress = (current, target) => {
  return Math.min((current / target) * 100, 100);
};

export const calculateDaysLeft = (targetDate) => {
  return Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
};