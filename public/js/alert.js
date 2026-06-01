export const hideAlert = () => {
  const el = document.querySelector('.alert');

  //   Remove child element
  if (el) el.remove();
};

// Type = "success" || "error"
export const showAlert = (type, message) => {
  // Always hide old alert whenever new alert shows up
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  //   Hide all alerts after 5 secs
  window.setTimeout(hideAlert, 5000);
};
