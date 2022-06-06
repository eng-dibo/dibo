/**
 * @jest-environment jsdom
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  expect,
  jest,
  test,
} from '@jest/globals';
import { MetaService } from './meta.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxLoadService } from './load-scripts.service';
import { Component } from '@angular/core';

// todo: test all meta tags
let tags = { title: 'app title test', name: 'test app' };
let adjustedTags = [
  { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  { charset: 'utf8' },
  { httpEquiv: 'content-type', content: 'text/html' },
  { name: 'title', content: 'app title test | test app' },
  { property: 'og:site_name', content: 'test app' },
  { name: 'application-name', content: 'test app' },
  { property: 'og:title', content: 'app title test | test app' },
  { property: 'og:type', content: 'website' },
  { name: 'medium', content: 'website' },
];

/* @Component({
  selector: 'app-test',
  template: '',
})
export class AppComponent {
  constructor(private meta: MetaService) {}
  ngOnInit(): void {
    this.meta.setTags(tags);
  }
} */

let service: MetaService;
// let comp: AppComponent;
// let fixture: ComponentFixture<AppComponent>;

beforeAll(async () => {
  await TestBed.configureTestingModule({
    // declarations: [AppComponent],
    providers: [MetaService, NgxLoadService],
  }).compileComponents();

  service = TestBed.inject(MetaService);

  // fixture = TestBed.createComponent(AppComponent);
  // comp = fixture.componentInstance;
  // fixture.detectChanges();
});

test('service should be created', () => {
  expect(service).toBeTruthy();
});

test('convert', () => {
  expect(service.convert('key', 'value')).toEqual({
    name: 'key',
    content: 'value',
  });
});

test.skip('addTags() adjusts the provided tags', () => {
  expect(service.addTags(tags)).toEqual(
    // use arrayContaining to compare arrays without order
    // todo: addTags() output changes from `MetaDefinition[]` to `HTMLMetaElement`
    expect.arrayContaining(adjustedTags)
  );
});

// see test: addTags
test.skip('update', () => {
  expect(service.updateTags({ description: 'our nice app' })).toEqual(
    expect.arrayContaining([
      { content: 'our nice app', name: 'description' },
      { content: 'our nice app', property: 'og:description' },
    ])
  );
});

test.skip('getTags -> should get all tags with the property `name` as HTMLMetaElement[] i.e: <meta ../> not {..}', () => {
  console.log('====>', service.getTags('name="title"'));
  expect(service.getTags('name="title"')[0].content).toEqual(
    'app title test | test app'
  );
});

// create a component (or bootstrap app) to run this test
test.skip('meta tags should be set to the component', () => {});
