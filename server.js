var express = require('express');

var app = express();
var Server = app.listen(process.env.PORT || 3000);

app.use(express.static('public'));

console.log("The server is up and running! :) Just type 'localhost:3000' into your Browser and you are good to go!");

var socket = require('socket.io');

var io = socket(Server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log('new connection: ' + socket.id);

    socket.on('button', buttonMsg);
    socket.on('mouse', mouseMsg);

    function buttonMsg(dataIn) {
        socket.broadcast.emit('button', dataIn);
    }

    function mouseMsg(data) {
        socket.broadcast.emit('mouse', data);
    }

}
