// messenger platform (facebook bot)
// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
// https://developers.facebook.com/docs/messenger-platform
import messengerConfig from '~config/server/messenger';
import { Request, Response } from 'express';
import querystring from 'node:querystring';
import _request from '@engineers/nodejs/https';
import { stringToObject } from '@engineers/javascript/string';
import { connect, query as dbQuery } from '~server/database';
import cache from '@engineers/nodejs/cache-fs';
import { TEMP } from '.';

/**
 * make http request to graph.facebook
 * @param id: object id (example: page id), used to get it's access token from db
 * @param url
 * @param data
 * @returns
 */
export function request(
  objectId: string | number,
  url: string,
  data?: any,
  options?: any
) {
  let endpoint = 'https://graph.facebook.com/v13.0';
  return cache(`${TEMP}/messenger/${objectId}.json`, () =>
    connect().then(() => dbQuery(`messenger/${objectId}`))
  ).then((config) =>
    _request(
      `${endpoint}/${url}?${querystring.stringify({
        access_token: config.access_token,
      })}`,
      data
    )
  );
}

/**
 * send messages via messenger platform
 * @param id PSID (~user id)
 * @param response
 * @returns
 */
export function send(
  objectId: string,
  psid: string,
  message: any
): Promise<any> {
  let payload = {
    recipient: { id: psid },
    message,
  };

  return request(objectId, 'me/messages', payload);
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


incoming request example:
```
{
    "object": "page",
    "entry": [
        {
            "id": 43674671559,
            "time": 1460620433256,
            "messaging": [
                {
                    "sender": {
                        "id": 123456789
                    },
                    "recipient": {
                        "id": 987654321
                    },
                    "timestamp": 1460620433123,
                    "message": {
                        "mid": "mid.1460620432888:f8e3412003d2d1cd93",
                        "seq": 12604,
                        "text": "Testing Chat Bot .."
                    }
                }
            ]
        }
    ]
}
```
 */
export default function webhook(req: Request, res: Response): void {
  let body = req.body;
  console.log({ body });
  if (body.object === 'page') {
    // body.entry is an Array
    body.entry.forEach((entry: any) => {
      // entry.messaging is an array of only one element

      let objectId = entry.id,
        payload = entry.messaging[0],
        psid = payload.sender.id;

      handleMessage(objectId, psid, payload)
        .then((response) => res.json(response))
        .catch((error) => {
          console.error('[server/routes/messenger] handleMessage:', { error });
          res.status(error.code).json({ error });
        });
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
}

// verify the webhook
// you need to use the route `/messenger/setup/$pageId` first to register the app page
// which is the page created just for the app
// https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
export function verify(req: Request, res: Response): void {
  let mode = req.query['hub.mode'],
    token = req.query['hub.verify_token'],
    challenge = req.query['hub.challenge'];
  cache(`${TEMP}/messenger/${messengerConfig.page}.json`, () =>
    connect().then(() => dbQuery(`messenger/${messengerConfig.page}`))
  )
    .then((config) => {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === config.verify_token) {
        res.json(challenge);
      } else {
        throw new Error('verification failed');
      }
    })
    .catch((error) => {
      // Responds with '403 Forbidden'
      console.log({ error });
      res.status(403).json({ error });
    });
}

/**
 * adds the app to a new page
 *
 * @example:  /setup/page=$pageId,access_token=$token,welcome=welcome%20{{user_first_name}}
 */
export function setup(req: Request, res: Response): void {
  try {
    let config = stringToObject(req.params.config);
    if (!config.page) {
      throw new Error(`parameter page (page id) is required`);
    } else if (!config.access_token) {
      throw new Error(`parameter access_token is required`);
    }

    config._id = config.page;
    delete config.page;

    if (config.welcome) {
      if (typeof config.welcome === 'string') {
        config.welcome = [{ locale: 'default', text: config.welcome }];
      }
      config.welcome = { greeting: config.welcome };
    }

    if (config.menu) {
      config.menu = { persistent_menu: config.menu };
    }
    if (config.userLevelMenu) {
      config.userLevelMenu = { persistent_menu: config.userLevelMenu };
    }

    connect()
      .then(() =>
        dbQuery(
          `updateOne:messenger/_id=${config._id}/${req.params.config}/upsert=true`
        )
      )
      .then(() =>
        // persistent menu requires adding a 'get started' button
        // https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
        config.menu || config.userLevelMenu
          ? request(config._id, 'me/messenger_profile', {
              get_started: { payload: 'get_started' },
            })
          : Promise.resolve()
      )
      .then(() =>
        Promise.all(
          ['welcome', 'menu', 'userLevelMenu']
            .filter((el) => config[el])
            .map((el) =>
              request(config._id, 'me/messenger_profile', config[el])
            )
        )
      )
      .then((result) => res.json(result))
      .catch((error) => {
        console.log({ error });
        res.status(500).json({ error });
      });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ error });
  }
}

export function handleMessage(
  objectId: string,
  psid: string,
  payload: any
): Promise<any> {
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
  return send(objectId, psid, response);
}
