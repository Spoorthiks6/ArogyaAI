const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const MedicalInfo = require('../models/MedicalInfo');

router.get('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    res.json({ 
      userId: req.userId, 
      email: req.userEmail,
      ...profile?.toObject() || {} 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', auth, async (req, res) => {
  const body = req.body;
  const updated = await Profile.findOneAndUpdate(
    { userId: req.userId },
    { $set: {
        fullName: body.fullName,
        phone: body.phone,
        dob: body.dob,
        gender: body.gender,
        meta: body.meta
      }},
    { upsert: true, new: true }
  );
  res.json({ ok: true, profile: updated });
});

// Medical Info endpoints
router.get('/medical', auth, async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.findOne({ userId: req.userId });
    if (!medicalInfo) {
      return res.json({ 
        userId: req.userId,
        bloodType: 'Unknown',
        allergies: [],
        medications: [],
        medicalConditions: [],
        emergencyNotes: '',
        organDonor: false
      });
    }
    res.json(medicalInfo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/medical', auth, async (req, res) => {
  try {
    const body = req.body;
    const updated = await MedicalInfo.findOneAndUpdate(
      { userId: req.userId },
      { $set: {
          bloodType: body.bloodType || 'Unknown',
          allergies: body.allergies || [],
          medications: body.medications || [],
          medicalConditions: body.medicalConditions || [],
          emergencyNotes: body.emergencyNotes || '',
          height: body.height,
          weight: body.weight,
          organDonor: body.organDonor || false,
          lastUpdated: new Date()
        }},
      { upsert: true, new: true }
    );
    res.json({ ok: true, medicalInfo: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
