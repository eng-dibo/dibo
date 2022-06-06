import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'any' })
export class PlatformService {
  constructor(@Inject(PLATFORM_ID) public platformId: any) {}

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
