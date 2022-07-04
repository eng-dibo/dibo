import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Meta } from '@engineers/ngx-utils/meta.service';
import { forkJoin } from 'rxjs';
import { PlatformService } from '@engineers/ngx-utils/platform';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  meta: Meta;
  toolbar: any;

  /*
  to get the toolbar content (as html) from ~config/toolbar.html
  ```
  this.http
      .get('/api/v1/config/toolbar.html', { responseType: 'text' })
      .subscribe((res) => {
        this.toolbar = res;
      });
   ```
   then inject it into the template `<div [innerHTML]="toolbarX | keepHtml"></div>`

   to enable Angular features ({{binding}}, (events)=>{}) in the dynamically injected content, 
   compile it at runtime
   https://www.linkedin.com/pulse/compiling-angular-templates-runtime-dima-slivin
  */

  constructor(private http: HttpClient, private platform: PlatformService) {
    if (
      platform.isBrowser() &&
      localStorage && // set the device id, use it:
      // - as a security check, if a logingin trial from a strange device add an additional step
      // - instead of userid if no loggedin user
      // - to set preferences per device

      !localStorage.getItem('device')
    ) {
      // todo: try to get 'device' from cookies or subScription.object.publicKey
      localStorage.setItem('device', Date.now().toString());
    }
  }

  ngOnInit(): void {
    forkJoin([
      // or use es6 import('/toolbar')
      // config/browser added to static dirs in express config
      this.http.get('api/v1/config/browser/meta'),
      this.http.get('api/v1/config/browser/toolbar'),
    ]).subscribe({
      next: (result: any) => {
        this.meta = result[0];
        let toolbar = result[1];
        if (toolbar && Array.isArray(toolbar)) {
          this.toolbar = toolbar.map((item: any) => {
            if (!item.tag) {
              if (item.link) {
                item.tag = 'a';
              } else if (item.click) {
                item.tag = 'button';
              } else {
                item.tag = 'div';
              }
            }
            return item;
          });
        }
      },
      error: (error) => console.log({ error }),
    });
  }
}
