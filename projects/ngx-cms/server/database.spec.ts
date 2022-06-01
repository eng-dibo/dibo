import { afterAll, expect, test } from '@jest/globals';
import { connect, getModel, query } from './database';
import { model, mongoose } from '../../../packages/mongoose';
import { uri } from '../../../packages/mongoose/test/config';
import { booksModel, clean } from '../../../packages/mongoose/index.spec';

afterAll(() => clean());

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

test('query', () => {
  return booksModel
    .create({ name: 'book#1' }, { name: 'book#2' })
    .then(() => query('books/:2'))
    .then((result) => {
      expect(result).toBeTruthy();
      expect(result.length).toEqual(2);
    });
});
