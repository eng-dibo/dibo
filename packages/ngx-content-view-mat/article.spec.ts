/**
 * @jest-environment jsdom
 */

import { beforeAll, expect, test } from '@jest/globals';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
// import { NgxContentArticleComponent } from './article';
import { NgxContentViewModule } from './module';
import { Component } from '@angular/core';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

let fixture: ComponentFixture<AppComponent>,
  app: AppComponent,
  template: HTMLElement;

@Component({
  selector: 'app',
  template: `<ngx-content-article [data]="data"></ngx-content-article>`,
})
export class AppComponent {
  public data = {
    author: { name: 'author name' },
    title: 'article title',
  };
}

beforeAll(async () => {
  await TestBed.configureTestingModule({
    imports: [RouterTestingModule, NgxContentViewModule],
    declarations: [AppComponent],
    providers: [
      // fixes: Could not find Angular Material core theme
      // same as importing '~@angular/material/prebuilt-themes/deeppurple-amber.css' in article.scss file
      // https://stackoverflow.com/a/45789335/12577650
      // https://github.com/thymikee/jest-preset-angular/issues/83#issuecomment-341055433
      { provide: MATERIAL_SANITY_CHECKS, useValue: false },
    ],
  }).compileComponents();
  // todo: use `await resolveComponentResources()` to resolve components templateUrl,styleUrls
  // https://github.com/angular/angular/blob/66f1962fa69179fbc40be69ea408ad4bb1d9d9b9/packages/core/test/metadata/resource_loading_spec.ts#L66

  fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  app = fixture.componentInstance;
  // same as fixture.debugElement.nativeElement
  template = fixture.nativeElement;
});

test('the app should be created', () => {
  expect(app).toBeTruthy();
});

test('it should create <mat-card>', () => {
  expect(template.querySelector('mat-card')).toBeTruthy();
  expect(template.querySelector('non-existing')).toBeFalsy();
});

test('card header should contain `author name`', () => {
  let subtitle = template.querySelector('mat-card-subtitle');
  expect(subtitle!.textContent).toContain('author name');
});
