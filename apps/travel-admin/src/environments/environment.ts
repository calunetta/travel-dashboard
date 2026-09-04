// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPMENT ENVIRONMENT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  REPLACE all placeholder values with your actual Firebase project config.
//     Get these from: Firebase Console → Project Settings → Your Apps → SDK Setup.
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
  production: false,
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-project.firebaseapp.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  },
  weRoadApiBaseUrl: '/api/weroad',
};
