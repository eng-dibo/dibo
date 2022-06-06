import { afterAll, beforeAll, expect, test } from '@jest/globals';
import { read, write, remove /*, readSync *writeSync*/ } from './storage';

afterAll(() => {
  return Promise.all(['myfile.txt'].map((file) => remove(file)));
});

test('write', () => expect(write('myfile.txt', 'ok')).resolves.not.toThrow());

test('read', () =>
  read('myfile.txt').then((data) => {
    expect(data).toEqual('ok');
  }));

/*
test('readSync', () => {
  expect(readSync('myfile.txt')).toEqual('');
});


test('writeSync',()=>{
    expect(writeSync()).toEqual()
})
*/
