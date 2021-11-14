export interface GCloudConfig {
  projectId: string;
  cloudRun: CloudRun;
}

export interface CloudRun {
  name: string;
  platform: string;
  region: string;
  allowUnauthenticated: boolean;
}

const config: GCloudConfig = {
  // todo: use dist/config/server/.env for deploying the production-ready project
  projectId: process.env.gcloud_projectId! || 'dibo-cloud',
  cloudRun: {
    name: 'ngx-cms',
    platform: 'managed',
    region: 'europe-west1',
    allowUnauthenticated: true,
  },
};

export default config;
