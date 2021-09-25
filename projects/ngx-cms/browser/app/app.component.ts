import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { metaTags, toolbar as _toolbar } from '~config/browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  name = metaTags.name;
  toolbar = _toolbar;

  constructor(private router: Router) {
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

  go(path: Array<string> | string): void {
    if (typeof path === 'string') {
      path = [path];
    }
    this.router.navigate(path);
  }
}
