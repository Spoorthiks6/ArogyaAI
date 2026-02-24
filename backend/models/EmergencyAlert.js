const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  message: String,
  location: String,
  latitude: Number,
  longitude: Number,
  contactsNotified: Number,
  smsSent: Number,
  smsFailed: Number,
  voiceRecording: {
    filename: String,
    path: String
  },
  status: { type: String, default: 'sent' }, // sent, delivered, failed
  smsProvider: { type: String, default: 'msg91' }, // 'twilio' or 'msg91'
  twilioDetails: {
    messageSids: [String],
    errors: [{
      phone: String,
      errorCode: String,
      errorMessage: String
    }],
    sentDetails: [{
      phone: String,
      sid: String,
      status: String
    }]
  },
  msg91Details: {
    messageSids: [String],
    errors: [{
      phone: String,
      errorCode: String,
      errorMessage: String
    }],
    sentDetails: [{
      phone: String,
      msgId: String,
      status: String
    }]
  },
  transcript: { type: String }, // Speech-to-text transcript of voice recording
  translatedTranscript: { type: String }, // Translated version of transcript
  detectedLanguage: { type: String }, // Language detected
  // Medical information snapshot at time of emergency
  patientMedicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    medicalConditions: [String],
    emergencyNotes: String,
    organDonor: Boolean,
    height: String,
    weight: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);

