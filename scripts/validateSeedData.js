require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const Class = require('../models/classModel');
const Subject = require('../models/subjectModel');
const AcademicCalendar = require('../models/academicCalendarModel');
const Attendance = require('../models/attendanceModel');
const Exam = require('../models/examModel');
const Result = require('../models/resultModel');
const Fee = require('../models/feeModel');
const LibraryBook = require('../models/libraryBookModel');
const Timetable = require('../models/timetableModel');
const Question = require('../models/questionModel');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`),
};

// Validation thresholds
const THRESHOLDS = {
  MIN_SCHOOLS: 1,
  MIN_USERS_PER_SCHOOL: 50,
  MIN_CLASSES: 6,
  MIN_STUDENTS_PER_CLASS: 20,
  MIN_SUBJECTS: 15,
  MIN_EXAMS: 30,
  MIN_QUESTIONS: 5,
  MIN_RESULTS: 10,
  MIN_ATTENDANCE: 10,
  MIN_FEES: 6,
  MIN_LIBRARY_BOOKS: 10,
};

const validateSeedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    log.info('Connected to MongoDB');

    let passedTests = 0;
    let failedTests = 0;
    let warningCount = 0;

    // ==================== SCHOOL VALIDATION ====================
    log.header('📚 SCHOOL VALIDATION');
    
    const schoolCount = await School.countDocuments();
    if (schoolCount >= THRESHOLDS.MIN_SCHOOLS) {
      log.success(`Schools created: ${schoolCount} (minimum: ${THRESHOLDS.MIN_SCHOOLS})`);
      passedTests++;
    } else {
      log.error(`Schools created: ${schoolCount} (minimum: ${THRESHOLDS.MIN_SCHOOLS})`);
      failedTests++;
    }

    const schools = await School.find();
    for (const school of schools) {
      const schoolOwner = await User.findOne({ schoolId: school._id, role: 'school_owner' });
      if (schoolOwner && schoolOwner.email) {
        log.success(`School: "${school.name}" - Owner: ${schoolOwner.email}`);
        passedTests++;
      } else {
        log.warning(`School: "${school.name}" - No owner assigned`);
        warningCount++;
      }

      if (school.subscription && school.subscription.status === 'active') {
        log.success(`  Subscription: ${school.subscription.plan} (${school.subscription.status})`);
        passedTests++;
      } else {
        log.warning(`  Subscription not properly configured`);
        warningCount++;
      }
    }

    // ==================== USER VALIDATION ====================
    log.header('👥 USER VALIDATION');

    const totalUsers = await User.countDocuments();
    log.success(`Total users created: ${totalUsers}`);
    passedTests++;

    const usersByRole = {};
    const roles = ['school_owner', 'principal', 'vp_academics', 'vp_admin', 'bursar', 'subject_teacher', 'class_teacher', 'student', 'parent', 'admin_staff', 'super_admin'];
    
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      if (count > 0) {
        log.success(`${role}: ${count} users`);
        usersByRole[role] = count;
        passedTests++;
      }
    }

    // Validate users per school
    for (const school of schools) {
      const schoolUsers = await User.countDocuments({ schoolId: school._id });
      if (schoolUsers >= THRESHOLDS.MIN_USERS_PER_SCHOOL) {
        log.success(`${school.name}: ${schoolUsers} users (minimum: ${THRESHOLDS.MIN_USERS_PER_SCHOOL})`);
        passedTests++;
      } else {
        log.error(`${school.name}: ${schoolUsers} users (minimum: ${THRESHOLDS.MIN_USERS_PER_SCHOOL})`);
        failedTests++;
      }
    }

    // ==================== CLASS VALIDATION ====================
    log.header('🏫 CLASS VALIDATION');

    const classCount = await Class.countDocuments();
    log.success(`Total classes created: ${classCount}`);
    passedTests++;

    const classByLevel = {};
    const levels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
    for (const level of levels) {
      const count = await Class.countDocuments({ level });
      if (count > 0) {
        log.success(`${level}: ${count} classes`);
        classByLevel[level] = count;
        passedTests++;
      }
    }

    // Validate students per class
    const classes = await Class.find();
    let studentsValidated = 0;
    for (const classDoc of classes) {
      if (classDoc.students && classDoc.students.length >= THRESHOLDS.MIN_STUDENTS_PER_CLASS) {
        studentsValidated++;
      } else {
        log.warning(`${classDoc.name}-${classDoc.arm}: Only ${classDoc.students?.length || 0} students`);
        warningCount++;
      }
    }
    log.success(`Classes with sufficient students: ${studentsValidated}/${classes.length}`);
    passedTests++;

    // ==================== SUBJECT VALIDATION ====================
    log.header('📖 SUBJECT VALIDATION');

    const subjectCount = await Subject.countDocuments();
    if (subjectCount >= THRESHOLDS.MIN_SUBJECTS) {
      log.success(`Subjects created: ${subjectCount} (minimum: ${THRESHOLDS.MIN_SUBJECTS})`);
      passedTests++;
    } else {
      log.error(`Subjects created: ${subjectCount} (minimum: ${THRESHOLDS.MIN_SUBJECTS})`);
      failedTests++;
    }

    const subjectsByCategory = {};
    const categories = ['core', 'science', 'arts', 'commercial', 'vocational', 'elective'];
    for (const category of categories) {
      const count = await Subject.countDocuments({ category });
      if (count > 0) {
        log.success(`${category}: ${count} subjects`);
        subjectsByCategory[category] = count;
        passedTests++;
      }
    }

    // Validate teachers assigned to subjects
    const subjects = await Subject.find();
    let subjectsWithTeachers = 0;
    for (const subject of subjects) {
      if (subject.teachers && subject.teachers.length > 0) {
        subjectsWithTeachers++;
      } else {
        log.warning(`${subject.name}: No teacher assigned`);
        warningCount++;
      }
    }
    log.success(`Subjects with teachers assigned: ${subjectsWithTeachers}/${subjects.length}`);
    passedTests++;

    // ==================== TIMETABLE VALIDATION ====================
    log.header('⏰ TIMETABLE VALIDATION');

    const timetableCount = await Timetable.countDocuments();
    log.success(`Timetables created: ${timetableCount}`);
    passedTests++;

    const publishedTimetables = await Timetable.countDocuments({ status: 'published' });
    log.success(`Published timetables: ${publishedTimetables}`);
    passedTests++;

    const timetables = await Timetable.find();
    let timetablesValid = 0;
    for (const timetable of timetables) {
      if (timetable.slots && timetable.slots.length >= 6) {
        timetablesValid++;
      } else {
        log.warning(`Timetable for class: Only ${timetable.slots?.length || 0} slots`);
        warningCount++;
      }
    }
    log.success(`Valid timetables with sufficient slots: ${timetablesValid}/${timetables.length}`);
    passedTests++;

    // ==================== QUESTION VALIDATION ====================
    log.header('❓ QUESTION VALIDATION');

    const questionCount = await Question.countDocuments();
    if (questionCount >= THRESHOLDS.MIN_QUESTIONS) {
      log.success(`Questions created: ${questionCount} (minimum: ${THRESHOLDS.MIN_QUESTIONS})`);
      passedTests++;
    } else {
      log.error(`Questions created: ${questionCount} (minimum: ${THRESHOLDS.MIN_QUESTIONS})`);
      failedTests++;
    }

    const questionsByType = {};
    const types = ['mcq', 'theory', 'essay', 'true_false', 'fill_blank'];
    for (const type of types) {
      const count = await Question.countDocuments({ type });
      if (count > 0) {
        log.success(`${type}: ${count} questions`);
        questionsByType[type] = count;
        passedTests++;
      }
    }

    const questionsByDifficulty = {};
    const difficulties = ['easy', 'medium', 'hard'];
    for (const difficulty of difficulties) {
      const count = await Question.countDocuments({ difficulty });
      if (count > 0) {
        log.success(`${difficulty}: ${count} questions`);
        questionsByDifficulty[difficulty] = count;
        passedTests++;
      }
    }

    // ==================== EXAM VALIDATION ====================
    log.header('📝 EXAM VALIDATION');

    const examCount = await Exam.countDocuments();
    if (examCount >= THRESHOLDS.MIN_EXAMS) {
      log.success(`Exams created: ${examCount} (minimum: ${THRESHOLDS.MIN_EXAMS})`);
      passedTests++;
    } else {
      log.error(`Exams created: ${examCount} (minimum: ${THRESHOLDS.MIN_EXAMS})`);
      failedTests++;
    }

    const publishedExams = await Exam.countDocuments({ status: 'published' });
    log.success(`Published exams: ${publishedExams}`);
    passedTests++;

    const examsByType = {};
    const examTypes = ['ca', 'exam'];
    for (const examType of examTypes) {
      const count = await Exam.countDocuments({ type: examType });
      if (count > 0) {
        log.success(`${examType}: ${count} exams`);
        examsByType[examType] = count;
        passedTests++;
      }
    }

    // ==================== ATTENDANCE VALIDATION ====================
    log.header('✅ ATTENDANCE VALIDATION');

    const attendanceCount = await Attendance.countDocuments();
    if (attendanceCount >= THRESHOLDS.MIN_ATTENDANCE) {
      log.success(`Attendance records created: ${attendanceCount} (minimum: ${THRESHOLDS.MIN_ATTENDANCE})`);
      passedTests++;
    } else {
      log.error(`Attendance records created: ${attendanceCount} (minimum: ${THRESHOLDS.MIN_ATTENDANCE})`);
      failedTests++;
    }

    const attendances = await Attendance.find().limit(5);
    for (const attendance of attendances) {
      const recordsCount = attendance.records ? attendance.records.length : 0;
      log.success(`Attendance for ${attendance.date.toDateString()}: ${recordsCount} records`);
      passedTests++;
    }

    // ==================== RESULT VALIDATION ====================
    log.header('🏆 RESULT VALIDATION');

    const resultCount = await Result.countDocuments();
    if (resultCount >= THRESHOLDS.MIN_RESULTS) {
      log.success(`Results created: ${resultCount} (minimum: ${THRESHOLDS.MIN_RESULTS})`);
      passedTests++;
    } else {
      log.error(`Results created: ${resultCount} (minimum: ${THRESHOLDS.MIN_RESULTS})`);
      failedTests++;
    }

    const resultStatuses = {};
    const statuses = ['draft', 'approved', 'released'];
    for (const status of statuses) {
      const count = await Result.countDocuments({ status });
      if (count > 0) {
        log.success(`${status}: ${count} results`);
        resultStatuses[status] = count;
        passedTests++;
      }
    }

    // Validate result calculations
    const results = await Result.find().limit(5);
    for (const result of results) {
      if (result.overallPercentage > 0 && result.overallPercentage <= 100) {
        log.success(`Result percentage valid: ${result.overallPercentage}%`);
        passedTests++;
      } else {
        log.warning(`Result percentage invalid: ${result.overallPercentage}%`);
        warningCount++;
      }
    }

    // ==================== FEE VALIDATION ====================
    log.header('💰 FEE VALIDATION');

    const feeCount = await Fee.countDocuments();
    if (feeCount >= THRESHOLDS.MIN_FEES) {
      log.success(`Fee structures created: ${feeCount} (minimum: ${THRESHOLDS.MIN_FEES})`);
      passedTests++;
    } else {
      log.error(`Fee structures created: ${feeCount} (minimum: ${THRESHOLDS.MIN_FEES})`);
      failedTests++;
    }

    const fees = await Fee.find().limit(3);
    for (const fee of fees) {
      if (fee.items && fee.items.length > 0) {
        log.success(`Fee "${fee.title}": ${fee.items.length} items, Total: ₦${fee.totalAmount}`);
        passedTests++;
      }
    }

    // ==================== LIBRARY VALIDATION ====================
    log.header('📚 LIBRARY VALIDATION');

    const bookCount = await LibraryBook.countDocuments();
    if (bookCount >= THRESHOLDS.MIN_LIBRARY_BOOKS) {
      log.success(`Library books created: ${bookCount} (minimum: ${THRESHOLDS.MIN_LIBRARY_BOOKS})`);
      passedTests++;
    } else {
      log.error(`Library books created: ${bookCount} (minimum: ${THRESHOLDS.MIN_LIBRARY_BOOKS})`);
      failedTests++;
    }

    const books = await LibraryBook.find().limit(5);
    let totalQuantity = 0;
    let totalAvailable = 0;
    for (const book of books) {
      totalQuantity += book.quantity || 0;
      totalAvailable += book.available || 0;
      log.success(`Book: "${book.title}" - Quantity: ${book.quantity}, Available: ${book.available}`);
      passedTests++;
    }
    log.success(`Sample average quantity: ${(totalQuantity / books.length).toFixed(1)} per book`);
    passedTests++;

    // ==================== ACADEMIC CALENDAR VALIDATION ====================
    log.header('📅 ACADEMIC CALENDAR VALIDATION');

    const calendarCount = await AcademicCalendar.countDocuments();
    if (calendarCount > 0) {
      log.success(`Academic calendars created: ${calendarCount}`);
      passedTests++;
    } else {
      log.error(`No academic calendars created`);
      failedTests++;
    }

    const calendars = await AcademicCalendar.find();
    for (const calendar of calendars) {
      if (calendar.terms && calendar.terms.length === 3) {
        log.success(`Calendar for ${calendar.session}: ${calendar.terms.length} terms`);
        passedTests++;
      } else {
        log.warning(`Calendar missing terms`);
        warningCount++;
      }
    }

    // ==================== SUMMARY REPORT ====================
    log.header('📊 VALIDATION SUMMARY REPORT');

    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${warningCount}${colors.reset}\n`);

    // Data overview
    log.header('📈 DATA OVERVIEW');
    console.log(`Schools:             ${schoolCount}`);
    console.log(`Total Users:         ${totalUsers}`);
    console.log(`  - Students:        ${usersByRole['student'] || 0}`);
    console.log(`  - Teachers:        ${(usersByRole['subject_teacher'] || 0) + (usersByRole['class_teacher'] || 0)}`);
    console.log(`  - Admin Staff:     ${(usersByRole['principal'] || 0) + (usersByRole['vp_academics'] || 0) + (usersByRole['vp_admin'] || 0) + (usersByRole['bursar'] || 0)}`);
    console.log(`\nClasses:             ${classCount}`);
    console.log(`Subjects:            ${subjectCount}`);
    console.log(`Timetables:          ${timetableCount}`);
    console.log(`Questions:           ${questionCount}`);
    console.log(`Exams:               ${examCount}`);
    console.log(`Results:             ${resultCount}`);
    console.log(`Attendance Records:  ${attendanceCount}`);
    console.log(`Fee Structures:      ${feeCount}`);
    console.log(`Library Books:       ${bookCount}`);
    console.log(`Academic Calendars:  ${calendarCount}`);

    // Final status
    log.header('✅ VALIDATION COMPLETE');
    if (failedTests === 0) {
      log.success('All critical validations passed!');
      if (warningCount > 0) {
        log.warning(`${warningCount} non-critical warnings found`);
      }
    } else {
      log.error(`${failedTests} validations failed. Please review the data.`);
    }

    await mongoose.disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Validation error: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run validation
validateSeedData();
