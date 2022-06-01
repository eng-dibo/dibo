/**
 * @jest-environment jsdom
 */

import { beforeAll, expect, test } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxContentViewComponent } from './view';
import { NgxContentViewModule } from './module';
import { Component } from '@angular/core';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MetaService } from '@engineers/ngx-utils/meta.service';
import { NgxLoadService } from '@engineers/ngx-utils/load-scripts.service';

let fixture: ComponentFixture<AppComponent>,
  app: AppComponent,
  template: HTMLElement;

@Component({
  selector: 'app',
  template: `<ngx-content-view [data]="data"></ngx-content-view>`,
})
export class AppComponent {
  public data = [
    {
      author: { name: 'angular developer' },
      title: 'front end',
    },
    {
      author: { name: 'nodejs developer' },
      title: 'back end',
    },
  ];
  constructor(public metaService: MetaService) {}
}

beforeAll(async () => {
  await TestBed.configureTestingModule({
    imports: [RouterTestingModule, NgxContentViewModule],
    declarations: [AppComponent],
    providers: [
      { provide: MATERIAL_SANITY_CHECKS, useValue: false },
      MetaService,
      NgxLoadService,
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  app = fixture.componentInstance;
  template = fixture.nativeElement;
});

test('the app should be created', () => {
  expect(app).toBeTruthy();
});

test('it should create <mat-card>', () => {
  expect(template.querySelector('mat-card')).toBeTruthy();
  expect(template.querySelector('non-existing')).toBeFalsy();
});

test('it should create two cards', () => {
  expect(template.querySelectorAll('.masonry-item').length).toEqual(2);
  expect(template.querySelectorAll('mat-card').length).toEqual(2);
});

test('card header should contain `author name`', () => {
  let subtitle = template.querySelectorAll('mat-card-subtitle');
  expect(subtitle[0].textContent).toContain('angular developer');
  expect(subtitle[1].textContent).toContain('nodejs developer');
});
