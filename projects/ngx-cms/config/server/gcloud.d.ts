export var apiKey: string;
export var measurementId: string;
export var storageBucket: string;
export var storageRoot: string;
export var databaseURL: string;
export namespace cloudRun {
  let name: string;
  let platform: string;
  let region: string;
  let allowUnauthenticated: boolean;
  let image: string;
}
export namespace gcloudMessaging {
  let id: string;
  let subject: string;
}
export let serviceAccount: any;
export let projectId: string;
