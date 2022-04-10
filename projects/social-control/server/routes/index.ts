import { Router } from 'express';
import { upload } from '~server/functions';
import { resolve } from 'node:path';
import supportedCollectionsRoute from './supported-collections';
import imageRoute from './image';
import configRoute from './config';
import backupRoute from './backup';
import restoreRoute from './restore';
import pushNotificationsRoute from './push-notifications';
import postCollectionRoute from './post-collection';
import dataRoute from './data';
import messengerRoute, {
  verify as messengerVerifyRoute,
  query as messengerQueryRoute,
  setup as messengerSetupRoute,
  blocks as messengerBlocksRoute,
} from './messenger';

// api version, increased every time there is a breaking change
// todo: add auth token & validate the requests
export let apiVersion = 1;

let app = Router();
export const TEMP = resolve(__dirname, '../temp');

// todo: update collection list
// todo: get collections from db, then collections.map(el=>/*rename or remove*/), save to ./temp/supportedCollections.json

app.get('/collections', supportedCollectionsRoute);
app.get(/^\/image\/([^/-]+)-([^/-]+)-([^/]+)/, imageRoute);
app.get(/^\/config\/(.+)/, configRoute);
app.get('/backup', backupRoute);
app.get('/restore/:hosts?', restoreRoute);
app.get('/restore/:hosts?', restoreRoute);
app.post('/push_notifications/:action', pushNotificationsRoute);
app.post('/messenger', messengerRoute);
app.get('/messenger', messengerVerifyRoute);
app.get('/messenger/setup/:config', messengerSetupRoute);
app.get('/messenger/blocks/:id/:payload', messengerBlocksRoute);
app.get('/messenger/blocks/:payload', messengerBlocksRoute);
// keep this after all /messenger routes
app.get(/^\/messenger\/(.+)/, messengerQueryRoute);

// keep this after all routes
app.get('*', dataRoute);
app.post('/:collection', upload.single('cover[]'), postCollectionRoute);

export default app;