// jest methods are available globally, no need to import them https://jestjs.io/docs/api
// install @types/jest
import { test, expect, describe, jest } from '@jest/globals';
import { timer } from './time';

describe('it should return the execution time duration, every `duration` seconds', () => {
  jest.useFakeTimers();
  for (let i = 0; i < 5; i++) {
    let duration = Math.round(i * 1000 * Math.random());
    test(`duration = ${duration}ms`, () => {
      jest.advanceTimersByTime(duration);
      expect(timer('test')).toEqual(duration / 1000);
    });
  }
});
