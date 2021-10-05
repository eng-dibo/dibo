export let cert = {
  type: 'service_account',
  project_id: '',
  private_key_id: '',
  private_key: '',
  client_email: '',
  client_id: '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: '',
};

export default {
  // admin.credential.cert()
  cert,
  appId: '',
  apiKey: '',
  // Cloud Messaging
  messagingSenderId: '',
  measurementId: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
};

// bucket name for gcloud storage
export const BUCKET = 'bucketName';
