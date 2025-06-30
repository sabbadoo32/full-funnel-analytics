const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('Campaign', campaignSchema);