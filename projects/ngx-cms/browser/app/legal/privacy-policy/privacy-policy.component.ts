import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Meta } from '@engineers/ngx-utils/meta.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
})
export class PrivacyPolicyComponent implements OnInit {
  meta: Meta;

  constructor(private http: HttpClient, private titleService: Title) {
    this.titleService.setTitle('privacy policy');
  }

  ngOnInit(): void {
    this.http.get('api/v1/config/browser/meta').subscribe((meta) => {
      this.meta = meta;
    });
  }
}
