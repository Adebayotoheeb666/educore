/**
 * Create or update the platform super admin (no school association).
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@educore.ng SUPER_ADMIN_PASSWORD='your-password' node scripts/seedSuperAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@educore.ng').toLowerCase().trim();
const password = process.env.SUPER_ADMIN_PASSWORD;

async function run() {
  if (!password) {
    console.error('Set SUPER_ADMIN_PASSWORD in .env or the environment.');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGO_URI or MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'super_admin';
    user.schoolId = undefined;
    user.name = user.name || 'Platform Admin';
    user.firstName = 'Platform';
    user.lastName = 'Admin';
    user.isActive = true;
    user.password = password;
    await user.save();
    console.log(`Updated existing user to super_admin: ${email}`);
  } else {
    user = await User.create({
      name: 'Platform Admin',
      firstName: 'Platform',
      lastName: 'Admin',
      email,
      password,
      role: 'super_admin',
      isActive: true,
    });
    console.log(`Created super_admin: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
