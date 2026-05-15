# Educore Platform - Comprehensive Seed Data Guide

## Overview

This document provides detailed information about the seed data for the Educore school management platform. The seed data includes realistic data for multiple schools with complete hierarchical structures, users, academics, and operations.

## What's Included

### 1. **Schools (3 Sample Schools)**

Three fully configured secondary schools are included:

| School Name | Location | Owner | Email |
|---|---|---|---|
| Pinnacle Academy Lagos | Lekki, Lagos | Tunde Awotona | tunde@pinnacle.ng |
| Excellence International School | Ibadan, Oyo | Chioma Okafor | chioma@excellence.edu.ng |
| Future Leaders Academy Abuja | Abuja, FCT | Ahmed Hassan | ahmed@futureleaders.ng |

**School Features:**
- Premium subscription plan (active, expires in 1 year)
- 500,000 AI token budget with varying usage (10k-100k tokens used)
- Academic session: 2024/2025
- Current term: First term

### 2. **User Roles & Hierarchy**

Each school has a complete staff structure:

```
School Owner (1)
├── Principal (1)
├── VP Academics (1)
├── VP Admin (1)
├── Bursar (1)
└── Subject Teachers (15+)

Students: 35-45 per class × 12 classes = ~480 students per school
```

**User Login Credentials:**
- **Default Password:** `Demo@1234`
- **Email Format:** `firstname.lastname@schoolname.ng`

**Sample Logins:**

| Email | Role | School | Password |
|---|---|---|---|
| tunde@pinnacle.ng | School Owner | Pinnacle Academy | Demo@1234 |
| emeka.eze@pinnacle.ng | Principal | Pinnacle Academy | Demo@1234 |
| chioma.nwosu@pinnacle.ng | Subject Teacher | Pinnacle Academy | Demo@1234 |

### 3. **Academic Structure**

#### Classes (12 per school)
```
JSS Level:
  - JSS1-A (35-45 students)
  - JSS1-B (35-45 students)
  - JSS2-A (35-45 students)
  - JSS2-B (35-45 students)
  - JSS3-A (35-45 students)
  - JSS3-B (35-45 students)

SS Level:
  - SS1-A (35-45 students)
  - SS1-B (35-45 students)
  - SS2-A (35-45 students)
  - SS2-B (35-45 students)
  - SS3-A (35-45 students)
  - SS3-B (35-45 students)
```

#### Subjects (21 subjects across 5 categories)

**Core Subjects (5):**
- English Language (ENG)
- Mathematics (MTH)
- Social Studies (SST)
- Civic Education (CED)
- Physical Education (PED)

**Science Subjects (5):**
- Basic Science (BSC)
- Physics (PHY)
- Chemistry (CHM)
- Biology (BIO)
- Further Mathematics (FMT)

**Arts Subjects (4):**
- Literature in English (LIT)
- Geography (GEO)
- Government (GOV)
- History (HIS)

**Commercial Subjects (3):**
- Economics (ECO)
- Commerce (COM)
- Financial Accounting (ACC)

**Vocational Subjects (3):**
- Agricultural Science (AGR)
- Computer Studies (CMP)
- Technical Drawing (TCD)

**Electives (2):**
- Islamic Studies (ISL)
- Christian Religious Studies (CRS)

### 4. **Academic Calendar**

Three complete terms with key dates and events:

**First Term (Sept 9 - Dec 13, 2024)**
- School Resumption: Sept 9
- Mid-term Break: Oct 25 - Nov 1
- Exams: Dec 2-13
- Christmas Holiday: From Dec 13

**Second Term (Jan 13 - Apr 4, 2025)**
- School Resumption: Jan 13
- Mid-term Break: Feb 21-28
- Exams: Mar 24 - Apr 4
- Easter Holiday: From Apr 4

**Third Term (Apr 21 - Jul 18, 2025)**
- School Resumption: Apr 21
- Mid-term Break: Jun 6-13
- Exams: Jun 30 - Jul 18
- Summer Holiday: From Jul 18

### 5. **Timetables**

- Generated for each class
- Includes 6 periods per day (07:30 - 14:00)
- Covers Monday through Friday
- Each slot assigned to a subject and teacher
- Status: Published and active

### 6. **Questions & Assessments**

**Sample Questions Included:**
- Multiple Choice Questions (MCQ)
- Fill in the Blank
- Theory/Essay Questions
- Difficulty levels: Easy, Medium, Hard
- Exam patterns: CA (Continuous Assessment), Exam

**Topics Covered:**
- Mathematics (Algebra, Geometry, Calculus)
- English Language (Grammar, Comprehension)
- Science (Chemical Reactions, Forces)

### 7. **Examinations**

- Created for each class-subject combination
- First term exams scheduled Dec 2-13, 2024
- 90-minute duration
- 100 total marks per subject
- Status: Published and ready

### 8. **Attendance Records**

- 20 attendance records per class (covering ~4 weeks)
- Dates: Mon-Fri only (weekends excluded)
- Status distribution: 90% present, 5% absent, 5% late
- Taken by: Class teacher records

### 9. **Results & Performance**

- Results created for sample 20 students per school
- Includes:
  - CA Scores (8-20 points)
  - Exam Scores (30-80 points)
  - Total Score (CA + Exam)
  - Grade Assignment (A-F based on score ranges)
  - Overall percentage and position in class
  - Principal's comment

**Grade Scale:**
| Score Range | Grade |
|---|---|
| 70-100 | A |
| 60-69 | B |
| 50-59 | C |
| 40-49 | D |
| Below 40 | F |

### 10. **Fee Management**

Fee structures created for each class with:

**Fee Items (per term):**
1. Tuition Fee: ₦150,000 (mandatory)
2. Development Levy: ₦50,000 (mandatory)
3. Examination Fee: ₦25,000 (mandatory)
4. Sports Fee: ₦10,000 (optional)
5. ICT Fee: ₦15,000 (optional)
6. Transport Fee: ₦30,000 (optional)

**Total Mandatory: ₦225,000**
**Total with Optional: ₦285,000**

### 11. **Library Books**

16 curated books across multiple categories:

**Literature (5 books)**
- Things Fall Apart - Chinua Achebe
- The Great Gatsby - F. Scott Fitzgerald
- Wuthering Heights - Emily Brontë
- Pride and Prejudice - Jane Austen
- One Man, One Matchet - Tunde Fatunde

**Mathematics (3 books)**
- Senior School Mathematics Vol. 1 & 2
- Further Mathematics Textbook

**Science (3 books)**
- Senior School Physics Vol. 1
- Senior School Chemistry Vol. 1
- Senior School Biology Vol. 1

**Social Studies (3 books)**
- Government for Senior Secondary Schools
- Economics Textbook
- Geography Workbook

**Reference (2 books)**
- The Oxford English Dictionary
- Collins Dictionary
- Mathematical Handbook

**Availability:**
- Quantity: 3-10 copies per book
- Available: 1-8 copies per book (simulating borrowing)

## How to Use the Seed Data

### Run the Comprehensive Seed Script

```bash
# From the project root
node scripts/seedComprehensiveData.js
```

**Prerequisites:**
- MongoDB connected and running
- `MONGO_URI` environment variable configured
- All models imported correctly

### Expected Output

```
✓ Connected to MongoDB
✓ Clearing existing data (if uncommented)

📚 Creating Schools and Staff...
  ✓ Created school: Pinnacle Academy Lagos
    ✓ Created owner: tunde@pinnacle.ng
    ✓ Created principal: emeka.eze@pinnacle.ng
    ...

📖 Creating Subjects...
  ✓ Created 21 subjects

👨‍🏫 Creating Teachers...
  ✓ Created 19 teachers

🏫 Creating Classes and Students...
  ✓ Created class JSS1-A with 38 students
  ✓ Created class JSS1-B with 42 students
  ...

📅 Creating Academic Calendar...
  ✓ Created academic calendar with 3 terms

⏰ Creating Timetables...
  ✓ Created timetables for all classes

❓ Creating Questions...
  ✓ Created 7 questions

📝 Creating Exams...
  ✓ Created exams for all class-subject combinations

✅ Creating Attendance Records...
  ✓ Created attendance records

🏆 Creating Student Results...
  ✓ Created results for sample students

💰 Creating Fee Structures...
  ✓ Created fee structures for all classes

📚 Creating Library Books...
  ✓ Created 16 library books

✅ Seed data created successfully!
   Total schools: 3
```

## Data Relationships & Cardinality

```
School (1)
├── Users (Admin, Teachers, Students) (1:*)
├── Classes (12) (1:12)
│   ├── Students (35-45) (1:*)
│   ├── Subjects (*) (1:*)
│   ├── Timetable (1) (1:1)
│   ├── Attendance Records (20+) (1:*)
│   └── Fee Structure (1) (1:1)
│
├── Subjects (21) (1:21)
│   ├── Teachers (*) (1:*)
│   ├── Questions (7) (1:*)
│   └── Exams (1 per class) (1:*)
│
├── Questions (7+) (1:*)
│   └── Exams (*) (1:*)
│
├── Exams (1 per class-subject) (1:*)
│   └── Results (*) (1:*)
│
├── Results (20+ per school) (1:*)
│
├── Library Books (16) (1:16)
│
└── Academic Calendar (1) (1:1)
```

## Customizing the Seed Data

### To Modify School Information

Edit the `SCHOOLS_DATA` constant:

```javascript
const SCHOOLS_DATA = [
  {
    name: 'Your School Name',
    email: 'admin@yourschool.ng',
    address: 'Your Address',
    phone: 'Your Phone',
    state: 'State',
    type: 'secondary',
    owner: {
      firstName: 'Owner First Name',
      lastName: 'Owner Last Name',
      email: 'owner@yourschool.ng',
      password: 'YourPassword@123'
    },
  },
];
```

### To Add More Students

Modify the `studentsPerClass` variable in the class creation loop:

```javascript
const studentsPerClass = 50; // Changed from randomInt(35, 45)
```

### To Add More Teachers

Add more names to `STAFF_NAMES` array:

```javascript
const STAFF_NAMES = [
  // ... existing names ...
  ['New Teacher First', 'New Teacher Last'],
];
```

### To Add More Subjects

Add to `SUBJECTS` array:

```javascript
const SUBJECTS = [
  // ... existing subjects ...
  { name: 'Your Subject', code: 'YSC', category: 'core' },
];
```

### To Add More Questions

Expand the `QUESTIONS_DATA` array:

```javascript
const QUESTIONS_DATA = [
  // ... existing questions ...
  {
    topic: 'Your Topic',
    type: 'mcq',
    difficulty: 'medium',
    examPattern: 'ca',
    marks: 1,
    question: 'Your question here?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 0
  },
];
```

## Clearing Data Before Re-seeding

If you want to start fresh, uncomment the data clearing section:

```javascript
// Uncomment these lines to clear existing data
await Promise.all([
  User.deleteMany({}),
  School.deleteMany({}),
  Class.deleteMany({}),
  Subject.deleteMany({}),
  AcademicCalendar.deleteMany({}),
  Attendance.deleteMany({}),
  Exam.deleteMany({}),
  Result.deleteMany({}),
  Fee.deleteMany({}),
  LibraryBook.deleteMany({}),
  Timetable.deleteMany({}),
  Question.deleteMany({}),
]);
```

## Testing the Seed Data

### 1. Verify Schools Created
```javascript
const schools = await School.find();
console.log(schools.length); // Should be 3
```

### 2. Verify Users
```javascript
const users = await User.countDocuments();
console.log(users); // Should be 1000+
```

### 3. Verify Classes
```javascript
const classes = await Class.find();
console.log(classes.length); // Should be 36 (12 per school × 3)
```

### 4. Verify Students
```javascript
const students = await User.find({ role: 'student' });
console.log(students.length); // Should be ~1440 (480 × 3)
```

### 5. Verify Exam Data
```javascript
const exams = await Exam.find().populate('questions');
console.log(exams.length); // Should be ~180+ (varies by class count)
```

## Performance Considerations

- **Total Records:** ~3000+ documents across all collections
- **Database Size:** ~50-100 MB depending on storage engine
- **Seeding Time:** ~30-60 seconds on typical hardware
- **Index Requirements:** Composite indexes on school, class, term combinations

## Troubleshooting

### Duplicate Key Error
**Cause:** Data already exists in the database
**Solution:** Either comment out the duplicate check or clear the database first

```javascript
// Remove this check if starting fresh:
const existing = await School.findOne({ email: schoolData.email });
if (existing) {
  console.log(`School already exists. Skipping...`);
  continue;
}
```

### Connection Error
**Cause:** MongoDB not running or `MONGO_URI` not set
**Solution:**
```bash
# Check .env file
echo $MONGO_URI

# Start MongoDB
mongod
```

### Missing Models
**Cause:** Some model files not found
**Solution:** Ensure all model files exist in `/models` directory

### Memory Issues
**Cause:** Too many students/records for server memory
**Solution:** Reduce `studentsPerClass` or create fewer schools

## Next Steps

1. **Run the seed script:** `node scripts/seedComprehensiveData.js`
2. **Login to test:** Use credentials from the "Sample Logins" section
3. **Explore data:** Navigate through classes, students, subjects
4. **Create results:** Generate more results using the Results Management system
5. **Test features:** Test attendance, exams, fees, library operations
6. **Customize:** Modify data as needed for your specific use case

## Additional Resources

- Existing seed scripts: `seedDemoSchool.js`, `seedNERDCData.js`
- Model definitions: `/models/` directory
- Database helpers: Check service files in `/services/`
- API routes: See `/routes/` directory

---

**Last Updated:** May 2026
**Platform Version:** 2.0.0
**Database:** MongoDB 6.x+
