export default function (tmplPath, config) {
  config.description = "tools for firebase-admin SDK";
  config.keywords = [
    "firebase",
    "GCP",
    "back-end",
    "hosting",
    "google cloud",
    "cloud hosting",
    "firebase-admin SDK",
  ];
  config.intro = `- initialize a new firebase app.
- upload & download files to firebase storage buckets.
- convert your \`express\` app into a \`firebase cloud function\`.`;
  config.peerDependencies = {
    "firebase-admin": "^9.4.1",
    "firebase-functions": "^3.11.0",
  };
  return config;
}
