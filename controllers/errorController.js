const AppError = require('../utils/appError');

// Handle invalid error
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate fields
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 404);
};

// Handle JWT error
const handleJWTError = () =>
  new AppError('Invalid token, please log in again', 401);

// Handle JWT Expired Error
const handleJWTExpiredError = () =>
  new AppError('Your Token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res, next) => {
  // A) API
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) Rendered website(temolate)
  console.error('ERROR 💥', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: err.message,
  });
};

const sendErrorProd = (err, req, res, next) => {
  // A) API
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    // A) operational, trusted error: send message to client
    if (err.isOperational && err.message) {
      return res
        .status(err.statusCode)
        .json({ status: err.status, message: err.message });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log the error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
  // B) RENDERED WEBSITE
  // A) operational, trusted error: send message to client
  if (err.isOperational && err.message) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log the error
  console.error('ERROR 💥', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Sonething went wrong',
    message: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res, next);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;

    // Handle invalid id (CastError)
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // Handle duplicated fields error (errorCode)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Handle validation error
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // Handle JSON Web Token Error
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    // Handle Token Expired Error
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res, next);
  }
};
