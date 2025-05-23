const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  // Goals endpoints
  async getGoals(token) {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async createGoal(goalData, token) {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goalData)
    });
    return response.json();
  },

  // Portfolio endpoints
  async getPortfolio(token) {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Stock endpoints
  async getStockQuote(symbol) {
    const response = await fetch(`${API_BASE_URL}/stocks/quote/${symbol}`);
    return response.json();
  },

  async searchStocks(query) {
    const response = await fetch(`${API_BASE_URL}/stocks/search?q=${query}`);
    return response.json();
  }
};