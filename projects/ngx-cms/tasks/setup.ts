import { execSync } from '@engineers/nodejs/process';

/**
 * install the required SDKs
 */
// this setup is for Debian and Ubuntu systems
// todo: auto detect system
export default function (): void {
  gcloudSetup();
  containerRegistryAuth();
  gcloudInit();
}

/**
 * install gcloud
 * https://cloud.google.com/sdk/docs/install
 */

export function gcloudSetup(): void {
  // Add the Cloud SDK distribution URI as a package source
  execSync(
    `echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`
  );

  // confirm that apt-transport-https installed
  // use '--yes' to suppress the confirmation message
  execSync(
    `sudo apt-get install apt-transport-https ca-certificates gnupg --yes`
  );

  // Import the Google Cloud public key
  execSync(
    `curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -`
  );

  // Update and install the Cloud SDK
  execSync(
    `sudo apt-get update && sudo apt-get install google-cloud-sdk --yes`
  );
}

/**
 * authenticate docker to use gcloud registry
 * https://cloud.google.com/container-registry/docs/advanced-authentication#linux
 */
export function containerRegistryAuth(): void {
  execSync('sudo usermod -a -G docker ${USER}');
  execSync('gcloud auth configure-docker --quiet');
}

export function gcloudInit(): void {
  execSync('gcloud auth login');
  // must login first
  execSync(`gcloud init`);
}
