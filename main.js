

var fs = require('fs');

var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');


var server = http.createServer(app);

var io = require('socket.io').listen(server);

server.listen(8080);

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/controller.html', function(req, res){
  console.log("here")
  res.sendFile(__dirname + '/controller.html');
});

app.get('/projector.html', function(req, res){
  console.log("here")
  res.sendFile(__dirname + '/projector.html');
});

app.get('/table.html', function(req, res){
  console.log("here")
  res.sendFile(__dirname + '/table.html');
});

io.on('connection', function (socket) {

  socket.emit('news', { hello: 'world' });

  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('locUpdate', function (data) {
    console.log("Broadcasting map update...");
    socket.broadcast.emit('pushLocUpdate', data)
  });

  //Added by Annabel

  socket.on('reQueryFeatures', function (data) {
    socket.broadcast.emit("reQueryFeatures", data);
  });

  socket.on('newMarker', function (data) {
    socket.broadcast.emit("newMarker", data);
  });

  socket.on('removeMarker', function(data){
    socket.broadcast.emit("removeMarker", data);
  });

  /*socket.on('selectPTProjector', function(data){
    socket.broadcast.emit("sendSelectedProjector", data);
  });*/

  // added by Muniba
  socket.on('hideLayer', function(data) {
    console.log(data.clickedLayer + " Layer hidden");
    socket.broadcast.emit('pushHideLayer', data)
  });
  socket.on('showLayer', function(data) {
    console.log(data.clickedLayer + " Layer shown");
    socket.broadcast.emit('pushShowLayer', data) // will emit to client that didn't send
  });
  socket.on('changeSize', function(data) {  // for toggleRectangle
    console.log(data.activeRectangle + " size selected");
    socket.broadcast.emit('pushChangeSize', data);
  })
});

/*

mapboxgl.accessToken = 'pk.eyJ1IjoiY2Zwb2xhY2siLCJhIjoiY2ppb3RlMXBiMGRjdzN2dDk3eWI2cmVkbyJ9.amywF3L9CAgcjl3GeFHb4g';

var mapA = new mapboxgl.Map({
  container: 'mapA', // container id
  style:'mapbox://styles/cfpolack/cjiugdneq69l72rqo4wzuixpw'
});

var mapB = new mapboxgl.Map({
  container: 'mapB', // container id
  style:'mapbox://styles/cfpolack/cjiugdneq69l72rqo4wzuixpw'
});
*/
