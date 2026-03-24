import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  toothId: { type: String, required: true },
  toothNumber: { type: Number, required: true },
  mode: { type: String, required: true },
  crownVariant: { type: String, default: null },
  fillingVariant: { type: String, default: null },
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'in-progress', 'planned'], default: 'planned' },
  date: { type: String, default: '' }
}, {
  timestamps: true
});

export const Treatment = mongoose.model('Treatment', treatmentSchema);
