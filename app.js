var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var port = 4000;
var index = require('./routes/index');
var pos = require('pos');
var chunker = require('pos-chunker'); 
var cheerio = require("cheerio");
var jQuery = require("jquery");
var request = require("request");
var fs = require('fs');
var im = require('imagemagick');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'S.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {      
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {
    
    socket.emit('message', { message: "Connected Successfully" });
    
    socket.on('voice', function (data) {
        console.log(data.message);
        var blackList = ["i", "penis", "vagina"];
        var words = new pos.Lexer().lex(data.message);
        var tags = new pos.Tagger()
          .tag(words)
          .map(function(tag){return tag[0] + '/' + tag[1];})
          .join(' ');
        var places = chunker.chunk(tags, '[{ tag: NNP }]');
        places = places.replace('{','').replace('}','');
        console.log(places);
        var wordtag = places.split(" ");
        var nounList = [];
        for(var i=0; i<wordtag.length; i++){
          var tempword = wordtag[i].split("/");
          if(tempword[1] == "NN" || tempword[1] == "NNS" || tempword[1] == "NNP" || tempword[1] == "NNPS"){
            if(blackList.indexOf(tempword[0].toLowerCase()) == -1)
                nounList.push(tempword[0]);
            else
              console.log("blackListed word");
          }
        }
        if(nounList.length == 0){
          for(var i=0; i<wordtag.length; i++){
            var tempword = wordtag[i].split("/");
            if(tempword[1] == "VBJ" || tempword[1] == "ADJ" || tempword[1] == "JJ" || tempword[1] == "VBG" || tempword[1] == "UH"){
              if(blackList.indexOf(tempword[0].toLowerCase()) == -1)
                nounList.push(tempword[0]);
              else
              console.log("blackListed word");
            }
          } 
        }
        socket.emit('nouns', nounList);
    });
    
    socket.on('noun', function (data){
      var path = 'public/'+data+'.png';
      fs.access(path, fs.F_OK, function(err) {
          if (!err) {
              console.log("deleting file");
              fs.unlinkSync(path)
          } else {
              console.log("new word!");
          }
      });

      var nounList = data;
      var imageName = 'public/'+nounList+'.png';
      if(nounList){
        console.log(nounList+' - Noun found! Starting to process.');
        console.log("_________________________________________________");
        var inputWord = nounList;
        var google = "https://www.google.fr/search?q=" + inputWord + "+silhouette+png&biw=1366&bih=677&source=lnms&tbm=isch&sa=X";

        console.log(google);
        var imageURL = "";
        var colors = ["blue", "red", "green"];

        request(google, function(error, response, body) {  
          if(error){
            console.log(error);
          }
          else{
            console.log('Heard from Google!, '+response.url);
            var $ = cheerio.load(body);
            imageURL = $('img').attr("src");
            console.log('URL Found: '+imageURL);
            var x = Math.floor((Math.random() * 3) + 1);
            var callback = function(){
              console.log('Downloded Image!');
               fs.access(imageName, fs.F_OK, function(err) {
                    if (!err) {
                      try{
                        im.convert([imageName, '-bordercolor', 'white', '-border', '100%x100%', '-alpha', 'set',  '-channel', 'RGBA', '-fill', 'none' ,'-opaque', 'white', '-fill', 'none', '-opaque', 'black' , imageName], 
                        function(err, stdout){
                          if (err){
                            console.log(err);
                          } 
                          else{
                          console.log('Border created');
                            io.sockets.emit('tag', nounList);
                          }
                        });
                      }
                      catch(e){
                        console.log(e);
                      }
                    } 
                    else {
                        console.log("No file!");
                    }
                });
              
              
            }
            download(imageURL, imageName, callback);
          }
        });
        console.log("_________________________________________________");
      }
      else{
        console.log('No nouns found');
        //Do something cool and random
      }
    });
});



module.exports = app;
