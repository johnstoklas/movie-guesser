var apiKey = "3f540891f7b254dd92eaaa54c0895843";

const movies = [];
const moviesGuessList = [];
var i = 0;
var timelineID = 1;
var currentMovieYear = 0;
var gameStarted= false;
var guessedAlready = false;
var bonusAlready = false;
var gameWon = false;
var socket = io();
var playerInfo = null;

class apiFetch {
    constructor(api) {this.api = api}
    async fetch() {
        try {
            const response = await fetch(this.api);
            const data = await response.json();
    
            data.results.forEach(media => {
                const card = createCard(media);
                movies[i] = card;
                //movieGuessListAppend(movies[i]);
                i++;
            });
        }
        catch (error) {
            console.error("error", error);
        }
    }
} 

function movieGuessListAppend(movie) {
    const guessList = document.getElementById('movie-guess-items');
    const guessItem = document.createElement('option');
    guessItem.value = movie[1];
    guessItem.innerHTML = `${movie[0]}`;
    guessList.appendChild(guessItem);
}
/*
function guessMovieTitle(movieID) {
    if(bonusAlready === true || gameWon === true) {
        return;
    }
    if(Number(movieID) === currentMovie[1]) {
        sendChatInfo('guessedMovieTitleTrue', currentMovie);
        addStealToken(currentMovie);
    }
    else {
        sendChatInfo('guessedMovieTitleFalse', currentMovie);
    }
    bonusAlready = true;
}
    */

function createCard(media) {
    const { poster_path, id, title, release_date, backdrop_path} = media;
    
    const card = [];

    card[0] = title;
    card[1] = id;
    card[2] = poster_path;
    card[3] = backdrop_path;
    const date = release_date.split('-');
    card[4] = date[0];

    return card;
}

function load() {
    for(var j = 1; j<30; j++) {
        var apiMovies = `https://api.themoviedb.org/3/movie/top_rated?language=en&page=${j}&api_key=${apiKey}`;
        guessMovies = new apiFetch(apiMovies);
        guessMovies.fetch();
    }
}

function selectMovie() {
    guessedAlready = false;
    const tmp = Math.random()*Math.random()*movies.length;
    const rand = Math.floor(tmp);

    const randMovie = movies[rand][3];

    const guess = document.getElementById('movie-guess');

    currentMovie = movies[rand];

    guess.innerHTML = `<img src="https://image.tmdb.org/t/p/w500/${randMovie}">`;

    /*
    const guessInfo = document.getElementById('movie-guess-info');
    guessInfo.innerHTML = `
    <h1> ${movies[rand][0]} </h1>
    <h2> Directed By: ${movies[rand][5]} </h2>
    <h2> Release Year: ${movies[rand][4]} </h2>
    `
    */
    movieRemove(rand);
}

function startingCard() {
    if(gameStarted== false) {
        const tmp = Math.random()*movies.length;
        const rand = Math.floor(tmp);

        const randMovie = movies[rand][2];
        const date = movies[rand][4];

        const orig = document.createElement("div");
        orig.className = "timeline-item";
        orig.id = timelineID;
        
        orig.innerHTML = `
            <div class="select" onclick="guessPos(${date},1,${timelineID})">
                <div class="poster-filler poster-filler-left" style="color:lightslategray"> ? </div>
                <p style="color:lightslategray"> ???? </p>
            </div>
            <div class="movie-item">
                <div class="poster">
                    <img src="https://image.tmdb.org/t/p/w500/${randMovie}">
                </div>
                <p> ${date} </p>
            </div>
            <div class="select" onclick="guessPos(${date},2, ${timelineID})">
                <div class="poster-filler" style="color:lightslategray"> ? </div>
                <p style="color:lightslategray"> ???? </p>
            </div>
        `;
        
        document.getElementById("timeline").insertBefore(orig, document.getElementById("timeline").childNodes[2]);
        gameStarted= true;
        sendChatInfo("firstMovie", movies[rand]);
        movieRemove(rand);
    }
    
}

document.getElementById("join-game").addEventListener("click", function() {
        document.getElementById("main-menu").style.display = "none";
        document.getElementById("username-sign-in").style.display = 'block';
    }
)

document.getElementById("how-to-play").addEventListener("click", function() {
        document.getElementById("game-instructions").style.display = "block";
        document.getElementById("main-menu").style.display = "none";
    }
)

document.getElementById("close-how-to-play").addEventListener("click", function() {
    document.getElementById("game-instructions").style.display = "none";
    document.getElementById("main-menu").style.display = "block";
    }
)

function signIn(username) {
    socket.emit('signIn', username);
}

function movieRemove(index) {
    movies.splice(index, 1);
}

function displayMovieInfo() {
    document.getElementById()
}

function sendChatInfo(phase, movie, playerNum) {
    const chatBox = document.getElementById('chat-text');
    const chat = document.createElement('div');
    if(phase === 'firstMovie') {
        chat.innerHTML = `Your first movie is <em>${movie[0]}</em>, ${movie[4]}.`;
    }
    if(phase === 'guessedMovieTitleTrue') {
        chat.innerHTML = `Correct! The movie was <em>${movie[0]}</em>. You get a steal token!`;
    }
    if(phase === 'guessedMovieTitleFalse') {
        chat.innerHTML = `Incorrect! You do not get a steal token.`;
    }
    if(phase === 'correctPlacement') {
        chat.innerHTML = `Correct! The movie was <em>${movie[0]}</em>, ${movie[4]}.`;
    }
    if(phase === 'incorrectPlacement') {
        chat.innerHTML = `Incorrect. The movie was <em>${movie[0]}</em>, ${movie[4]}.`;
    }
    if(phase === 'win') {
        chat.innerHTML = `Congratulations! You placed 10 movies in the correct order. You won the game! Press the button to playen again: <button onclick="leaveGame()"> Play Again </button>`;
    }
    if(playerNum === 1) {
        chat.innerHTML = `You will go first, you are player one.`;
    }
    if(playerNum === 2) {
        chat.innerHTML = `You will go second, you are player two.`;
    }
    chatBox.appendChild(chat);
}

function displayServerInfo(data) {
    const chatBox = document.getElementById('chat-text');
    const chat = document.createElement('div');
    if(!data.opponent) {
        chat.innerHTML = `Waiting for opponent to connect.`;
        chatBox.appendChild(chat);
        return;
    }
    
    var length = Number(data.player.timelineLength) + 1;
    
    if(data.phase === 'correctMovie') {
        chat.innerHTML = `<b>${data.player.username}</b> guessed the correct spot for <em>${data.movie[0]}</em>, ${data.movie[4]}. It is now <b>${data.opponent.username}'s</b> turn. <b>${data.player.username}'s</b> timeline is ${length} long.`;
    }
    else if(data.phase === 'notCorrectMovie') {
        chat.innerHTML = `<b>${data.player.username}</b> guessed the incorrect spot for <em>${data.movie[0]}</em>, ${data.movie[4]}. It is now <b>${data.opponent.username}'s</b> turn. <b>${data.player.username}'s</b> timeline is ${data.player.timelineLength} long.`;
    }
    else if(data.phase === 'win') {
        chat.innerHTML = `<b>${data.player.username}</b> placed 10 movies in order and won the game. Press the button to playen again: <button onclick="leaveGame()"> Play Again </button>`;
    }
    else if(data.phase === 'stealToken') {
        chat.innerHTML = `<b>${data.player.username}</b> guessed the title of <em>${data.movie[0]}</em> and gained a steal token.`;
    }
    else if(data.phase === 'disconnect') {
        chat.innerHTML = `<b>${data.player.username}</b> disconnected. You win the game. Press the button to play again: <button onclick="leaveGame()" class="leave-button"> Play Again </button>`;
    }
    chatBox.appendChild(chat);
}

function sendServerChatInfo(phase, movie) {
    var pack = {
        phase:phase,
        movie:movie,
        player:playerInfo,
    }
    socket.emit('sendServerChatInfo', pack);
}
/*

function addStealToken(movie) {
    var count = document.getElementById('steal-token-count');
    var tokenCount = Number(count.innerHTML.slice(2,3)) + 1;
    count.innerHTML = ` x${tokenCount} `;
    socket.emit('addStealToken', {
        movie:movie, 
        count:count, 
        player:playerInfo,
        phase:'stealToken'
    });
}
    */

socket.on('startGame', function(data) {
    sendChatInfo(null, null, data.playerNum);
});

socket.on('playerInfo', function(self) {
    var player = Player({
        username:self.username,
        id:self.id,
        timelineLength:self.timelineLength,
        gameNum:self.gameNum, 
        playerNum:self.playerNum,
        currentPlayerTurn:self.currentPlayerTurn,
        movies:self.movies,
        gameStatus:self.gameStatus,
        stealToken:self.stealToken,
    }); 
    playerInfo = player;
});

var Player = function(data) {
    var self = {};
    self.username = data.username;
    self.id = data.id;
    self.timelineLength = data.timelineLength;
    self.gameNum = data.gameNum;
    self.playerNum = data.playerNum;
    self.currentPlayerTurn = data.currentPlayerTurn;
    self.movies = data.movies;
    self.gameStatus = data.gameStatus;
    self.stealToken = data.stealToken;
    return self;
}

var updateCurrentTurn = function(turn) {
    if(turn === 1) {
        return 2;
    }
    else {
        return 1;
    }
}

var updatePlayerInfo = function(data) {
    socket.emit('updatePlayerInfo', {
        currentTurn:data.turn,
        timelineLength:data.timelineLength,
    });
}

socket.on('addToChat', function(data) {
    displayServerInfo(data);
});

/*

var displayTimeline = function(timeline, data) {
    socket.emit('displayTimeline', {
        timeline:timeline,
        player:data,
    });
}

socket.on('showOpponentTimeline', function(opponentTimeline) {
    const playerTimeline = document.getElementById('timeline');
    playerTimeline.style.display = 'none';
    const opponentTimelineDiv = document.getElementById('opponent-timeline');
    opponentTimelineDiv.style.display = 'block';
    opponentTimelineDiv.innerHTML = `${opponentTimeline}`;
});

*/

socket.on('invalidUsername', function() {
    document.getElementById("invalid-username").style.display = 'block';
});

socket.on('signInStatus', function(status) {
    if(status) {
        document.getElementById("username-sign-in").style.display = 'none';
        selectMovie();
        startingCard();
    }
    else {
        document.getElementById("invalid-username").style.display = 'block';
    }
})

function leaveGame() {
    document.getElementById("main-menu").style.display = "block";
    socket.emit('removePlayer', playerInfo);
    playerInfo = null;
    document.getElementById('chat-form').innerHTML = `<div id="chat-text" style="width: 380px; height: 200px; overflow: auto; background-color: slategray;"> </div>`;
    document.getElementById('timeline').innerHTML = ``;
    gameStarted = false;
}


function guessPos(adjacentDateInput, index, inputOrder) {
    if(guessedAlready === false && gameWon == false && playerInfo.currentPlayerTurn === playerInfo.playerNum && playerInfo.gameStatus == true) {
        var guessDate = currentMovie[4];

        const adjacentMovieInput = document.getElementById(inputOrder);
        const timeline = document.getElementById('timeline');
        var timelineLength = timeline.childElementCount;

        var timelinePosition = Number(Array.prototype.indexOf.call(timeline.children, adjacentMovieInput)) + 1;

        var correct = null;
        var timelineYearsOrder = [];
        
        if(timelineLength > 1 && (timelinePosition !=1 || index == 2) && (timelinePosition != timelineLength || index == 1)) {
            for(var i = 0; i<timeline.children.length;i++) {
                timelineYearsOrder[i] = Number(timeline.children[i].childNodes[1].outerHTML.split("\"")[3].split("(")[1].split(",")[0])
            }
            if(index == 1) {
                var adjacentDateOther = timelineYearsOrder[timelinePosition-2];
            }
            else if(index == 2) {
                var adjacentDateOther = timelineYearsOrder[timelinePosition+2];
            }
        }

        if((index === 1 && adjacentDateInput >= guessDate && (!adjacentDateOther || adjacentDateOther <= guessDate)) || (index === 2 && adjacentDateInput <= guessDate && (!adjacentDateOther || adjacentDateOther >= guessDate))) {
            timelineID++;

            const newMovie = document.createElement("div");
            newMovie.className = "timeline-item";
            newMovie.id = timelineID;

            newMovie.innerHTML = `
                <div class="select" onclick="guessPos(${guessDate},1,${timelineID})">
                    <div class="poster-filler poster-filler-left" style="color:lightslategray"> ? </div>
                    <p style="color:lightslategray"> ???? </p>
                </div>
                <div class="movie-item">
                    <div class="poster">
                        <img src="https://image.tmdb.org/t/p/w500/${currentMovie[2]}">
                    </div>
                    <p> ${guessDate} </p>
                </div>
                <div class="select" onclick="guessPos(${guessDate},2,${timelineID})">
                    <div class="poster-filler" style="color:lightslategray"> ? </div>
                    <p style="color:lightslategray"> ???? </p>
                </div>
            `;
            if(index === 1) {
                document.getElementById("timeline").insertBefore(newMovie, document.getElementById("timeline").childNodes[timelinePosition-1]);
            }
            else if(index === 2) {
                document.getElementById("timeline").insertBefore(newMovie, document.getElementById("timeline").childNodes[timelinePosition]);

            }
            sendChatInfo('correctPlacement', currentMovie);
            if(timelineLength == 9) {
                sendChatInfo('win');
                sendServerChatInfo('win', null);
                gameWon = true;
            }
            guessedAlready = false;
            correct = 'correctMovie';

            timelineLength+=1;
        }
        else {
            sendChatInfo('incorrectPlacement', currentMovie);
            guessedAlready = true;
            correct = 'notCorrectMovie'
        }
        var turn = updateCurrentTurn(playerInfo.currentPlayerTurn);
        updatePlayerInfo({
            turn:turn,
            timelineLength:timelineLength,
            timeline:timeline,
        });
        sendServerChatInfo(correct, currentMovie);
        selectMovie();
    }
}