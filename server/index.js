import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { Patient } from './models/Patient.js';
import { Treatment } from './models/Treatment.js';
import { Prescription } from './models/Prescription.js';
import { ClinicPricing } from './models/ClinicPricing.js';
import { Billing } from './models/Billing.js';
import { Insurance } from './models/Insurance.js';
import { User } from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Deep DNS override to bypass Windows/ISP filtering of SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dentora_super_secret_jwt_key_2026';

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], credentials: true }));
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fallback';
mongoose.connect(MONGODB_URI, { family: 4 })
  .then(() => console.log('✅ Connected to MongoDB Atlas - DentalCare_DB'))
  .catch(err => console.error('❌ MongoDB connection error (Check MONGODB_URI):', err.message));

// Middleware to verify JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// ─── AUTH ROUTES ───

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, clinicName, specialty } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = new User({
      name,
      email,
      password,
      clinicName,
      specialty
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        clinicName: newUser.clinicName,
        specialty: newUser.specialty,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        clinicName: user.clinicName,
        specialty: user.specialty,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  res.send(req.user);
});

// ─── BILLING ROUTES ───

// Get billing records for a patient
app.get('/api/billing/:patientId', async (req, res) => {
  try {
    const billing = await Billing.find({ patientId: req.params.patientId }).sort({ date: -1 });
    res.json(billing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
});

// Create a new billing record
app.post('/api/billing', async (req, res) => {
  try {
    const newBilling = new Billing(req.body);
    const saved = await newBilling.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create billing record' });
  }
});

// Update a billing record
app.put('/api/billing/:id', async (req, res) => {
  try {
    const updated = await Billing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Billing record not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update billing record' });
  }
});

// Delete a billing record
app.delete('/api/billing/:id', async (req, res) => {
  try {
    const deleted = await Billing.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Billing record not found' });
    res.json({ message: 'Billing record deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete billing record' });
  }
});

// ─── INSURANCE ROUTES ───

// Get insurance for a patient
app.get('/api/insurance/:patientId', async (req, res) => {
  try {
    const insurance = await Insurance.findOne({ patientId: req.params.patientId });
    res.json(insurance || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insurance' });
  }
});

// Update or Create insurance for a patient
app.put('/api/insurance/:patientId', async (req, res) => {
  try {
    const insurance = await Insurance.findOneAndUpdate(
      { patientId: req.params.patientId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(insurance);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update insurance' });
  }
});

// ... rest of the existing routes ...

// ─── PATIENT ROUTES ───

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get a single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create a new patient
app.post('/api/patients', async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create patient' });
  }
});

// Update a patient (Full replacement/merge)
app.put('/api/patients/:id', async (req, res) => {
  try {
    const updatedPatient = await Patient.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPatient) return res.status(404).json({ error: 'Patient not found' });
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update patient' });
  }
});

// Delete a patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const deletedPatient = await Patient.findOneAndDelete({ id: req.params.id });
    if (!deletedPatient) return res.status(404).json({ error: 'Patient not found' });
    // Also clean up related treatments
    await Treatment.deleteMany({ patientId: req.params.id });
    res.json({ message: 'Patient and related treatments deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// ─── TREATMENT ROUTES ───

// Get treatments for a specific patient
app.get('/api/treatments/:patientId', async (req, res) => {
  try {
    const treatments = await Treatment.find({ patientId: req.params.patientId });
    res.json(treatments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

// Add a new treatment
app.post('/api/treatments', async (req, res) => {
  try {
    const newTreatment = new Treatment(req.body);
    const savedTreatment = await newTreatment.save();
    
    // Auto-update patient document array as well for easier state syncing
    await Patient.findOneAndUpdate(
      { id: req.body.patientId },
      { $push: { treatments: savedTreatment } }
    );

    res.status(201).json(savedTreatment);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to add treatment' });
  }
});

// Update an existing treatment
app.put('/api/treatments/:id', async (req, res) => {
  try {
    const updatedTreatment = await Treatment.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTreatment) return res.status(404).json({ error: 'Treatment not found' });
    
    // Also update it within the patient array
    await Patient.updateOne(
      { id: updatedTreatment.patientId, "treatments.id": updatedTreatment.id },
      { $set: { "treatments.$": updatedTreatment } }
    );

    res.json(updatedTreatment);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update treatment' });
  }
});

// ─── PRESCRIPTION ROUTES ───

// Get all prescriptions
app.get('/api/prescriptions/:patientId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Create a new prescription
app.post('/api/prescriptions', async (req, res) => {
  try {
    const newPrescription = new Prescription(req.body);
    const saved = await newPrescription.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create prescription' });
  }
});

// Update a prescription
app.put('/api/prescriptions/:id', async (req, res) => {
  try {
    const updated = await Prescription.findOneAndUpdate(
      { prescriptionId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Prescription not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update prescription' });
  }
});

// Delete a prescription
app.delete('/api/prescriptions/:id', async (req, res) => {
  try {
    const deleted = await Prescription.findOneAndDelete({ prescriptionId: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// ─── PATIENT ALLERGY ROUTES ───

// Get allergies for a patient
app.get('/api/patients/:id/allergies', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ allergies: patient.allergies || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
});

// Update allergies for a patient
app.put('/api/patients/:id/allergies', async (req, res) => {
  try {
    const updated = await Patient.findOneAndUpdate(
      { id: req.params.id },
      { allergies: req.body.allergies },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Patient not found' });
    res.json({ allergies: updated.allergies });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update allergies' });
  }
});

// ─── CLINIC PRICING ROUTES ───

// Get all clinic prices
app.get('/api/clinic-pricing', async (req, res) => {
  try {
    const prices = await ClinicPricing.find().sort({ treatmentName: 1 });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinic prices' });
  }
});

// Bulk save/update clinic prices
app.post('/api/clinic-pricing/bulk', async (req, res) => {
  try {
    const { prices } = req.body;
    // Delete all existing and replace with new set
    await ClinicPricing.deleteMany({});
    const saved = await ClinicPricing.insertMany(prices);
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to save prices' });
  }
});

// Delete a single clinic price
app.delete('/api/clinic-pricing/:id', async (req, res) => {
  try {
    const deleted = await ClinicPricing.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Price not found' });
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete price' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
