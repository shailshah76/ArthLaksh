const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Goal = sequelize.define('Goal', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currentAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    riskTolerance: {
      type: DataTypes.ENUM('conservative', 'moderate', 'aggressive'),
      allowNull: false,
      defaultValue: 'moderate'
    },
    monthlyContribution: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.ENUM('retirement', 'house', 'education', 'emergency', 'vacation', 'other'),
      defaultValue: 'other'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isAchieved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    achievedDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'goals',
    timestamps: true,
    hooks: {
      beforeSave: async (goal) => {
        // Check if goal is achieved
        if (goal.currentAmount >= goal.targetAmount && !goal.isAchieved) {
          goal.isAchieved = true;
          goal.achievedDate = new Date();
        }
      }
    }
  });

  // Instance methods
  Goal.prototype.getProgress = function() {
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
  };

  Goal.prototype.getDaysRemaining = function() {
    const today = new Date();
    const target = new Date(this.targetDate);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Goal.prototype.getMonthsRemaining = function() {
    const today = new Date();
    const target = new Date(this.targetDate);
    const diffMonths = (target.getFullYear() - today.getFullYear()) * 12 + 
                      (target.getMonth() - today.getMonth());
    return Math.max(diffMonths, 0);
  };

  Goal.prototype.getRequiredMonthlyContribution = function() {
    const monthsRemaining = this.getMonthsRemaining();
    const amountRemaining = this.targetAmount - this.currentAmount;
    
    if (monthsRemaining <= 0) return amountRemaining;
    return amountRemaining / monthsRemaining;
  };

  // Associations
  Goal.associate = (models) => {
    Goal.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Goal;
};