import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  allergies: { type: [String], default: [] },
  medications: { type: String, default: '' },
  lastVisit: { type: String, default: '' },
  diseaseScore: { type: Number, default: 0 },
  risk_level: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  scanResults: { type: Array, default: [] },
  treatments: { type: Array, default: [] },
  appointments: { type: Array, default: [] }
}, {
  timestamps: true
});

export const Patient = mongoose.model('Patient', patientSchema);
