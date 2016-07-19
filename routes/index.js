var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// initiates conference call with user and contact 
// - records call, transcribes it, analyzes it, and updates model accordingly
router.post('/call', function(req, res, next) {

	// create caller id for user making call/verify their phone number with twilio


	// make a call request to Twilio, using the from number as the number verified in the previous route
	request.post({
		    	url: '/2010-04-01/Accounts/{AccountSid}/Calls',
		    	from: "+1" + 
		    	to: "+1" + 
	})

})


// simple webhook for calls
router.get('/calls/receive', (req, res, next) => {
  // when a call is sent from a user, should send another request to start a conference call with the two people that should be talking

  //for now, just respond to make this work
  console.log('do it right');
  res.send('do it right');
})

router.post('/transcribe', (req, res, next) => {
	console.log(req.body);
	res.send('good');
})
// <Response>
// <Dial timeout="10" record="true">914-523-5432</Dial>
// <Conference record='record-from-start'>  <Record transcribe="true" transcribeCallback="https://c01bfffd.ngrok.io/transcribe/"></Record> </Conference>
// </Response>
 //method='POST' action='https://0f8daa0e.ngrok.io/transcribe/'

module.exports = router;
