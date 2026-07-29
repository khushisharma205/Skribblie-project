const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  text: { type: String, required: true, unique: true, trim: true, lowercase: true },
  category: { type: String, default: 'general', trim: true, lowercase: true },
});

module.exports = mongoose.model('Word', wordSchema);
