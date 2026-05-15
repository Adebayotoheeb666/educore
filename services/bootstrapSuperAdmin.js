const User = require('../models/userModel');

/**
 * Ensures the platform super admin exists in the connected database.
 * Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in Render (or .env) — safe to run on every deploy.
 */
async function bootstrapSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@educore.ng').toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    console.warn(
      '[bootstrap] SUPER_ADMIN_PASSWORD not set — skip super admin seed. ' +
        'Set it in Render env vars, then redeploy or run: npm run seed:super-admin',
    );
    return null;
  }

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'super_admin';
    user.schoolId = undefined;
    user.name = user.name || 'Platform Admin';
    user.firstName = user.firstName || 'Platform';
    user.lastName = user.lastName || 'Admin';
    user.isActive = true;
    user.password = password;
    await user.save();
    console.log(`[bootstrap] Super admin ready: ${email}`);
    return user;
  }

  user = await User.create({
    name: 'Platform Admin',
    firstName: 'Platform',
    lastName: 'Admin',
    email,
    password,
    role: 'super_admin',
    isActive: true,
  });
  console.log(`[bootstrap] Created super admin: ${email}`);
  return user;
}

module.exports = { bootstrapSuperAdmin };
