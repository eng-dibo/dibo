import { test, expect, describe, jest } from '@jest/globals';
import { existsSync, unlinkSync } from 'fs';
import { resize, OutputInfo, convert, edit } from './index';

const img = __dirname + '/test/flower.jpg';

test('edit: to buffer', () => {
  return edit(img, { output: 'buffer' }).then((result) => {
    expect(result).toBeInstanceOf(Buffer);
  });
});

test('resize 200X200', () => {
  return resize(img, [200, 200]).then((result) => {
    result = result as OutputInfo;
    expect(result.format).toEqual('jpeg');
    expect(result.output).toEqual(__dirname + '/test/flower_200X200.jpg');
    expect(existsSync(result.output)).toBeTruthy();
    unlinkSync(result.output);
  });
});

test('resize 250Xnull', () => {
  return resize(__dirname + '/test/flower.jpg', 250).then((result) => {
    result = result as OutputInfo;
    expect(result.format).toEqual('jpeg');
    expect(result.output).toEqual(__dirname + '/test/flower_250.jpg');
    expect(existsSync(result.output)).toBeTruthy();
    unlinkSync(result.output);
  });
});

test('edit nullXnull, png', () => {
  return edit(__dirname + '/test/flower.jpg', { format: 'png' }).then(
    (result) => {
      result = result as OutputInfo;
      expect(result.format).toEqual('png');
      expect(result.output).toEqual(__dirname + '/test/flower.png');
      expect(existsSync(result.output)).toBeTruthy();
      unlinkSync(result.output);
    }
  );
});

test('convert to gif', () => {
  return convert(__dirname + '/test/flower.jpg', 'tiff').then((result) => {
    result = result as OutputInfo;
    expect(result.format).toEqual('tiff');
    expect(result.output).toEqual(__dirname + '/test/flower.tiff');
    expect(existsSync(result.output)).toBeTruthy();
    unlinkSync(result.output);
  });
});

test('editAll', () => {});
