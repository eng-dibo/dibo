export interface GCloudConfig {
  projectId: string;
  cloudRun: CloudRun;
  GCM: GCM;
}
export interface CloudRun {
  name: string | undefined;
  platform: string | undefined;
  region: string | undefined;
  allowUnauthenticated: boolean | undefined;
  // container image name
  image: string | undefined;
}

export interface GCM {
  id: string;
  subject: string;
}

declare const config: GCloudConfig;
export default config;
