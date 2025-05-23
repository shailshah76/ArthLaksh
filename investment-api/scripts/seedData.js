const { User, Goal, Portfolio, StockData, sequelize } = require('../models');
const alphaVantageService = require('../services/alphaVantage');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized');

    // Create demo user
    const demoUser = await User.create({
      email: 'demo@investment.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Demo',
      riskTolerance: 'moderate',
      investmentExperience: 'intermediate',
      annualIncome: 75000,
      isActive: true,
      emailVerified: true
    });
    console.log('✅ Demo user created:', demoUser.email);

    // Create sample goals
    const goals = await Goal.bulkCreate([
      {
        userId: demoUser.id,
        name: 'Retirement Fund',
        description: 'Long-term retirement savings goal',
        targetAmount: 500000,
        currentAmount: 45000,
        targetDate: '2040-12-31',
        riskTolerance: 'moderate',
        monthlyContribution: 1200,
        category: 'retirement',
        priority: 'high'
      },
      {
        userId: demoUser.id,
        name: 'House Down Payment',
        description: 'Save for first home down payment',
        targetAmount: 100000,
        currentAmount: 25000,
        targetDate: '2027-06-01',
        riskTolerance: 'conservative',
        monthlyContribution: 800,
        category: 'house',
        priority: 'high'
      },
      {
        userId: demoUser.id,
        name: 'Emergency Fund',
        description: '6 months of expenses as emergency fund',
        targetAmount: 30000,
        currentAmount: 15000,
        targetDate: '2026-01-01',
        riskTolerance: 'conservative',
        monthlyContribution: 500,
        category: 'emergency',
        priority: 'medium'
      },
      {
        userId: demoUser.id,
        name: 'Vacation Fund',
        description: 'European vacation savings',
        targetAmount: 8000,
        currentAmount: 2500,
        targetDate: '2025-07-01',
        riskTolerance: 'moderate',
        monthlyContribution: 300,
        category: 'vacation',
        priority: 'low'
      }
    ]);
    console.log(`✅ Created ${goals.length} sample goals`);

    // Seed popular stock data
    console.log('📈 Seeding stock data...');
    const popularSymbols = alphaVantageService.getPopularSymbols().slice(0, 10);
    
    // Create mock stock data if API is not available
    const mockStockData = [
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        price: 175.50,
        previousClose: 173.20,
        change: 2.30,
        changePercent: 1.33,
        volume: 45000000,
        marketCap: 2800000000000,
        peRatio: 28.5,
        dividendYield: 0.52,
        weekHigh52: 198.23,
        weekLow52: 124.17,
        beta: 1.24,
        eps: 6.16,
        sector: 'Technology',
        industry: 'Consumer Electronics'
      },
      {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        price: 285.20,
        previousClose: 282.80,
        change: 2.40,
        changePercent: 0.85,
        volume: 25000000,
        marketCap: 2100000000000,
        peRatio: 32.1,
        dividendYield: 0.89,
        weekHigh52: 348.10,
        weekLow52: 213.43,
        beta: 0.89,
        eps: 8.88,
        sector: 'Technology',
        industry: 'Software'
      },
      {
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        price: 125.30,
        previousClose: 123.90,
        change: 1.40,
        changePercent: 1.13,
        volume: 28000000,
        marketCap: 1600000000000,
        peRatio: 22.8,
        dividendYield: 0.00,
        weekHigh52: 151.55,
        weekLow52: 83.34,
        beta: 1.05,
        eps: 5.49,
        sector: 'Technology',
        industry: 'Internet Content & Information'
      },
      {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        price: 225.80,
        previousClose: 220.15,
        change: 5.65,
        changePercent: 2.57,
        volume: 35000000,
        marketCap: 720000000000,
        peRatio: 65.4,
        dividendYield: 0.00,
        weekHigh52: 414.50,
        weekLow52: 138.80,
        beta: 2.11,
        eps: 3.45,
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers'
      },
      {
        symbol: 'AMZN',
        companyName: 'Amazon.com, Inc.',
        price: 142.90,
        previousClose: 140.20,
        change: 2.70,
        changePercent: 1.93,
        volume: 42000000,
        marketCap: 1500000000000,
        peRatio: 48.2,
        dividendYield: 0.00,
        weekHigh52: 188.11,
        weekLow52: 81.43,
        beta: 1.33,
        eps: 2.96,
        sector: 'Consumer Cyclical',
        industry: 'Internet Retail'
      }
    ];

    // Try to get real data, fall back to mock data
    const stockDataToInsert = [];
    
    for (const mockStock of mockStockData) {
      try {
        if (process.env.ALPHA_VANTAGE_API_KEY) {
          const realStock = await alphaVantageService.updateStockData(mockStock.symbol);
          stockDataToInsert.push(realStock);
          console.log(`✅ Fetched real data for ${mockStock.symbol}`);
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw new Error('No API key');
        }
      } catch (error) {
        console.log(`⚠️  Using mock data for ${mockStock.symbol}: ${error.message}`);
        stockDataToInsert.push({
          ...mockStock,
          lastUpdated: new Date()
        });
      }
    }

    await StockData.bulkCreate(stockDataToInsert, { 
      updateOnDuplicate: Object.keys(mockStockData[0]) 
    });
    console.log(`✅ Created/updated ${stockDataToInsert.length} stock records`);

    // Create sample portfolio
    const portfolioItems = await Portfolio.bulkCreate([
      {
        userId: demoUser.id,
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        shares: 10,
        averageCost: 150.25,
        currentPrice: 175.50,
        sector: 'Technology',
        industry: 'Consumer Electronics'
      },
      {
        userId: demoUser.id,
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        shares: 8,
        averageCost: 250.75,
        currentPrice: 285.20,
        sector: 'Technology',
        industry: 'Software'
      },
      {
        userId: demoUser.id,
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        shares: 5,
        averageCost: 105.80,
        currentPrice: 125.30,
        sector: 'Technology',
        industry: 'Internet Content & Information'
      },
      {
        userId: demoUser.id,
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        shares: 3,
        averageCost: 180.50,
        currentPrice: 225.80,
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers'
      }
    ]);
    console.log(`✅ Created ${portfolioItems.length} portfolio positions`);

    // Create additional users for testing
    const additionalUsers = await User.bulkCreate([
      {
        email: 'alice@example.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Johnson',
        riskTolerance: 'aggressive',
        investmentExperience: 'advanced',
        annualIncome: 120000
      },
      {
        email: 'bob@example.com',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Smith',
        riskTolerance: 'conservative',
        investmentExperience: 'beginner',
        annualIncome: 50000
      }
    ]);
    console.log(`✅ Created ${additionalUsers.length} additional test users`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${1 + additionalUsers.length}`);
    console.log(`🎯 Goals: ${goals.length}`);
    console.log(`📈 Stocks: ${stockDataToInsert.length}`);
    console.log(`💼 Portfolio Items: ${portfolioItems.length}`);
    
    console.log('\n🔐 Demo Login Credentials:');
    console.log('Email: demo@investment.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };