const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const compression = require("compression");

const errorHandler = require("./middleWare/errorMiddleware");

// Event-driven realtime system
const { wsManager, sseManager, changeStreamManager } = require("./events");

const app = express();

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...DEFAULT_ALLOWED_ORIGINS, ...envAllowedOrigins]),
);

app.use(compression());

// Flutterwave webhook must use raw JSON body for signature verification
const { handleFlutterwaveWebhook } = require('./controllers/paymentController');
app.post(
  '/api/payments/webhook/flutterwave',
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  handleFlutterwaveWebhook
);

// Security headers (NDPR / OWASP)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/realtime", sseManager.createRouter());

// Handle 404s for API routes with JSON

const authRoute = require("./routes/authRoute");
const schoolRoute = require("./routes/schoolRoute");
const studentRoute = require("./routes/studentRoute");
const teacherRoute = require("./routes/teacherRoute");
const parentRoute = require("./routes/parentRoute");
const classRoute = require("./routes/classRoute");
const subjectRoute = require("./routes/subjectRoute");
const attendanceRoute = require("./routes/attendanceRoute");
const examRoute = require("./routes/examRoute");
const resultRoute = require("./routes/resultRoute");
const feeRoute = require("./routes/feeRoute");
const aiRoute = require("./routes/aiRoute");
const syncRoute = require("./routes/syncRoute");
const libraryRoute = require("./routes/libraryRoute");
const calendarRoute = require("./routes/calendarRoute");
const announcementRoute = require("./routes/announcementRoute");
const analyticsRoute = require("./routes/analyticsRoute");
const lessonPlanRoute = require("./routes/lessonPlanRoute");
const timetableRoute = require("./routes/timetableRoute");
const behaviorRoute = require("./routes/behaviorRoute");
const blogRoute = require("./routes/blogRoute");
const adminRoute = require("./routes/adminRoute");
const paymentRoute = require("./routes/paymentRoute");

app.use("/api/auth", authRoute);
app.use("/api/school", schoolRoute);
app.use("/api/students", studentRoute);
app.use("/api/teachers", teacherRoute);
app.use("/api/parents", parentRoute);
app.use("/api/classes", classRoute);
app.use("/api/subjects", subjectRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/exams", examRoute);
app.use("/api/results", resultRoute);
app.use("/api/fees", feeRoute);
app.use("/api/ai", aiRoute);
app.use("/api/sync", syncRoute);
app.use("/api/library", libraryRoute);
app.use("/api/calendar", calendarRoute);
app.use("/api/announcements", announcementRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/lesson-plans", lessonPlanRoute);
app.use("/api/timetable", timetableRoute);
app.use("/api/behavior", behaviorRoute);
app.use("/api/blog", blogRoute);
app.use("/api/admin", adminRoute);
app.use("/api/payments", paymentRoute);

app.use('/api', (req, res, next) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Global JSON error handler for API routes
app.use((err, req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
      message: err.message || 'An error occurred',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } else {
    next(err);
  }
});

// Error Middleware
if (errorHandler) {
  app.use(errorHandler);
}

module.exports = app;
