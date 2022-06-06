import { Request, Response } from 'express';
import { parse } from '@engineers/databases/operations';
import { connect, query } from '~server/database';

/**
 * subscribe to a sequence to get some data each time, based on the registered query
 * to register a new sequence run `/sequence/id/query`
 * where id is the subscription id (i.e userId), and query is how the date fetched from the database
 * (may contain '/'), this query returns the registered data includes '_id'
 * use this _id to get items
 * to get items run `sequence/sequence._id`
 *
 * @param req
 * @param request
 * @param res
 */
export default (request: Request, res: Response): void => {
  let sequenceId = request.params[0];

  if (!sequenceId) {
    throw new Error(`invalid sequence ${sequenceId}`);
  }

  getPayload(sequenceId)
    .then((payload: any) => res.json(payload))
    .catch((error: any) => {
      res.json({ error });
      console.error({ error });
    });
};

export interface Sequence {
  query: string;
  subscription: string;
  // every request, skip increased to fetch the next items
  skip?: number;
  _id: string;
}

/**
 * get the current item in the sequence
 *
 * @param id the sequence id
 */
export function getPayload(id: string) {
  return connect()
    .then(() => query(`sequences/${id}`))
    .then((result: Sequence) => {
      if (!result) {
        throw new Error(`invalid subscription ${id}`);
      }
      let defaultValues = { skip: 0, limit: 1 };
      let skip = result.skip ? +result.skip + defaultValues.limit : 0;

      let queryObject = parse(result.query);
      queryObject.params = queryObject.params || {};
      queryObject.params.limit = queryObject.params.limit || 1;
      queryObject.params.skip = skip;

      return query(queryObject).then((payload) => {
        query(`updateOne:sequences/_id=${id}/skip=${skip}/upsert=true`);
        return payload;
      });
    });
}

/**
 * register a new sequence subscription
 *
 * @param req
 * @param request
 * @param res
 * @example sequence/(psid)/(articles/@categories=1)
 */
export function register(request: Request, res: Response) {
  // the subscription id (i.e user id)
  let id = request.params[0],
    // the query for the sequence
    queryUrl = request.params[1];

  return connect()
    .then(() =>
      query({
        operation: 'create',
        collection: 'sequences',
        portions: [{ subscription: id, query: queryUrl }],
      })
    )
    .then((payload) => res.json(payload))
    .catch((error) => {
      res.json({ error });
      console.error('[server/routes/sequence]', error);
    });
}
