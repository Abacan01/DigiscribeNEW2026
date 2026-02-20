import admin from 'firebase-admin';

let adminAuth;
let adminDb;

try {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
    throw new Error('Missing required Firebase service account environment variables (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID).');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  adminAuth = admin.auth();
  adminDb = admin.firestore();
} catch (err) {
  console.warn('Firebase Admin SDK not initialized:', err.message);
  console.warn('Admin features (user management, Firestore writes) will be unavailable.');
  console.warn('Set FIREBASE_* environment variables in your .env file.');
  adminAuth = null;
  adminDb = null;
}

export { adminAuth, adminDb };
export default admin;
