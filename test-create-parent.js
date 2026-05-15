const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/educore');
  try {
    const parent = new User({
      name: "Test Parent",
      email: "testparent@example.com",
      password: "password123",
      role: 'parent',
      phone: "08000000000",
      schoolId: new mongoose.Types.ObjectId(), // dummy
      avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg=="
    });
    await parent.validate();
    console.log("Validation passed!");
  } catch (err) {
    console.error("Validation failed:", err);
  }
  mongoose.disconnect();
}
test();
