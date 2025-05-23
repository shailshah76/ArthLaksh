const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockData = sequelize.define('StockData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    price: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    previousClose: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    change: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    changePercent: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true
    },
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    marketCap: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    peRatio: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    dividendYield: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true
    },
    weekHigh52: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    weekLow52: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    beta: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: true
    },
    eps: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
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
    tableName: 'stock_data',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['symbol']
      },
      {
        fields: ['sector']
      },
      {
        fields: ['lastUpdated']
      }
    ]
  });

  // Instance methods
  StockData.prototype.isDataStale = function(minutes = 15) {
    const now = new Date();
    const diffMs = now - this.lastUpdated;
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes > minutes;
  };

  StockData.prototype.getPerformanceMetrics = function() {
    return {
      symbol: this.symbol,
      price: parseFloat(this.price),
      change: parseFloat(this.change || 0),
      changePercent: parseFloat(this.changePercent || 0),
      volume: parseInt(this.volume || 0),
      marketCap: parseInt(this.marketCap || 0),
      peRatio: parseFloat(this.peRatio || 0),
      beta: parseFloat(this.beta || 0)
    };
  };

  // Static methods
  StockData.getBySymbol = async function(symbol) {
    return await this.findOne({ 
      where: { symbol: symbol.toUpperCase() } 
    });
  };

  StockData.getBySector = async function(sector) {
    return await this.findAll({ 
      where: { sector },
      order: [['marketCap', 'DESC']]
    });
  };

  StockData.getTopPerformers = async function(limit = 10) {
    return await this.findAll({
      where: {
        changePercent: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [['changePercent', 'DESC']],
      limit
    });
  };

  StockData.getTopLosers = async function(limit = 10) {
    return await this.findAll({
      where: {
        changePercent: {
          [sequelize.Sequelize.Op.lt]: 0
        }
      },
      order: [['changePercent', 'ASC']],
      limit
    });
  };

  return StockData;
};