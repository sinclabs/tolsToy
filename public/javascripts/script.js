var socket = io.connect('http://'+window.location.hostname+':4000');

window.onload = function() {
  
  //Variable Declarations
  var messages = [];
  var field = document.getElementById("field");
  var sendButton = document.getElementById("send");
  var content = document.getElementById("content");
  var counter = 1;
  var lock = false;
  var saga = document.getElementById('saga');
  var targets = [
    {
      type: ParticleSaga.ImageTarget,
      url: '../bgLoad.jpg',
      options: {
         color: {
            r: 1,
            g: 1,
            b: 1
          },
          scale: 0,
          size: 2,
          respondsToMouse: false
      }
    }
  ];

  //Particle System Setup
  var scene = new ParticleSaga.Scene(saga, targets, {
    numParticles: 60000,
    slideshowDuration: 3000,
    sort: ParticleSaga.VertexSort.leftToRight
  });

  //Particle System load
  scene.load(function() {
    scene.setTarget(0);
    scene.startSlideshow();
  }); 

  //Conection Established Message
  socket.on('message', function (data) {
      if(data.message) {
          messages.push(data.message);
          var html = '';
          for(var i=0; i<messages.length; i++) {
              html += messages[i] + '<br />';
          }
          console.log(html);
      } else {
          console.log("There is a problem:", data);
      }
  }); 

  //Nouns Recieved Message
  socket.on('nouns', function (data) {
      if(data.length) {
        var sent = false;
        for(var i=0; i<data.length; i++) {
          socket.emit('noun',data[i]);
        }
      } 
      else {
          console.log("There is a problem:", data);
      }
  });

  //Tag Recieved Message
  socket.on('tag',function(data){
    console.log("tag recieved: "+ data);
    if(data){
      var Consttarget = {
        options: {
          respondsToMouse: false,
          size: 2
        }
      }
      Consttarget.type = ParticleSaga.ImageTarget;
      Consttarget.url = '../bgLoad.jpg';
      
      var target = {
        options: {
          respondsToMouse: false,
          size: 7
        }
      }

      target.type = ParticleSaga.ImageTarget;
      target.url = '../'+data+'.png';
      
      // var incomingIndex = scene.targets.length;
      // scene.loadTarget(Consttarget, function() {
      //   scene.stopSlideshow();
      //   scene.setTarget(incomingIndex,true);
      // });

      incomingIndex = scene.targets.length;
      scene.loadTarget(target, function() {
        scene.stopSlideshow();
        scene.setTarget(incomingIndex,true);
      });

      
      
      

      if(counter < 3){
        counter++;
      }
      else{
        counter = 1;
      }
    }
    lock = false;
  });

}

//Chrome webkit Speech Recognition Engine Setup
if (!('webkitSpeechRecognition' in window)) {
  upgrade();
} 
else {
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  //Recognition Start
  recognition.onstart = function() {
    recognizing = true;
  };

  //Recognition Error
  recognition.onerror = function(event) {
    console.log("Recognition Error!: "+event.message);
  };

  //Recognition End
  recognition.onend = function() {
    recognizing = false;
  };

  //Recognition Result
  recognition.onresult = function(event) {
    var interim_transcript = '';
    var final_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    if (final_transcript || interim_transcript) {
      //document.getElementById('story').value = final_transcript;  
      socket.emit('voice', { message: final_transcript });
    }
    
  };
}

//Recognition Keyboard Trigger
$(document).ready(function(){
  var keyState = false;
  final_transcript = '';
  recognition.lang = 'en-IN';

  $("#sparkles").sparkle({
    // accepts a HEX string, or "rainbow" or an array of HEX strings:
    color: ["#2eafea","#e56604"],

    // determine how many sparkles will be on the element at a time
    count: 30,

    // tell the canvas how far over the edge of it's container it should overlap in pixels.
    overlap: 0,

    // set the speed multiplier
    speed: 1,

    // min size
    minSize: 7,

    // max size
    maxSize: 10,

    // "up", "down" or "both" to set which direction the sparkles will travel in.
    direction: "both"
  });
  $("#sparkles").off("mouseover.sparkle")

  $("#sparkles").trigger("start.sparkle")

  timer = setTimeout(function(){
        $("#sparkles").trigger("start.sparkle");
    },2000);




  //Space bar down 
  $('body').keydown(function(event){
    if(event.which == 32){
      event.preventDefault();
      if(!keyState){
        keyState = true;
        recognition.start();
        document.getElementById('strBtn').value = "Recognizing... Release Spacebar to See Magic";
        console.log("Started");
      }
    }
  });

  //Space bar up
  $('body').keyup(function(event){
    if(event.which == 32){
      event.preventDefault();
      keyState = false;
      document.getElementById('strBtn').value = "Press and Hold Spacebar to Start Magic";
      recognition.stop();
    }
  });

});

//Recoreder Function - Not using anymore
var onFail = function(e) {
  console.log('Rejected!', e);
};

var onSuccess = function(s) {
  var context = new webkitAudioContext();
  var mediaStreamSource = context.createMediaStreamSource(s);
  recorder = new Recorder(mediaStreamSource);
  recorder.record();
}

window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var recorder, recognizing;
var audio = document.querySelector('audio');

function startRecording() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: true}, onSuccess, onFail);
  } else {
    console.log('navigator.getUserMedia not present');
  }
}

function stopRecording() {
  recorder.stop();
  recorder.exportWAV(function(s) {
    audio.src = window.URL.createObjectURL(s);
  });
}