const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const path = require('path');

// STORING IMAGE TO MEMORY(BUFFER)
const multerStorage = multer.memoryStorage();

// CREATING MULTER FILTER
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  }
  cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// Multer config
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// Use :
// upload.array("images", 3)|req.files| when multi-images with only one field names
// upload.single("photo") |req.file| when there's only 1 image

// IMAGE PROCESSOR MIDDLEWARE
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  ///// Cover Image  /////

  // Insert the imageCover file name on req.body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  /////// Images ////////
  // INITIALIZE req.body.images as an empty array
  req.body.images = [];

  //  LOOP THROUGH THE req.file.images and await them all
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // INITIALIZE FILE NAME
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      // USE SHARP IMAGE PROCESSOR TO RESIZE AND PROCESS EACH IMAGE FILE
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

////////////// MIDDLEWARE ////////////////
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty,';
  next();
};

//////////////////////////////////////

// //////// ROUTE HANDLERS ///////////////
// Get All Tours
exports.getAllTours = factory.getAll(Tour);

// Get single tour
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// Create tour
exports.createTour = factory.createOne(Tour);

// Update tour
exports.updateTour = factory.updateOne(Tour);

// Delete tour
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({ status: 'success', data: { stats } });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({ status: 'success', data: { plan } });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Get Route Parameters
  const { distance, latlng, unit } = req.params;

  // Get Latitude & Longitude from latlng
  const [lat, lng] = latlng.split(',');

  // Define radius (distance converted to the radiant unit based on unit)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Check that lat and lng exists
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  // Get tours that match geospatial query
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // Send Response to Client
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  // Get Parameters
  const { latlng, unit } = req.params;

  // Get longitude and latitude from latlng
  const [lat, lng] = latlng.split(',');

  // Testing for the unit
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // Check that lat and lng exists
  if (!lat || !lng)
    next(
      new AppError(
        'Please provide a latitude and longitude in the format lat,lng.',
        400,
      ),
    );

  // Commence geospatial aggregation
  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  // Send Response to client
  res.status(200).json({
    status: 'success',
    data: { data: distance },
  });
});
