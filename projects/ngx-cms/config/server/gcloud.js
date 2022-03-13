module.exports = {
  // todo: use dist/config/server/.env for deploying the production-ready project
  projectId: process.env.gcloud_projectId || "dibo-cloud",
  cloudRun: {
    name: "ngx-cms",
    platform: "managed",
    region: "europe-west1",
    allowUnauthenticated: true,
  },
  // todo: rename 'gcloud_messagingSenderId' to 'GCM'
  GCM: {
    // firebase cloud messages VS in-app messsages
    // https://stackoverflow.com/a/66399812/12577650
    id: process.env.gcloud_messagingSenderId,
    subject: "mailto:example@yourdomain.org",
  },
};
