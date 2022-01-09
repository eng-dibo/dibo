import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Meta } from '@engineers/ngx-utils/meta.service';
import { forkJoin } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    forkJoin([
      this.http.get('api/v1/config/browser/meta'),
      this.http.get('api/v1/config/browser/toolbar'),
    ]).subscribe(
      (result: any) => {
        this.meta = result[0].default;
        let toolbar = result[1].default;
        if (toolbar && toolbar instanceof Array) {
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
      (err) => console.log({ err })
    );
  }
}
