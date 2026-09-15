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
  const link = payload.data?.link || payload.fcmOptions?.link || payload.data?.url || '/';
  
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: { link }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it and navigate
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
