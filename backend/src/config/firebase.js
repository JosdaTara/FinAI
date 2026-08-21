const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

let db = null;
let auth = null;
let initError = null;

try {
  const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!relativePath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH no está definida en backend/.env');
  }

  const serviceAccountPath = path.resolve(__dirname, '..', relativePath);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const serviceAccount = require(serviceAccountPath);

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = app.firestore();
  auth = app.auth();
} catch (err) {
  initError = err.message;
}

function isReady() {
  return db !== null;
}

module.exports = { admin, db, auth, initError, isReady };
