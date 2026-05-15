const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/userModel');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/educore');
  const schoolOwner = await User.findOne({ role: 'school_owner' });
  
  if (!schoolOwner) {
    console.log("No school owner found");
    process.exit(1);
  }

  // generate a token
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: schoolOwner._id }, process.env.JWT_SECRET || "123456", { expiresIn: '1d' });

  try {
    const res = await axios.post('http://localhost:4000/api/parents', {
      name: "Test Parent 99",
      email: "testparent99@example.com",
      password: "password123",
      phone: "08000000000",
      avatar: ""
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
  process.exit(0);
}
run();
