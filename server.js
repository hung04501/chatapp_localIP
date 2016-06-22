var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var app = require('./app');
var Message=require('./models/message');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 5000);
var express = require('express');

var app = require('./app');

app.set('port', process.env.PORT || 5000);

var fs = require('fs');
var server = require('http').createServer(app),
    io = require('socket.io').listen(server);
	



app.get('/', function(resuest, response) {
  response.sendFile(__dirname+'/index.html');
});

// app.use(express.static('emotion'));
app.use('/emotion', express.static('emotion'));

//get currentday

var today = new Date();
var miliseconds = today.getTime();

console.log(miliseconds);





//socket
var UserDetails = {};
io.sockets.on('connection', function(socket) {
		//show all chat
		Message.find(function(err, messages) {
		  if (err) return console.error(err);
		  io.sockets.emit('showallchat', messages);
		});
	//get message from client
	socket.on('sendchat', function (data) {
		console.log(data);
		 UserDetails.ipClient = data.ipClient;
		 UserDetails.username = getProperty(data.ipClient);
		 UserDetails.timechat = miliseconds;
		//find last record in DB
		var cursor  = Message.find().limit(1).sort({ $natural : -1 });
		  cursor.exec(function(err, results) {
			if (err) throw err;
			UserDetails.same = data.ipClient == results[0].ipClient ? true :  false;
		  });
		//message save to DB
		 var message=new Message({
			ipClient:data.ipClient,
			clientName:getProperty(data.ipClient),
			message:data.message,
			timechat:miliseconds
		 });
		 //save db mongoose
        message.save(function(err, thor) {
		  if (err) return console.error(err);
		  console.dir(thor);
		});
		io.sockets.emit('updatechat',UserDetails, data.message);
	});
  
	  //join a room
	  socket.on('subscribe_room', function(room) { 
			console.log('joining room', room);
			socket.join(room); 
		})
	//leave room
		socket.on('unsubscribe_room', function(room) {  
			console.log('leaving room', room);
			socket.leave(room); 
		})
	//send to joined room 
		socket.on('sendmsg_room', function(data) {
			console.log('sending message');
			io.sockets.in(data.room).emit('message_room', data);
		});
  
 
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
  
  //console.log(getProperty(ipuser)+'\n');
  //console.log(map.getKeyByValue(nickname)+'\n');
});

//get value map theo key
var getProperty = function get(k) {
    return map[k];
}
//get key from value
Object.defineProperty( Object.prototype, 'getKeyByValue', {
    value: function() {
    for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
             if( this[ prop ] === value )
                 return prop;
        }
    }
}
});

//port
server.listen(app.get('port'), function () {
  console.log('Listening on port ' + server.address().port)
});