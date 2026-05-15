require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
const Announcement = require('../models/announcementModel');
const BehaviorLog = require('../models/behaviorLogModel');

// ==================== SEED DATA DEFINITIONS ====================

const SCHOOLS_DATA = [
  {
    name: 'Lagos Internation School',
    email: 'info@lagosinternation.ng',
    address: '12 Mainland Way, Lagos',
    phone: '08011112222',
    state: 'Lagos',
    type: 'secondary',
    owner: { firstName: 'Admin', lastName: 'User', email: 'adminuser@gmail.com', password: 'AdminUser@2024' },
  },
  {
    name: 'Pinnacle Academy Lagos',
    email: 'info@pinnacle.ng',
    address: '45 Lekki Road, Lekki, Lagos',
    phone: '08012345001',
    state: 'Lagos',
    type: 'secondary',
    owner: { firstName: 'Tunde', lastName: 'Awotona', email: 'tunde@pinnacle.ng', password: 'Pinnacle@2024' },
  },
  {
    name: 'Excellence International School',
    email: 'admin@excellence.edu.ng',
    address: '123 Ring Road, Ibadan, Oyo',
    phone: '08023456001',
    state: 'Oyo',
    type: 'secondary',
    owner: { firstName: 'Chioma', lastName: 'Okafor', email: 'chioma@excellence.edu.ng', password: 'Excellence@2024' },
  },
  {
    name: 'Future Leaders Academy Abuja',
    email: 'contact@futureleaders.ng',
    address: '78 Ahmadu Bello Way, Abuja',
    phone: '08034567001',
    state: 'FCT',
    type: 'secondary',
    owner: { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed@futureleaders.ng', password: 'FutureLead@2024' },
  },
];

const SUBJECTS = [
  // Core Subjects
  { name: 'English Language', code: 'ENG', category: 'core' },
  { name: 'Mathematics', code: 'MTH', category: 'core' },
  { name: 'Social Studies', code: 'SST', category: 'core' },
  // Science
  { name: 'Basic Science', code: 'BSC', category: 'science' },
  { name: 'Physics', code: 'PHY', category: 'science' },
  { name: 'Chemistry', code: 'CHM', category: 'science' },
  { name: 'Biology', code: 'BIO', category: 'science' },
  // Arts
  { name: 'Literature in English', code: 'LIT', category: 'arts' },
  { name: 'Geography', code: 'GEO', category: 'arts' },
  { name: 'Government', code: 'GOV', category: 'arts' },
  { name: 'History', code: 'HIS', category: 'arts' },
  // Commercial
  { name: 'Economics', code: 'ECO', category: 'commercial' },
  { name: 'Commerce', code: 'COM', category: 'commercial' },
  { name: 'Financial Accounting', code: 'ACC', category: 'commercial' },
  // Vocational
  { name: 'Agricultural Science', code: 'AGR', category: 'vocational' },
  { name: 'Computer Studies', code: 'CMP', category: 'vocational' },
  { name: 'Technical Drawing', code: 'TCD', category: 'vocational' },
  // Electives
  { name: 'Further Mathematics', code: 'FMT', category: 'science' },
  { name: 'Civic Education', code: 'CED', category: 'core' },
  { name: 'Islamic Studies', code: 'ISL', category: 'core' },
  { name: 'Christian Religious Studies', code: 'CRS', category: 'core' },
  { name: 'Physical Education', code: 'PED', category: 'core' },
];

const CLASSES_STRUCTURE = [
  { name: 'JSS1', arm: 'A', level: 'JSS1' },
  { name: 'JSS1', arm: 'B', level: 'JSS1' },
  { name: 'JSS2', arm: 'A', level: 'JSS2' },
  { name: 'JSS2', arm: 'B', level: 'JSS2' },
  { name: 'JSS3', arm: 'A', level: 'JSS3' },
  { name: 'JSS3', arm: 'B', level: 'JSS3' },
  { name: 'SS1', arm: 'A', level: 'SS1' },
  { name: 'SS1', arm: 'B', level: 'SS1' },
  { name: 'SS2', arm: 'A', level: 'SS2' },
  { name: 'SS2', arm: 'B', level: 'SS2' },
  { name: 'SS3', arm: 'A', level: 'SS3' },
  { name: 'SS3', arm: 'B', level: 'SS3' },
];

const STAFF_NAMES = [
  ['Emeka', 'Eze'], ['Ngozi', 'Adeyemi'], ['Bello', 'Ibrahim'], ['Amaka', 'Obi'],
  ['Tunde', 'Akinola'], ['Chioma', 'Nwosu'], ['Femi', 'Adeleke'], ['Kemi', 'Oladipo'],
  ['Seun', 'Babatunde'], ['Uche', 'Okeke'], ['Biodun', 'Afolabi'], ['Sola', 'Fashola'],
  ['Zainab', 'Musa'], ['Ifeanyi', 'Okafor'], ['Halima', 'Suleiman'], ['Jamal', 'Muhammad'],
  ['Yetunde', 'Adebayo'], ['Obinna', 'Ezuka'], ['Folake', 'Oluwaseun'], ['Kunle', 'Oladele'],
  ['Priya', 'Sharma'], ['David', 'Okonkwo'], ['Stella', 'Iheanacho'], ['Victor', 'Osei'],
];

const STUDENT_FIRST_NAMES = [
  'Chidi', 'Amara', 'Seun', 'Taiwo', 'Kehinde', 'Emeka', 'Ngozi', 'Temi', 'Bola', 'Uche',
  'Fatima', 'Aisha', 'Musa', 'Hassan', 'Zainab', 'Sola', 'Femi', 'Kemi', 'Tunde', 'Yemi',
  'Adanna', 'Bukari', 'Chidinma', 'Omolola', 'Gbemi', 'Tolani', 'Adebayo', 'Kunle', 'Samuel', 'Ayo',
];

const STUDENT_LAST_NAMES = [
  'Obi', 'Adeyemi', 'Ibrahim', 'Eze', 'Akinola', 'Nwosu', 'Adeleke', 'Oladipo',
  'Babatunde', 'Okeke', 'Afolabi', 'Fashola', 'Musa', 'Okafor', 'Suleiman', 'Adebowale',
  'Iheanacho', 'Okafor', 'Okenwa', 'Eze', 'Okoro', 'Nwankwo', 'Amara', 'Agwu',
];

const LIBRARY_BOOKS = [
  // English Literature
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '978-0385474542', category: 'Literature', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', category: 'Literature', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'Wuthering Heights', author: 'Emily Brontë', isbn: '978-0199232383', category: 'Literature', classLevels: ['SS2', 'SS3'] },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0141439518', category: 'Literature', classLevels: ['SS2', 'SS3'] },
  { title: 'One Man, One Matchet', author: 'Tunde Fatunde', isbn: '978-1234567890', category: 'Literature', classLevels: ['JSS3', 'SS1'] },
  // Mathematics
  { title: 'Senior School Mathematics Vol. 1', author: 'S.A Oluwasanmi', isbn: '978-0123456789', category: 'Mathematics', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'Senior School Mathematics Vol. 2', author: 'S.A Oluwasanmi', isbn: '978-0987654321', category: 'Mathematics', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'Further Mathematics Textbook', author: 'K. Adeniji', isbn: '978-1122334455', category: 'Mathematics', classLevels: ['SS2', 'SS3'] },
  // Science
  { title: 'Senior School Physics Vol. 1', author: 'Anyakoha', isbn: '978-2233445566', category: 'Science', classLevels: ['SS1', 'SS2'] },
  { title: 'Senior School Chemistry Vol. 1', author: 'Ababio', isbn: '978-3344556677', category: 'Science', classLevels: ['SS1', 'SS2'] },
  { title: 'Senior School Biology Vol. 1', author: 'Madu', isbn: '978-4455667788', category: 'Science', classLevels: ['SS1', 'SS2'] },
  // Social Studies
  { title: 'Government for Senior Secondary Schools', author: 'Appadorai', isbn: '978-5566778899', category: 'Social Studies', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'Economics Textbook', author: 'Samuelson', isbn: '978-6677889900', category: 'Social Studies', classLevels: ['SS2', 'SS3'] },
  { title: 'Geography Workbook', author: 'Eze', isbn: '978-7788990011', category: 'Social Studies', classLevels: ['SS1', 'SS2'] },
  // Reference Books
  { title: 'The Oxford English Dictionary', author: 'Oxford University', isbn: '978-8899001122', category: 'Reference', classLevels: ['SS1', 'SS2', 'SS3'] },
  { title: 'Collins Dictionary', author: 'Collins', isbn: '978-9900112233', category: 'Reference', classLevels: ['JSS1', 'JSS2', 'JSS3'] },
  { title: 'Mathematical Handbook', author: 'Backhouse', isbn: '978-0011223344', category: 'Reference', classLevels: ['SS1', 'SS2', 'SS3'] },
];

const QUESTIONS_DATA = [
  // Mathematics questions
  { topic: 'Algebra', type: 'mcq', difficulty: 'easy', examPattern: 'ca', marks: 1, question: 'Solve for x: 2x + 5 = 13', options: ['2', '3', '4', '5'], answer: 1 },
  { topic: 'Geometry', type: 'mcq', difficulty: 'medium', examPattern: 'ca', marks: 1, question: 'What is the sum of angles in a triangle?', options: ['90°', '180°', '270°', '360°'], answer: 1 },
  { topic: 'Calculus', type: 'theory', difficulty: 'hard', examPattern: 'internal', marks: 5, question: 'Differentiate f(x) = 3x² + 2x with respect to x' },
  // English questions
  { topic: 'Grammar', type: 'mcq', difficulty: 'easy', examPattern: 'ca', marks: 1, question: 'Choose the correctly spelled word', options: ['recieve', 'receive', 'receieve', 'recieve'], answer: 1 },
  { topic: 'Comprehension', type: 'theory', difficulty: 'medium', examPattern: 'internal', marks: 3, question: 'Explain the theme of the novel "Things Fall Apart"' },
  // Science questions
  { topic: 'Chemical Reactions', type: 'mcq', difficulty: 'medium', examPattern: 'ca', marks: 1, question: 'Which of these is a chemical reaction?', options: ['Melting ice', 'Burning wood', 'Dissolving salt', 'Both B and C'], answer: 1 },
  { topic: 'Forces', type: 'fill_blank', difficulty: 'easy', examPattern: 'ca', marks: 1, question: 'Force is measured in ___________', answer: 'Newtons' },
];

// ==================== UTILITY FUNCTIONS ====================

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ==================== MAIN SEED FUNCTION ====================

const seedComprehensiveData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data (optional - uncomment to start fresh)
    // await Promise.all([
    //   User.deleteMany({}),
    //   School.deleteMany({}),
    //   Class.deleteMany({}),
    //   Subject.deleteMany({}),
    //   AcademicCalendar.deleteMany({}),
    //   Attendance.deleteMany({}),
    //   Exam.deleteMany({}),
    //   Result.deleteMany({}),
    //   Fee.deleteMany({}),
    //   LibraryBook.deleteMany({}),
    //   Timetable.deleteMany({}),
    //   Question.deleteMany({}),
    // ]);
    // console.log('✓ Cleared existing data');

    const hashedPassword = await bcrypt.hash('Demo@1234', 10);
    const schools = [];

    // ==================== CREATE SCHOOLS & USERS ====================
    console.log('\n📚 Creating Schools and Staff...');
    for (const schoolData of SCHOOLS_DATA) {
      let school = await School.findOne({ email: schoolData.email }) || await School.findOne({ name: schoolData.name });
      if (school) {
        console.log(`  ⚠ School "${schoolData.name}" already exists. Reusing existing record...`);
        let updated = false;
        if (!school.email) { school.email = schoolData.email; updated = true; }
        if (!school.address) { school.address = schoolData.address; updated = true; }
        if (!school.phone) { school.phone = schoolData.phone; updated = true; }
        if (!school.state) { school.state = schoolData.state; updated = true; }
        if (!school.type) { school.type = schoolData.type; updated = true; }
        if (updated) {
          await school.save();
          console.log(`    ✓ Updated metadata for existing school: ${school.name}`);
        }
      } else {
        // Create school
        school = await School.create({
          name: schoolData.name,
          email: schoolData.email,
          address: schoolData.address,
          phone: schoolData.phone,
          state: schoolData.state,
          type: schoolData.type,
          subscription: {
            status: 'active',
            plan: 'premium',
            aiTokenBudget: 500000,
            usedAiTokens: randomInt(10000, 100000),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          settings: {
            academicSession: '2024/2025',
            currentTerm: 'first',
          },
        });
        console.log(`  ✓ Created school: ${school.name} (${school._id})`);
      }

      // Create or reconcile school owner
      const ownerData = schoolData.owner;
      let owner = null;
      if (school.owner) {
        owner = await User.findById(school.owner);
      }
      if (!owner) {
        owner = await User.findOne({ email: ownerData.email, schoolId: school._id });
      }
      if (owner && owner.role !== 'school_owner') {
        owner.role = 'school_owner';
        owner.schoolId = school._id;
        await owner.save();
        console.log(`    ✓ Updated existing user to school owner: ${owner.email}`);
      }
      if (owner) {
        if (!owner.password || !owner.password.startsWith('$2') || !(await bcrypt.compare('Demo@1234', owner.password))) {
          owner.password = 'Demo@1234';
          await owner.save();
          console.log(`    ✓ Reset existing owner password for: ${owner.email}`);
        }
      }
      if (!owner) {
        owner = await User.create({
          name: `${ownerData.firstName} ${ownerData.lastName}`,
          email: ownerData.email,
          password: hashedPassword,
          role: 'school_owner',
          schoolId: school._id,
          phone: `080${randomInt(10000000, 99999999)}`,
          isActive: true,
        });
        console.log(`    ✓ Created owner: ${owner.email}`);
      } else {
        console.log(`    ✓ Found existing owner: ${owner.email}`);
      }
      if (!school.owner || !school.owner.equals(owner._id)) {
        school.owner = owner._id;
      }
      if (!school.subscription || school.subscription.status !== 'active') {
        school.subscription = {
          status: 'active',
          plan: 'premium',
          aiTokenBudget: 500000,
          usedAiTokens: randomInt(10000, 100000),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
      }
      if (!school.settings || !school.settings.academicSession) {
        school.settings = school.settings || {};
        school.settings.academicSession = '2024/2025';
        school.settings.currentTerm = 'first';
      }
      await school.save();

      const adminRoles = ['principal', 'vp_academics', 'vp_admin'];
      const existingAdminStaffCount = await User.countDocuments({ schoolId: school._id, role: { $in: [...adminRoles, 'bursar'] } });
      let adminStaff = [];
      if (existingAdminStaffCount === 0) {
        const adminCount = randomInt(2, adminRoles.length);
        adminStaff = [];
        for (let i = 0; i < adminCount; i++) {
          const [firstName, lastName] = STAFF_NAMES[i];
          const admin = await User.create({
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${school.name.split(' ')[0].toLowerCase()}.ng`,
            password: hashedPassword,
            role: adminRoles[i],
            schoolId: school._id,
            phone: `080${randomInt(10000000, 99999999)}`,
            isActive: true,
          });
          adminStaff.push(admin);
          console.log(`    ✓ Created ${adminRoles[i]}: ${admin.email}`);
        }

        const [bursarFirst, bursarLast] = STAFF_NAMES[adminCount];
        const bursar = await User.create({
          name: `${bursarFirst} ${bursarLast}`,
          email: `${bursarFirst.toLowerCase()}.${bursarLast.toLowerCase()}@${school.name.split(' ')[0].toLowerCase()}.ng`,
          password: hashedPassword,
          role: 'bursar',
          schoolId: school._id,
          phone: `080${randomInt(10000000, 99999999)}`,
          isActive: true,
        });
        adminStaff.push(bursar);
        console.log(`    ✓ Created bursar: ${bursar.email}`);
      } else {
        adminStaff = await User.find({ schoolId: school._id, role: { $in: [...adminRoles, 'bursar'] } });
        console.log(`    ✓ Found ${adminStaff.length} existing admin staff members`);
      }

      // ==================== CREATE SUBJECTS ====================
      let subjects = await Subject.find({ school: school._id });
      if (subjects.length === 0) {
        console.log(`  📖 Creating Subjects for ${school.name}...`);
        subjects = await Subject.insertMany(
          SUBJECTS.map(s => ({ ...s, school: school._id }))
        );
        console.log(`    ✓ Created ${subjects.length} subjects`);
      } else {
        console.log(`  📖 Found ${subjects.length} existing subjects for ${school.name}`);
      }

      // ==================== CREATE TEACHERS ====================
      let teachers = await User.find({ schoolId: school._id, role: 'subject_teacher' });
      if (teachers.length === 0) {
        console.log(`  👨‍🏫 Creating Teachers...`);
        teachers = [];
        for (let i = 0; i < STAFF_NAMES.length; i++) {
          const [firstName, lastName] = STAFF_NAMES[i];
          const teacher = await User.create({
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${school.name.split(' ')[0].toLowerCase()}.ng`,
            password: hashedPassword,
            role: 'subject_teacher',
            schoolId: school._id,
            phone: `080${randomInt(10000000, 99999999)}`,
            isActive: true,
          });
          teachers.push(teacher);
        }
        console.log(`    ✓ Created ${teachers.length} teachers`);
      } else {
        console.log(`  👨‍🏫 Found ${teachers.length} existing teachers`);
      }

      if (teachers.length && subjects.length) {
        for (let i = 0; i < subjects.length; i++) {
          if (!subjects[i].teachers || subjects[i].teachers.length === 0) {
            const teacher = teachers[i % teachers.length];
            subjects[i].teachers = [teacher._id];
            await subjects[i].save();
          }
        }
      }

      // ==================== CREATE CLASSES ====================
      let classes = await Class.find({ school: school._id }).populate('students');
      const allStudents = [];
      if (classes.length === 0) {
        console.log(`  🏫 Creating Classes and Students...`);
        for (const classData of CLASSES_STRUCTURE) {
          const isJSS = classData.level.startsWith('JSS');
          const classCoreSubjects = isJSS
            ? subjects.filter(s => ['ENG', 'MTH', 'BSC', 'SST', 'CED', 'PED'].includes(s.code))
            : subjects.filter(s => ['ENG', 'MTH', 'PED', 'CRS', 'ISL'].includes(s.code));

          const classDoc = await Class.create({
            school: school._id,
            name: classData.name,
            arm: classData.arm,
            level: classData.level,
            session: '2024/2025',
            classTeacher: teachers[randomInt(0, teachers.length - 1)]._id,
            subjects: classCoreSubjects.map(s => s._id),
          });
          classes.push(classDoc);

          const studentIds = [];
          const studentsPerClass = randomInt(35, 45);
          for (let s = 0; s < studentsPerClass; s++) {
            const firstName = randomItem(STUDENT_FIRST_NAMES);
            const lastName = randomItem(STUDENT_LAST_NAMES);

            const schoolSlug = school.name.split(' ')[0].toLowerCase();
            const student = await User.create({
              name: `${firstName} ${lastName}`,
              email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${s}.${classData.level.toLowerCase()}${classData.arm.toLowerCase()}@student.${schoolSlug}.ng`,
              password: hashedPassword,
              role: 'student',
              schoolId: school._id,
              phone: `080${randomInt(10000000, 99999999)}`,
              isActive: true,
            });
            studentIds.push(student._id);
            allStudents.push({ id: student._id, classId: classDoc._id, name: student.name });
          }
          classDoc.students = studentIds;
          await classDoc.save();
          console.log(`    ✓ Created class ${classData.name}-${classData.arm} with ${studentIds.length} students`);
        }
      } else {
        console.log(`  🏫 Found ${classes.length} existing classes for ${school.name}`);
        for (const classDoc of classes) {
          const existingStudentIds = classDoc.students?.map((s) => s._id) || [];
          const existingStudentCount = existingStudentIds.length;
          if (existingStudentCount < 35) {
            const schoolSlug = school.name.split(' ')[0].toLowerCase();
            const desiredStudents = randomInt(35, 45);
            const studentsToAdd = desiredStudents - existingStudentCount;
            if (studentsToAdd > 0) {
              for (let s = existingStudentCount; s < desiredStudents; s++) {
                const firstName = randomItem(STUDENT_FIRST_NAMES);
                const lastName = randomItem(STUDENT_LAST_NAMES);
                const student = await User.create({
                  name: `${firstName} ${lastName}`,
                  email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${s}.${classDoc.level.toLowerCase()}${classDoc.arm.toLowerCase()}@student.${schoolSlug}.ng`,
                  password: hashedPassword,
                  role: 'student',
                  schoolId: school._id,
                  phone: `080${randomInt(10000000, 99999999)}`,
                  isActive: true,
                });
                existingStudentIds.push(student._id);
                allStudents.push({ id: student._id, classId: classDoc._id, name: student.name });
              }
              classDoc.students = existingStudentIds;
              await classDoc.save();
              console.log(`    ✓ Added ${studentsToAdd} students to ${classDoc.name}-${classDoc.arm}`);
            }
          } else {
            for (const student of classDoc.students) {
              allStudents.push({ id: student._id, classId: classDoc._id, name: student.name });
            }
          }
        }
      }

      // ==================== CREATE ACADEMIC CALENDAR ====================
      const existingCalendar = await AcademicCalendar.countDocuments({ school: school._id });
      if (existingCalendar === 0) {
        console.log(`  📅 Creating Academic Calendar...`);
        await AcademicCalendar.create({
          school: school._id,
          session: '2024/2025',
          terms: [
            {
              term: 'first',
              name: 'First Term 2024/2025',
              startDate: new Date('2024-09-09'),
              endDate: new Date('2024-12-13'),
              events: [
                { title: 'School Resumption', date: new Date('2024-09-09'), type: 'other' },
                { title: 'Mid-Term Break Begins', date: new Date('2024-10-25'), type: 'holiday' },
                { title: 'Mid-Term Break Ends', date: new Date('2024-11-01'), type: 'holiday' },
                { title: 'First Term Exams Begin', date: new Date('2024-12-02'), type: 'exam' },
                { title: 'Christmas Holiday Begins', date: new Date('2024-12-13'), type: 'holiday' },
              ],
            },
            {
              term: 'second',
              name: 'Second Term 2024/2025',
              startDate: new Date('2025-01-13'),
              endDate: new Date('2025-04-04'),
              events: [
                { title: 'School Resumption', date: new Date('2025-01-13'), type: 'other' },
                { title: 'Mid-Term Break Begins', date: new Date('2025-02-21'), type: 'holiday' },
                { title: 'Mid-Term Break Ends', date: new Date('2025-02-28'), type: 'holiday' },
                { title: 'Second Term Exams Begin', date: new Date('2025-03-24'), type: 'exam' },
                { title: 'Easter Holiday Begins', date: new Date('2025-04-04'), type: 'holiday' },
              ],
            },
            {
              term: 'third',
              name: 'Third Term 2024/2025',
              startDate: new Date('2025-04-21'),
              endDate: new Date('2025-07-18'),
              events: [
                { title: 'School Resumption', date: new Date('2025-04-21'), type: 'other' },
                { title: 'Mid-Term Break Begins', date: new Date('2025-06-06'), type: 'holiday' },
                { title: 'Mid-Term Break Ends', date: new Date('2025-06-13'), type: 'holiday' },
                { title: 'Third Term Exams Begin', date: new Date('2025-06-30'), type: 'exam' },
                { title: 'Summer Holiday Begins', date: new Date('2025-07-18'), type: 'holiday' },
              ],
            },
          ],
        });
        console.log(`    ✓ Created academic calendar with 3 terms`);
      } else {
        console.log(`  📅 Academic calendar already exists for ${school.name}`);
      }

      // ==================== CREATE TIMETABLES ====================
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const periods = [
        { period: 1, startTime: '07:30', endTime: '08:30' },
        { period: 2, startTime: '08:30', endTime: '09:30' },
        { period: 3, startTime: '09:30', endTime: '10:30' },
        { period: 4, startTime: '10:45', endTime: '11:45' },
        { period: 5, startTime: '11:45', endTime: '12:45' },
        { period: 6, startTime: '13:00', endTime: '14:00' },
      ];

      const existingTimetables = await Timetable.find({ school: school._id });
      if (existingTimetables.length === 0) {
        console.log(`  ⏰ Creating Timetables...`);
        for (const classDoc of classes) {
          const slots = [];
          let subjectIndex = 0;
          for (const day of days) {
            for (const periodData of periods) {
              if (classDoc.subjects.length === 0) continue;
              const subject = subjects.find(s => s._id.equals(classDoc.subjects[subjectIndex % classDoc.subjects.length]));
              const teacher = teachers[randomInt(0, teachers.length - 1)];
              slots.push({
                day,
                period: periodData.period,
                startTime: periodData.startTime,
                endTime: periodData.endTime,
                subject: subject?._id,
                teacher: teacher._id,
              });
              subjectIndex++;
            }
          }

          await Timetable.create({
            school: school._id,
            class: classDoc._id,
            term: 'first',
            slots,
            status: 'published',
          });
        }
        console.log(`    ✓ Created timetables for all classes`);
      } else {
        console.log(`  ⏰ Updating incomplete timetables for ${school.name}...`);
        const timetablesByClass = existingTimetables.reduce((memo, tt) => {
          memo[tt.class.toString()] = tt;
          return memo;
        }, {});

        for (const classDoc of classes) {
          const scheduleSlots = [];
          let subjectIndex = 0;
          for (const day of days) {
            for (const periodData of periods) {
              if (classDoc.subjects.length === 0) continue;
              const subject = subjects.find(s => s._id.equals(classDoc.subjects[subjectIndex % classDoc.subjects.length]));
              const teacher = teachers[randomInt(0, teachers.length - 1)];
              scheduleSlots.push({
                day,
                period: periodData.period,
                startTime: periodData.startTime,
                endTime: periodData.endTime,
                subject: subject?._id,
                teacher: teacher._id,
              });
              subjectIndex++;
            }
          }

          const existingClassTimetable = timetablesByClass[classDoc._id.toString()];
          if (!existingClassTimetable) {
            await Timetable.create({
              school: school._id,
              class: classDoc._id,
              term: 'first',
              slots: scheduleSlots,
              status: 'published',
            });
            console.log(`    ✓ Created missing timetable for ${classDoc.name}-${classDoc.arm}`);
          } else if (existingClassTimetable.slots.length < periods.length * days.length) {
            existingClassTimetable.slots = scheduleSlots;
            await existingClassTimetable.save();
            console.log(`    ✓ Repaired incomplete timetable for ${classDoc.name}-${classDoc.arm}`);
          }
        }
      }

      // ==================== CREATE QUESTIONS ====================
      const existingQuestions = await Question.countDocuments({ school: school._id });
      let questionsCreated = [];
      if (existingQuestions === 0) {
        console.log(`  ❓ Creating Questions...`);
        for (let i = 0; i < QUESTIONS_DATA.length; i++) {
          const questionData = QUESTIONS_DATA[i];
          const subject = subjects[i % subjects.length];
          const classRef = randomItem(classes);
          const question = await Question.create({
            school: school._id,
            subject: subject._id,
            class: classRef._id,
            ...questionData,
          });
          questionsCreated.push(question);
        }
        console.log(`    ✓ Created ${questionsCreated.length} questions`);
      } else {
        console.log(`  ❓ Questions already exist for ${school.name}`);
        questionsCreated = await Question.find({ school: school._id });
      }

      // ==================== CREATE EXAMS ====================
      const existingExams = await Exam.countDocuments({ school: school._id });
      if (existingExams === 0) {
        console.log(`  📝 Creating Exams...`);
        for (const classDoc of classes) {
          for (const subject of classDoc.subjects) {
            const examQuestions = questionsCreated.filter(q => q.subject.equals(subject)).slice(0, 5);
            await Exam.create({
              school: school._id,
              subject,
              class: classDoc._id,
              term: 'first',
              type: 'exam',
              scheduledDate: randomDate(new Date('2024-12-02'), new Date('2024-12-13')),
              duration: 90,
              totalMarks: 100,
              questions: examQuestions.map(q => q._id),
              status: 'published',
            });
          }
        }
        console.log(`    ✓ Created exams for all class-subject combinations`);
      } else {
        console.log(`  📝 Exams already exist for ${school.name}`);
      }

      // ==================== CREATE ATTENDANCE RECORDS ====================
      const existingAttendance = await Attendance.countDocuments({ school: school._id });
      if (existingAttendance === 0) {
        console.log(`  ✅ Creating Attendance Records...`);
        const attendanceDates = [];
        const start = new Date('2024-09-09');
        const end = new Date('2024-12-13');
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            attendanceDates.push(new Date(d));
          }
        }

        for (const classDoc of classes) {
          for (const attendanceDate of attendanceDates.slice(0, 20)) {
            const records = classDoc.students.map(studentId => ({
              student: studentId,
              status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
            }));

            await Attendance.create({
              school: school._id,
              class: classDoc._id,
              date: attendanceDate,
              term: 'first',
              session: '2024/2025',
              takenBy: teachers[0]._id,
              records,
            });
          }
        }
        console.log(`    ✓ Created attendance records`);
      } else {
        console.log(`  ✅ Attendance records already exist for ${school.name}`);
      }

      // ==================== CREATE RESULTS ====================
      const existingResults = await Result.countDocuments({ school: school._id });
      if (existingResults === 0 && allStudents.length > 0) {
        console.log(`  🏆 Creating Student Results...`);
        for (const student of allStudents.slice(0, 20)) {
          const classDoc = classes.find(c => c._id.equals(student.classId));
          const resultSubjects = [];
          for (const subject of classDoc.subjects) {
            resultSubjects.push({
              subject,
              caScore: randomInt(8, 20),
              examScore: randomInt(30, 80),
              totalScore: 0,
              grade: '',
            });
          }

          let totalPoints = 0;
          for (const subj of resultSubjects) {
            subj.totalScore = subj.caScore + subj.examScore;
            if (subj.totalScore >= 70) subj.grade = 'A';
            else if (subj.totalScore >= 60) subj.grade = 'B';
            else if (subj.totalScore >= 50) subj.grade = 'C';
            else if (subj.totalScore >= 40) subj.grade = 'D';
            else subj.grade = 'F';
            totalPoints += subj.totalScore;
          }

          await Result.create({
            school: school._id,
            student: student.id,
            class: student.classId,
            term: 'first',
            session: '2024/2025',
            subjects: resultSubjects,
            overallPercentage: Math.round((totalPoints / (resultSubjects.length * 100)) * 100),
            positionInClass: randomInt(1, 20),
            principalComment: 'Good performance. Keep up the good work.',
            status: 'approved',
          });
        }
        console.log(`    ✓ Created results for sample students`);
      } else if (existingResults > 0) {
        console.log(`  🏆 Results already exist for ${school.name}`);
      }

      // ==================== CREATE FEES ====================
      const existingFees = await Fee.countDocuments({ school: school._id });
      if (existingFees === 0) {
        console.log(`  💰 Creating Fee Structures...`);
        for (const classDoc of classes) {
          await Fee.create({
            school: school._id,
            title: `First Term 2024/2025 - ${classDoc.name}-${classDoc.arm}`,
            session: '2024/2025',
            term: 'first',
            class: classDoc._id,
            items: [
              { name: 'Tuition Fee', amount: 150000, mandatory: true },
              { name: 'Development Levy', amount: 50000, mandatory: true },
              { name: 'Examination Fee', amount: 25000, mandatory: true },
              { name: 'Sports Fee', amount: 10000, mandatory: false },
              { name: 'ICT Fee', amount: 15000, mandatory: false },
              { name: 'Transport Fee', amount: 30000, mandatory: false },
            ],
            totalAmount: 250000,
            dueDate: new Date('2024-09-30'),
          });
        }
        console.log(`    ✓ Created fee structures for all classes`);
      } else {
        console.log(`  💰 Fee structures already exist for ${school.name}`);
      }

      // ==================== CREATE LIBRARY BOOKS ====================
      const existingLibraryBooks = await LibraryBook.countDocuments({ school: school._id });
      if (existingLibraryBooks === 0) {
        console.log(`  📚 Creating Library Books...`);
        for (const bookData of LIBRARY_BOOKS) {
          await LibraryBook.create({
            school: school._id,
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn,
            classLevel: bookData.classLevels,
            quantity: randomInt(3, 10),
            available: randomInt(1, 8),
          });
        }
        console.log(`    ✓ Created ${LIBRARY_BOOKS.length} library books`);
      } else {
        console.log(`  📚 Library books already exist for ${school.name}`);
      }

      schools.push(school);
    }

    console.log('\n✅ Seed data created successfully!');
    console.log(`   Total schools: ${schools.length}`);
    console.log(`   Run "npm run seed:demo" or "npm run seed:nerdc" for additional seeds`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some data already exists');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

// ==================== RUN SEED ====================
seedComprehensiveData();
