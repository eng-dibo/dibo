export let cert = {
  type: 'service_account',
  project_id: process.env.firebase_projectId,
  private_key_id: process.env.firebase_privateKeyId,
  private_key: process.env.firebase_privateKey,
  client_email: process.env.firebase_clientEmail,
  client_id: process.env.firebase_clientId,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.firebase_certUrl,
};

export default {
  // admin.credential.cert()
  cert,
  appId: process.env.firebase_appId,
  apiKey: process.env.firebase_apiKey,
  // Cloud Messaging
  messagingSenderId: process.env.firebase_messagingSenderId,
  measurementId: process.env.firebase_measurementId,
  authDomain: process.env.firebase_authDomain,
  databaseURL: process.env.firebase_databaseURL,
  projectId: process.env.firebase_projectId,
  storageBucket: process.env.firebase_storageBucket,
};

// bucket name for gcloud storage
export const BUCKET = process.env.firebase_storageBucket;
