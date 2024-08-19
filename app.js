var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/public'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.');

SOCKET_LIST = {};
playersOn = 0;
GAME_LIST = [3][2];

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    socket.on('signIn', function(currentUsername) {
        if(currentUsername === "" || currentUsername.includes(' ')) {
            socket.emit('signInStatus', false);
            return;
        }
        for(var i in Player.list) {
            var opponent = Player.list[i];
            if(opponent.id != socket.id && opponent.username === currentUsername) {
                socket.emit('signInStatus', false);
                return;
            }
        }
        socket.emit('signInStatus', true);
        Player.onConnect(currentUsername, socket);
    });
    socket.on('disconnect', function() {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });
    socket.on('removePlayer', function(data) {
        delete SOCKET_LIST[socket.id];
        playersOn--;
        delete Player.list[socket.id];
    })
});

var Player = function(data) {
    var self = {
        username:data.username,
        id:data.id,
        timelineLength:data.timelineLength,
        gameNum:data.gameNum, 
        playerNum:data.playerNum,
        currentPlayerTurn:data.currentPlayerTurn,
        gameStatus:data.gameStatus,
        stealToken:data.stealToken,
    };
    return self;
}
Player.list = {};


Player.onConnect = function(username, socket) {
    playersOn++;
    
    var gameNum = checkGame();
    var playerNum = checkPlayerNum();
    var currentPlayerTurn = checkCurrentTurn(gameNum, playerNum);

    var player = Player({
        username:username,
        id:socket.id,
        timelineLength:1,
        gameNum:gameNum, 
        playerNum:playerNum,
        currentPlayerTurn:currentPlayerTurn,
        gameStatus:true,
        stealToken:1,
    });

    Player.list[socket.id] = player;

    socket.on('updatePlayerInfo', function(data) {
        player.currentPlayerTurn = data.currentTurn;
        player.timelineLength = data.timelineLength; 
        if(player.timelineLength === 10) {
            player.gameStatus = false;
        }
        for(var i in Player.list) {
            var opponent = Player.list[i];
            if(opponent.playerNum != player.playerNum && opponent.gameNum === player.gameNum) {
                opponent.currentPlayerTurn = data.currentTurn;
                if(player.gameStatus === false) {
                    opponent.gameStatus = false;
                }
            }
        }
    });

    socket.on('sendServerChatInfo', function(data) {
        var opponent = null;
        if(playersOn%2 != 0) {
            var pack = {
                phase:data.phase,
                movie:data.movie,
                player:data.playerInfo,
                opponent:opponent,
            }
            socket.emit('addToChat', pack);
            return;
        }
        for(var i in SOCKET_LIST) {
            opponent = Player.list[i];
            if(opponent.playerNum != player.playerNum && opponent.gameNum === player.gameNum) {
                var pack = {
                    phase:data.phase,
                    movie:data.movie,
                    player:data.player,
                    opponent:opponent,
                }
                SOCKET_LIST[i].emit('addToChat', pack);
            }
        }
    });
    /*

    socket.on('addStealToken', function(data) {
        player.stealToken = data.count;
        for(var i in SOCKET_LIST) {
            opponent = Player.list[i];
            if(opponent.playerNum != data.player.playerNum && opponent.gameNum === data.player.gameNum) {
                var pack = {
                    phase:data.phase,
                    movie:data.movie,
                    player:data.player,
                    opponent:opponent,
                }
                SOCKET_LIST[i].emit('addToChat', pack);
            }
        }
    });
    */

    setInterval (function() {
        socket.emit('playerInfo', player);
    }, 1000/25);

    socket.emit('startGame', {playerNum:playerNum, currentPlayerTurn:player.currentPlayerTurn});
}

Player.onDisconnect = function(socket) {
    let player = Player.list[socket.id];
    if(!player)
        return
    if(player.gameStatus === true) {
        for(var i in SOCKET_LIST) {
            opponent = Player.list[i];
            if(opponent.playerNum != player.playerNum && opponent.gameNum === player.gameNum) {
                var pack = {
                    phase:'disconnect',
                    movie:null,
                    player:player,
                    opponent:opponent,
                }
                SOCKET_LIST[i].emit('addToChat', pack);
                Player.list[i].gameStatus = false;
            }
        }
    }
    playersOn--;
    delete Player.list[socket.id];
}

var checkGame = function() {
    var countOne = 0;
    var countTwo = 0;
    var countThree = 0;
    for(var i in Player.list) { 
        var player = Player.list[i];
        if(player.gameNum === 1) {
            countOne++;
        }
        else if(player.gameNum === 2) {
            countTwo++;
        }
        else if(player.gameNum === 3) {
            countThree++;
        }
    }
    if(countOne === 1) {
        return 1;
    }
    else if(countTwo === 1) {
        return 2;
    }
    else if(countThree === 1) {
        return 3;
    }
    if(countOne < 2) {
        return 1;
    }
    else if(countTwo < 2) {
        return 2;
    }
    else if(countThree < 3) {
        return 3;
    }
}

var checkPlayerNum = function() {
    if(playersOn%2 === 1)
        return 1;
    else
        return 2;
}

var checkCurrentTurn = function(gameNum, playerNum) {
    if(playerNum === 1) {
        return 1;
    }
    else {
        for(var i in Player.list) {
            var opponent = Player.list[i];
            if(opponent.playerNum != playerNum && opponent.gameNum === gameNum) {
                return opponent.currentPlayerTurn;
            }
        }
    }
}

