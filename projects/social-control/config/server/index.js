module.exports.prod = process.env.NODE_ENV === "production";
// use auth code to perform admin operations.
module.exports.AUTH = "";
module.exports.db = require("./database");
module.exports.firebaseConfig = require("./firebase");
