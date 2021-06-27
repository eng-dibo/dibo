import { test, expect, describe, jest } from '@jest/globals';
import './console';
import { formatOptions, format } from './console';
import { inspect } from 'util';

import { InspectOptions } from 'util';

describe('Logger', () => {
  let logger = console,
    spyLog = jest.spyOn(console, 'log'),
    obj = { x: 1 },
    objFormatted = inspect(obj, formatOptions);

  test('format', () => {
    expect(format(obj)).toEqual([objFormatted]);
  });

  /*
  // todo: https://stackoverflow.com/questions/68131022/test-a-function-after-changing-its-signature

  test('it should format the objects for console methods', () => {
    // use jest.spyOn or jest.fn()
    // https://stackoverflow.com/a/59225389/12577650
    // https://stackoverflow.com/a/54305420/12577650
    // todo: prevent console.log from printing the output, only spy on it

   // todo: console here called with `obj`, not `objFormatted`
    logger.log(obj);    

    expect(spyLog).toHaveBeenCalledWith(objFormatted);
    expect(spyLog).not.toHaveBeenCalledWith(obj);
  });

  test('for console.assert() elements should be formatted if the first one is object', () => {
    let spyAssert = jest.spyOn(console, 'assert');
    logger.assert(false, obj);
    expect(spyAssert).toHaveBeenCalledWith(false, objFormatted);

    logger.assert(false, 'hello');
    expect(spyAssert).toHaveBeenCalledWith(false, 'hello');
  });
  */
});
