var restify = require('restify');
//var amqp = require('amqplib/callback_api');
var http = require('https');
var fs = require('fs');
var crypto = require('crypto');

var cards = JSON.parse(fs.readFileSync('cah-official.json', 'utf8'));
var app = restify.createServer();

//var server_port = process.env.NODE_PORT;
var server_port = 3030;

//var server_host = "https://api.narwhl.com";
var server_host = "http://127.0.0.1:3030";


//var queue = "ingestor-in";

app.use(restify.bodyParser());
app.use(restify.queryParser());
app.use(restify.authorizationParser());

formatError = function(errStr) {
	error = {};
	error.message = errStr;
	return error;
}


//var AUTH_URL = process.env.AUTH_URL;
//var MQ_LINK = "amqp://" + process.env.AMQP_URL;

//TODO: This has to go into a private module
//Probably something along the lines of var verify = require('lib/verify')(AUTH_SERVER_URL)

/*
verifyRole = function(authorization, role, callback) {
	if(authorization.scheme == "Bearer") {
		//Call the auth server with the token
		verifyToken(authorization.credentials, function(err, valid) {
			if(err) {
				callback(err, false);
				return;
			}

			if(valid.verified) {
				if(valid.claims.roles.indexOf(role) >= 0) {
					callback(null, valid);
					return;
				} else {
					callback({"code": 403, "message": "You do not have the proper permissions to access this resource."}, false);
					return;
				}
			} else {
				callback({"code": 401, "message": "You must have a valid token to access this resource"}, false);
				return;
			}
		});
	} else {
		callback({"code": 401, "message": "You must have a valid token to access this resource"}, false);
		return;
	}
}
*/


//callback(error, token_data)
/*
verifyToken = function(token, callback) {
    return http.get(AUTH_URL + "?token=" + encodeURIComponent(token), function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done, do whatever with it!
			try {
            	var parsed = JSON.parse(body);
			} catch(error) {
				console.log("Could not parse JSON from server: \n\n" + JSON.stringify(error) + "\n==========\n" + body);
				callback({"code": 500, "message": "Could not authenticate due to server error"});
				return;
			}
			callback(null, parsed);
			return;
        });
    }).on('error', function(err) {
        // handle errors with the request itself
        console.error('Error with the request:', err.message);
        callback({"code": 500, "message": "Unable to complete authorization due to server error."}, null);
    });
}
*/

/*****
Support Functions
*****/

shuffle = function(cards) {
	var rando;
	var tmpVal;
	var newCards = cards.slice();
console.log("Newcards: " + newCards.length);

	for(n = 0; n < newCards.length; n++) {
		rando = Math.floor((Math.random() * 1000) % newCards.length);
		tmpVal = newCards[rando];
		newCards[rando] = newCards[n];
		newCards[n] = tmpVal;
	}
	return newCards;
}


//Too many differing ways to handle pass by reference in JS, so I'm being lazy and creating two functions. 
//Not DRY, but neither are my pants.
drawBlack = function(number) {
	var drawArray = [];
	for(n = 0; n < number; n++) {
		//If we got to the end of the cards, start over
		if(currBlack >= blackDeck.length) {
			currBlack = 0;
		}
			
		drawArray.push(blackDeck[currBlack]);
		currBlack++;
	}
	return drawArray;
}	
	
drawWhite = function(number) {
	var drawArray = [];
	for(n = 0; n < number; n++) {
		//If we got to the end of the cards, start over
		if(currWhite >= whiteDeck.length) {
			currWhite = 0;
		}
			
		drawArray.push(whiteDeck[currWhite]);
		currWhite++;
	}
	return drawArray;
}



/*****
End
*****/


/*****
Game state setup 
 --> Some of this will be moved to a POST for games
*****/


//This should be moved to an external datastore
var games = {};
var gameCount = 0;

//Want to dynamically load the cards and asign URLs to them.
//This needs to be in a persistence layer
for(n = 0; n < cards.blackCards.length; n++) {
	cards.blackCards[n]._links = [{"rel": "_self", "href": server_host + "/cards/black/" + n}];
}

for(n = 0; n < cards.whiteCards.length; n++) {
	text = cards.whiteCards[n];
	cards.whiteCards[n] = {};
	cards.whiteCards[n].text = text;
	cards.whiteCards[n]._links = [{"rel": "_self", "href": server_host + "/cards/white/" + n}];
}

//These should be done on a per game basis
var blackDeck = shuffle(cards.blackCards);
var whiteDeck = shuffle(cards.whiteCards);

var currBlack = 0;
var currWhite = 0;


/*****
END
*****/



/*****
Routing
*****/

app.get('/cards/black/:id', function(req, res, next) {
	/*	
	verifyRole(req.authorization, "user", function(err, valid) {
		if(err) {
			res.send(err.code, err);
			next();
			return;
		}
		if(valid) {
			//TODO: Implement me
			res.send(200, {"message": "Hey, token verification works!"});
			next();
			return;
		} else {
			res.send(403, {"code": 403, "message": "You do not have the necessary permissions to access this resource."});
			next();
			return;
		}
	});
	*/
	if((!isNaN(req.params.id)) && (cards.blackCards.length > req.params.id)) {
		res.send(200, cards.blackCards[req.params.id]);
	} else {
		res.send(404, {"code": 400, "message": "No cards match that ID."});
	}
	return;
});

app.get('/cards/white/:id', function(req, res, next) {
	/*	
	verifyRole(req.authorization, "user", function(err, valid) {
		if(err) {
			res.send(err.code, err);
			next();
			return;
		}
		if(valid) {
			//TODO: Implement me
			res.send(200, {"message": "Hey, token verification works!"});
			next();
			return;
		} else {
			res.send(403, {"code": 403, "message": "You do not have the necessary permissions to access this resource."});
			next();
			return;
		}
	});
	*/
	if((!isNaN(req.params.id)) && (cards.whiteCards.length > req.params.id)) {
		res.send(200, cards.whiteCards[req.params.id]);
	} else {
		res.send(404, {"code": 400, "message": "No cards match ID " + req.params.id});
	}
	next();
	return;
});

//Pulls a black card from the deck and corresponding white cards
app.get('/rando', function(req, res, next) {
	bCard = drawBlack(1);
console.log(bCard);
	wCards = drawWhite(bCard[0].pick);

	var data = {};
	data.blackCard = bCard;
	data.whiteCards = wCards;
	res.send(200, data);
	next();
	return;
});

app.get('/games', function(req, res, next) {
	var resArray = [];
	for (var key in games) {
		// skip loop if the property is from prototype
		if (!games.hasOwnProperty(key)) continue;
		links = [];
		links.push({"rel": "_self", "href": server_host + '/games/' + key, "method": "GET"});
		links.push({"rel": "players", "href": server_host + '/games/' + key + '/players', "method": "GET"});
		links.push({"rel": "join", "href": server_host + '/games/' + key + '/players', "method": "POST"});
		resArray.push({"game_id": n, "game_status": games[key].status, "_links": links});
	}
	res.send(200, resArray);
	next();
	return;
});

//We're going to add the authentication service to this. For now, though. we'll let folks self-identify
app.post('/games', function(req, res, next) {
	if(req.params.username) {
		var hash = crypto.createHash('sha256');
		hash.update(username);
		var hashed_key = hash.digest('hex');
		
//TODO: Allow new games to be created
//Hash according to Sha hash of username
//Handle all he game mechanics. 


	} else {
		res.response(403, {"code": 403, "message": "Bad or mising username."});
	}
	next();
	return;
});

//Would be cool to load up a Swagger file and just have this respond with the definition for each endpoint
app.opts('/', function(req, res, next) {
	var options = {};
	options.message = "I will eventually describe the API here using some common format like Swagger.";
	res.send(200, options);
	next();
	return;
});


app.listen(server_port, function() {
	console.log("Listening on port " + server_port);
});



