import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  providerName: { type: String, default: '' },
  policyNumber: { type: String, default: '' },
  memberID: { type: String, default: '' },
  groupNumber: { type: String, default: '' },
  validThrough: { type: Date },
  annualMaximum: { type: Number, default: 0 },
  annualMaximumUsed: { type: Number, default: 0 },
  deductible: { type: Number, default: 0 },
  deductibleMet: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

export const Insurance = mongoose.model('Insurance', insuranceSchema);
