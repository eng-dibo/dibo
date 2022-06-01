import { Observable, combineLatest } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';

// export type Param = Observable<ParamMap>;
/**
 * Observe changes of the activated route for both params and query strings.
 *
 * @function urlParams
 * @param  route the current activated route
 * @returns Observable<[Param, Param]>
 */

// issue with combineLatest: https://stackoverflow.com/a/63097193/12577650
// other techniques: https://stackoverflow.com/questions/40699229/subscribe-to-both-route-params-and-queryparams-in-angular-2

/**
 *
 * @param route
 */
export function urlParams(
  route: ActivatedRoute
): Observable<[ParamMap, ParamMap]> {
  // use combineLatest (not forkJoin), because route.paramMap and route.queryParamMap
  // may be changed at any time again and again, every time any of them changes it will emit the current (latest)
  // value from each one.
  return combineLatest([route.paramMap, route.queryParamMap]);
}
