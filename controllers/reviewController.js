const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // AlLOW NESTED ROUTES
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Get ALL Reviews
exports.getAllReviews = factory.getAll(Review);

// Get review
exports.getReview = factory.getOne(Review);

// Create review
exports.createReview = factory.createOne(Review);

// Update review
exports.updateReview = factory.updateOne(Review);

// Delete review
exports.deleteReview = factory.deleteOne(Review);
