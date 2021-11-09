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
  projectId: process.env.gcloud_projectId || 'dibo-cloud',
  cloudRun: {
    name: 'ngx-cms',
    platform: 'managed',
    region: 'europe-west1',
    allowUnauthenticated: true,
  },
};

export default config;
