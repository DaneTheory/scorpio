var express = require('express');
var router = express.Router();
var client = require('twilio')('AC0267f6ffaee6267f387f6681654ba52b', 'b7fd16fb34b78199b1c283702973553c');
var request = require('request');
var passport = require('passport');
var findOrCreate = require('mongoose-findorcreate');
var websocket = require('websocket-stream');
var wsURI = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token=";
var indico = require('indico.io');
indico.apiKey =  '98ec712b78bba76fbc655865c9e74cbe';
var Wit = require('node-wit').Wit;
const witclient = new Wit({accessToken: 'XWGLY6YPJZWVXDFKG6OHPO7KNSZ76JNT'});
var phone = require('node-phonenumber');
var phoneUtil = phone.PhoneNumberUtil.getInstance();
var models = require('../models/models');

const SERVER_URI = "http://scorpio-backend.herokuapp.com";
// const SERVER_URI = "https://7729e36e.ngrok.io";

// var response = function(res) { console.log(res); }
var logError = function(err) { console.log(err); }

/* GET home page. api.twilio.com/2010-04-01/Accounts/AC0267f6ffaee6267f387f6681654ba52b/Calls*/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// initiates conference call with user and contact 
router.post('/call', function(req, res, next) {
	// create caller id for user making call/verify their phone number with twilio --DO THIS LATER
	var phoneNumber = phoneUtil.parse(req.body.from,'US');
	var toNumber = phoneUtil.format(phoneNumber, phone.PhoneNumberFormat.INTERNATIONAL);
	var to = toNumber.replace(/[ ]/g, '').replace(/[-]/g, '');
	// console.log("to number:" + to)

	// make a call request to Twilio, using the from number as the number verified in the previous route
	client.makeCall({
		to: to,
		from: '+12155154014',
		url: SERVER_URI + '/call?to=' + req.body.to,
		method: 'GET'
	}, function(err, responseData) {
		if (!err) {
			// console.log("this is the fucking error",err)
			return res.sendStatus(200)
		}
		return res.sendStatus(400)
	});
	// res.sendStatus(200)
})

// connects twilio number and user number to the contact's number using TwiML
router.get('/call', (req, res, next) => {
	var link="<?xml version='1.0' encoding='UTF-8'?>\
			<Response>\
				<Say>Connecting you to your caller</Say><Dial timeout='10' record='true' action='" + SERVER_URI +"/calls/receive'>" + req.query.to + "</Dial>\
			</Response>";
	console.log("TwiML", link)
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

// processes the message response of the 
function onMessage(evt, recordingUrl) {
	// console.log("On Message:", evt.data.);
	evt.data = JSON.parse(evt.data);

	// if the results from watson have been received, we parse the data and analyze it
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

		// saves conversation to mongoose
		var convo = new models.Conversation({
				  	transcription:chat  	
				  });
		convo.save(function(err, conversation){
				  	if(err){
				  		console.log("convo error",err)
				  	}
				  });
		console.log("Chat", chat);

		// iterate through chat array and send every statement to Wit.ai for processing
		for (var i = 0; i < chat.length; i++) {
				// console.log("this is fucking chat[i]", chat[i]);
				var chatmessage = chat[i];
				witclient.message(chat[i], {})
				.then((data) => {
				  console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));


				  ///////////////////// Example Wit response \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
				  //Yay, got Wit.ai response: {"msg_id":"9e300e0a-a11c-4160-ab30-ec80c38152b2",
				  //"_text":"Hey I'd like to schedule a meeting with you from five to seven PM on Thursday ",
				  //"entities":{"scorpio":[{"confidence":1,"type":"value","value":"meeting at"}],
				  //"datetime":[{"confidence":0.9759197034399201,"type":"interval","from":{"value":"2005-01-01T00:00:00.000-08:00",
				  //"grain":"hour"},"to":{"value":"2005-01-06T20:00:00.000-08:00","grain":"hour"},"values":[]}]}}

				  // iterate through keys in data.entities and look for Wit.ai triggers
				  	// datetime
				  
				  	console.log('CHECK IF DATE', data.entities.datetime);
				  	if (data.entities.datetime) {
				  		var calendar = {description: null, startTime: null, endTime: null};
				  		for (var j = 0; j < data.entities.datetime.length; j++) {
						  	if (data.entities.datetime[j].type === "interval") {
						  		calendar.startTime = data.entities.datetime[j].from.value;
						  		var end = new Date(data.entities.datetime[j].to.value);
						  		// still have to modify ending time

						  		calendar.endTime = end;
						  		calendar.description = chatmessage;
						  		convo.calendar.push(calendar)
						  		console.log("this is the calendar", calendar);
						  	}
				 		}
				  	}

				  	// locations
				  	if (data.entities.location) {
				  		data.entities.location.forEach(function(x) {
						  convo.location.push(x.value);						  		  	
				  		})
				  	}

				  	// learning
				  	console.log('CHECK IF LEARN', data.entities.learn);
				  	if (data.entities.learn) {
				  		convo.learning.push(chatmessage);						  		 
					}

					// money amounts
				
					if (data.entities.amount_of_money) {
				  		data.entities.amount_of_money.forEach(function(x) {
			
						  		 convo.money.push(x.value);	 
						  	
				  		})
				  	}

				  	// add twitter engagements or sentiments

				  	// save to model when done
				  	convo.save(function(err, conversation) {
						  			if (err) console.log("individual error", err);
						  			// console.log("saved convo:", conversation)
						  		})

				  	//////////////////////// to do: seed database, add twitter engagements, add hour/minute to end time, test

				//   var calendar = {description: null, startTime: null, endTime: null, location: null};
				 
				//   for (var j = 0; j < data.entities.datetime.length; j++) {
				//   	if (data.entities.datetime[j].type === "interval" && data.entities.datetime.confidence > 0.95) {
				//   		calendar.startTime = data.entities.datetime[j].from.value;
				//   		var end = new Date(data.entities.datetime[j].to.value);


				//   		calendar.endTime = end;

				//   		// if (data.entities.location) {
				//   		// 	calendar.location = data.entities.location;
				//   		// }
				//   		calendar.description = chatmessage;
				//   		convo.calendar.push(calendar)
				//   		convo.save(function(err, conversation) {
				//   			if (err) console.log("individual error", err);
				//   			console.log("saved convo:", conversation)
				//   		})
				//   	}
				//   }
				})
				.catch(console.error)
		};
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
				

				console.log("Person1 mentioned these places: ", places);
				console.log("Person1 mentioned these people: ", people);
				console.log("Person1's average Twitter Engagement was ", avgTwit);
				// console.log("Person1's emotions for each statement: ", res.emotion)
				console.log("Person1's average sentiment was ", avgSent)})
				
			.catch(logError);
			// indico.analyzeText(Person2, {apis: ['sentiment_hq', 'places', 'people', 'emotion', 'twitterEngagement']})
			// .then((res) => {
			// 	var sumSent = 0;
			// 	var sumTwit = 0;
			// 	var avgSent = 0;
			// 	var avgTwit = 0;
			// 	for (var i=0; i<res.sentiment_hq.length; i++) {
			// 		sumSent += res.sentiment_hq[i];
			// 		sumTwit += res.twitterEngagement[i];
			// 	}
			// 	avgSent = sumSent/res.sentiment_hq.length;
			// 	avgTwit = sumTwit/res.twitterEngagement.length;

			// 	var places = '';
			// 	for (var i=0; i<res.places.length; i++) {
			// 		for (var j in res.places[i]) {
			// 			places += res.places[i][j].text + ", ";
			// 		}
			// 	}
			// 	var people = '';
			// 	for (var i=0; i<res.people.length; i++) {
			// 		for (var j in res.people[i]) {
			// 			people += res.people[i][j].text + ", ";
			// 		}
			// 	}

				// attempt at parsing emotions
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

				// console.log("Person2 mentioned these places: ", places);
				// console.log("Person2 mentioned these people: ", people);
				// console.log("Person2's average Twitter Engagement was ", avgTwit);
				// console.log("Person2's average sentiment was ", avgSent)})
				// console.log("Anger: ", emotion[0]);
				// console.log("Joy: ", emotion[1]);
				// console.log("Fear: ", emotion[2]);
				// console.log("Sadness: ", emotion[3]);
				// console.log("Surprise: ", emotion[4])
			// .catch(logError);
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

// obtains a new watson token, since it requires a new one with each api call
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

// creates a new web socket; all functions within it are called by the socket and not us 
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

//
router.post('/calls/receive', (req, res, next) => {

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

module.exports = router;
