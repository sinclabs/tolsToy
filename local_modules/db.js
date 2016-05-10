var mongojs = require("mongojs");
var databaseUrl = "assembly";
var collections = ["posts"];
var db = mongojs(databaseUrl, collections);

module.exports = db;
