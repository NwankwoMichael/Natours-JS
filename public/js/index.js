/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login'); //--login
const logoutBtn = document.querySelector('.nav__el--logout');
const userUpdateForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATIONS
if (mapBox) {
  // Force execution only after CDN Library loads completely
  if (typeof window.mapboxgl !== 'undefined') {
    const locations = JSON.parse(mapBox.dataset.locations);
    const mapboxToken = mapBox.dataset.mapboxToken;
    displayMap(locations, mapboxToken);
  } else {
    console.error('Mapbox script not loaded from CDN');
  }
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // console.log('Logging in with:', email, password);
    login(email, password);
  });

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (userUpdateForm)
  userUpdateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // PROGRAMATICALLY CREATE A MULTIPART FORM DATA
    const form = new FormData();

    // One append for each data we intend to send
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);

    // Select the image file. (.files = [], hence index[0])
    form.append('photo', document.getElementById('photo').files[0]);

    // axios recognizes form as an object & works as it should
    await updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    //
    e.target.textContent = 'Processing...';
    //Get tour id
    const { tourId } = e.target.dataset;
    // Call bookTour
    bookTour(tourId);
  });
