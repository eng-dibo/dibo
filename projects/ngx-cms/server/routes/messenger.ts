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
import { unlinkSync, existsSync } from 'node:fs';

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
  return getConfig(objectId).then((config) =>
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
 * https://developers.facebook.com/docs/messenger-platform/reference/send-api/
 * @param id PSID (~user id)
 * @param response
 * @returns
 */
export function send(
  objectId: string,
  psid: string,
  message: any,
  args?: { [key: string]: any }
): Promise<any> {
  let payload = {
    recipient: { id: psid },
    message,
    ...args,
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
    res.status(500).json({ body });
    // log the incoming event to inspect it
    console.log('invalid messenger webhook event', body);
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

  // Checks the mode and token sent is correct
  if (mode === 'subscribe' && token === messengerConfig.verify_token) {
    res.send(challenge);
  } else {
    res.status(500).send(`verification failed: mode=${mode}, token=${token}`);
  }
}

/**
 * adds the app to a new page
 * see config/server/models.messenger for more
 *
 * @example:  messenger/setup/page=$pageId,access_token=$token,greeting=welcome%20{{user_first_name}},welcome=conversation%20started
 * access_token is required for the first time only, other properties except pageId are optional
 */
export function setup(req: Request, res: Response): void {
  try {
    let config = stringToObject(req.params.config);
    if (!config.page) {
      throw new Error(`parameter page (page id) is required`);
    }

    config._id = config.page;
    delete config.page;

    if (typeof config.greeting === 'string') {
      config.greeting = [{ locale: 'default', text: config.greeting }];
    }

    if (typeof config.welcome === 'string') {
      // welcome is a plain text message
      // it may be any message template or an array of messages
      config.welcome = { text: config.welcome };
    }

    connect()
      .then(() =>
        // access_token is required for the first time only.
        // when updating the page's configs, access_token is optional
        config.access_token
          ? undefined
          : getConfig(config._id).then((result) => {
              if (!result || !result.access_token) {
                throw new Error('parameter access_token is required');
              }
            })
      )
      .then(() =>
        // todo: add user
        dbQuery(
          `updateOne:messenger/_id=${config._id}/${JSON.stringify(
            config
          )}/upsert=true`
        )
      )
      // purge the cache
      .then(() => {
        let tmp = `${TEMP}/messenger/${config._id}.json`;
        existsSync(tmp) && unlinkSync(tmp);
      })
      .then(() =>
        // persistent menu requires adding a 'get started' button
        // https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
        config.menu
          ? request(config._id, 'me/messenger_profile', {
              get_started: { payload: 'get_started' },
            })
          : Promise.resolve()
      )
      .then(() =>
        Promise.all(
          ['greeting', 'menu']
            .filter((el) => config[el])
            .map((el) => {
              if (el === 'menu') return { persistent_menu: config[el] };
              else if (el === 'greeting') return { greeting: config[el] };
              return config[el];
            })
            .map((el) => request(config._id, 'me/messenger_profile', el))
        )
      )
      .then((result) => res.json(config))
      .catch((error) => {
        console.log({ error, config });
        res.status(500).json({ error, config });
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
    // todo: check payload.referral.ref to redirect the conversation to another block
    // instead of displaying the welcome message
    if (payload.referral && payload.referral.ref) {
    } else if (payload.postback.payload === 'get_started') {
      return getConfig(objectId).then((config) =>
        config && config.welcome
          ? send(objectId, psid, config.welcome)
          : // no action required
            Promise.resolve()
      );
    }
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

export function getConfig(pageId: string | number) {
  return cache(`${TEMP}/messenger/${pageId}.json`, () =>
    connect().then(() => dbQuery(`messenger/${pageId}`))
  );
}

/**
 * add/modify blocks
 * a block is a set of services (message, subscription to a json api or rss, ...)
 *
 * @example full qualified format: [{service: 'message', payload: {text: 'hello'}}]
 * @example default service=message: [{payload: {text: 'hello'}}]
 * @example a single item of service=message: {text: 'hello' }
 * @example a single item of service=message, type=text: 'hello'
 */
export function blocks(req: Request, res: Response) {
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
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error, payload });
    });
}
