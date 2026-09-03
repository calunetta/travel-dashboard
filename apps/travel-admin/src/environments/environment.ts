// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPMENT ENVIRONMENT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  REPLACE all placeholder values with your actual Firebase project config.
//     Get these from: Firebase Console → Project Settings → Your Apps → SDK Setup.
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  weRoadApiBaseUrl: '/api/weroad',
};
