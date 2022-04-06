import { Request, Response } from 'express';
import { parse } from '@engineers/databases/operations';
import { query } from '~server/database';
import { connect } from '~server/database';

/**
 * subscribe to a sequence to get some data each time, based on the registered query
 * to register a new sequence run `/sequence/id/query`
 * where id is the subscription id (i.e userId), and query is how the date fetched from the database
 * (may contain '/'), this query returns the registered data includes '_id'
 * use this _id to get items
 * to get items run `sequence/sequence._id`
 */
export default (req: Request, res: Response): void => {
  let sequenceId = req.params[0];

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

      let queryObj = parse(result.query);
      queryObj.params = queryObj.params || {};
      queryObj.params.limit = queryObj.params.limit || 1;
      queryObj.params.skip = skip;

      return query(queryObj).then((payload) => {
        query(`updateOne:sequences/_id=${id}/skip=${skip}/upsert=true`);
        return payload;
      });
    });
}

/**
 * register a new sequence subscription
 * @example sequence/(psid)/(articles/@categories=1)
 */
export function register(req: Request, res: Response) {
  // the subscription id (i.e user id)
  let id = req.params[0],
    // the query for the sequence
    queryUrl = req.params[1];

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
