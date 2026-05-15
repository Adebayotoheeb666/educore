const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleWare/authMiddleware");
const requireRole = require("../middleWare/requireRole");
const { upload } = require("../utils/fileUpload");

router.post("/register", register);
router.post("/register-school", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.get("/loggedin", loggedin);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.patch("/resetpassword/:token", resetPassword);
router.post("/invite", protect, requireRole(['principal', 'school_owner']), inviteUser);
router.post("/accept-invite/:token", acceptInvite);
router.patch("/profile", protect, upload.single("image"), updateProfile);

module.exports = router;
