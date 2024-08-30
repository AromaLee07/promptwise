const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clickSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clickCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Click = mongoose.model('Click', clickSchema);

module.exports = Click;