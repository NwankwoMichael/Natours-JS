const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // GET THE CURRENTLY BOOKED TOUR
  const tour = await Tour.findById(req.params.tourId);

  // CREATE THE CHECKOUT SESSION
  const session = await stripe.checkout.sessions.create({
    // Payment with credit card
    payment_method_types: ['card'],

    // redirect to home page when payment is successful & create booking
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,

    success_url: `${req.protocol}://${req.ger('host')}/?tours`,

    // redirect to tour page if user decides to cancel payment
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

    // get customer's email
    customer_email: req.user.email,

    // specify a custom field for creating a new booking DataBase
    client_reference_id: req.params.tourId,

    // specify some details about the tour itself
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.ger('host')}/img/tours/${tour.imageCover}`,
            ],
          },
          unit_amount: tour.price * 100, //We multiply by 100 cos default=cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // SEND SESSION AS RESPONSE
  res.status(200).json({
    status: 'success',
    session,
  });
});

// UNSECURE TEMPORARY Function THat creates Booking in The Database
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // Getting the data from the query string
//   const { tour, user, price } = req.query;

//   // Create a booking if all the above are specified
//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   // Redirect to the home page splitting the queryString by the ?mark
//   res.redirect(req.originalUrl.split('?')[0]);

//   // res.redirect makes another request to the specified url which in this case is the first array element of the split query string before the ?mark
// });

const createBookingCheckout = async (session) => {
  // Initialize the query parameters
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  // Create booking via the query parameters
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
