import { Request, Response } from 'express';
import { stringToObject } from '@engineers/javascript/string';
import { TEMP } from '.';
import { unlinkSync, existsSync } from 'node:fs';
/**
 * adds the app to a new page
 * see config/server/models.messenger for more
 *
 * @example:  messenger/setup/page=$pageId,access_token=$token,greeting=welcome%20{{user_first_name}},welcome=conversation%20started
 * access_token is required for the first time only, other properties except pageId are optional
 */
export default (req: Request, res: Response): void => {
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

    // access_token is required for the first time only.
    // when updating the page's configs, access_token is optional
    (config.access_token
      ? Promise.resolve()
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
};
