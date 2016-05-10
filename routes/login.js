//Reqire everything here
var express = require('express');
var router = express.Router();
var db = require("../local_modules/db");


//When home page is requested
router.get('/', function(req, res, next) {
  res.render('login', { Page: "login" });
});


//Export the module
module.exports = router;
