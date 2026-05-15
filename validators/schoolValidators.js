const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};

const studentCreateRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('parentPhone').optional().isMobilePhone('any').withMessage('Invalid parent phone number'),
  body('parentEmail').optional().isEmail().withMessage('Invalid parent email'),
];

const bulkImportRules = [
  body('students').isArray({ min: 1 }).withMessage('students must be a non-empty array'),
  body('students.*.firstName').trim().notEmpty().withMessage('Each student requires a first name'),
  body('students.*.lastName').trim().notEmpty().withMessage('Each student requires a last name'),
  body('students.*.classId').isMongoId().withMessage('Each student requires a valid class ID'),
];

const examCreateRules = [
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('class').isMongoId().withMessage('Valid class ID is required'),
  body('term').notEmpty().withMessage('Term is required'),
  body('type').isIn(['ca', 'mid_term', 'terminal', 'mock']).withMessage('Invalid exam type'),
  body('totalMarks').isInt({ min: 1, max: 200 }).withMessage('Total marks must be between 1 and 200'),
  body('duration').optional().isInt({ min: 10, max: 300 }).withMessage('Duration must be between 10 and 300 minutes'),
];

const feeScheduleRules = [
  body('title').trim().notEmpty().withMessage('Fee title is required'),
  body('session').trim().notEmpty().withMessage('Academic session is required'),
  body('term').notEmpty().withMessage('Term is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one fee item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Each fee item requires a name'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Each fee item requires a valid amount'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
];

const scoreEntryRules = [
  body('scores').isArray({ min: 1 }).withMessage('scores must be a non-empty array'),
  body('scores.*.studentId').isMongoId().withMessage('Each score entry requires a valid student ID'),
  body('scores.*.caScore').optional().isFloat({ min: 0, max: 100 }).withMessage('CA score must be between 0 and 100'),
  body('scores.*.examScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Exam score must be between 0 and 100'),
];

const schoolUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('School name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid school email'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
];

const inviteUserRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn([
    'principal', 'vp_academics', 'vp_admin', 'class_teacher',
    'subject_teacher', 'bursar', 'librarian', 'admin_staff', 'parent', 'student'
  ]).withMessage('Invalid role'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerSchoolRules = [
  body('schoolName').trim().notEmpty().withMessage('School name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
];

const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
];

module.exports = {
  validate,
  studentCreateRules,
  bulkImportRules,
  examCreateRules,
  feeScheduleRules,
  scoreEntryRules,
  schoolUpdateRules,
  inviteUserRules,
  loginRules,
  registerSchoolRules,
  mongoIdParam,
};
