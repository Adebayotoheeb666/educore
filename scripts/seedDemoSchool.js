require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const School = require('../models/schoolModel');
const Class = require('../models/classModel');
const Subject = require('../models/subjectModel');
const AcademicCalendar = require('../models/academicCalendarModel');

const DEMO_SCHOOL = {
  name: 'EduCore Demo Academy',
  email: 'demo@educore.ng',
  address: '12 Education Way, Victoria Island, Lagos',
  phone: '08012345678',
  state: 'Lagos',
  type: 'secondary',
};

const DEMO_OWNER = {
  firstName: 'Adaeze',
  lastName: 'Okonkwo',
  email: 'owner@edudemo.ng',
  password: 'Demo@1234',
  role: 'school_owner',
  phone: '08012345678',
};

const CLASSES = [
  { name: 'JSS1', arm: 'A', level: 'JSS1' }, { name: 'JSS1', arm: 'B', level: 'JSS1' },
  { name: 'JSS2', arm: 'A', level: 'JSS2' }, { name: 'JSS2', arm: 'B', level: 'JSS2' },
  { name: 'JSS3', arm: 'A', level: 'JSS3' },
  { name: 'SS1', arm: 'A', level: 'SS1' }, { name: 'SS1', arm: 'B', level: 'SS1' },
  { name: 'SS2', arm: 'A', level: 'SS2' }, { name: 'SS2', arm: 'B', level: 'SS2' },
  { name: 'SS3', arm: 'A', level: 'SS3' },
];

const CORE_SUBJECTS = [
  { name: 'English Language', code: 'ENG', category: 'core' },
  { name: 'Mathematics', code: 'MTH', category: 'core' },
  { name: 'Basic Science', code: 'BSC', category: 'science' },
  { name: 'Physics', code: 'PHY', category: 'science' },
  { name: 'Chemistry', code: 'CHM', category: 'science' },
  { name: 'Biology', code: 'BIO', category: 'science' },
  { name: 'Geography', code: 'GEO', category: 'arts' },
  { name: 'Government', code: 'GOV', category: 'arts' },
  { name: 'Economics', code: 'ECO', category: 'arts' },
  { name: 'Commerce', code: 'COM', category: 'commercial' },
  { name: 'Financial Accounting', code: 'ACC', category: 'commercial' },
  { name: 'Social Studies', code: 'SST', category: 'core' },
  { name: 'Agricultural Science', code: 'AGR', category: 'vocational' },
  { name: 'Computer Studies', code: 'CMP', category: 'vocational' },
  { name: 'Further Mathematics', code: 'FMT', category: 'science' },
];

const TEACHER_NAMES = [
  ['Emeka', 'Eze'], ['Ngozi', 'Adeyemi'], ['Bello', 'Ibrahim'], ['Amaka', 'Obi'],
  ['Tunde', 'Akinola'], ['Chioma', 'Nwosu'], ['Femi', 'Adeleke'], ['Kemi', 'Oladipo'],
  ['Seun', 'Babatunde'], ['Uche', 'Okeke'], ['Biodun', 'Afolabi'], ['Sola', 'Fashola'],
  ['Zainab', 'Musa'], ['Ifeanyi', 'Okafor'], ['Halima', 'Suleiman'],
];

const STUDENT_FIRST_NAMES = ['Chidi', 'Amara', 'Seun', 'Taiwo', 'Kehinde', 'Emeka', 'Ngozi', 'Temi', 'Bola', 'Uche',
  'Fatima', 'Aisha', 'Musa', 'Hassan', 'Zainab', 'Sola', 'Femi', 'Kemi', 'Tunde', 'Yemi'];
const STUDENT_LAST_NAMES = ['Obi', 'Adeyemi', 'Ibrahim', 'Eze', 'Akinola', 'Nwosu', 'Adeleke', 'Oladipo',
  'Babatunde', 'Okeke', 'Afolabi', 'Fashola', 'Musa', 'Okafor', 'Suleiman'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedDemoSchool = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding demo school...');

  // Check if demo school already exists
  const existing = await School.findOne({ email: DEMO_SCHOOL.email });
  if (existing) {
    console.log('Demo school already exists. Skipping.');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_OWNER.password, 10);

  // Create school
  const school = await School.create({
    ...DEMO_SCHOOL,
    subscription: { plan: 'premium', status: 'active', aiTokenBudget: 500000, usedAiTokens: 0 },
  });
  console.log(`School created: ${school.name} (${school._id})`);

  // Create owner
  const owner = await User.create({ ...DEMO_OWNER, password: hashedPassword, schoolId: school._id, isActive: true });
  school.owner = owner._id;
  await school.save();
  console.log(`Owner created: ${owner.email}`);

  // Create subjects
  const subjectDocs = await Subject.insertMany(
    CORE_SUBJECTS.map(s => ({ ...s, school: school._id }))
  );
  console.log(`Created ${subjectDocs.length} subjects`);

  // Create teachers (15)
  const teacherDocs = [];
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const [firstName, lastName] = TEACHER_NAMES[i];
    const teacher = await User.create({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@edudemo.ng`,
      password: hashedPassword,
      role: i === 0 ? 'principal' : 'subject_teacher',
      schoolId: school._id,
      phone: `070${randomInt(10000000, 99999999)}`,
      isActive: true,
    });
    teacherDocs.push(teacher);
  }
  console.log(`Created ${teacherDocs.length} teachers (including 1 principal)`);

  // Assign teachers to subjects
  for (let i = 0; i < subjectDocs.length; i++) {
    const teacher = teacherDocs[(i % (teacherDocs.length - 1)) + 1];
    subjectDocs[i].teachers = [teacher._id];
    await subjectDocs[i].save();
  }

  // Create classes and students (10 classes, ~20 students each = 200 students)
  const classDocs = [];
  for (const classData of CLASSES) {
    const jssSubjects = subjectDocs.filter(s => ['ENG','MTH','BSC','SST','AGR','CMP'].includes(s.code));
    const ssSubjects = subjectDocs.filter(s => ['ENG','MTH','PHY','CHM','BIO','GEO','GOV','ECO'].includes(s.code));
    const isJSS = classData.level.startsWith('JSS');
    const classSubjects = isJSS ? jssSubjects : ssSubjects;

    const classDoc = await Class.create({
      school: school._id,
      name: classData.name,
      arm: classData.arm,
      level: classData.level,
      session: '2024/2025',
      classTeacher: teacherDocs[classDocs.length % teacherDocs.length]._id,
      subjects: classSubjects.map(s => s._id),
    });
    classDocs.push(classDoc);

    // Create 20 students per class
    const studentIds = [];
    for (let s = 0; s < 20; s++) {
      const firstName = randomItem(STUDENT_FIRST_NAMES);
      const lastName = randomItem(STUDENT_LAST_NAMES);
      const admNo = `EDU/${classData.level}/${String(classDocs.length).padStart(2,'0')}/${String(s+1).padStart(3,'0')}`;
      const student = await User.create({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}${s}.${lastName.toLowerCase()}@student.edudemo.ng`,
        password: hashedPassword,
        role: 'student',
        schoolId: school._id,
        admissionNumber: admNo,
        parentPhone: `080${randomInt(10000000, 99999999)}`,
        dateOfBirth: new Date(randomInt(2005, 2012), randomInt(0, 11), randomInt(1, 28)),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        isActive: true,
      });
      studentIds.push(student._id);
    }
    classDoc.students = studentIds;
    await classDoc.save();
  }
  console.log(`Created ${classDocs.length} classes with 20 students each (${classDocs.length * 20} total students)`);

  // Create academic calendar
  await AcademicCalendar.create({
    school: school._id,
    session: '2024/2025',
    terms: [
      {
        term: 'First Term',
        name: 'First Term 2024/2025',
        startDate: new Date('2024-09-09'),
        endDate: new Date('2024-12-13'),
        events: [
          { title: 'Resumption', date: new Date('2024-09-09'), type: 'academic' },
          { title: 'Mid-term Break', date: new Date('2024-10-25'), type: 'holiday' },
          { title: 'End of Term Exams', date: new Date('2024-12-02'), type: 'exam' },
          { title: 'Christmas Break', date: new Date('2024-12-13'), type: 'holiday' },
        ],
      },
      {
        term: 'Second Term',
        name: 'Second Term 2024/2025',
        startDate: new Date('2025-01-13'),
        endDate: new Date('2025-04-04'),
        events: [
          { title: 'Resumption', date: new Date('2025-01-13'), type: 'academic' },
          { title: 'Mid-term Break', date: new Date('2025-02-21'), type: 'holiday' },
          { title: 'End of Term Exams', date: new Date('2025-03-24'), type: 'exam' },
          { title: 'Easter Break', date: new Date('2025-04-04'), type: 'holiday' },
        ],
      },
      {
        term: 'Third Term',
        name: 'Third Term 2024/2025',
        startDate: new Date('2025-04-28'),
        endDate: new Date('2025-07-25'),
        events: [
          { title: 'Resumption', date: new Date('2025-04-28'), type: 'academic' },
          { title: 'Sports Day', date: new Date('2025-05-23'), type: 'event' },
          { title: 'WAEC Exams', date: new Date('2025-04-28'), type: 'exam' },
          { title: 'Promotion Exams', date: new Date('2025-07-07'), type: 'exam' },
          { title: 'Long Vacation', date: new Date('2025-07-25'), type: 'holiday' },
        ],
      },
    ],
  });
  console.log('Academic calendar created');

  console.log('\n=== DEMO SCHOOL SEEDING COMPLETE ===');
  console.log(`School: ${school.name}`);
  console.log(`Login: ${DEMO_OWNER.email} / ${DEMO_OWNER.password}`);
  console.log(`Classes: ${classDocs.length} | Teachers: ${teacherDocs.length} | Students: ${classDocs.length * 20}`);

  await mongoose.disconnect();
};

seedDemoSchool().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
