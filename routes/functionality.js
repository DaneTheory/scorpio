var router = require('express').Router();
var _ = require('underscore');
var models = require('../models/models');
var User = models.User;

router.get('/conversations', function (req, res) {
	models.Conversation.find({
		user: req.query.id
	}, function(err, convos) {
		if (err) {
			res.statues(400).json({
				success: false,
				error: err.message
			})
		} else {
			res.json({
				success: true,
				convos
			});
		}
	})
});

router.get('/content/:id', function (req, res) {
	models.Conversation.findById(req.params.id, function(err, content) {
		if (err) {
			res.status(400).json({
				success: false,
				error: err.message
			});
		} else {
			res.json({
				success: true,
				content
			});
		}
	});
});

module.exports = router;