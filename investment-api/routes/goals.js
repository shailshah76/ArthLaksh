const express = require('express');
const { body, validationResult } = require('express-validator');
const { Goal } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all goals for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, priority, isActive } = req.query;
    
    const where = { userId: req.user.id };
    
    // Add filters
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const goals = await Goal.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    // Add calculated fields
    const goalsWithMetrics = goals.rows.map(goal => ({
      ...goal.toJSON(),
      progress: goal.getProgress(),
      daysRemaining: goal.getDaysRemaining(),
      monthsRemaining: goal.getMonthsRemaining(),
      requiredMonthlyContribution: goal.getRequiredMonthlyContribution()
    }));

    res.json({
      goals: goalsWithMetrics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(goals.count / parseInt(limit)),
        totalItems: goals.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch goals',
      message: 'Internal server error'
    });
  }
});

// Get single goal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'Goal does not exist or you do not have permission to access it'
      });
    }

    const goalWithMetrics = {
      ...goal.toJSON(),
      progress: goal.getProgress(),
      daysRemaining: goal.getDaysRemaining(),
      monthsRemaining: goal.getMonthsRemaining(),
      requiredMonthlyContribution: goal.getRequiredMonthlyContribution()
    };

    res.json({ goal: goalWithMetrics });
  } catch (error) {
    console.error('Goal fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch goal',
      message: 'Internal server error'
    });
  }
});

// Create new goal
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('targetAmount').isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid date'),
  body('riskTolerance').isIn(['conservative', 'moderate', 'aggressive']).withMessage('Invalid risk tolerance'),
  body('monthlyContribution').optional().isFloat({ min: 0 }).withMessage('Monthly contribution must be a positive number'),
  body('category').optional().isIn(['retirement', 'house', 'education', 'emergency', 'vacation', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('description').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    console.log('Creating goal with data:', req.body);  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const goalData = {
      ...req.body,
      userId: req.user.id
    };

    const goal = await Goal.create(goalData);

    const goalWithMetrics = {
      ...goal.toJSON(),
      progress: goal.getProgress(),
      daysRemaining: goal.getDaysRemaining(),
      monthsRemaining: goal.getMonthsRemaining(),
      requiredMonthlyContribution: goal.getRequiredMonthlyContribution()
    };

    res.status(201).json({
      message: 'Goal created successfully',
      goal: goalWithMetrics
    });
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({
      error: 'Failed to create goal',
      message: 'Internal server error'
    });
  }
});

// Update goal
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('targetAmount').optional().isFloat({ min: 0 }),
  body('currentAmount').optional().isFloat({ min: 0 }),
  body('targetDate').optional().isISO8601(),
  body('riskTolerance').optional().isIn(['conservative', 'moderate', 'aggressive']),
  body('monthlyContribution').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['retirement', 'house', 'education', 'emergency', 'vacation', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const goal = await Goal.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'Goal does not exist or you do not have permission to access it'
      });
    }

    await goal.update(req.body);

    const goalWithMetrics = {
      ...goal.toJSON(),
      progress: goal.getProgress(),
      daysRemaining: goal.getDaysRemaining(),
      monthsRemaining: goal.getMonthsRemaining(),
      requiredMonthlyContribution: goal.getRequiredMonthlyContribution()
    };

    res.json({
      message: 'Goal updated successfully',
      goal: goalWithMetrics
    });
  } catch (error) {
    console.error('Goal update error:', error);
    res.status(500).json({
      error: 'Failed to update goal',
      message: 'Internal server error'
    });
  }
});

// Delete goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'Goal does not exist or you do not have permission to access it'
      });
    }

    await goal.destroy();

    res.json({
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Goal deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete goal',
      message: 'Internal server error'
    });
  }
});

// Update goal progress (add/subtract from current amount)
router.post('/:id/progress', authenticateToken, [
  body('amount').isFloat().withMessage('Amount is required and must be a number'),
  body('type').isIn(['add', 'subtract']).withMessage('Type must be either add or subtract')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, type } = req.body;

    const goal = await Goal.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'Goal does not exist or you do not have permission to access it'
      });
    }

    const currentAmount = parseFloat(goal.currentAmount);
    const changeAmount = parseFloat(amount);
    
    let newAmount;
    if (type === 'add') {
      newAmount = currentAmount + changeAmount;
    } else {
      newAmount = Math.max(0, currentAmount - changeAmount); // Don't allow negative amounts
    }

    await goal.update({ currentAmount: newAmount });

    const goalWithMetrics = {
      ...goal.toJSON(),
      progress: goal.getProgress(),
      daysRemaining: goal.getDaysRemaining(),
      monthsRemaining: goal.getMonthsRemaining(),
      requiredMonthlyContribution: goal.getRequiredMonthlyContribution()
    };

    res.json({
      message: 'Goal progress updated successfully',
      goal: goalWithMetrics
    });
  } catch (error) {
    console.error('Goal progress update error:', error);
    res.status(500).json({
      error: 'Failed to update goal progress',
      message: 'Internal server error'
    });
  }
});

// Get goal statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id }
    });

    const stats = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.isActive).length,
      achievedGoals: goals.filter(g => g.isAchieved).length,
      totalTargetAmount: goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0),
      totalCurrentAmount: goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0),
      averageProgress: goals.length > 0 ? 
        goals.reduce((sum, g) => sum + g.getProgress(), 0) / goals.length : 0,
      goalsByCategory: {},
      goalsByPriority: {},
      goalsExpiringSoon: goals.filter(g => g.getDaysRemaining() <= 30 && g.getDaysRemaining() > 0).length
    };

    // Group by category
    goals.forEach(goal => {
      stats.goalsByCategory[goal.category] = (stats.goalsByCategory[goal.category] || 0) + 1;
    });

    // Group by priority
    goals.forEach(goal => {
      stats.goalsByPriority[goal.priority] = (stats.goalsByPriority[goal.priority] || 0) + 1;
    });

    res.json({ stats });
  } catch (error) {
    console.error('Goal stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch goal statistics',
      message: 'Internal server error'
    });
  }
});

module.exports = router;