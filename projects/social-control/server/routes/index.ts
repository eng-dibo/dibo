// messenger platform (facebook bot)
// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
// https://developers.facebook.com/docs/messenger-platform

import { Router } from 'express';
import { upload } from '~server/functions';
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
import dataRouteRoute from './dataRoute';

// api version, increased every time there is a breaking change
// todo: add auth token & validate the requests
export let apiVersion = 1;

let app = Router();
export const TEMP = resolve(__dirname, '../temp');

app.get('/collections', supportedCollectionsRoute);
app.get('/backup', backupRoute);
app.get('/restore/:hosts?', restoreRoute);
app.post('/messenger/webhook', messengerWebhookRoute);
app.get('/messenger/webhook', messengerVerifyRoute);
app.get('/messenger/setup/:config', messengerSetupRoute);
app.get('/messenger/actions/:id/:payload', messengerBlocksRoute);
app.get('/messenger/actions/:payload', messengerActionsRoute);
// keep this after all /messenger routes
app.get(/^\/messenger\/(.+)/, messengerActionsRoute);

// keep this after all routes
app.get('*', dataRoute);

export default app;
