/**
 * @jest-environment jsdom
 */

import { beforeAll, beforeEach, describe, expect, test } from '@jest/globals';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

let fixture: ComponentFixture<AppComponent>,
  app: AppComponent,
  template: HTMLElement;

beforeAll(() => {
  TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    declarations: [AppComponent],
  }).compileComponents();

  fixture = TestBed.createComponent(AppComponent);
  app = fixture.componentInstance;
  template = fixture.nativeElement;
  fixture.detectChanges();
});

test('should create the app', () => {
  expect(app).toBeTruthy();
});

test(`should have as title 'ngx-cms'`, () => {
  expect(app.title).toEqual('ngx-cms');
});

test('should render title', () => {
  expect(template.querySelector('.content span')!.textContent).toContain(
    'ngx-cms app is running!'
  );
});
