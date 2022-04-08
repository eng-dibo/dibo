// data models
const shortId = require("shortid");
const mongoose = require("mongoose");
let mixed = mongoose.Schema.Types.Mixed;

/*
//replace '-' with '@', because it will be used as a separator between the id and the slug,
//or use '='
//ex: /id-slug-text   OR /id=slug-text
shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_@"
);
*/

// times (createdAt, updatedAt) are added automatically, by the option {typestamps: true}

let articles = {
  _id: { type: String, default: shortId.generate },
  title: String,
  subtitle: String,
  content: String,
  summary: String,
  keywords: [{ type: String, ref: "keywords" }],
  author: { type: String, ref: "persons" },
  // pending, approved, denied, expired
  status: String,
  // example: denied reason
  notes: String,
  contacts: String, // for jobs
  categories: [String],
  sources: String,
};
module.exports.articles = articles;

module.exports.jobs = Object.assign(articles, {
  contacts: String,
});

module.exports.categories = {
  _id: { type: String, default: shortId.generate },
  title: String,
  slug: String,
  parent: { type: String, ref: "categories" },
  // associated social accounts
  // todo: social:[{type:'fb.page', id, name}]
  fb_pages: [String],
  // example: `listed: boolean` (listed in home page),
  // example: `type: jobs`
  config: {},
};

module.exports.keywords = {
  _id: { type: String, default: shortId.generate },
  text: String,
  // same as articles.status (approved keywords appears in suggestions)
  status: String,
  // number of times this keyword used
  count: Number,
};

module.exports.countries = {
  // country code, ex: 'EG'
  _id: String,
  name: {
    en: String,
    native: String,
  },
  // formal language
  language: { type: String, ref: "languages" },
  capital: String,
  currency: String,
};

module.exports.cities = {
  _id: { type: String, default: shortId.generate },
  country: { type: String, ref: "countries" },
  name: {
    en: String,
    native: String,
  },
};

module.exports.languages = {
  // language code, ex: 'ar', 'en'
  _id: String,
  name: {
    en: String,
    native: String,
  },
};

module.exports.persons = {
  _id: { type: String, default: shortId.generate },
  // [first, mid, last]
  name: [String],
  gender: String,
  birthday: [Number],
  nationality: { type: String, ref: "countries" },
  // residence country & city
  country: { type: String, ref: "countries" },
  city: { type: String, ref: "cities" },
  // type= national id, passport, ...
  ids: [{ type: { type: String }, value: String }],
  // account role, ex: admin, moderator,...
  // todo: move role to persons
  role: { type: mongoose.Types.ObjectId, ref: "roles" },
};

// logins collection now merged with accounts
// {type:"login", entries:{ type:"email|mobile|fb", pass:"", confirmed:boolean}}
module.exports.accounts = {
  _id: { type: String, default: shortId.generate },
  // email, mobile, system (system account)
  type: String,
  entry: String,
  user: { type: String, ref: "persons" },
  // todo: last confirmed timestamp
  confirmed: { type: Boolean, default: false },
  // the primary account for a specific account type
  // for example the primary email is used for contacting the user
  primary: Boolean,
  // if the account doesn't receive our messages, put `active: false` flag
  active: Boolean,
  auth: {
    type: { String, default: "password" },
    value: String,
  },
  // example: for Adsense: { slot, channel};
  extra: {},
};

// CV extends person info
module.exports.cv = {
  _id: { type: String, default: shortId.generate },
  person: { type: String, ref: "persons" },
  job_hsitory: [
    {
      company: { type: String, ref: "places" },
      position: String,
      // tasks, activities, job description, ...
      notes: String,
      // start->end;
      //validation: current job has no end value [Date, null]
      // validation: when selecting a job as current, offer to remove the previous current job and set an end date
      period: [Date],
      country: { type: String, ref: "countries" },
      city: { type: String, ref: "cities" },
    },
  ],
  education: [
    {
      // example: primary school, PHD, ...
      level: String,
      // school or college info
      place: { type: String, ref: "places" },
      department: String,
      university: String,
      period: [Date],
    },
  ],
  languages: [
    // fluency%
    { language: { type: String, ref: "languages" }, fluency: Number },
  ],
  // level%
  skills: [{ name: String, level: Number }],
};

module.exports.places = {
  name: String,
  // [lang, lat]
  location: [String],
  country: { type: String, ref: "countries" },
  city: { type: String, ref: "cities" },
  description: String,
  // example: company, club, shop, store, ...
  type: String,
  // the head square place for this branch
  head: { type: String, ref: "places" },
  contacts: [{ type: String, ref: "accounts" }],
  extra: {},
};

/*
roles example:
{ name:user,
  permissions:[
    // alow `edit, delete` own articles
    {type:articles, scope:own, allowed:['edit','delete']},
    {type:articles, scope:all, allowed:['read','comment','react']},
    {type:jobs, scope:all, allowed:['read','comment','react','apply']},
 ]
},
 */
module.exports.roles = {
  // admin, moderator, writer, advertiser, user, guest
  name: String,
  permissions: [{ type: { type: String }, scope: String, allowed: [String] }],
};

// push notifications subscription object
// _id is the device id
// todo: generate models.d.ts
module.exports.push_notifications = {
  _id: String,
  endpoint: String,
  expirationTime: String,
  keys: { p256dh: String, auth: String },
};

module.exports.messenger = {
  // page id
  _id: String,
  // the access_token for this page
  access_token: String,
  // the welcome screen
  // https://developers.facebook.com/docs/messenger-platform/discovery/welcome-screen/
  welcome: mixed,
  // the persistent menu
  // https://developers.facebook.com/docs/messenger-platform/send-messages/persistent-menu/
  menu: [mixed],
  userLevelMenu: [mixed],
};
