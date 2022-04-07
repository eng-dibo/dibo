// messenger platform (facebook bot)
// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
// https://developers.facebook.com/docs/messenger-platform
import messengerConfig from '~config/server/messenger';
import { Request, Response } from 'express';
import querystring from 'node:querystring';
import _request from '@engineers/nodejs/https';

/**
 * make http request to graph.facebook
 * @param url
 * @param data
 * @returns
 */
export function request(url: string, data?: any, options?: any) {
  let endpoint = 'https://graph.facebook.com/v13.0';

  return _request(
    `${endpoint}/${url}?${querystring.stringify({
      access_token: messengerConfig.access_token,
    })}`,
    data
  );
}

/**
 * send messages via messenger platform
 * @param id PSID (~user id)
 * @param response
 * @returns
 */
export function send(id: string, message: any): Promise<any> {
  let payload = {
    recipient: { id },
    message,
  };

  return request('me/messages', payload);
}
/**
 * responds to webhook events from messenger platform
 * @param req
 * @param res
 */
/*
to test the webhook make a curl request
use https://reqbin.com/curl  to make curl requests online

```
curl -i -X POST -H 'Content-Type: application/json' -d '{"object":"page","entry":[{"id":43674671559,"time":1460620433256,"messaging":[{"sender":{"id":123456789},"recipient":{"id":987654321},"timestamp":1460620433123,"message":{"mid":"mid.1460620432888:f8e3412003d2d1cd93","seq":12604,"text":"Testing Chat Bot .."}}]}]}' {{host}}/api/v1/messenger
```
 replace {{host}} with your server's host
*/
export default function webhook(req: Request, res: Response): void {
  let body = req.body;
  if (body.object === 'page') {
    // body.entry is an Array
    body.entry.forEach((entry: any) => {
      // entry.messaging is an array of only one element
      let payload = entry.messaging[0],
        id = payload.sender.id;

      handleMessage(id, payload)
        .then((response) => res.json(response))
        .catch((error) => res.status(error.code).json({ error }));
    });
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
    res.json({ body });
  }
}

/**
 * make arbitrary queries
 * @example post:$pageId/subscribed_apps
 *          url: without endpoint or access_token
 */
// todo: authentication
export function query(req: Request, res: Response): void {
  let [fullMatch, method, url, data] = req.params[0].match(
    // method:url;data
    /(?:([^:\/]+):)?(.+)(?:;(.+))?/
  ) as RegExpMatchArray;

  request(url, data, { method })
    .then((response) => res.json(response))
    .catch((error) => res.json({ error }));
}

// verify webhook
export function verify(req: Request, res: Response): void {
  let mode = req.query['hub.mode'],
    token = req.query['hub.verify_token'],
    challenge = req.query['hub.challenge'];

  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === messengerConfig.verify_token) {
      res.send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

export function handleMessage(id: string, payload: any): Promise<any> {
  let response: any;
  if (payload.postback) {
  } else if (payload.message) {
    let message = payload.message;
    // basic text message
    if (message.text) {
      response = {
        text: `received: "${message.text}"`,
      };
    }
  }

  // Sends the response message
  return send(id, response);
}
