const Announcement = require("../models/announcementModel");

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, priority, targetClass, sendSMS, sendPush, sendEmail } = req.body;
    const announcement = await Announcement.create({
      school: req.school._id,
      title,
      body,
      priority: priority || 'normal',
      targetAudience: audience || 'all',
      targetClasses: targetClass ? [targetClass] : [],
      createdBy: req.user._id,
      sentViaSMS: sendSMS,
      sentViaWhatsApp: sendPush || sendEmail 
    });
    
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ school: req.school._id })
      .populate('targetClasses', 'name')
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 });
    
    // Map for frontend compatibility
    const formatted = announcements.map(a => ({
      ...a._doc,
      audience: a.targetAudience,
      createdBy: { 
        name: a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : 'Admin',
        role: a.createdBy?.role || 'Staff'
      }
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestAnnouncements = async (schoolId) => {
  return await Announcement.find({ school: schoolId })
    .sort({ createdAt: -1 })
    .limit(5);
};

const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement, getLatestAnnouncements };
