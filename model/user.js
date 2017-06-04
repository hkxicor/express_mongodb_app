const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  name: String,
  password: String,
  email: String,
  dob: Date,
  status: String
},{collection: 'user'}));
