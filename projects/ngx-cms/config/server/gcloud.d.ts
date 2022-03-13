export interface GCloudConfig {
  projectId: string;
  cloudRun: CloudRun;
  GCM: GCM;
}
export interface CloudRun {
  name: string;
  platform: string;
  region: string;
  allowUnauthenticated: boolean;
}

export interface GCM {
  id: string;
  subject: string;
}

declare const config: GCloudConfig;
export default config;
