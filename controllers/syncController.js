const SyncLog = require("../models/syncLogModel");

const syncOfflineData = async (req, res) => {
  try {
    const { deviceId, changes } = req.body;
    const syncLog = await SyncLog.create({
      school: req.school._id,
      user: req.user._id,
      deviceId: deviceId || "unknown",
      status: "completed",
      itemsSynced: changes ? changes.length : 0
    });
    res.status(200).json({ message: "Sync successful", syncLog });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { syncOfflineData };
