const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'anonymous'
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Data validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this data already exists',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Authentication token has expired'
    });
  }

  // Axios/API errors
  if (err.response && err.response.status) {
    return res.status(502).json({
      error: 'External API error',
      message: 'Failed to fetch data from external service',
      statusCode: err.response.status
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded, please try again later'
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;