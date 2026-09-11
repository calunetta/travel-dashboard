import './commands';

Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('APP ERROR: ', err);
  return false;
});

Cypress.on('window:before:load', (win) => {
  const originalError = win.console.error;
  win.console.error = function (...args) {
    console.log('CONSOLE ERROR: ', ...args);
    return originalError.apply(this, args);
  };
});
