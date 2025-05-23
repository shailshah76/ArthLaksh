const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { StockData } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const alphaVantageService = require('../services/alphaVantage');

const router = express.Router();

// Search stocks by symbol or company name
router.get('/search', optionalAuth, [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { q, limit = 10 } = req.query;
    const searchTerm = q.toUpperCase();

    // Search in database first
    const stocks = await StockData.findAll({
      where: {
        [StockData.sequelize.Sequelize.Op.or]: [
          {
            symbol: {
              [StockData.sequelize.Sequelize.Op.iLike]: `${searchTerm}%`
            }
          },
          {
            companyName: {
              [StockData.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
            }
          }
        ]
      },
      limit: parseInt(limit),
      order: [['symbol', 'ASC']]
    });

    res.json({
      stocks: stocks.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        sector: stock.sector,
        industry: stock.industry
      }))
    });
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({
      error: 'Failed to search stocks',
      message: 'Internal server error'
    });
  }
});

// Get stock quote by symbol
router.get('/quote/:symbol', optionalAuth, [
  param('symbol').trim().isLength({ min: 1, max: 10 }).withMessage('Valid stock symbol is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const symbol = req.params.symbol.toUpperCase();
    let stock = await StockData.findOne({ where: { symbol } });

    // If stock doesn't exist or data is stale, fetch from API
    if (!stock || stock.isDataStale(15)) {
      try {
        stock = await alphaVantageService.updateStockData(symbol);
      } catch (apiError) {
        if (!stock) {
          return res.status(404).json({
            error: 'Stock not found',
            message: `No data available for symbol: ${symbol}`
          });
        }
        // Use stale data if API fails
        console.warn(`Using stale data for ${symbol}:`, apiError.message);
      }
    }

    res.json({
      stock: {
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: parseFloat(stock.price),
        previousClose: parseFloat(stock.previousClose || 0),
        change: parseFloat(stock.change || 0),
        changePercent: parseFloat(stock.changePercent || 0),
        volume: parseInt(stock.volume || 0),
        marketCap: parseInt(stock.marketCap || 0),
        peRatio: parseFloat(stock.peRatio || 0),
        dividendYield: parseFloat(stock.dividendYield || 0),
        weekHigh52: parseFloat(stock.weekHigh52 || 0),
        weekLow52: parseFloat(stock.weekLow52 || 0),
        beta: parseFloat(stock.beta || 0),
        eps: parseFloat(stock.eps || 0),
        sector: stock.sector,
        industry: stock.industry,
        lastUpdated: stock.lastUpdated
      }
    });
  } catch (error) {
    console.error('Stock quote error:', error);
    res.status(500).json({
      error: 'Failed to get stock quote',
      message: 'Internal server error'
    });
  }
});

// Get multiple stock quotes
router.post('/quotes', optionalAuth, async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Symbols array is required'
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Too many symbols',
        message: 'Maximum 20 symbols allowed per request'
      });
    }

    const results = [];
    const errors = [];

    for (const symbol of symbols) {
      try {
        const upperSymbol = symbol.toUpperCase();
        let stock = await StockData.findOne({ where: { symbol: upperSymbol } });

        if (!stock || stock.isDataStale(15)) {
          try {
            stock = await alphaVantageService.updateStockData(upperSymbol);
          } catch (apiError) {
            if (!stock) {
              errors.push({ symbol: upperSymbol, error: 'Stock not found' });
              continue;
            }
          }
        }

        results.push({
          symbol: stock.symbol,
          companyName: stock.companyName,
          price: parseFloat(stock.price),
          change: parseFloat(stock.change || 0),
          changePercent: parseFloat(stock.changePercent || 0),
          volume: parseInt(stock.volume || 0),
          lastUpdated: stock.lastUpdated
        });
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    }

    res.json({ stocks: results, errors });
  } catch (error) {
    console.error('Multiple quotes error:', error);
    res.status(500).json({
      error: 'Failed to get stock quotes',
      message: 'Internal server error'
    });
  }
});

// Get historical data for a stock
router.get('/history/:symbol', optionalAuth, [
  param('symbol').trim().isLength({ min: 1, max: 10 }).withMessage('Valid stock symbol is required'),
  query('period').optional().isIn(['1d', '5d', '1m', '3m', '6m', '1y', '2y', '5y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const symbol = req.params.symbol.toUpperCase();
    const period = req.query.period || '1m';

    try {
      let data;
      if (period === '1d') {
        data = await alphaVantageService.getIntradayData(symbol, '5min');
      } else {
        data = await alphaVantageService.getDailyData(symbol);
        
        // Filter data based on period
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case '5d':
            startDate.setDate(now.getDate() - 5);
            break;
          case '1m':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case '3m':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case '2y':
            startDate.setFullYear(now.getFullYear() - 2);
            break;
          case '5y':
            startDate.setFullYear(now.getFullYear() - 5);
            break;
        }
        
        data = data.filter(item => new Date(item.date) >= startDate);
      }

      res.json({
        symbol,
        period,
        data: data.slice(0, 500) // Limit response size
      });
    } catch (apiError) {
      res.status(404).json({
        error: 'Historical data not available',
        message: `No historical data found for symbol: ${symbol}`
      });
    }
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({
      error: 'Failed to get historical data',
      message: 'Internal server error'
    });
  }
});

// Get market movers (top gainers/losers)
router.get('/movers', optionalAuth, [
  query('type').optional().isIn(['gainers', 'losers']).withMessage('Type must be gainers or losers'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type = 'gainers', limit = 10 } = req.query;

    let stocks;
    if (type === 'gainers') {
      stocks = await StockData.getTopPerformers(parseInt(limit));
    } else {
      stocks = await StockData.getTopLosers(parseInt(limit));
    }

    res.json({
      type,
      stocks: stocks.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: parseFloat(stock.price),
        change: parseFloat(stock.change || 0),
        changePercent: parseFloat(stock.changePercent || 0),
        volume: parseInt(stock.volume || 0),
        sector: stock.sector
      }))
    });
  } catch (error) {
    console.error('Market movers error:', error);
    res.status(500).json({
      error: 'Failed to get market movers',
      message: 'Internal server error'
    });
  }
});

// Get stocks by sector
router.get('/sector/:sectorName', optionalAuth, [
  param('sectorName').trim().isLength({ min: 1 }).withMessage('Sector name is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sectorName } = req.params;
    const { limit = 20 } = req.query;

    const stocks = await StockData.getBySector(sectorName);

    res.json({
      sector: sectorName,
      stocks: stocks.slice(0, parseInt(limit)).map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: parseFloat(stock.price),
        change: parseFloat(stock.change || 0),
        changePercent: parseFloat(stock.changePercent || 0),
        marketCap: parseInt(stock.marketCap || 0),
        industry: stock.industry
      }))
    });
  } catch (error) {
    console.error('Sector stocks error:', error);
    res.status(500).json({
      error: 'Failed to get sector stocks',
      message: 'Internal server error'
    });
  }
});

// Get available sectors
router.get('/sectors', optionalAuth, async (req, res) => {
  try {
    const sectors = await StockData.findAll({
      attributes: [
        'sector',
        [StockData.sequelize.fn('COUNT', StockData.sequelize.col('sector')), 'count']
      ],
      where: {
        sector: {
          [StockData.sequelize.Sequelize.Op.not]: null
        }
      },
      group: ['sector'],
      order: [[StockData.sequelize.fn('COUNT', StockData.sequelize.col('sector')), 'DESC']]
    });

    res.json({
      sectors: sectors.map(s => ({
        name: s.sector,
        count: parseInt(s.dataValues.count)
      }))
    });
  } catch (error) {
    console.error('Sectors fetch error:', error);
    res.status(500).json({
      error: 'Failed to get sectors',
      message: 'Internal server error'
    });
  }
});

// Admin route to update stock data
router.post('/admin/update', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges (you may want to add role-based auth)
    const { symbols } = req.body;
    
    let symbolsToUpdate;
    if (symbols && Array.isArray(symbols)) {
      symbolsToUpdate = symbols.slice(0, 20); // Limit to 20 symbols
    } else {
      symbolsToUpdate = alphaVantageService.getPopularSymbols().slice(0, 10);
    }

    const result = await alphaVantageService.batchUpdateStocks(symbolsToUpdate);

    res.json({
      message: 'Stock data update initiated',
      updated: result.results.length,
      errors: result.errors.length,
      details: result
    });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({
      error: 'Failed to update stock data',
      message: 'Internal server error'
    });
  }
});

// Get popular/trending stocks
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const popularSymbols = alphaVantageService.getPopularSymbols();
    const stocks = await StockData.findAll({
      where: {
        symbol: {
          [StockData.sequelize.Sequelize.Op.in]: popularSymbols
        }
      },
      limit: parseInt(limit),
      order: [['marketCap', 'DESC']]
    });

    res.json({
      stocks: stocks.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: parseFloat(stock.price),
        change: parseFloat(stock.change || 0),
        changePercent: parseFloat(stock.changePercent || 0),
        marketCap: parseInt(stock.marketCap || 0),
        sector: stock.sector,
        volume: parseInt(stock.volume || 0)
      }))
    });
  } catch (error) {
    console.error('Popular stocks error:', error);
    res.status(500).json({
      error: 'Failed to get popular stocks',
      message: 'Internal server error'
    });
  }
});

module.exports = router;