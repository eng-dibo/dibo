import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { query as databaseQuery } from '~server/database';
/**
 * add/modify blocks
 * a block is a set of services (message, subscription to a json api or rss, ...)
 *
 * @param req
 * @param request
 * @param res
 * @example full qualified format: [{service: 'message', payload: {text: 'hello'}}]
 * @example default service=message: [{payload: {text: 'hello'}}]
 * @example a single item of service=message: {text: 'hello' }
 * @example a single item of service=message, type=text: 'hello'
 */
export default (request: Request, res: Response) => {
  let id = request.params.id,
    payload: any = request.params.payload;

  try {
    payload = stringToObject(payload);
    if (!Array.isArray(payload)) {
      // payload is a single message item
      payload = [{ service: 'message', payload }];
    }
    // mongoose.model will add the default service value if missing.
  } catch {
    // payload is a plain text message
    payload = [{ service: 'message', payload: [{ text: payload }] }];
  }

  // todo: add user
  payload = { items: payload };
  let payloadString = JSON.stringify(payload);

  databaseQuery(
    id
      ? `updateOne:actions/_id=${id}/${payloadString}`
      : `insert:actions/${payloadString}`
  )
    .then((result) => res.json(result))
    .catch((error: any) => {
      console.error(error);
      res.status(500).json({ error, payload });
    });
};
