var router = require('express').Router();
var _ = require('underscore');
var bcrypt = require('bcrypt');
var models = require('../models/models');

module.exports = function(passport) {

	router.get('/login/failure', function(req, res) {
		res.status(401).json({
		  success: false
		});
	});

	router.post('/login', passport.authenticate('local', {
		successRedirect: '/login/success',
		failureRedirect: '/login/failure'
	}));

	router.post('/register', function(req, res, next) {
		var params = _.pick(req.body, ['username', 'password']);
		console.log("Got: ", params)
		bcrypt.genSalt(10, function(err, salt) {
		  bcrypt.hash(params.password, salt, function(err, hash) {
		    // Store hash in your password DB.
		    params.password = hash;
		    var user = new models.User(params)

		    user.save(function(err, user) {
		    	console.log("user save err", err)
		    	console.log("user", user)
		      if (err) {
		        res.status(400).json({
		          success: false,
		          error: err.message
		        });
		      } else {
		        res.json({
		          success: true,
		          user: user
		        });
		      }
		    });
		  });
		});
	});

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

	return router

}
