import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId, stripePublicKey) => {
  try {
    // Initialize stripe dynamically using passed public key
    const stripe = window.Stripe(stripePublicKey);

    // Get checkout session from server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    showAlert('error', err);
  }
};
