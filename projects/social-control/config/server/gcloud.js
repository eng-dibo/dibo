module.exports = {
  // todo: use dist/config/server/.env for deploying the production-ready project
  projectId: process.env.gcloud_projectId || "social-control",
  cloudRun: {
    name:
      process.env.gcloud_cloudRun_name || process.env.gcloud_cloudRun_image
        ? process.env.gcloud_cloudRun_image.replace(/\./, "-")
        : "social-control",
    platform: process.env.gcloud_cloudRun_platform || "managed",
    region: process.env.gcloud_cloudRun_region || "europe-west1",
    allowUnauthenticated: true,
    image: process.env.gcloud_cloudRun_image,
  },
  // todo: rename 'gcloud_messagingSenderId' to 'GCM'
  GCM: {
    // firebase cloud messages VS in-app messages
    // https://stackoverflow.com/a/66399812/12577650
    id: process.env.gcloud_messagingSenderId,
    subject:
      process.env.gcloud_messagingSubject || "mailto:example@yourdomain.org",
  },
};
