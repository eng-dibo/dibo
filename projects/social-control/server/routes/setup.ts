import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { TEMP } from '.';
import { existsSync, unlinkSync } from 'node:fs';
import { query as databaseQuery } from '~server/database';
import { getConfig, handleMessage, request } from '~server/functions';
/**
 * adds the app to a new page
 * see ~server/models.pages for more
 *
 * @param req
 * @param request_
 * @param res
 * @example:  setup/page=$pageId,access_token=$token,greeting=welcome%20{{user_first_name}},welcome=conversation%20started
 * access_token is required for the first time only, other properties except pageId are optional
 */
export default (request_: Request, res: Response): void => {
  try {
    let config = stringToObject(request_.params.config);
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

    // access_token is required for the first time only.
    // when updating the page's configs, access_token is optional
    (config.access_token
      ? Promise.resolve()
      : getConfig(config._id).then((result: any) => {
          if (!result || !result.access_token) {
            throw new Error('parameter access_token is required');
          }
        })
    )
      .then(() =>
        // todo: add user
        databaseQuery(
          `updateOne:pages/_id=${config._id}/${JSON.stringify(
            config
          )}/upsert=true`
        )
      )
      // purge the cache
      .then(() => {
        let temporary = `${TEMP}/pages/${config._id}.json`;
        existsSync(temporary) && unlinkSync(temporary);
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
            .filter((element) => config[element])
            .map((element) => {
              if (element === 'menu')
                return { persistent_menu: config[element] };
              else if (element === 'greeting')
                return { greeting: config[element] };
              return config[element];
            })
            .map((element) =>
              request(config._id, 'me/messenger_profile', element)
            )
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
};
