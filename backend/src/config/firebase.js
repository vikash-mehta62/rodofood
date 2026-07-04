const { initializeApp, cert, getApps } = require('firebase-admin/app');
const serviceAccount = require('./firebase-service-account.json');

try {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
}
