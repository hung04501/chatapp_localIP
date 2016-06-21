var express = require('express');
var mongodb = require('mongodb');

var app = express()
var fs = require('fs');
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
	
var port = 5000;
app.set('port', port);


app.get('/', function(resuest, response) {
  response.sendFile(__dirname+'/index.html');
});

// app.use(express.static('emotion'));
app.use('/emotion', express.static('emotion'));

//socket
var UserDetails = {};
io.sockets.on('connection', function(socket) {
	socket.on('sendchat', function (data) {
		console.log(data);
		 UserDetails.ipClient = data.ipClient;
		 UserDetails.username = getProperty(data.ipClient);
		io.sockets.emit('updatechat',UserDetails, data.message);
	});
  
  /*
  io.sockets.on('connection', function(socket) {
	socket.on('sendchat', function (data) {
		io.sockets.emit('updatechat', socket.username, data);
	});
  
  socket.on('adduser', function(username) {
		socket.username = username;
		socket.broadcast.emit('new-user', username);
	});*/
	
 //get ipclient
 // socket.on('ipclient', function(ipclient) {
 
	// UserDetails = {  
		// ipClient : ipclient,  
		// username : getProperty(ipclient)  
		// };
	// });
});

//map ip client
var map = new Object(); // or var map = {};
//read file

const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('listip.txt')
});

rl.on('line', function (line) {
  //console.log('Line from file:', line);
  var ipuser = line.substring(0, line.indexOf("@"));
  var nickname = line.substring(16, line.length);
  //set nickname to ip
  map[ipuser] = nickname;
  
  console.log(getProperty(ipuser)+'\n');
  console.log(map.getKeyByValue(nickname)+'\n');
});

//get value map theo key
var getProperty = function get(k) {
    return map[k];
}
//get key from value
Object.prototype.getKeyByValue = function( value ) {
    for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
             if( this[ prop ] === value )
                 return prop;
        }
    }
}


//port
server.listen(port, function () {
  console.log('Listening on port ' + server.address().port)
});