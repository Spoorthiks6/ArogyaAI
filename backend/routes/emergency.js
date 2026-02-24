const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../models/EmergencyContact');
const EmergencyAlert = require('../models/EmergencyAlert');
const MedicalInfo = require('../models/MedicalInfo');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const transcriptionService = require('../services/offlineTranscriptionService');
const translationService = require('../services/translationService');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// configure multer to save uploads to /uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Find nearby hospitals
const findNearbyHospitals = async (latitude, longitude, radiusKm = 5) => {
  try {
    const hospitals = await Hospital.find({ isActive: true });
    const nearbyHospitals = hospitals
      .map(hospital => ({
        ...hospital.toObject(),
        distance: calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude)
      }))
      .filter(hospital => hospital.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyHospitals;
  } catch (err) {
    console.error('Error finding nearby hospitals:', err);
    return [];
  }
};

// POST /emergency
// Accepts optional multipart field 'voice' (audio file)
// Body (application/json or multipart): { message: 'help me', location: 'lat,lng', userName: 'John', language: 'en' }
router.post('/', auth, upload.single('voice'), async (req, res) => {
  try {
    console.log('\n🚨 EMERGENCY REQUEST RECEIVED');
    const userId = req.userId;
    const messageText = (req.body.message || 'Emergency! Please help.').toString();
    const location = req.body.location || null;
    const userName = req.body.userName || 'Unknown User';
    const detectedLanguage = req.body.language || 'en'; // Language detected from frontend

    console.log(`   User ID: ${userId}`);
    console.log(`   User Name: ${userName}`);
    console.log(`   Location: ${location}`);
    console.log(`   Message: ${messageText}`);
    console.log(`   Language: ${detectedLanguage}`);

    // fetch user's contacts to get count for display
    const contacts = await Contact.find({ userId }).limit(20);
    console.log(`   Found ${contacts?.length || 0} emergency contacts`);
    
    if (!contacts || contacts.length === 0) {
      console.log('   ❌ No emergency contacts found');
      return res.status(400).json({ error: 'No emergency contacts found' });
    }

    const phoneNumbers = contacts.filter(c => c.phone).map(c => c.phone);

    console.log(`   Total contacts: ${phoneNumbers.length}`);
    phoneNumbers.forEach((phone, idx) => {
      console.log(`     [${idx + 1}] ${phone}`);
    });

    if (phoneNumbers.length === 0) {
      console.log('   ❌ No valid phone numbers in contacts');
      return res.status(400).json({ error: 'No valid phone numbers in contacts' });
    }

    // If voice file present, transcribe it
    let voiceInfo = null;
    let transcript = null;
    let translatedTranscript = null;
    if (req.file) {
      voiceInfo = {
        filename: req.file.filename,
        path: path.relative(process.cwd(), req.file.path)
      };
      
      // --- Check if message already contains transcription from frontend (Web Speech API) ---
      if (messageText && messageText.includes('🚨 EMERGENCY:')) {
        // Extract just the speech part (after the emoji and "EMERGENCY:" prefix)
        transcript = messageText.replace('🚨 EMERGENCY: ', '').replace('🚨 EMERGENCY:', '').trim();
        
        if (transcript === 'Voice recording received - transcribing...' || !transcript) {
          // Empty/placeholder message - try to transcribe audio file first
          console.log('   ℹ️ Received placeholder message, attempting audio transcription...');
          try {
            const transcriptionResult = await transcriptionService.transcribeAndTranslate(req.file.path, detectedLanguage);
            transcript = transcriptionResult.originalText;
            console.log(`   ✅ Audio transcribed: "${transcript}"`);
          } catch (transErr) {
            console.error(`   ❌ Transcription failed: ${transErr.message}`);
            // Create a language-specific emergency message
            const emergencyMessages = {
              'en': 'Emergency! I need immediate help and assistance.',
              'hi': 'आपातकाल! मुझे तुरंत मदद की जरूरत है।',
              'kn': 'ತುರ್ತ ಸ್ಥಿತಿ! ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು।'
            };
            transcript = emergencyMessages[detectedLanguage] || emergencyMessages['en'];
            console.log(`   ℹ️ Using language-specific emergency message: "${transcript}"`);
          }
        } else {
          // Got real transcript from Web Speech API
          console.log('   ✅ Extracted Web Speech API transcript');
          console.log(`      Text: "${transcript}"`);
        }
      } else {
        // Fallback - use whatever message we got
        console.log('   ℹ️ Using message as-is (no EMERGENCY: prefix detected)');
        transcript = messageText;
      }
      
      // Translate if not in English
      if (detectedLanguage !== 'en') {
        console.log(`   🌐 Translating from ${detectedLanguage} to English...`);
        try {
          translatedTranscript = await translationService.translateToEnglish(transcript, detectedLanguage);
          console.log(`   ✅ Translation complete: "${translatedTranscript}"`);
        } catch (transError) {
          console.error(`   ⚠️ Translation failed: ${transError.message}`);
          translatedTranscript = transcript; // Fall back to original
        }
      } else {
        translatedTranscript = transcript;
      }
    } else {
      console.log('   ⏭️ No voice file attached');
      transcript = messageText;
      
      // Translate if not in English
      if (detectedLanguage !== 'en') {
        console.log(`   🌐 Translating from ${detectedLanguage} to English...`);
        try {
          translatedTranscript = await translationService.translateToEnglish(messageText, detectedLanguage);
          console.log(`   ✅ Translation complete: "${translatedTranscript}"`);
        } catch (transError) {
          console.error(`   ⚠️ Translation failed: ${transError.message}`);
          translatedTranscript = messageText; // Fall back to original
        }
      } else {
        translatedTranscript = messageText;
      }
    }

    console.log(`\n   ✅ Emergency alert created`);

    // Parse location coordinates
    const [latitude, longitude] = location ? location.split(',').map(l => parseFloat(l.trim())) : [null, null];

    // Fetch medical info before saving alert
    let medicalInfo = null;
    try {
      medicalInfo = await MedicalInfo.findOne({ userId });
    } catch (err) {
      console.warn(`   ⚠️ Could not fetch medical info:`, err.message);
    }

    // Save emergency alert to history
    try {
      const alert = await EmergencyAlert.create({
        userId,
        message: messageText,
        location,
        latitude,
        longitude,
        contactsNotified: phoneNumbers.length,
        smsSent: 0,
        smsFailed: 0,
        voiceRecording: voiceInfo,
        transcript,
        translatedTranscript, // Store both original and translated
        detectedLanguage, // Store the language that was detected
        patientMedicalInfo: medicalInfo ? {
          bloodType: medicalInfo.bloodType,
          allergies: medicalInfo.allergies,
          medications: medicalInfo.medications,
          medicalConditions: medicalInfo.medicalConditions,
          emergencyNotes: medicalInfo.emergencyNotes,
          organDonor: medicalInfo.organDonor,
          height: medicalInfo.height,
          weight: medicalInfo.weight
        } : undefined,
        status: 'created',
        smsProvider: 'msg91',
        msg91Details: null
      });
      console.log(`   📝 Emergency alert saved to history: ${alert._id}`);
      console.log(`      Contacts to notify: ${phoneNumbers.length}`);
      console.log(`      Original transcript (${detectedLanguage}): ${transcript}`);
      console.log(`      Translated transcript (en): ${translatedTranscript}`);
      if (medicalInfo) {
        console.log(`      Blood Type: ${medicalInfo.bloodType}`);
        console.log(`      Allergies: ${medicalInfo.allergies.join(', ')}`);
        console.log(`      Medications: ${medicalInfo.medications.join(', ')}`);
      }
    } catch (error) {
      console.error('   ⚠️ Failed to save alert to history:', error);
    }

    // Return transcription result with both versions
    console.log(`\n   ✅ Emergency alert processed`);

    // Fetch user profile and medical info to include in response
    let userProfile = null;
    let nearbyHospitals = [];
    try {
      userProfile = await User.findById(userId).select('email name');
      medicalInfo = await MedicalInfo.findOne({ userId });
      console.log(`   📋 Fetched medical info:`, medicalInfo ? 'Found' : 'Not found');
      
      // Find nearby hospitals (within 5km by default)
      if (latitude && longitude) {
        nearbyHospitals = await findNearbyHospitals(latitude, longitude, 5);
        console.log(`   🏥 Found ${nearbyHospitals.length} nearby hospitals within 5km`);
        nearbyHospitals.forEach((hospital, idx) => {
          console.log(`      [${idx + 1}] ${hospital.name} - ${hospital.distance.toFixed(2)}km away`);
        });
      }
    } catch (err) {
      console.warn(`   ⚠️ Could not fetch additional info:`, err.message);
    }

    res.json({ 
      ok: true, 
      emergency: {
        message: `Emergency alert received with transcription!`,
        voice: voiceInfo,
        transcript: transcript,
        translatedTranscript: translatedTranscript, // Send translated version for SMS/WhatsApp
        detectedLanguage: detectedLanguage,
        location: location,
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
        // Nearby hospitals
        nearbyHospitals: nearbyHospitals.map(h => ({
          id: h._id,
          name: h.name,
          phone: h.phone,
          distance: h.distance.toFixed(2),
          specialties: h.specialties,
          bedsAvailable: h.bedsAvailable,
          ambulancesAvailable: h.ambulancesAvailable
        })),
        // Include medical information for first responders
        patientInfo: {
          name: userProfile?.name || userName,
          email: userProfile?.email || '',
          medicalDetails: medicalInfo ? {
            bloodType: medicalInfo.bloodType,
            allergies: medicalInfo.allergies,
            medications: medicalInfo.medications,
            medicalConditions: medicalInfo.medicalConditions,
            emergencyNotes: medicalInfo.emergencyNotes,
            organDonor: medicalInfo.organDonor,
            height: medicalInfo.height,
            weight: medicalInfo.weight
          } : {
            bloodType: 'Unknown',
            allergies: [],
            medications: [],
            medicalConditions: [],
            emergencyNotes: '',
            organDonor: false
          }
        }
      }
    });
  } catch (e) {
    console.error('❌ Error processing emergency:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

module.exports = router;
