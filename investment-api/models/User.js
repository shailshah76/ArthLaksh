const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    riskTolerance: {
      type: DataTypes.ENUM('conservative', 'moderate', 'aggressive'),
      defaultValue: 'moderate'
    },
    investmentExperience: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      defaultValue: 'beginner'
    },
    annualIncome: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Goal, {
      foreignKey: 'userId',
      as: 'goals',
      onDelete: 'CASCADE'
    });
    
    User.hasMany(models.Portfolio, {
      foreignKey: 'userId',
      as: 'portfolioItems',
      onDelete: 'CASCADE'
    });
  };

  return User;
};