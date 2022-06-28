import shortId from 'shortid';
import mongoose from 'mongoose';

let mixed = mongoose.Schema.Types.Mixed;

/**
 * the application members
 */
export let users = {};

/**
 * the bot users, that receive and send messages to the bot
 */
export let messenger_users = {};

/**
 * the page that the bot is run in
 */
export let pages = {
  // page id
  _id: String,
  // the access_token for this page
  access_token: String,
  // the greeting message that displays before the conversation starts
  // https://developers.facebook.com/docs/messenger-platform/discovery/welcome-screen/
  greeting: [{ locale: String, text: String }],
  // the persistent menu
  // https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
  menu: [mixed],
  // the first message or block of messages that be sent to the user
  // when he clicks the get started button
  // could be any message template
  welcome: mixed,
};

export let user_pages = {
  page: { type: String, ref: 'pages' },
  // the user that currently uses the bot in this page
  // multiple users are allowed to manage the same page (team)
  user: { type: String, ref: 'users' },
};

/**
 * a block is a message of any type or an acton such as:
 *  - structured message
 *  - an API subscription button
 *  - setting a user attribute *
 */
export let blocks = {
  // keep _id short to be used as postback for buttons
  _id: { type: String, default: shortId.generate },
  // use labels to easily manage and search blocks, and automatically run actions based on labels
  labels: [String],
  // display name, displayed to the user when selecting an action
  // if empty, the field _id is used
  name: String,
  // the server that handles this block, see ~server/services
  service: { type: String, default: 'message' },
  // service options, each service has its own options
  options: mixed,
  // the page that this block belongs to
  // the user can reuse or copy any block in a page he manages to another page
  page: { type: String, ref: 'pages' },
};

/**
 * a flow is a set of blocks to be run conditionally in a sequence
 * for example: send a structured message, then subscribe to an API, then send another message, ...
 */
export let flows = {
  _id: { type: String, default: shortId.generate },
  // todo: support flow branches
  // example: if(true)goto block1; else goto block2
  blocks: [{ type: String, ref: 'blocks' }],
};

/**
 * a dataSource subscription, for exmple the user can subscripte to an API object
 * data is fetched from `source` and sent to the user as per the determined flow
 *
 * every user subscribes to a subscription, the corresponding sequence object is updated
 */
export let subscription = {
  _id: { type: String, default: shortId.generate },
  // the url that is used to fetch the data
  // example: https://example.com/api/articles
  // the response is { payload: [{...}], next:$next_url}
  source: String,
  // the flow that started when the subscription is triggered, i.e when the user clicks
  // the subscription button
  flow: { type: String, ref: 'flow' },
};

export let sequence = {
  subscription: { type: String, ref: 'subscription' },
  user: { type: String, ref: 'messenger_users' },
  // source is updated every time the subscription `next` is fetched
  source: String,
  // the item count that sent to the user in the current source
  // updated every time an item sent to the user
  // if a new `next` fetched it resets to 0
  // todo: use a field (example: item._id) or a function returns the next item to be sent
  item: Number,
};
