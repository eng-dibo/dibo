import { toObservable } from './index';
import { Observable, of } from 'rxjs';
import { beforeAll, beforeEach, expect, test } from '@jest/globals';

test('toObservable() converts non-observables to Observable', (done) => {
  expect(toObservable('ok')).toBeInstanceOf(Observable);

  toObservable('ok').subscribe((value) => {
    expect(value).toEqual('ok');
  });
  done();
});

test('toObservable() Observable value', (done) => {
  expect(toObservable(of('ok'))).toBeInstanceOf(Observable);

  toObservable(of('ok')).subscribe((value) => {
    expect(value).toEqual('ok');
  });
  done();
});
