import { resolve } from 'node:path';
import { Request, Response } from 'express';

// todo: use import('~config/*').then() from browser directly
// add '~config' to browser/webpack -> 'ESM ../config/*'
// in this case, config/*  must be added to express.static()
export default (request: Request, res: Response): void => {
  let file = request.params[0];
  let filePath = resolve(__dirname, `../config/${file}`);
  import(/* webpackIgnore: true */ filePath)
    .then((content) => {
      if (file === 'server/vapid' && content) {
        // only send the publicKey
        content = content.publicKey;
      } else if (file.startsWith('server/')) {
        // todo: use auth for sensitive data (specially for config/server/*)
        throw new Error('unauthorized permission');
      }

      res.json(content);
    })
    .catch((error) => {
      console.error({ error });
      res.status(500).json({ error });
    });
};
