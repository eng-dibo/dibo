// jest methods are available globally, no need to import them https://jestjs.io/docs/api
// install @types/jest
import { describe, expect, jest, test } from '@jest/globals';
import { sleep, timer } from './time';

describe('timer', () => {
  jest.useFakeTimers();
  for (let index = 0; index < 5; index++) {
    let duration = Math.round(index * 1000 * Math.random());
    test(`duration = ${duration}ms`, () => {
      jest.advanceTimersByTime(duration);
      expect(timer('test')).toEqual(duration / 1000);
    });
  }
});

describe('sleep', () => {
  test('sleep for 2 seconds', () => {
    // todo: test sleep()
  });
});
