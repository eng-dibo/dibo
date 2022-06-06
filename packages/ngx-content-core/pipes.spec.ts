/**
 * @jest-environment jsdom
 */
import { beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxContentCoreModule } from './module';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';

let fixture: ComponentFixture<AppComponent>,
  app: AppComponent,
  template: HTMLElement,
  value: string;

@Component({
  selector: 'app',
  // eslint-disable-next-line no-secrets/no-secrets
  template: `
    <div id="length">{{ 'abcdefghijklmnopqrstuvwxyz' | length: 5 }}</div>
    <div id="nl2br" [innerHTML]="nl2brValue | nl2br"></div>
    <div id="slug">{{ 'a b/c-d&e 123--' | slug: { length: 5 } }}</div>
    <div id="html2text" [innerHTML]="html2textValue | html2text"></div>
    <div id="hypernate" [innerHTML]="hypernateValue | hypernate"></div>
  `,
})
class AppComponent {
  constructor() {}
  nl2brValue = 'a<br>b<br />c\nd\re\n\rf';
  html2textValue = `<h2>heading</h2><p>paragraph1</p><p>paragraph2</p><a href='https://google.com'>link text</a><br />text`;
  hypernateValue = `text https://example.com/files<br />example.com.eg <a href="example.com">example.com</a>example.com`;
}

beforeAll(async () => {
  await TestBed.configureTestingModule({
    imports: [RouterTestingModule, NgxContentCoreModule],
    declarations: [AppComponent],
  }).compileComponents();

  fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  app = fixture.componentInstance;
  template = fixture.nativeElement;
});

test('LengthPipe', () => {
  /*
  you can test using the class implementation, without DOM
  expect(new LengthPipe().transform(value)).toEqual(..)
  */
  value = template.querySelector('#length')!.innerHTML;
  expect(value.length).toEqual(5);
  expect(value).toEqual('abcde');
});

test('nl2br', () => {
  // todo: angular or jest removes the slash from `<br />`
  value = template.querySelector('#nl2br')!.innerHTML;
  expect(value).toEqual('a<br>b<br>c<br>d<br>e<br>f');
});

test('slug', () => {
  value = template.querySelector('#slug')!.innerHTML;
  expect(value).toEqual('a-b-c');
});

test('html2text', () => {
  value = template.querySelector('#html2text')!.innerHTML;
  expect(value).toEqual(
    `\nheading\n\nparagraph1\n\nparagraph2\nlink text https://google.com\ntext`
  );
});

test('hypernate', () => {
  value = template.querySelector('#hypernate')!.innerHTML;
  expect(value).toEqual(
    `text <a href="https://example.com/files">https://example.com/files</a><br><a href="example.com.eg">example.com.eg</a> <a href="example.com">example.com</a><a href="example.com">example.com</a>`
  );
});
