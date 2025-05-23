const { sequelize } = require('../config/database');

// Import all models
const User = require('./User')(sequelize);
const Goal = require('./Goal')(sequelize);
const Portfolio = require('./Portfolio')(sequelize);
const StockData = require('./StockData')(sequelize);

// Create models object
const models = {
  User,
  Goal,
  Portfolio,
  StockData,
  sequelize
};

// Fix Portfolio-StockData association
Portfolio.belongsTo(StockData, {
  foreignKey: 'symbol',
  targetKey: 'symbol',
  as: 'stockData'
});

// Set up other associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;