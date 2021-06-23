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

/**
 * to pause a function make it async and use await sleep(duration);
 * or use sleep() as a promise
 * @method sleep
 * @param  seconds
 * @return
 * @examples async function test(){console.log(1); await sleep(2); console.log(1);}
 */
export function sleep(seconds?: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, (seconds || 0) * 1000));
}
