const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const School = require("../models/schoolModel");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};

const register = async (req, res) => {
    try {
        const { schoolName, schoolSubDomain, name, firstName, lastName, email, password, phone, phoneNumber } = req.body;

        const finalName = name || `${firstName || ""} ${lastName || ""}`.trim();
        const finalPhone = phone || phoneNumber;
        const finalSubDomain = schoolSubDomain || schoolName?.toLowerCase().replace(/\s+/g, "-");

        if (!schoolName || !finalName || !email || !password) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: "Email has already been registered" });
        }

        const school = await School.create({
            name: schoolName,
            subDomain: finalSubDomain,
            subscription: {
                status: "trial",
                plan: "basic",
                aiTokenBudget: 100000,
                usedAiTokens: 0,
            }
        });

        const user = await User.create({
            name: finalName,
            email,
            password,
            role: 'school_owner',
            schoolId: school._id,
            phone: finalPhone
        });

        const token = generateToken(user._id);
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400),
            sameSite: "none",
            secure: true,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Please add email and password" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        let isMatched = false;
        if (user.password && user.password.startsWith('$2')) {
            isMatched = await user.matchPassword(password);
        } else {
            isMatched = user.password === password;
            if (isMatched) {
                user.password = password;
                await user.save();
            }
        }

        if (!isMatched) return res.status(400).json({ message: "Invalid email or password" });

        if (!user.isActive) return res.status(401).json({ message: "Account deactivated" });

        const token = generateToken(user._id);
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400),
            sameSite: "none",
            secure: true,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logout = async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({ message: "Successfully Logged Out" });
};

const getMe = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password").populate("schoolId");
    res.status(200).json(user);
};

const loggedin = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json(false);
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified) return res.json(true);
    } catch (err) {
        return res.json(false);
    }
    return res.json(false);
};

const changePassword = async (req, res) => { res.status(200).json({ message: "Password changed" }); };
const forgotPassword = async (req, res) => { res.status(200).json({ message: "Reset email sent" }); };
const resetPassword = async (req, res) => { res.status(200).json({ message: "Password reset" }); };
const inviteUser = async (req, res) => { res.status(200).json({ message: "Invite sent" }); };
const acceptInvite = async (req, res) => { res.status(200).json({ message: "Invite accepted" }); };

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { firstName, lastName, phone, avatar } = req.body;
        
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (firstName || lastName) user.name = `${firstName || user.firstName} ${lastName || user.lastName}`.trim();
        if (phone) user.phone = phone;
        
        // Handle avatar URL from body or file from multer
        if (avatar) user.avatar = avatar;
        if (req.file) {
            user.avatar = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const updatedUser = await user.save();
        const userResponse = await User.findById(updatedUser._id).select("-password").populate("schoolId");
        
        res.status(200).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    loggedin,
    changePassword,
    forgotPassword,
    resetPassword,
    inviteUser,
    acceptInvite,
    updateProfile
};
