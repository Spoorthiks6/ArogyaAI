require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Configure CORS for mobile app access
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Increase payload limit for audio data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/hackshethra';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

// routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const contactsRoutes = require('./routes/contacts');
const emergencyRoutes = require('./routes/emergency');
const emergencyHistoryRoutes = require('./routes/emergency-history');
const hospitalsRoutes = require('./routes/hospitals');
const testRoutes = require('./routes/test');

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/contacts', contactsRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/emergency-history', emergencyHistoryRoutes);
app.use('/hospitals', hospitalsRoutes);
app.use('/test', testRoutes);

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', ()=>console.log(`API running on http://0.0.0.0:${port}`));
