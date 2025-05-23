const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Portfolio, StockData } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const alphaVantageService = require('../services/alphaVantage');

const router = express.Router();

// Get user's complete portfolio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const portfolioItems = await Portfolio.findAll({
      where: { userId: req.user.id },
      order: [['symbol', 'ASC']]
    });

    // Update current prices for all holdings
    const symbols = portfolioItems.map(item => item.symbol);
    if (symbols.length > 0) {
      try {
        await Promise.all(
          symbols.map(async (symbol) => {
            const stock = await StockData.findOne({ where: { symbol } });
            if (!stock || stock.isDataStale(15)) {
              await alphaVantageService.updateStockData(symbol);
            }
          })
        );
      } catch (error) {
        console.warn('Failed to update some stock prices:', error.message);
      }
    }

    // Get updated portfolio with current prices
    const updatedPortfolio = await Portfolio.findAll({
      where: { userId: req.user.id },
      include: [{
        model: StockData,
        as: 'stockData',
        required: false
      }],
      order: [['symbol', 'ASC']]
    });

    const portfolioWithMetrics = updatedPortfolio.map(item => {
      const currentPrice = item.stockData?.price || item.averageCost;
      const totalValue = parseFloat(item.shares) * parseFloat(currentPrice);
      const totalCost = parseFloat(item.shares) * parseFloat(item.averageCost);
      const gainLoss = totalValue - totalCost;
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      return {
        id: item.id,
        symbol: item.symbol,
        companyName: item.companyName || item.stockData?.companyName,
        shares: parseFloat(item.shares),
        averageCost: parseFloat(item.averageCost),
        currentPrice: parseFloat(currentPrice),
        totalValue,
        totalCost,
        gainLoss,
        gainLossPercent,
        sector: item.sector || item.stockData?.sector,
        industry: item.industry || item.stockData?.industry,
        lastUpdated: item.lastUpdated
      };
    });

    const totalPortfolioValue = portfolioWithMetrics.reduce((sum, item) => sum + item.totalValue, 0);
    const totalPortfolioCost = portfolioWithMetrics.reduce((sum, item) => sum + item.totalCost, 0);

    // Calculate allocation percentages
    const portfolioWithAllocation = portfolioWithMetrics.map(item => ({
      ...item,
      allocation: totalPortfolioValue > 0 ? (item.totalValue / totalPortfolioValue) * 100 : 0
    }));

    res.json({
      portfolio: portfolioWithAllocation,
      summary: {
        totalValue: totalPortfolioValue,
        totalCost: totalPortfolioCost,
        totalGainLoss: totalPortfolioValue - totalPortfolioCost,
        totalGainLossPercent: totalPortfolioCost > 0 ? ((totalPortfolioValue - totalPortfolioCost) / totalPortfolioCost) * 100 : 0,
        totalPositions: portfolioWithAllocation.length
      }
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: 'Internal server error'
    });
  }
});

// Add stock to portfolio
router.post('/positions', authenticateToken, [
  body('symbol').trim().isLength({ min: 1, max: 10 }).withMessage('Valid stock symbol is required'),
  body('shares').isFloat({ min: 0.0001 }).withMessage('Shares must be a positive number'),
  body('averageCost').isFloat({ min: 0.01 }).withMessage('Average cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { symbol, shares, averageCost } = req.body;
    const upperSymbol = symbol.toUpperCase();

    // Get or update stock data
    let stockData;
    try {
      stockData = await alphaVantageService.updateStockData(upperSymbol);
    } catch (error) {
      console.warn(`Failed to get stock data for ${upperSymbol}:`, error.message);
    }

    // Check if position already exists
    const existingPosition = await Portfolio.findOne({
      where: { 
        userId: req.user.id, 
        symbol: upperSymbol 
      }
    });

    if (existingPosition) {
      // Update existing position (average cost calculation)
      const currentShares = parseFloat(existingPosition.shares);
      const currentCost = parseFloat(existingPosition.averageCost);
      const newShares = parseFloat(shares);
      const newCost = parseFloat(averageCost);

      const totalShares = currentShares + newShares;
      const weightedAverageCost = ((currentShares * currentCost) + (newShares * newCost)) / totalShares;

      await existingPosition.update({
        shares: totalShares,
        averageCost: weightedAverageCost,
        currentPrice: stockData?.price || null,
        companyName: stockData?.companyName || existingPosition.companyName,
        sector: stockData?.sector || existingPosition.sector,
        industry: stockData?.industry || existingPosition.industry,
        lastUpdated: new Date()
      });

      res.json({
        message: 'Position updated successfully',
        position: existingPosition
      });
    } else {
      // Create new position
      const newPosition = await Portfolio.create({
        userId: req.user.id,
        symbol: upperSymbol,
        shares: parseFloat(shares),
        averageCost: parseFloat(averageCost),
        currentPrice: stockData?.price || null,
        companyName: stockData?.companyName || null,
        sector: stockData?.sector || null,
        industry: stockData?.industry || null
      });

      res.status(201).json({
        message: 'Position added successfully',
        position: newPosition
      });
    }
  } catch (error) {
    console.error('Add position error:', error);
    res.status(500).json({
      error: 'Failed to add position',
      message: 'Internal server error'
    });
  }
});

// Update portfolio position
router.put('/positions/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid position ID is required'),
  body('shares').optional().isFloat({ min: 0 }).withMessage('Shares must be a positive number'),
  body('averageCost').optional().isFloat({ min: 0.01 }).withMessage('Average cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const position = await Portfolio.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!position) {
      return res.status(404).json({
        error: 'Position not found',
        message: 'Position does not exist or you do not have permission to access it'
      });
    }

    const updates = {};
    if (req.body.shares !== undefined) updates.shares = parseFloat(req.body.shares);
    if (req.body.averageCost !== undefined) updates.averageCost = parseFloat(req.body.averageCost);
    
    // If shares is 0, delete the position
    if (updates.shares === 0) {
      await position.destroy();
      return res.json({
        message: 'Position removed successfully'
      });
    }

    updates.lastUpdated = new Date();
    await position.update(updates);

    res.json({
      message: 'Position updated successfully',
      position: position
    });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({
      error: 'Failed to update position',
      message: 'Internal server error'
    });
  }
});

// Delete portfolio position
router.delete('/positions/:id', authenticateToken, [
  param('id').isUUID().withMessage('Valid position ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const position = await Portfolio.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!position) {
      return res.status(404).json({
        error: 'Position not found',
        message: 'Position does not exist or you do not have permission to access it'
      });
    }

    await position.destroy();

    res.json({
      message: 'Position deleted successfully'
    });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({
      error: 'Failed to delete position',
      message: 'Internal server error'
    });
  }
});

// Get portfolio performance over time
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { period = '1m' } = req.query;
    
    // This is a simplified version - in a real app, you'd store historical portfolio values
    const portfolioItems = await Portfolio.findAll({
      where: { userId: req.user.id }
    });

    if (portfolioItems.length === 0) {
      return res.json({
        performance: [],
        message: 'No portfolio data available'
      });
    }

    // Get historical data for each stock and calculate portfolio value over time
    const symbols = portfolioItems.map(item => item.symbol);
    const performanceData = [];

    try {
      // Get sample historical data (you'd expand this for real historical portfolio tracking)
      const sampleData = await alphaVantageService.getDailyData(symbols[0]);
      
      // Calculate portfolio value for recent dates (simplified)
      const recentData = sampleData.slice(0, 30).map((data, index) => {
        const totalValue = portfolioItems.reduce((sum, item) => {
          const mockPrice = parseFloat(data.close) * (0.9 + Math.random() * 0.2); // Mock variation
          return sum + (parseFloat(item.shares) * mockPrice);
        }, 0);

        return {
          date: data.date,
          value: totalValue,
          change: index === 0 ? 0 : totalValue - performanceData[index - 1]?.value || 0
        };
      });

      res.json({
        performance: recentData.reverse(),
        period,
        symbols
      });
    } catch (error) {
      res.json({
        performance: [],
        error: 'Historical data not available',
        message: 'Unable to fetch performance data'
      });
    }
  } catch (error) {
    console.error('Portfolio performance error:', error);
    res.status(500).json({
      error: 'Failed to get portfolio performance',
      message: 'Internal server error'
    });
  }
});

// Get portfolio allocation by sector
router.get('/allocation', authenticateToken, async (req, res) => {
  try {
    const portfolioItems = await Portfolio.findAll({
      where: { userId: req.user.id },
      include: [{
        model: StockData,
        as: 'stockData',
        required: false
      }]
    });

    if (portfolioItems.length === 0) {
      return res.json({
        sectors: [],
        message: 'No portfolio data available'
      });
    }

    // Calculate total portfolio value
    const totalValue = portfolioItems.reduce((sum, item) => {
      const currentPrice = item.stockData?.price || item.averageCost;
      return sum + (parseFloat(item.shares) * parseFloat(currentPrice));
    }, 0);

    // Group by sector
    const sectorAllocation = {};
    portfolioItems.forEach(item => {
      const sector = item.sector || item.stockData?.sector || 'Unknown';
      const currentPrice = item.stockData?.price || item.averageCost;
      const value = parseFloat(item.shares) * parseFloat(currentPrice);
      
      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = {
          sector,
          value: 0,
          percentage: 0,
          positions: []
        };
      }
      
      sectorAllocation[sector].value += value;
      sectorAllocation[sector].positions.push({
        symbol: item.symbol,
        companyName: item.companyName || item.stockData?.companyName,
        value,
        shares: parseFloat(item.shares)
      });
    });

    // Calculate percentages
    Object.values(sectorAllocation).forEach(sector => {
      sector.percentage = totalValue > 0 ? (sector.value / totalValue) * 100 : 0;
    });

    res.json({
      sectors: Object.values(sectorAllocation).sort((a, b) => b.value - a.value),
      totalValue
    });
  } catch (error) {
    console.error('Portfolio allocation error:', error);
    res.status(500).json({
      error: 'Failed to get portfolio allocation',
      message: 'Internal server error'
    });
  }
});

// Get portfolio statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const portfolioItems = await Portfolio.findAll({
      where: { userId: req.user.id },
      include: [{
        model: StockData,
        as: 'stockData',
        required: false
      }]
    });

    if (portfolioItems.length === 0) {
      return res.json({
        stats: {
          totalPositions: 0,
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          diversificationScore: 0,
          topPerformer: null,
          worstPerformer: null
        }
      });
    }

    let totalValue = 0;
    let totalCost = 0;
    let bestPerformer = null;
    let worstPerformer = null;
    let bestGainPercent = -Infinity;
    let worstGainPercent = Infinity;

    const positionsWithMetrics = portfolioItems.map(item => {
      const currentPrice = parseFloat(item.stockData?.price || item.averageCost);
      const shares = parseFloat(item.shares);
      const avgCost = parseFloat(item.averageCost);
      
      const positionValue = shares * currentPrice;
      const positionCost = shares * avgCost;
      const gainLoss = positionValue - positionCost;
      const gainLossPercent = positionCost > 0 ? (gainLoss / positionCost) * 100 : 0;

      totalValue += positionValue;
      totalCost += positionCost;

      if (gainLossPercent > bestGainPercent) {
        bestGainPercent = gainLossPercent;
        bestPerformer = {
          symbol: item.symbol,
          companyName: item.companyName || item.stockData?.companyName,
          gainLossPercent
        };
      }

      if (gainLossPercent < worstGainPercent) {
        worstGainPercent = gainLossPercent;
        worstPerformer = {
          symbol: item.symbol,
          companyName: item.companyName || item.stockData?.companyName,
          gainLossPercent
        };
      }

      return {
        symbol: item.symbol,
        value: positionValue,
        gainLossPercent
      };
    });

    // Calculate diversification score (simplified)
    const sectors = new Set(portfolioItems.map(item => item.sector || item.stockData?.sector || 'Unknown'));
    const diversificationScore = Math.min((sectors.size / portfolioItems.length) * 100, 100);

    const stats = {
      totalPositions: portfolioItems.length,
      totalValue,
      totalCost,
      totalGainLoss: totalValue - totalCost,
      totalGainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      diversificationScore,
      topPerformer: bestPerformer,
      worstPerformer: worstPerformer,
      uniqueSectors: sectors.size
    };

    res.json({ stats });
  } catch (error) {
    console.error('Portfolio stats error:', error);
    res.status(500).json({
      error: 'Failed to get portfolio statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;