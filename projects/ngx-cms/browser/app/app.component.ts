import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { metaTags, toolbar as _toolbar } from '~config/browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  name = metaTags.name;
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
  toolbar = _toolbar;

  constructor(private http: HttpClient) {
    this.toolbar.map((item: any) => {
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
}
