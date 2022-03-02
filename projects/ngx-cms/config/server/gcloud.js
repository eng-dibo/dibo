module.exports = {
  // todo: use dist/config/server/.env for deploying the production-ready project
  projectId: process.env.gcloud_projectId || "dibo-cloud",
  cloudRun: {
    name: "ngx-cms",
    platform: "managed",
    region: "europe-west1",
    allowUnauthenticated: true,
  },
};
