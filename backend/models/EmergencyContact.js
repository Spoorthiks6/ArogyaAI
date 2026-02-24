const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmergencyContactSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  phone: { type: String },
  relation: { type: String },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);
