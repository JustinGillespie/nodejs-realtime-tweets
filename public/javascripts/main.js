(function() {
	
	var socket = io.connect('http://localhost');

	var patterns = {
		links    : /[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g,
		username : /[@]+[A-Za-z0-9-_]+/g,
		hashtag  : /[#]+[A-Za-z0-9-_]+/g
	};

	// Reverse Geocode the position given and display
	// the friendly address.

	function displayPosition(position) {
			$.ajax({
					async: false,
					url: "http://maps.googleapis.com/maps/api/geocode/json",
					data: { 
						latlng: position.coords.latitude + "," + position.coords.longitude,
						sensor: "false"
					}
			}).done(function( data ) {
				$("#location").append(' ' + data.results[4].formatted_address);
			});
	} // end displayPosition


	function formatTweet(tweet) {

		var format;

		format = tweet.replace(patterns.links, function(url) {
			return url.link(url);
		});

		format = format.replace(patterns.username, function(u) {
			var username = u.replace("@","")
			return u.link("http://twitter.com/"+username);
		});

		format = format.replace(patterns.hashtag, function(t) {
			var tag = t.replace("#","%23")
			return t.link("http://search.twitter.com/search?q="+tag);
		});

		return format;
}

	// DOM is ready to manipulate

	$(document).ready(function() {

		// Adding Tweets to the DOM

		var tweet_container  =  $("#tweets"),
				tweet_count      =  $("#count"),
				tweet            =  {},
				content;

		// Controls 

		var start     =  $('*[data-stream="true"]'),
				stop      =  $('*[data-stream="false"]'),
				controls  =  $("#controls"),
				input     =  $("#tags");

		var nav = $("nav");

		$('*[data-panel]').on('click', function(e) {
			if($(this).data('panel') === 'show'){
				nav.addClass('panel-open').removeClass('panel-close');
			} else {
				nav.addClass('panel-close').removeClass('panel-open');
			}

			e.preventDefault();
		});

		// Start Streaming (from Keyboard Enter)

		input.on('keypress', function(e) {
			if (e.which == 13) {
				$(this).data('stream', false);
				controls.hide();
				$("#start").addClass('fadeout');
				tweet_container.fadeIn();
				socket.emit('twitterStreamStart', { tags: input.val() });
				e.preventDefault();
			}
		}).focus();

		// Start Streaming Button

		start.on('click', function(e) {
			$(this).data('stream', false);
			controls.hide();
			$("#start").addClass('fadeout');
			tweet_container.fadeIn();
			socket.emit('twitterStreamStart', { tags: input.val() });
			e.preventDefault();
		});

		// Stop Streaming Button

		stop.on('click', function(e) {
			$(this).data('stream', true);
			$("#controls").show();
			socket.emit('twitterStreamStop', { status: false });	
			e.preventDefault();
		});

		socket.on('tweet', function (data) {
			
			// Store the tweet data for later use

			tweet = {
				avatar: data.tweet.user.profile_image_url,
				text: formatTweet(data.tweet.text),
				name: data.tweet.user.name,
			};

			content = $('<div class="tweet"></div>');

			//$('<img>').attr('src', tweet.avatar).appendTo(content);
			$('<span>' + tweet.text + '</span>').addClass('text').appendTo(content);
			$('<span>' + tweet.name + '</span>').addClass('name').appendTo(content);

			// Visualize Sentiment Analysis
			
			var sentiment_class;

			if(data.sentiment > 2) {
				sentiment_class = 'positive';
			} else if(data.sentiment < -2){
				sentiment_class = 'negative';
			} else {
				sentiment_class = 'neutral';
			}

			$('<span class="score">' + data.sentiment + '</span>').appendTo(content);

			content.addClass(sentiment_class).prependTo(tweet_container).fadeIn('slow');
			tweet_count.html(parseInt(tweet_count.html()) + 1);
		});

		// Geolocation

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(displayPosition);
		} else {
			console.log("Geolocation is not supported by this browser.");
		}
		
	}); // end document.ready()
})(); // End of file
