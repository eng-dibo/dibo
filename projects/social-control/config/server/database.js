module.exports = {
  type: "mongodb",
  config: {
    username: process.env.dbUsername,
    password: process.env.dbPassword,
    // '<clusterName>-gbdqa.gcp.mongodb.net'
    host: process.env.dbHost,
    srv: true,
    dbName: process.env.dbName,
  },
};
