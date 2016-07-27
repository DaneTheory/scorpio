var router = require('express').Router();
var _ = require('underscore');
var models = require('../models/models');
var User = models.User;

router.get('/conversations', function (req, res) {
	models.Conersation.find({
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

return router;