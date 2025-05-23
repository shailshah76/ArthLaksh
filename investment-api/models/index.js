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

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;