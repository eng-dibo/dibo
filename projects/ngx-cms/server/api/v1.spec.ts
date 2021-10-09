import { test, expect, beforeAll, afterAll } from '@jest/globals';
import app, { query } from './v1';
import { Router } from 'express';
import { connect, getModel } from '../mongoose';
// todo: use '~'
import { model, mongoose } from '../../../../packages/mongoose';
import { uri } from '../../../../packages/mongoose/test/config';

// todo: afterAll() -> delete db
beforeAll(() => {
  return connect(uri)
    .then(() => getModel('articles'))
    .then((articlesModel) =>
      articlesModel.create({ title: 'article#1' }, { title: 'article#2' })
    );
});

afterAll(() => {
  // drop all databases used for testing and close the connection after finishing testing
  // to avoid open handlers
  let con = mongoose.connection.useDb('spec');
  return con.db.dropDatabase().then(() => con.close());
});

test('query', () => {
  return query('find', 'articles', {}, { title: 1 }, { limit: 1 }).then(
    (result) => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(1);
      expect(result[0].title.indexOf('article#')).toEqual(0);
    }
  );
});

// todo: testing routes via SuperTest
// https://dev.to/lukekyl/testing-your-express-js-backend-server-3ae6
test('routes', () => {});
