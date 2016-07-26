var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var bcrypt = require('bcrypt');

// creates user schema to store conversation data
var userSchema = mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  triggers: { // these are words set by the user that they use in conversation
    type: Array
  },
  conversations: { // this may need a separate model, because there will be multiple conversations
    date: {
      type: String
    },
    transcription: {
      type: String
    },
    numbers: {
      type: Array
    },
    locations: {
      type: Array
    },
    triggerSurround: {
      type: Array
    }
  }
});

userSchema.methods.validPassword = function(pw) {
	return bcrypt.compareSync(pw, this.password);
}


userSchema.plugin(findOrCreate);

module.exports = {
	User: mongoose.model('User', userSchema)
}