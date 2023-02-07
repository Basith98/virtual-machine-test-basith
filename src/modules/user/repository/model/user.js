const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  image: String,
  phonenumber: Number,
  country: String,
  verified: Boolean,
  recordStatusId: Number,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
