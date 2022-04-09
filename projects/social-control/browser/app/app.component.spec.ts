/**
 * @jest-environment jsdom
 */

import { test, expect, beforeAll, beforeEach, describe } from '@jest/globals';

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

test(`should have as title 'social-control'`, () => {
  expect(app.title).toEqual('social-control');
});

test('should render title', () => {
  expect(template.querySelector('.content span')!.textContent).toContain(
    'social-control app is running!'
  );
});
