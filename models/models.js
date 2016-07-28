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
  conversations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  }]
});

var conversationSchema = mongoose.Schema({
  contact: {
    type: String
  },
  date: {
    type: String
  },
  transcription: {
    type: Array
  },
  calendar:{
    type: Array
  },
  locations: {
    type: Array
  },
  learning: {
    type: Array
  },
  money: {
    type: Array
  },
  twitter: {
    type: Array
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

userSchema.methods.validPassword = function(pw) {
  return bcrypt.compareSync(pw, this.password);
}

userSchema.plugin(findOrCreate);

module.exports = {
  User: mongoose.model('User', userSchema),
  Conversation: mongoose.model('Conversation', conversationSchema)
}