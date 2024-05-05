var https = require('https');
var fs = require('fs'); // Using the filesystem module
var express = require('express');
var socketIo = require('socket.io');

var credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/jl14890.itp.io/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/jl14890.itp.io/cert.pem')
};

var app = express();
app.use(express.static('public'));

// Handle root URL request
app.get('/', function (req, res) {
    res.send("Welcome to the Multiplayer Sphere Game!");
});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
    console.log('HTTPS server running on port 443');
});

var io = socketIo(httpsServer);

let players = {}; // Store player state

io.on('connection', function (socket) {
    console.log("New player connected: " + socket.id);

    // Initialize player state
    players[socket.id] = { position: { x: 0, y: 0, z: 0 }, volume: 0 };
    io.emit('allPlayers', players);

    socket.on('updateState', (state) => {
        // Update player state
        if (players[socket.id]) {
            players[socket.id] = state;
            io.emit('stateUpdated', { id: socket.id, state: players[socket.id] });
        }
    });

    socket.on('disconnect', () => {
        console.log("Player disconnected: " + socket.id);
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});
