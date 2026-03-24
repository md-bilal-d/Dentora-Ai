import mongoose from 'mongoose';

const clinicPricingSchema = new mongoose.Schema({
  treatmentName: { type: String, required: true },
  treatmentCode: { type: String, default: '' },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  doctorName: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const ClinicPricing = mongoose.model('ClinicPricing', clinicPricingSchema);
