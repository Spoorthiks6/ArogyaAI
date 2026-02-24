const mongoose = require('mongoose');

const MedicalInfoSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bloodType: {
    type: String,
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: {
    type: [String],
    default: []
  },
  medications: {
    type: [String],
    default: []
  },
  medicalConditions: {
    type: [String],
    default: []
  },
  emergencyNotes: {
    type: String,
    default: ''
  },
  height: String, // e.g., "5'10"" or "178 cm"
  weight: String, // e.g., "75 kg" or "165 lbs"
  organDonor: {
    type: Boolean,
    default: false
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MedicalInfo', MedicalInfoSchema);
