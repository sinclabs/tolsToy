
//Reqire everything here
var express = require('express');
var router = express.Router();
//var db = require("../local_modules/db");
var l = ""


router.post('/', function(req, res, next) {
  var line = req.body.story;
  console.log(line);
  var words;
  words = line.split(' ');
  for(var i=0; i<words.length; i++){
    console.log(words[i]);
    console.log("\n");
  }
  res.render('index', { Page: "output", Line: line });
});

//When home page is requested
router.get('/', function(req, res, next) {
  res.render('index', { Page: "input" });
});



//Export the module
module.exports = router;


