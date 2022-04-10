// data models
const shortId = require("shortid");
const mongoose = require("mongoose");
let mixed = mongoose.Schema.Types.Mixed;

// todo: implement login system
module.exports.persons = {};

module.exports.pages = {
  // page id
  _id: String,
  // the access_token for this page
  access_token: String,
  user: { type: String, ref: "persons" },
  // the greeting message that displays before the conversation starts
  // https://developers.facebook.com/docs/messenger-platform/discovery/welcome-screen/
  greeting: [{ locale: String, text: String }],
  // the first message or block of messages that be sent to the user
  // when he clicks the get started button
  // could be any message template
  welcome: mixed,
  // the persistent menu
  // https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
  menu: [mixed],
};

module.exports.actions = {
  // keep _id short to be used as postback for buttons
  _id: { type: String, default: shortId.generate },
  // display name, displayed to the user when selecting an action
  // if empty, the field _id used
  name: String,
  // use dataSource to dynamically get data, based on service type
  // example: {service: 'message', dataSource:{url}, payload:{title: '<% data.pageTitle.toLowerCase() %>'  } }}
  items: [
    {
      service: { type: String, default: "message" },
      payload: [mixed],
      dataSource: mixed,
    },
  ],
  user: { type: String, ref: "persons" },
  // use labels to easily manage and search bocks, and automatically run actions based on labels
  labels: [String],
};
