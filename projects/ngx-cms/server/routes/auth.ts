import { Request, Response, query } from 'express';
import cache from '@engineers/nodejs/cache-fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type Action = 'login' | 'register';

export default (req: Request, res: Response): void => {
  let action: Action = req.params.action as Action;
  if (action === 'register') {
    let { email, mobile, password } = req.body;

    // todo: check if the entry (email or mobile) is already existing

    // Validate the user input
    if (!(email && password && mobile)) {
      res.status(400).send('All inputs are required');
    }

    // Encrypt the password
    bcrypt.hash(password, 10).then((encryptedPassword) => {
      connect()
        .then(() => query('== post user data =='))
        .then((data) => {
          let authToken = jwt.sign(
            { id: data._id, email },
            process.env.TOKEN_KEY,
            {
              expiresIn: '2h',
            }
          );

          res.json({ authToken });
        });
    });
  } else if (action === 'login') {
  } else {
    // error
  }
};
