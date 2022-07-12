import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Meta } from '@engineers/ngx-utils/meta.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.scss'],
})
export class TermsOfServiceComponent implements OnInit {
  meta: Meta;

  constructor(private http: HttpClient, private titleService: Title) {
    this.titleService.setTitle('terms of services');
  }

  ngOnInit(): void {
    this.http.get('api/v1/config/browser/meta').subscribe((meta) => {
      this.meta = meta;
    });
  }
}
