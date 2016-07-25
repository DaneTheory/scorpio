var express = require('express');
var router = express.Router();
var client = require('twilio')('AC0267f6ffaee6267f387f6681654ba52b', 'b7fd16fb34b78199b1c283702973553c');
var request = require('request');
var passport = require('passport');
// var WebSocket = require('websocket').w3cwebsocket;
var websocket = require('websocket-stream');
var wsURI = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token=";
var indico = require('indico.io');
indico.apiKey =  '98ec712b78bba76fbc655865c9e74cbe';

var googleCredentials = require('client_secret.json');

var GoogleStrategy = require('passport-google-oauth2').Strategy;
passport.use(new GoogleStrategy({
    clientID: googleCredentials.installed.client_id,
    clientSecret: googleCredentials.installed.client_secret,
    callbackURL: "https://scorpio-backend.herokuapp.com/auth/google/callback",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

// var response = function(res) { console.log(res); }
var logError = function(err) { console.log(err); }

/* GET home page. api.twilio.com/2010-04-01/Accounts/AC0267f6ffaee6267f387f6681654ba52b/Calls*/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// initiates conference call with user and contact 
// - records call, transcribes it, analyzes it, and updates model accordingly
router.post('/call', function(req, res, next) {
	// create caller id for user making call/verify their phone number with twilio --DO THIS LATER

	// make a call request to Twilio, using the from number as the number verified in the previous route
	client.makeCall({
		to: req.body.from,
		from: '+12155154014',
		url: 'https://b708783f.ngrok.io/call?to='+req.body.to,
		method: 'GET'
	}, function(err, responseData) {
		console.log("RESPONSE DATA:", responseData);
	});
})

router.get('/call', (req, res, next) => {
	// data: {
	// 	url: 'https://657a1c9b.ngrok.io/call'
	var link="<?xml version=\'1.0\' encoding=\'UTF-8\'?><Response><Say>Connecting you to your caller</Say><Dial timeout=\'10\' record=\'true\' action=\'https://b708783f.ngrok.io/calls/receive\'>" + req.query.to + "</Dial></Response>";
	// console.log("LINK:", link);
	res.set('Content-Type', 'text/xml')
	res.send(link)
})

// simple webhook for calls
function noOp () {
	console.log("KEEP-ALIVE");
	this.send(JSON.stringify({"action":"no-op"}))
}

function onError (evt) {
	console.log("On ERROR!!!:", evt);
}

function onOpen(evt) {
	// console.log("ONOPEN!!!:", evt)
	var message = "{\"action\": \"start\", \"continuous\": true, \"content-type\": \"audio/wav;rate=8000\"}";
   	this.send(message);
   	// setInterval(noOp.bind(this), 8*1000);
}

function onMessage(evt, recordingUrl) {
	// console.log("On Message:", evt.data.);
	evt.data = JSON.parse(evt.data);
	if (evt.data["results"]) {

		var chat = [];
		var Person1 = [];
		var Person2 = [];
		// console.log("Evt data", evt.data["results"][0])
		for (var i=0; i<evt.data["results"].length; i++) {
			if (i%2 === 0) {
				Person1.push(evt.data["results"][i].alternatives[0].transcript);
				chat.push("Person1: " + evt.data["results"][i].alternatives[0].transcript)
			} else if (i%2 !== 0) {
				Person2.push(evt.data["results"][i].alternatives[0].transcript);
				chat.push("Person2: " + evt.data["results"][i].alternatives[0].transcript)
			}
		}
		console.log("Chat", chat);
		// indico.analyzeText(['Donald Trump is not a good person', 'Republicans are evil and the wealthy should be heavily taxed', 'Democrats are evil and there should be no income taxes'], {apis: ['sentiment_hq', 'people', 'places']}).then((res) => {console.log(res.people)}).catch(logError);
		indico.analyzeText(Person1, {apis: ['sentiment_hq', 'places', 'people', 'emotion', 'twitterEngagement']})
			.then((res) => {
				var sumSent = 0;
				var sumTwit = 0;
				var avgSent = 0;
				var avgTwit = 0;
				for (var i=0; i<res.sentiment_hq.length; i++) {
					sumSent += res.sentiment_hq[i];
					sumTwit += res.twitterEngagement[i];
				}
				avgSent = sumSent/res.sentiment_hq.length;
				avgTwit = sumTwit/res.twitterEngagement.length;

				var places = '';
				for (var i=0; i<res.places.length; i++) {
					for (var j in res.places[i]) {
						places += res.places[i][j].text + ", ";
					}
				}
				var people = '';
				for (var i=0; i<res.people.length; i++) {
					for (var j in res.people[i]) {
						people += res.people[i][j].text + ", ";
					}
				}
				// var emotion = [];
				// var sumAnger = 0;
				// var sumJoy = 0;
				// var sumSadness = 0;
				// var sumFear = 0;
				// var sumSurprise = 0;
				// for (var i in res.emotion) {
				// 	switch (res.emotion[i]) {
				// 		case "anger":
				// 			sumAnger += res.emotion[i].anger;
				// 		case "joy":
				// 			sumJoy += res.emotion[i].joy;
				// 		case "fear":
				// 			sumFear += res.emotion[i].fear;
				// 		case "sadness":
				// 			sumSadness += res.emotion[i].sadness;
				// 		case "surprise":
				// 			sumSurprise += res.emotion[i].surprise;
				// 	}
				// }
				// emotion.push(sumAnger/res.emotion.length);
				// emotion.push(sumJoy/res.emotion.length);
				// emotion.push(sumFear/res.emotion.length);
				// emotion.push(sumSadness/res.emotion.length);
				// emotion.push(sumSurprise/res.emotion.length);

				console.log("Person1 mentioned these places: ", places);
				console.log("Person1 mentioned these people: ", people);
				console.log("Person1's average Twitter Engagement was ", avgTwit);
				// console.log("Person1's emotions for each statement: ", res.emotion)
				console.log("Person1's average sentiment was ", avgSent)})
				// console.log("Anger: ", emotion[0]);
				// console.log("Joy: ", emotion[1]);
				// console.log("Fear: ", emotion[2]);
				// console.log("Sadness: ", emotion[3]);
				// console.log("Surprise: ", emotion[4])
			.catch(logError);
			indico.analyzeText(Person2, {apis: ['sentiment_hq', 'places', 'people', 'emotion', 'twitterEngagement']})
			.then((res) => {
				var sumSent = 0;
				var sumTwit = 0;
				var avgSent = 0;
				var avgTwit = 0;
				for (var i=0; i<res.sentiment_hq.length; i++) {
					sumSent += res.sentiment_hq[i];
					sumTwit += res.twitterEngagement[i];
				}
				avgSent = sumSent/res.sentiment_hq.length;
				avgTwit = sumTwit/res.twitterEngagement.length;

				var places = '';
				for (var i=0; i<res.places.length; i++) {
					for (var j in res.places[i]) {
						places += res.places[i][j].text + ", ";
					}
				}
				var people = '';
				for (var i=0; i<res.people.length; i++) {
					for (var j in res.people[i]) {
						people += res.people[i][j].text + ", ";
					}
				}
				// var emotion = [];
				// var sumAnger = 0;
				// var sumJoy = 0;
				// var sumSadness = 0;
				// var sumFear = 0;
				// var sumSurprise = 0;
				// for (var i in res.emotion) {
				// 	switch (res.emotion[i]) {
				// 		case "anger":
				// 			sumAnger += res.emotion[i].anger;
				// 		case "joy":
				// 			sumJoy += res.emotion[i].joy;
				// 		case "fear":
				// 			sumFear += res.emotion[i].fear;
				// 		case "sadness":
				// 			sumSadness += res.emotion[i].sadness;
				// 		case "surprise":
				// 			sumSurprise += res.emotion[i].surprise;
				// 	}
				// }
				// emotion.push(sumAnger/res.emotion.length);
				// emotion.push(sumJoy/res.emotion.length);
				// emotion.push(sumFear/res.emotion.length);
				// emotion.push(sumSadness/res.emotion.length);
				// emotion.push(sumSurprise/res.emotion.length);

				console.log("Person2 mentioned these places: ", places);
				console.log("Person2 mentioned these people: ", people);
				console.log("Person2's average Twitter Engagement was ", avgTwit);
				console.log("Person2's average sentiment was ", avgSent)})
				// console.log("Anger: ", emotion[0]);
				// console.log("Joy: ", emotion[1]);
				// console.log("Fear: ", emotion[2]);
				// console.log("Sadness: ", emotion[3]);
				// console.log("Surprise: ", emotion[4])
			.catch(logError);
		// indico.analyzeText(Person2, {apis: ['sentiment_hq', 'places', 'people', 'emotion', 'twitterEngagement']}).then((res) => {console.log("Person2: ", res)}).catch(logError);
		//indico.places(Person1)
		this.close()
		this.doneTom=true;
	}
	if (evt.data.state === "listening" && !this.doneTom) {
		// console.log('[Now piping data...please be patient!]');
		// https://aacapps.com/lamp/sound/amy.wav
	  	request.get(recordingUrl + ".wav?Download=true")
	  	// request.get("http://api.twilio.com/2010-04-01/Accounts/AC0267f6ffaee6267f387f6681654ba52b/Recordings/RE2228d1b946c2fa928b2bf44af84c7121")
	  	.on('data', (chunk) => {this.send(chunk)})
	  	.on('end', () => this.send(JSON.stringify({action: "stop"})));
	}
}

function onClose(evt) {
	console.log("[Closing socket. Goodbye!]");
}

var getNewWatsonToken = function() {
	return new Promise(function(resolve, reject) {
		request.get("https://stream.watsonplatform.net/authorization/api/v1/token?url=https://stream.watsonplatform.net/speech-to-text/api", {
			auth : {
				username: "a46e041c-a023-4304-9202-7e37cc3a69b6",
				password: "pmIQtgmiC3aJ"
			}
		}, function(err, response, data) {
			if (err) reject(err)
			resolve(data)
		});
	});
}

var createNewSocket = function(token, recordingUrl) {
	return new Promise(function(resolve, reject) {
		try {

			console.log("New token: ", token);
			var ws = websocket(wsURI + token + "&model=en-US_NarrowbandModel");

			ws.socket.onopen = function(evt) { onOpen.bind(this)(evt); resolve(this) }.bind(ws.socket);
			websocket.onclose = function(evt) { onClose(evt) };
			ws.socket.onmessage = function(evt) { onMessage.bind(this)(evt, recordingUrl) }.bind(ws.socket);
			ws.socket.onerror = function(evt) { onError.bind(this)(evt) }.bind(ws.socket);
			resolve(ws);
		}
		catch (err) {
			reject(err);
		}
	})
}

var waitForSocketConnect = function(socket) {
	return new Promise(function(resolve, reject) {
		resolve(socket);
	});
}

router.post('/calls/receive', (req, res, next) => {
  // when a call is sent from a user, should send another request to start a conference call with the two people that should be talking
  //for now, just respond to make this work


  getNewWatsonToken()
	.then((token) => createNewSocket(token, req.body.RecordingUrl))
	// .then(waitForSocketConnect)
	.then(function(socket) {
		// console.log("DATAOF SOMESHIT JOSH WROTE:", socket)
		// may or may not need formatting
  	// probs need to chunk it up
  	// var chunks = []
  	console.log("[Opening socket]")
  	console.log("[sending data]")
  	console.log("[waiting for data]")
  	// socket.onMessage();
	})
	.catch((err) => {
		console.log(err);
	});
  
  // req.body.RecordingUrl
  console.log("REQ BODY:", req.body);
  res.send('do it right');
})

router.post('/transcribe', (req, res, next) => {
	console.log(req.body);
	res.send('good');
})






// ALL OF THE AUTHENTICATION AND LOGIN SHIT!!!!!!

router.get('/login/failure', function(req, res) {
	res.status(401).json({
	  success: false
	});
});

router.post('/login', passport.authenticate('local', {
	successRedirect: '/login/success',
	failureRedirect: '/login/failure'
}));

// router.post('/register', function(req, res, next) {
// 	var params = _.pick(req.body, ['username', 'password']);
// 	bcrypt.genSalt(10, function(err, salt) {
// 	  bcrypt.hash(params.password, salt, function(err, hash) {
// 	    // Store hash in your password DB.
// 	    params.password = hash;
// 	    models.User.create(params, function(err, user) {
// 	      if (err) {
// 	        res.status(400).json({
// 	          success: false,
// 	          error: err.message
// 	        });
// 	      } else {
// 	        res.json({
// 	          success: true,
// 	          user: user
// 	        });
// 	      }
// 	    });
// 	  });
// 	});
// });

// Beyond this point the user must be logged in
router.use(function(req, res, next) {
	if (!req.isAuthenticated()) {
	  res.status(401).json({
	    success: false,
	    error: 'not authenticated'
	  });
	} else {
	  next();
	}
});

router.get('/logout', function(req, res) {
	req.logout();
	res.json({
	  success: true,
	  message: 'logged out.'
	});
});

router.get('/login/success', function(req, res) {
	var user = _.pick(req.user, 'username', '_id');
	res.json({
	  success: true,
	  user: user
	});
});


// <Response>
// <Dial timeout="10" record="true">914-523-5432</Dial>
// <Conference record='record-from-start'>  <Record transcribe="true" transcribeCallback="https://c01bfffd.ngrok.io/transcribe/"></Record> </Conference>
// </Response>
 //method='POST' action='https://0f8daa0e.ngrok.io/transcribe/'

module.exports = router;
