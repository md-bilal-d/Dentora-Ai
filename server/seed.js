import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { User } from './models/User.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: 'server/.env' });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'mohammedbilald95@gmail.com';
    // Wipe existing admin to ensure fresh credentials
    await User.deleteMany({ email: adminEmail });
    console.log(`Cleared existing accounts for ${adminEmail}`);

    const admin = new User({
      name: 'Dr. Mohammed Bilal',
      email: adminEmail,
      password: 'Dentora2026',
      clinicName: 'Bright Smile Dental',
      specialty: 'Clinical Director',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
