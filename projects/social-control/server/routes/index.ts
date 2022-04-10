// messenger platform (facebook bot)
// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
// https://developers.facebook.com/docs/messenger-platform

import { Router } from 'express';
import { resolve } from 'node:path';
import supportedCollectionsRoute from './supported-collections';
import backupRoute from './backup';
import restoreRoute from './restore';
import messengerWebhookRoute, {
  verify as messengerVerifyRoute,
} from './webhook';
import messengerQueryRoute from './query';
import messengerSetupRoute from './setup';
import messengerActionsRoute from './actions';
import dataRoute from './data';

// api version, increased every time there is a breaking change
// todo: add auth token & validate the requests
export let apiVersion = 1;

let app = Router();
export const TEMP = resolve(__dirname, '../temp');

app.get('/collections', supportedCollectionsRoute);
app.get('/backup', backupRoute);
app.get('/restore/:hosts?', restoreRoute);
app.post('/webhook', messengerWebhookRoute);
app.get('/webhook', messengerVerifyRoute);
app.get('/setup/:config', messengerSetupRoute);
app.get('/actions/:id/:payload', messengerActionsRoute);
app.get('/actions/:payload', messengerActionsRoute);
// perform arbitrary database queries
app.get('/db/*', dataRoute);
// keep this after all routes
app.get('*', messengerActionsRoute);

export default app;
