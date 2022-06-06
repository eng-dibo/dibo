import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { query as databaseQuery } from '~server/database';
import { request } from '~server/functions';
/**
 * make arbitrary queries
 *
 * @param req
 * @param request_
 * @param res
 * @example post:$pageId/subscribed_apps
 *          url: without endpoint or access_token
 */
// todo: authentication
export default (request_: Request, res: Response): void => {
  // matches: method:objectId;url;data
  let [fullMatch, method, objectId, url, data] = request_.params[0].match(
    /^(?:([^:]+):)?([^;]+);([^;]+)(?:;(.+))?$/
  ) as RegExpMatchArray;

  try {
    let dataObject = stringToObject(data);
    request(objectId, url, dataObject, { method })
      .then((response: any) => res.json(response))
      .catch((error: any) => {
        console.error('[server/routes/messenger] query:', { error });
        res.status(500).json({ error });
      });
  } catch (error: any) {
    console.error('[server/routes/messenger] query:', { error });
    res.status(500).json({ error });
  }
};
