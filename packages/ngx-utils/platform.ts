import { PLATFORM_ID, Inject, Injectable } from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';

@Injectable()
export class PlatformService {
  constructor(@Inject(PLATFORM_ID) public platformId: Object) {}

  getPlatform() {
    return {
      id: this.platformId,
      type: this.isBrowser() ? 'browser' : 'server',
    };
  }

  isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  isServer() {
    return isPlatformServer(this.platformId);
  }
}
