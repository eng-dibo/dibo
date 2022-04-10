import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { query as dbQuery } from '~server/database';
/**
 * make arbitrary queries
 * @example post:$pageId/subscribed_apps
 *          url: without endpoint or access_token
 */
// todo: authentication
export default (req: Request, res: Response): void => {
  // matches: method:objectId;url;data
  let [fullMatch, method, objectId, url, data] = req.params[0].match(
    /^(?:([^:]+):)?([^;]+);([^;]+)(?:;(.+))?$/
  ) as RegExpMatchArray;

  try {
    let dataObj = stringToObject(data);
    request(objectId, url, dataObj, { method })
      .then((response) => res.json(response))
      .catch((error) => {
        console.error('[server/routes/messenger] query:', { error });
        res.status(500).json({ error });
      });
  } catch (error) {
    console.error('[server/routes/messenger] query:', { error });
    res.status(500).json({ error });
  }
};
