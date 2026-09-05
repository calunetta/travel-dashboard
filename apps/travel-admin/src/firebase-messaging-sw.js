importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Must match the config in environment.ts
firebase.initializeApp({
  apiKey: "AIzaSyDC8qVgF8AopHuMT30VKnmSZ-F9LfzMFTs",
  authDomain: "travel-dashboard-f98a3.firebaseapp.com",
  projectId: "travel-dashboard-f98a3",
  storageBucket: "travel-dashboard-f98a3.firebasestorage.app",
  messagingSenderId: "156926373440",
  appId: "1:156926373440:web:350d2caf98a6ec89a8b9a5",
  measurementId: "G-C1KCEZ0CS3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
