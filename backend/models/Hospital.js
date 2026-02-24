const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  specialties: { 
    type: [String], 
    default: [] 
    // e.g., ['Cardiology', 'Trauma', 'Emergency', 'Neurology']
  },
  bedsAvailable: { 
    type: Number, 
    default: 0 
  },
  ambulancesAvailable: { 
    type: Number, 
    default: 0 
  },
  contactPersonName: { 
    type: String 
  },
  contactPersonPhone: { 
    type: String 
  },
  emergencyAlerts: [{
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyAlert' },
    receivedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'acknowledged', 'responded'], default: 'pending' },
    responseTime: Number, // in minutes
    notes: String
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create geospatial index for proximity queries
HospitalSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
