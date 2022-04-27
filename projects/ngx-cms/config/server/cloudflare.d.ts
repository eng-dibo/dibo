interface CloudFlareConfig {
  purge: { [key: string]: any };
  token: string | undefined;
  zone: string | undefined;
}

declare let cloudFlareConfig: CloudFlareConfig;
export default cloudFlareConfig;
