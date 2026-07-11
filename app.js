const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingController = require('./controllers/bookingController');

// Start express app
const app = express();

app.set('trust proxy', 1); // trust first proxy

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) ///////////// GLOBAL MIDDLEWARES //////////////
// Implement CORS
app.use(cors()); // for so-called simple request

app.options('*', cors()); // for all non-simple request
// app.options("/api/v1/tours/:id", cors()) for specific route

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://*.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://js.stripe.com',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com'], // allow stripe checkout iframe
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://api.mapbox.com',
        'https://*.mapbox.com',
        'https://fonts.googleapis.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://api.mapbox.com'],
      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://*.mapbox.com', // This covers a.tiles, b.tiles, api, and events
        'https://api.stripe.com',
        'ws://127.0.0.1:1234',
        'ws://localhost:1234',
      ],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.mapbox.com'],
    },
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Need to be in raw form not JSON hence calling handler in app.js
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

// parsing the raw body

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// CONNECT HTML FORM TO THE ROUTE HANDLER
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Used to compress our API response
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// SILENCING CHROME DEVTOOLS REQUEST
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end(); // No content
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
