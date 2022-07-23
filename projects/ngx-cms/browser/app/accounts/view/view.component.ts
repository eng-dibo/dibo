import { Component, OnInit } from '@angular/core';
import { Article, ViewOptions } from '@engineers/ngx-content-view-mat';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ViewComponent implements OnInit {
  data: Array<Article>;
  options!: ViewOptions;

  constructor(private http: HttpClient, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('our social media accounts follow us');

    this.options = {
      layout: 'grid',
    };

    this.http
      .get<Array<Article>>('config/browser/accounts')
      .subscribe((accounts) => {
        this.data = accounts.map((account) => {
          for (let [key, value] of Object.entries(account.links || {})) {
            account.content += `<br /><a href="${value}" target="_blank">${key}</a>`;
          }
          return account;
        });
      });
  }
}
