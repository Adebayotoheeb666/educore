const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const School = require("../models/schoolModel");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, please login" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id).select("-password").populate("schoolId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "User account is deactivated" });
    }

    req.user = user;
    if (user.schoolId) {
      req.school = user.schoolId; // The populated school document
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };
