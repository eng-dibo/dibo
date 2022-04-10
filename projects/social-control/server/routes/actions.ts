import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { query as dbQuery } from '~server/database';
/**
 * add/modify blocks
 * a block is a set of services (message, subscription to a json api or rss, ...)
 *
 * @example full qualified format: [{service: 'message', payload: {text: 'hello'}}]
 * @example default service=message: [{payload: {text: 'hello'}}]
 * @example a single item of service=message: {text: 'hello' }
 * @example a single item of service=message, type=text: 'hello'
 */
export default (req: Request, res: Response) => {
  let id = req.params.id,
    payload: any = req.params.payload;

  try {
    payload = stringToObject(payload);
    if (!(payload instanceof Array)) {
      // payload is a single message item
      payload = [{ service: 'message', payload }];
    }
    // mongoose.model will add the default service value if missing.
  } catch (e) {
    // payload is a plain text message
    payload = [{ service: 'message', payload: [{ text: payload }] }];
  }

  // todo: add user
  payload = { items: payload };
  let payloadString = JSON.stringify(payload);

  dbQuery(
    id
      ? `updateOne:messenger_blocks/_id=${id}/${payloadString}`
      : `insert:messenger_blocks/${payloadString}`
  )
    .then((result) => res.json(result))
    .catch((error: any) => {
      console.error(error);
      res.status(500).json({ error, payload });
    });
};
