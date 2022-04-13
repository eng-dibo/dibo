export var apiKey: string;
export var measurementId: string;
export var storageBucket: string;
export var storageRoot: string;
export var databaseURL: string;
export namespace cloudRun {
  const name: string;
  const platform: string;
  const region: string;
  const allowUnauthenticated: boolean;
  const image: string;
}
export namespace gcloudMessaging {
  const id: string;
  const subject: string;
}
export let serviceAccount: any;
export let projectId: string;
