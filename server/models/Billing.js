import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  treatmentName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  insurancePaid: { type: Number, default: 0 },
  patientPaid: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Cash' },
  date: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' }
}, {
  timestamps: true
});

export const Billing = mongoose.model('Billing', billingSchema);
