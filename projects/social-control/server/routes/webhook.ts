import { Request, Response } from 'express';
import messengerConfig from '~config/server/messenger';
import { handleMessage } from '~server/functions';
/**
 * responds to webhook events from messenger platform
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
/**
 *
 * @param request
 * @param res
 */
export default function webhook(request: Request, res: Response): void {
  let body = request.body;

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
 * verify the webhook
 * you need to use the route `/setup/$pageId` first to register the app page
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
 * which is the page created just for the app
 *
 * @param req
 * @param request
 * @param res
 */
export function verify(request: Request, res: Response): void {
  let mode = request.query['hub.mode'],
    token = request.query['hub.verify_token'],
    challenge = request.query['hub.challenge'];

  // Checks the mode and token sent is correct
  if (mode === 'subscribe' && token === messengerConfig.verify_token) {
    res.send(challenge);
  } else {
    res.status(500).send(`verification failed: mode=${mode}, token=${token}`);
  }
}
