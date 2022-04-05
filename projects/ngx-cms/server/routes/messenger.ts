// messenger platform (facebook bot)
// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
// https://developers.facebook.com/docs/messenger-platform
import messengerConfig from '~config/server/messenger';
import { Request, Response } from 'express';
import https from 'node:https';
import querystring from 'node:querystring';

const host = 'https://graph.facebook.com';
const endpoint = '/v2.6/me/messages';

/**
 *
 * @param id sender psid
 * @param received_message
 */
export function handleMessage(id: string, message: any) {
  let response: any;
  if (message.text) {
    // Create the payload for a basic text message
    response = {
      text: `received: "${message.text}"`,
    };
  }

  // Sends the response message
  send(id, response);
}

export function handlePostback(id: string, message: any) {}

export function send(id: string, response: any) {
  let payload = {
    recipient: {
      id: id,
    },
    message: response,
  };

  let options = {
    protocol: 'https:',
    host,
    path: `${endpoint}/${querystring.stringify({
      access_token: messengerConfig.access_token,
    })}`,
    method: 'POST',
  };

  let req = https.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log(chunk);
    });
  });

  req.on('error', function (error) {
    console.error(`> [messenger] error:`, error);
  });

  req.write(JSON.stringify(payload));
  req.end();
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

export default (req: Request, res: Response) => {
  let body = req.body;
  if (body.object === 'page') {
    // body.entry is an Array
    body.entry.forEach((entry: any) => {
      // entry.messaging is an array of only one element
      let payload = entry.messaging[0],
        id = payload.sender.id;

      if (payload.message) {
        handleMessage(id, payload.message);
      } else if (payload.postback) {
        handlePostback(id, payload.postback);
      }
    });

    res.send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};
