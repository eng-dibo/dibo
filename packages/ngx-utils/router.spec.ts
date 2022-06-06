/**
 * @jest-environment jsdom
 */

import { beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, Routes } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { urlParams as urlParameters } from './router';
import { take } from 'rxjs/operators';
import { of } from 'rxjs';

// testing Angular routing
// https://codecraft.tv/courses/angular/unit-testing/routing/

// the root App with <router-outlet>
@Component({
  template: `<router-outlet></router-outlet>`,
})
class AppComponent {}

@Component({
  template: `Home`,
})
class HomeComponent {}

@Component({
  template: `Search`,
})
class SearchComponent {}

@Component({
  template: `User`,
})
class UserComponent {
  id: string | null;
  id2: string | null;
  constructor(public _activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this._activatedRoute.snapshot.params.id;

    this._activatedRoute.paramMap.subscribe((parameters) => {
      this.id2 = parameters.get('id');
    });
  }
}

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'user/:id', component: UserComponent },
];

let location: Location;
let router: Router;
let fixture: ComponentFixture<UserComponent>;
let userComponent: UserComponent;
let activatedRoute: ActivatedRoute;

beforeAll(() => {
  TestBed.configureTestingModule({
    imports: [RouterTestingModule.withRoutes(routes)],
    declarations: [AppComponent, HomeComponent, SearchComponent, UserComponent],

    providers: [
      {
        // todo: test the actual ActivatedRoute instead of mocking it
        provide: ActivatedRoute,
        useValue: {
          // the initial params value
          snapshot: { params: { id: '123' } },
          // changes to the activated route
          paramMap: of({ id: '456' }),
          queryParamMap: of({ username: 'test' }),
        },
      },
    ],
  }); // .compileComponents();

  router = TestBed.inject(Router);
  location = TestBed.inject(Location);
  activatedRoute = TestBed.inject(ActivatedRoute);
  fixture = TestBed.createComponent(UserComponent);
  userComponent = fixture.componentInstance;
  router.initialNavigation();
});

beforeEach(() => {
  fixture.detectChanges();
});
describe.skip('temporary skip all tests', () => {
  test('navigate to "" redirects to /home', () => {
    return router.navigate(['']).then((result: any) => {
      expect(result).toEqual(true);
      expect(location.path()).toEqual('/home');
    });
  });

  test('urlParams', (done) => {
    // don't navigate to the same location as the previous test
    // otherwise router.navigate() will never resolves
    router
      .navigate(['/user/123'], { queryParams: { username: 'test' } })
      .then((result: any) => {
        return (
          urlParameters(activatedRoute)
            // combineLatest may emit continuously and never complete,
            // we just need the fist emitted value
            // but we take(>1) to guarantee that bot paramMap and queryParamMap emitted values
            .pipe(take(1))
            .subscribe((parameters: any) => {
              expect(parameters).toEqual([{ id: '456' }, { username: 'test' }]);
              done();
            })
        );
      });
  });

  test('tmp', (done) => {
    router
      .navigate(['/user/123'], {
        queryParams: { username: 'test' },
      })
      .then((result: any) => {
        expect(result).toBeTruthy();
        expect(activatedRoute.snapshot.paramMap.get('username')).toEqual(2);
        activatedRoute.paramMap.pipe(take(1)).subscribe((value) => {
          expect(value).toEqual(3);
          done();
        });
      });
  });

  // todo: Create service which will hold the route path
  // https://tomastrajan.medium.com/how-to-get-route-path-parameters-in-non-routed-angular-components-32fc90d9cb52
  test('tmp2', (done) => {
    // or location.go('/user/123?username=test')
    router
      .navigate(['/user/123'], {
        queryParams: { username: 'test' },
      })
      .then((result: any) => {
        expect(result).toBeTruthy();
        expect(location.path()).toEqual('/user/123?username=test');
        expect(activatedRoute.snapshot.queryParamMap).toEqual({
          params: { username: 'test' },
        });
        expect(activatedRoute.snapshot.paramMap).toEqual('snapshot.paramMap');

        activatedRoute.paramMap.pipe(take(1)).subscribe((value) => {
          expect(value).toEqual('paramMap');
          done();
        });
      });
  });

  test('tmp3: using location', (done) => {
    location.go('/user/123?username=test');
    expect(location.path()).toEqual('/user/123?username=test');
    expect(activatedRoute.snapshot.queryParamMap).toEqual({
      params: { username: 'test' },
    });
    expect(activatedRoute.snapshot.paramMap).toEqual('snapshot.paramMap');
    // todo: urlParams
  });

  test('tmp4: userComp', (done) => {
    location.go('/user/123?username=test');
    expect(userComponent.id).toEqual(4);
    done();
  });
});
