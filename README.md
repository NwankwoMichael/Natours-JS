Built using modern technologies: node.js, express,

# Natours-JS Application

Natours-JS is a full‑stack tours booking application built using modern technologies: **Node.js, Express, MongoDB, mongoose, Stripe and friends 🥱**.  
It allows users to browse tours, sign up, log in, and securely book tours with integrated payments.

---

## 🚀 Live Demo

👉 [Natours-JS on Render](https://natours-js.onrender.com)

---

## ✨ Features

- User authentication & authorization (signup, login, password reset)
- Tour browsing with detailed pages
- Secure payments via Stripe Checkout
- Webhook integration for booking confirmation
- Alerts for successful bookings
- RESTful API endpoints for tours, users, and bookings
- MVC architecture with controllers, models, and routes
- Deployment ready for **Render** and **Heroku**

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT, bcrypt
- **Payments:** Stripe Checkout + Webhooks
- **Frontend:** Pug templates, vanilla JS
- **Deployment:** Render (live demo), Heroku (compatible)

---

## 📂 Project Structure

Natours-JS/
├── controllers/ # Route controllers (tours, users, bookings)
├── models/ # Mongoose models
├── routes/ # Express routes
├── utils/ # Utility functions (error handling, etc.)
├── views/ # Pug templates
├── public/ # Static assets (CSS, JS, images)
├── server.js # App entry point
└── config.env # Environment variables

---

## ⚙️ Setup & Installation

1. Clone the repo:

   ```bash
   git clone https://github.com/NwankwoMichael/Natours-JS.git
   cd Natours-JS
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in config.env:

   ```Env
    NODE_ENV=development
    DATABASE=<your-mongodb-uri>
    STRIPE_SECRET_KEY=<your-stripe-secret-key>
    STRIPE_PUBLIC_KEY=<your-stripe-public-key>
    STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
    JWT_SECRET=<your-jwt-secret>
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90

   ```

4. Run the app:

   ```bash
   npm start

   ```

   📌 Notes

   Ensure trust proxy is set in app.js for secure cookies behind proxies:

   ```Js
   app.set('trust proxy', 1);
   ```

   Webhooks require a public HTTPS endpoint. Use tools like ngrok or Stripe CLI for local testing.

   Always verify webhook signatures with stripe.webhooks.constructEvent.

   📜 License

   This project is licensed under the MIT License.
