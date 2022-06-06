import { connect, getModel } from '~server/database';
import { Request, Response } from 'express';

// Google cloud messaging (push notifications)
export default (request: Request, res: Response): any => {
  let action = request.params.action,
    data = request.body;

  if (action === 'save') {
    // save the subscription object
    console.log({
      gcm: { ...data.subscription, device: data.device },
    });
    if (!data.subscription || !data.subscription.endpoint) {
      return res.json({ error: 'invalid subscription object', payload: data });
    }
    connect()
      .then(() => {
        // todo: add gcm to models
        let model = getModel('push_notifications');
        let content = new model({ _id: data.device, ...data.subscription });
        return content.save();
      })
      .then((_data) => res.json(_data))
      .catch((error) => res.json({ error }));
  } else if (action === 'send') {
    // send push notifications to the selected subscriptions (users)
    // req.body = {payload{}, subscriptions:ids[]|undefined='all'}
    // https://gist.github.com/jhades/4f9b93daa3469ba65c60e1e47b1a9f9b#file-04-ts
    // https://blog.angular-university.io/angular-push-notifications/
  } else {
    // error
  }
};
