const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Portfolio = sequelize.define('Portfolio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    symbol: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        len: [1, 10],
        isUppercase: true
      }
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shares: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    averageCost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currentPrice: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    sector: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'portfolio',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'symbol']
      }
    ]
  });

  // Instance methods
  Portfolio.prototype.getTotalValue = function() {
    return this.shares * (this.currentPrice || this.averageCost);
  };

  Portfolio.prototype.getTotalCost = function() {
    return this.shares * this.averageCost;
  };

  Portfolio.prototype.getGainLoss = function() {
    if (!this.currentPrice) return 0;
    return this.getTotalValue() - this.getTotalCost();
  };

  Portfolio.prototype.getGainLossPercentage = function() {
    const totalCost = this.getTotalCost();
    if (totalCost === 0) return 0;
    return (this.getGainLoss() / totalCost) * 100;
  };

  // Static methods
  Portfolio.getUserPortfolioValue = async function(userId) {
    const portfolioItems = await this.findAll({ where: { userId } });
    return portfolioItems.reduce((total, item) => total + item.getTotalValue(), 0);
  };

  Portfolio.getUserPortfolioAllocation = async function(userId) {
    const portfolioItems = await this.findAll({ where: { userId } });
    const totalValue = portfolioItems.reduce((total, item) => total + item.getTotalValue(), 0);
    
    return portfolioItems.map(item => ({
      symbol: item.symbol,
      companyName: item.companyName,
      value: item.getTotalValue(),
      allocation: totalValue > 0 ? (item.getTotalValue() / totalValue) * 100 : 0
    }));
  };

  // Associations
  Portfolio.associate = (models) => {
    Portfolio.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Portfolio;
};