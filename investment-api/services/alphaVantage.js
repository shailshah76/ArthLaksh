const axios = require('axios');
const { StockData } = require('../models');

class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  // Rate limiting: Alpha Vantage allows 5 requests per minute for free tier
  async rateLimitCheck() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 12000) { // 12 seconds between requests
      const waitTime = 12000 - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  async makeRequest(params) {
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    await this.rateLimitCheck();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          ...params,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${response.data['Error Message']}`);
      }

      if (response.data['Note']) {
        throw new Error('Alpha Vantage API rate limit exceeded');
      }

      return response.data;
    } catch (error) {
      console.error('Alpha Vantage API request failed:', error.message);
      throw error;
    }
  }

  async getQuote(symbol) {
    try {
      const data = await this.makeRequest({
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase()
      });

      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getCompanyOverview(symbol) {
    try {
      const data = await this.makeRequest({
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase()
      });

      if (!data.Symbol) {
        throw new Error(`No company data found for symbol: ${symbol}`);
      }

      return {
        symbol: data.Symbol,
        companyName: data.Name,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: parseInt(data.MarketCapitalization) || null,
        peRatio: parseFloat(data.PERatio) || null,
        dividendYield: parseFloat(data.DividendYield) || null,
        weekHigh52: parseFloat(data['52WeekHigh']) || null,
        weekLow52: parseFloat(data['52WeekLow']) || null,
        beta: parseFloat(data.Beta) || null,
        eps: parseFloat(data.EPS) || null
      };
    } catch (error) {
      console.error(`Failed to get company overview for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getIntradayData(symbol, interval = '5min') {
    try {
      const data = await this.makeRequest({
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol.toUpperCase(),
        interval: interval
      });

      const timeSeriesKey = `Time Series (${interval})`;
      const timeSeries = data[timeSeriesKey];

      if (!timeSeries) {
        throw new Error(`No intraday data found for symbol: ${symbol}`);
      }

      // Convert to array format
      return Object.entries(timeSeries).map(([timestamp, values]) => ({
        timestamp: new Date(timestamp),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      })).slice(0, 100); // Limit to recent 100 data points
    } catch (error) {
      console.error(`Failed to get intraday data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getDailyData(symbol, outputSize = 'compact') {
    try {
      const data = await this.makeRequest({
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol: symbol.toUpperCase(),
        outputsize: outputSize
      });

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error(`No daily data found for symbol: ${symbol}`);
      }

      return Object.entries(timeSeries).map(([date, values]) => ({
        date: new Date(date),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        adjustedClose: parseFloat(values['5. adjusted close']),
        volume: parseInt(values['6. volume']),
        dividendAmount: parseFloat(values['7. dividend amount'])
      }));
    } catch (error) {
      console.error(`Failed to get daily data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async updateStockData(symbol) {
    try {
      // Get quote and company overview in parallel
      const [quote, overview] = await Promise.all([
        this.getQuote(symbol).catch(() => null),
        this.getCompanyOverview(symbol).catch(() => null)
      ]);

      if (!quote) {
        throw new Error(`Failed to get quote data for ${symbol}`);
      }

      // Combine data
      const stockData = {
        symbol: symbol.toUpperCase(),
        price: quote.price,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        lastUpdated: new Date()
      };

      // Add company data if available
      if (overview) {
        Object.assign(stockData, {
          companyName: overview.companyName,
          sector: overview.sector,
          industry: overview.industry,
          marketCap: overview.marketCap,
          peRatio: overview.peRatio,
          dividendYield: overview.dividendYield,
          weekHigh52: overview.weekHigh52,
          weekLow52: overview.weekLow52,
          beta: overview.beta,
          eps: overview.eps
        });
      }

      // Update database
      const [stockRecord, created] = await StockData.upsert(stockData, {
        where: { symbol: symbol.toUpperCase() }
      });

      console.log(`${created ? 'Created' : 'Updated'} stock data for ${symbol}`);
      return stockRecord;
    } catch (error) {
      console.error(`Failed to update stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async batchUpdateStocks(symbols) {
    const results = [];
    const errors = [];

    for (const symbol of symbols) {
      try {
        const result = await this.updateStockData(symbol);
        results.push(result);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    }

    return { results, errors };
  }

  // Get popular stock symbols for demo purposes
  getPopularSymbols() {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
      'META', 'NVDA', 'NFLX', 'DIS', 'V',
      'JPM', 'JNJ', 'WMT', 'PG', 'UNH',
      'HD', 'MA', 'BAC', 'XOM', 'CVX'
    ];
  }
}

module.exports = new AlphaVantageService();