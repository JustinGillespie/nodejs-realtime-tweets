
// Module dependencies.
 
var express = require('express'),
		routes = require('./routes'),
		http = require('http');

var app = express(),
		server = app.listen(3000),
		io = require('socket.io').listen(server);

// Sentiment Tracking

var sentiment = require('sentiment');

// Twitter dependencies

var twitter = require('ntwitter'),
		t = new twitter({
			consumer_key:        'YOUR_CONSUMER_KEY',
			consumer_secret:     'YOUR_CONSUMER_SECRET',
			access_token_key:    'YOUR_ACCESS_TOKEN_KEY',
			access_token_secret: 'YOUR_ACCESS_TOKEN_SECRET'
});

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

// Realtime Events

io.sockets.on('connection', function (socket) {

	var tconnection;

	// Start Twitter Stream

	socket.on('twitterStreamStart', function(data) {
		
		t.stream('statuses/filter', {track: data.tags.split(',')}, function(stream) {
			
			tconnection = stream;
			stream.on('data', function(tweet) {

					// Run the tweet text through Sentiment Analysis
					
					if(tweet.text) {
						sentiment(tweet.text, function(err, result) {
							socket.emit('tweet', { sentiment: result.score, tweet: tweet });
						});
					} else {
						socket.emit('tweet', { sentiment: 0, tweet: tweet });
					}

			}); // end stream.on()
		});  // end t.stream()
	}); // end startTweetStream

	// End Twitter Stream

	socket.on('twitterStreamStop', function(data) {
		if(tconnection) {
			tconnection.destroy();
		}
		console.log('Connection Stream Destroyed');
	});

}); // end connection


