/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, test } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  html2text,
  hypernate,
  keepHtml,
  length,
  nl2br,
  slug,
} from './pipes-functions';
import { Component } from '@angular/core';

test('length', () => {
  let value = 'abcdefghi';
  expect(length(value)).toEqual(value);
  expect(length(value, 3)).toEqual('abc');
  expect(length(value, 3, 2)).toEqual('cde');
});

test('nl2br', () => {
  let value = 'a<br>b<br />c\nd\re\n\rf';
  expect(nl2br(value)).toEqual('a<br>b<br />c<br />d<br />e<br />f');
});

test('slug', () => {
  let value = 'a b/c-d&e 123--';
  expect(slug(value)).toEqual('a-b-c-d-e-123');
  expect(slug(value, { length: 3 })).toEqual('a-b');
  expect(slug(value, { allowedChars: '&', encode: false })).toEqual(
    'a-b-c-d&e-123'
  );
  expect(slug(value, { allowedChars: '&', encode: true })).toEqual(
    'a-b-c-d%26e-123'
  );
});

test('html2text', () => {
  let value = `<h2>heading</h2><p>paragraph1</p><p>paragraph2</p><a href='https://google.com'>link text</a><br />text`;

  expect(html2text(value, { lineBreak: 'n' })).toEqual(
    `\nheading\n\nparagraph1\n\nparagraph2\nlink text https://google.com\ntext`
  );

  /* todo: jest removes <br />
  expect(html2text(value, { lineBreak: 'br' })).toEqual(
    `<br />heading<br /><br />paragraph1<br /><br />paragraph2<br />link text https://google.com<br />text`
  );
  */
});

test('hypernate', () => {
  let value = `text https://example.com/files<br />example.com.eg <a href="example.com">example.com</a>example.com`;

  expect(hypernate(value)).toEqual(
    `text <a href="https://example.com/files">https://example.com/files</a><br /><a href="example.com.eg">example.com.eg</a> <a href="example.com">example.com</a><a href="example.com">example.com</a>`
  );
});

// todo: test keepHtml(): Component.#ref.innerHTML=value

describe('keepHtml()', () => {
  test('keepHtml', () => {
    @Component({
      selector: 'comp',
      template: `<div #ref></div>`,
    })
    class AppComponent {
      constructor(public sanitizer: DomSanitizer) {}
    }

    TestBed.configureTestingModule({
      imports: [BrowserTestingModule],
      declarations: [AppComponent],
      // we don't need to add DomSanitizer to providers[]
      // https://stackoverflow.com/a/39438086/12577650
    }).compileComponents();

    let fixture: ComponentFixture<AppComponent> =
      TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let sanitizer = fixture.componentInstance.sanitizer;
    let value = '<div>trusted html code</div>';
    let trustedValue: SafeHtml = {
      changingThisBreaksApplicationSecurity: '<div>trusted html code</div>',
    };

    expect(keepHtml(value, sanitizer)).toEqual(trustedValue);

    // without injecting DomSanitizer
    expect(keepHtml(value)).toEqual(trustedValue);
  });

  test('it should keep the inserted html code with keepHtml()', () => {});
});
