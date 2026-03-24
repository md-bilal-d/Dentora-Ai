import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  schedule: { type: [String], default: [] }, // ['morning', 'afternoon', 'evening', 'night']
  startDate: { type: Date, required: true },
  durationDays: { type: Number, default: 0 },
  endDate: { type: Date, required: true },
  doctorName: { type: String, required: true },
  instructions: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed', 'refill_due', 'overdue'], default: 'active' },
}, {
  timestamps: true
});

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
