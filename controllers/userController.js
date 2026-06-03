const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// CREATING MULTER STORAGE (SAVING TO DISK)
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

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

// Multer middleware
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // Return if no image
  if (!req.file) return next();

  // Set filename
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Crop image to square, convert to jpeg
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    // .toFile(path.join(__dirname, `../public/img/users`, req.file.filename));
    .toFile(
      path.join(process.cwd(), 'public', 'img', 'users', req.file.filename),
    );

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ROUTE HANDLERS

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  //Filter out field-names that shouldn't be granted update permission
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route us not defined! Please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// Update user (Won't work for password update)
exports.updateUser = factory.updateOne(User);

// Delete user
exports.deleteUser = factory.deleteOne(User);
