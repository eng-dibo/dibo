import { Observable, of } from 'rxjs';

/**
 * converts non-observable values to rxjs.observable
 * useful if you function expects to recieve a value or an observable that emmits the value
 */
export function toObservable<T>(value: T | Observable<T>): Observable<T> {
  if (!(value instanceof Observable)) {
    value = of(value);
  }
  return value;
}
