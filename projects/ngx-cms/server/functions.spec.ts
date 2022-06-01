import { beforeAll, expect, test } from '@jest/globals';
import { bucket, dev as development, getCategories } from './functions';
import { connect } from './mongoose';
import { uri } from '../../../packages/mongoose/test/config';

beforeAll(() => {
  return connect(uri);
});

test('project in prod mode by default', () => {
  expect(development).toEqual(false);
});

test('bucket', () => {
  // expect(bucket).toBeInstanceOf(storage);
  expect(bucket.bucket.name).toEqual('bucketName');
});

test('getCategories', () => {
  return getCategories('articles').then((data) => {
    expect(data.categories).toBeInstanceOf(Array);
  });
});
