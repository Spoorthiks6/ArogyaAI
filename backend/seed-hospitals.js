require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/hackshethra';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('📚 MongoDB connected - Starting hospital seed...\n');

    // Sample hospitals near Bangalore & Mysore, India
    const hospitals = [
      {
        name: 'Bangalore Emergency Hospital',
        email: 'emergency@bgram.hospital.com',
        phone: '+91-9876543210',
        address: 'Indiranagar, Bangalore, Karnataka',
        latitude: 12.9716,
        longitude: 77.6412,
        specialties: ['Emergency', 'Trauma', 'Cardiology'],
        bedsAvailable: 25,
        ambulancesAvailable: 5,
        contactPersonName: 'Dr. Sharma',
        contactPersonPhone: '+91-9876543210'
      },
      {
        name: 'Apollo Hospital Bangalore',
        email: 'apollo@bangalore.hospital.com',
        phone: '+91-9876543211',
        address: 'Koramangala, Bangalore, Karnataka',
        latitude: 12.9352,
        longitude: 77.6245,
        specialties: ['Cardiology', 'Neurology', 'Emergency'],
        bedsAvailable: 40,
        ambulancesAvailable: 8,
        contactPersonName: 'Dr. Patel',
        contactPersonPhone: '+91-9876543211'
      },
      {
        name: 'Max Healthcare Bangalore',
        email: 'max@bangalore.hospital.com',
        phone: '+91-9876543212',
        address: 'Whitefield, Bangalore, Karnataka',
        latitude: 12.9698,
        longitude: 77.7499,
        specialties: ['Emergency', 'Trauma', 'Orthopedics'],
        bedsAvailable: 35,
        ambulancesAvailable: 6,
        contactPersonName: 'Dr. Singh',
        contactPersonPhone: '+91-9876543212'
      },
      {
        name: 'Fortis Hospital Bangalore',
        email: 'fortis@bangalore.hospital.com',
        phone: '+91-9876543213',
        address: 'Cunningham Road, Bangalore, Karnataka',
        latitude: 13.0011,
        longitude: 77.5946,
        specialties: ['Cardiology', 'Neurology', 'Emergency'],
        bedsAvailable: 30,
        ambulancesAvailable: 7,
        contactPersonName: 'Dr. Kumar',
        contactPersonPhone: '+91-9876543213'
      },
      {
        name: 'Manipal Hospital Bangalore',
        email: 'manipal@bangalore.hospital.com',
        phone: '+91-9876543214',
        address: 'Domlur, Bangalore, Karnataka',
        latitude: 12.9689,
        longitude: 77.6499,
        specialties: ['Emergency', 'Trauma', 'General Surgery'],
        bedsAvailable: 28,
        ambulancesAvailable: 5,
        contactPersonName: 'Dr. Desai',
        contactPersonPhone: '+91-9876543214'
      },
      {
        name: 'Mysore Medical Center',
        email: 'contact@mysoremedicl.hospital.com',
        phone: '+91-9876543215',
        address: 'Sayyaji Rao Road, Mysore, Karnataka',
        latitude: 12.2958,
        longitude: 76.6394,
        specialties: ['Emergency', 'Trauma', 'General Medicine'],
        bedsAvailable: 20,
        ambulancesAvailable: 4,
        contactPersonName: 'Dr. Reddy',
        contactPersonPhone: '+91-9876543215'
      },
      {
        name: 'Apollo Hospital Mysore',
        email: 'apollo@mysore.hospital.com',
        phone: '+91-9876543216',
        address: 'Hebbal, Mysore, Karnataka',
        latitude: 12.3019,
        longitude: 76.6551,
        specialties: ['Cardiology', 'Emergency', 'Neurology'],
        bedsAvailable: 32,
        ambulancesAvailable: 6,
        contactPersonName: 'Dr. Gupta',
        contactPersonPhone: '+91-9876543216'
      },
      {
        name: 'Fortis Hospital Mysore',
        email: 'fortis@mysore.hospital.com',
        phone: '+91-9876543217',
        address: 'Gokulam, Mysore, Karnataka',
        latitude: 12.3105,
        longitude: 76.6874,
        specialties: ['Emergency', 'Trauma', 'Orthopedics'],
        bedsAvailable: 28,
        ambulancesAvailable: 5,
        contactPersonName: 'Dr. Rao',
        contactPersonPhone: '+91-9876543217'
      }
    ];

    try {
      // Clear existing hospitals (optional)
      await Hospital.deleteMany({});
      console.log('🗑️  Cleared existing hospitals\n');

      // Insert new hospitals
      const createdHospitals = await Hospital.insertMany(hospitals);
      console.log(`✅ Created ${createdHospitals.length} fake hospitals:\n`);
      
      createdHospitals.forEach((hospital, idx) => {
        console.log(`[${idx + 1}] ${hospital.name}`);
        console.log(`    📧 ${hospital.email}`);
        console.log(`    📍 ${hospital.latitude}, ${hospital.longitude}`);
        console.log(`    🛏️  Beds: ${hospital.bedsAvailable} | 🚑 Ambulances: ${hospital.ambulancesAvailable}\n`);
      });

      console.log('✨ Hospital seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error seeding hospitals:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
