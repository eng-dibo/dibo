import { test, expect, afterAll } from '@jest/globals';
import { connect, getModel } from './mongoose';
import { model, mongoose } from '../../../packages/mongoose';
import { uri } from '../../../packages/mongoose/test/config';

test('connect', () => {
  return connect(uri).then((cn) => {
    expect(cn).toBeInstanceOf(mongoose.Mongoose);
  });
});

test('getModel', () => {
  let articlesModel = getModel('articles');
  expect(articlesModel.constructor).toBeInstanceOf(mongoose.Model.constructor);
  expect(articlesModel.schema.constructor).toBeInstanceOf(
    mongoose.Schema.constructor
  );
  expect(articlesModel.schema.paths.title).toBeTruthy();
  expect(articlesModel.schema.paths.slug).toBeTruthy();
});
