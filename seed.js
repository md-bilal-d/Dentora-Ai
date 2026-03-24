import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './server/models/User.js';

dotenv.config({ path: './server/.env' });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'mohammedbilald95@gmail.com';
    const existing = await User.findOne({ email: adminEmail });
    
    if (existing) {
      console.log('Admin user already exists.');
    } else {
      const admin = new User({
        name: 'Dr. Mohammed Bilal',
        email: adminEmail,
        password: 'Denxis2026',
        clinicName: 'Bright Smile Dental',
        specialty: 'General Dentist',
        role: 'doctor'
      });
      await admin.save();
      console.log('Admin user seeded successfully!');
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
