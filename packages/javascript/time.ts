/**
 * time & Date functions
 */

/**
 * a helper object for timer()
 */
let timerObj: { [key: string]: number } = {};

/**
 * measure the execution's duration.
 * @param label a unique label to identify a group of operators.
 * @param end end the timer and remove it from the local object `timerObj`
 * @returns
 *
 * @example
 * timer('connection')
 * connect().then(()=>console.log(`connected in ${timer('connection')} seconds`))
 */
export function timer(label = 'default', end = false): number {
  let now = Date.now();
  let diff = timerObj[label] ? (now - timerObj[label]) / 1000 : 0;
  // remove or reset the timer
  if (end) {
    delete timerObj[label];
  } else {
    timerObj[label] = now;
  }
  return diff;
}
