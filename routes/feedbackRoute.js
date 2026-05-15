const express = require("express");
const router = express.Router();
const {
    createFeedback,
    getFeedbacks,
    getFeedbackById,
    updateFeedback
} = require("../controllers/feedbackController");
const { protect } = require("../middleWare/authMiddleware");

router.post("/", protect, createFeedback);
router.get("/", protect, getFeedbacks);
router.get("/:id", protect, getFeedbackById);
router.patch("/:id", protect, updateFeedback);

module.exports = router;
