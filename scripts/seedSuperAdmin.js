/**
 * Create or update the platform super admin (no school association).
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@educore.ng SUPER_ADMIN_PASSWORD='your-password' node scripts/seedSuperAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { bootstrapSuperAdmin } = require('../services/bootstrapSuperAdmin');

async function run() {
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.error('Set SUPER_ADMIN_PASSWORD in .env or the environment.');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGO_URI or MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  await bootstrapSuperAdmin();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
