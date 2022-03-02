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
declare const config: GCloudConfig;
export default config;
