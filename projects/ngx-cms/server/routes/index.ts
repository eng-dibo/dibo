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
import rssRoute from './rss';
import sitemapRoute from './sitemap';
import sequenceRoute, { register as sequenceRegisterRoute } from './sequence';
import updateRoute from './update';
import moveRoute from './move';

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
app.get(/^\/rss(\/.+)?/, rssRoute);
app.get(/^\/sitemap(\/.+)?/, sitemapRoute);
app.get(/^\/sequence\/([^/]+)\/(.+)/, sequenceRegisterRoute);
app.get(/^\/sequence\/([^/]+)/, sequenceRoute);
app.get(/update/, updateRoute);
app.get('/move/:category', moveRoute);

// keep this after all routes
app.get('*', dataRoute);
app.post('/:collection', upload.single('cover[]'), postCollectionRoute);

export default app;
