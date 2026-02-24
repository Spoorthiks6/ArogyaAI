const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hospital = require('../models/Hospital');

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

// GET all hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true }).select('-emergencyAlerts');
    res.json(hospitals);
  } catch (e) {
    console.error('Error fetching hospitals:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET nearby hospitals (within specified radius)
// Query params: latitude, longitude, radius (in km, default 5km)
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxRadius = parseFloat(radius);

    const hospitals = await Hospital.find({ isActive: true });
    
    const nearbyHospitals = hospitals
      .map(hospital => ({
        ...hospital.toObject(),
        distance: calculateDistance(lat, lon, hospital.latitude, hospital.longitude)
      }))
      .filter(hospital => hospital.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    console.log(`   📍 Found ${nearbyHospitals.length} hospitals within ${maxRadius}km`);
    res.json(nearbyHospitals);
  } catch (e) {
    console.error('Error finding nearby hospitals:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (e) {
    console.error('Error fetching hospital:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE hospital (Admin only - for now, allow anyone for testing)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude, specialties, bedsAvailable, ambulancesAvailable, contactPersonName, contactPersonPhone } = req.body;

    if (!name || !email || !phone || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(400).json({ error: 'Hospital with this email already exists' });
    }

    const hospital = await Hospital.create({
      name,
      email,
      phone,
      address,
      latitude,
      longitude,
      specialties: specialties || [],
      bedsAvailable: bedsAvailable || 0,
      ambulancesAvailable: ambulancesAvailable || 0,
      contactPersonName,
      contactPersonPhone,
      isActive: true
    });

    console.log(`✅ Hospital created: ${hospital.name} (${hospital.email})`);
    res.status(201).json({ ok: true, hospital });
  } catch (e) {
    console.error('Error creating hospital:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// UPDATE hospital
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, latitude, longitude, specialties, bedsAvailable, ambulancesAvailable, contactPersonName, contactPersonPhone, isActive } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          phone,
          address,
          latitude,
          longitude,
          specialties: specialties || [],
          bedsAvailable,
          ambulancesAvailable,
          contactPersonName,
          contactPersonPhone,
          isActive,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    console.log(`✅ Hospital updated: ${hospital.name}`);
    res.json({ ok: true, hospital });
  } catch (e) {
    console.error('Error updating hospital:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE hospital (soft delete - mark as inactive)
router.delete('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    console.log(`✅ Hospital deactivated: ${hospital.name}`);
    res.json({ ok: true, message: 'Hospital deactivated' });
  } catch (e) {
    console.error('Error deleting hospital:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE hospital status for emergency alert
router.post('/:hospitalId/emergency-response', async (req, res) => {
  try {
    const { alertId, status, responseTime, notes } = req.body;

    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Add or update emergency response
    const existingAlert = hospital.emergencyAlerts.find(a => a.alertId.toString() === alertId);
    if (existingAlert) {
      existingAlert.status = status;
      existingAlert.responseTime = responseTime;
      existingAlert.notes = notes;
    } else {
      hospital.emergencyAlerts.push({
        alertId,
        status,
        responseTime,
        notes
      });
    }

    await hospital.save();
    console.log(`✅ Emergency response recorded for ${hospital.name}`);
    res.json({ ok: true, hospital });
  } catch (e) {
    console.error('Error recording emergency response:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
