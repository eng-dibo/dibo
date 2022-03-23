import { resolve } from 'node:path';

// todo: use import('~config/*').then() from browser directly
// add '~config' to browser/webpack -> 'ESM ../../config/*'
// in this case, config/*  must be added to express.static()
export default (req: any, res: any) => {
  let nativeRequire = require('@engineers/webpack/native-require');
  let file = req.params[0];
  let filePath = resolve(__dirname, `../../config/${file}`);
  let content = nativeRequire(filePath);

  if (file === 'server/vapid' && content) {
    // only send the publicKey
    content = content.publicKey;
  } else if (file.startsWith('server/')) {
    // todo: use auth for sensitive data (specially for config/server/*)
    throw new Error('unauthorized permission');
  }

  res.json(content);

  /*
    // todo: use ES6 dynamic import(), requires node>14
    import(filePath)
      .then((content) => res.json(content))
      .catch((error) => res.json({ error, filePath }));
      */
};
