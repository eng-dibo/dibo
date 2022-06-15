import querystring from 'node:querystring';
import _request from '@engineers/nodejs/https';
import cache from '@engineers/nodejs/cache-fs';
import { TEMP } from './routes';
import { query as databaseQuery } from '~~projects/ngx-cms/server/database';
/**
 * make http request to graph.facebook
 *
 * @param id: object id (example: page id), used to get it's access token from db
 * @param objectId
 * @param url
 * @param data
 * @param options
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
 *
 * @param id PSID (~user id)
 * @param response
 * @param objectId
 * @param psid
 * @param message
 * @returns
 */
export function send(
  objectId: string,
  psid: string,
  message: any,
  arguments_?: { [key: string]: any }
): Promise<any> {
  let payload = {
    recipient: { id: psid },
    message,
    ...arguments_,
  };

  return request(objectId, 'me/messages', payload);
}

/**
 *
 * @param objectId
 * @param psid
 * @param payload
 */
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

/**
 *
 * @param pageId
 */
export function getConfig(pageId: string | number) {
  return cache(`${TEMP}/pages/${pageId}.json`, () =>
    databaseQuery(`pages/${pageId}`)
  );
}
