const http = require('http');
const mongoose = require('mongoose');
const app = require('./server');
const { wsManager, sseManager, changeStreamManager } = require('./events');
const Attendance   = require('./models/attendanceModel');
const Result       = require('./models/resultModel');
const Payment      = require('./models/paymentModel');
const Announcement = require('./models/announcementModel');
const { bootstrapSuperAdmin } = require('./services/bootstrapSuperAdmin');

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      await bootstrapSuperAdmin();
    } catch (err) {
      console.error('[bootstrap] Super admin setup failed:', err.message);
    }

    const server = http.createServer(app);
    wsManager.initialize(server);
    sseManager.initialize();

    changeStreamManager.initializeStream('attendance',    Attendance.collection);
    changeStreamManager.initializeStream('results',       Result.collection);
    changeStreamManager.initializeStream('payments',      Payment.collection);
    changeStreamManager.initializeStream('announcements', Announcement.collection);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      changeStreamManager.closeAll();
      wsManager.shutdown();
      sseManager.shutdown();
      server.close(() => {
        mongoose.connection.close(false, () => {
          process.exit(0);
        });
      });
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => console.log(err));
