var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');

var client = redis.createClient({
    host: 'localhost',
    port: 6379
});
client.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
    
});

global.count = 0;

io.on('connection', function(socket) {

	socket.on('eConnect', function(userCred) {
		if (userCred == '') {
			io.emit('newmessage', 'Anon user just connected!');
		}
		else {
			io.emit('newmessage', 'Welcome! Username: ' + userCred);
            client.set(userCred, socket.id, function(err) {
                if (err) {
                    throw err;
                }
                console.log('Existing user connected. Socket id: ' + socket.id + ' User id: ' + userCred);
            });
		}
		global.count = global.count + 1;
        getUsers();
	});

	socket.on('disconnect', function() {
		global.count = global.count - 1;
        getUsers();
		io.emit('newmessage', 'User has disconnected');
	});

	socket.on('userset', function(userCred) {
		io.emit('newmessage', 'New user set! Username: ' + userCred);
        console.log('User has been set. Socket id: ' + socket.id + ' User id: ' + userCred);
        client.set(userCred, socket.id, function(err) {
                if (err) {
                    throw err;
                }
            });
	});

	socket.on('newmessage', function(msg) {
		io.emit('newmessage', msg);
	});

	socket.on('privmessage', function(msg, user){
        console.log(user);
        client.get(user, function(err, socketId) {
            if (err) {
                throw err;
            }
            io.to(socketId).emit('newmessage', msg);
            console.log('Message sent: ' + msg);
        })
	});	

});

function getUsers() {
    io.emit('usernumupdate', global.count);
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});