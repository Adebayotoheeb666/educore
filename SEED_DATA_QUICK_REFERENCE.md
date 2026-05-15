# Educore Seed Data - Quick Reference

## ⚡ Quick Start

```bash
# Run the comprehensive seed script
npm run seed:comprehensive

# Or manually
node scripts/seedComprehensiveData.js
```

## 📊 Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| **Schools** | 3 | Pinnacle Academy, Excellence International, Future Leaders Academy |
| **Users** | ~1500+ | Owners, Admins, Teachers, Students |
| **Classes** | 36 | 12 per school (6 JSS + 6 SS) |
| **Students** | ~1440 | 40 per class on average |
| **Teachers** | 57 | ~19 per school |
| **Subjects** | 21 | Same across all schools |
| **Exams** | 180+ | Per class-subject combination per term |
| **Questions** | 7+ | Sample questions for testing |
| **Timetable Slots** | 360+ | Per class per term |
| **Attendance Records** | 240+ | 20 per class |
| **Results** | 60+ | 20 students per school |
| **Fee Structures** | 36 | One per class |
| **Library Books** | 16 | Curated books across categories |

## 🔐 Default Credentials

**Password for all users:** `Demo@1234`

**Sample Logins:**

### School Owners
- `tunde@pinnacle.ng` - Pinnacle Academy Lagos
- `chioma@excellence.edu.ng` - Excellence International School
- `ahmed@futureleaders.ng` - Future Leaders Academy Abuja

### Admins/Teachers (Examples)
- `emeka.eze@pinnacle.ng` - Principal
- `ngozi.adeyemi@pinnacle.ng` - Vice Principal Academics
- `bello.ibrahim@pinnacle.ng` - VP Admin
- `amaka.obi@pinnacle.ng` - Bursar
- `tunde.akinola@pinnacle.ng` - Subject Teacher

### Students
- Email format: `firstname{number}lastname@student.ng`
- Example: `chidi1obi@student.ng`, `amara2adeyemi@student.ng`

## 📚 Subjects by Category

```
Core (5)
├── English Language (ENG)
├── Mathematics (MTH)
├── Social Studies (SST)
├── Civic Education (CED)
└── Physical Education (PED)

Science (5)
├── Basic Science (BSC)
├── Physics (PHY)
├── Chemistry (CHM)
├── Biology (BIO)
└── Further Mathematics (FMT)

Arts (4)
├── Literature in English (LIT)
├── Geography (GEO)
├── Government (GOV)
└── History (HIS)

Commercial (3)
├── Economics (ECO)
├── Commerce (COM)
└── Financial Accounting (ACC)

Vocational (3)
├── Agricultural Science (AGR)
├── Computer Studies (CMP)
└── Technical Drawing (TCD)

Electives (2)
├── Islamic Studies (ISL)
└── Christian Religious Studies (CRS)
```

## 📅 Academic Calendar

| Term | Period | Duration |
|------|--------|----------|
| **First** | Sep 9 - Dec 13, 2024 | 13 weeks |
| **Second** | Jan 13 - Apr 4, 2025 | 12 weeks |
| **Third** | Apr 21 - Jul 18, 2025 | 13 weeks |

## 💰 Fee Structure (Per Term)

| Item | Amount | Mandatory |
|------|--------|-----------|
| Tuition Fee | ₦150,000 | ✓ |
| Development Levy | ₦50,000 | ✓ |
| Examination Fee | ₦25,000 | ✓ |
| Sports Fee | ₦10,000 | ✗ |
| ICT Fee | ₦15,000 | ✗ |
| Transport Fee | ₦30,000 | ✗ |

**Total (Mandatory):** ₦225,000  
**Total (Optional):** ₦60,000  
**Grand Total:** ₦285,000

## 🏆 Grade Scale

| Score Range | Grade | Interpretation |
|---|---|---|
| 70-100 | A | Excellent |
| 60-69 | B | Good |
| 50-59 | C | Credit |
| 40-49 | D | Pass |
| Below 40 | F | Fail |

## 📖 Class Structure

### Per School (12 Classes)

```
JSS Level (Lower Secondary)
├── JSS1-A (Arm A)
├── JSS1-B (Arm B)
├── JSS2-A (Arm A)
├── JSS2-B (Arm B)
├── JSS3-A (Arm A)
└── JSS3-B (Arm B)

SS Level (Upper Secondary)
├── SS1-A (Arm A)
├── SS1-B (Arm B)
├── SS2-A (Arm A)
├── SS2-B (Arm B)
├── SS3-A (Arm A)
└── SS3-B (Arm B)
```

## ⏰ School Day Schedule

| Period | Time | Duration |
|--------|------|----------|
| Period 1 | 07:30 - 08:30 | 1 hour |
| Period 2 | 08:30 - 09:30 | 1 hour |
| Period 3 | 09:30 - 10:30 | 1 hour |
| Break | 10:30 - 10:45 | 15 min |
| Period 4 | 10:45 - 11:45 | 1 hour |
| Period 5 | 11:45 - 12:45 | 1 hour |
| Lunch | 12:45 - 13:00 | 15 min |
| Period 6 | 13:00 - 14:00 | 1 hour |

## 🎯 Attendance Status Distribution

- **Present:** 90%
- **Absent:** 5%
- **Late:** 5%

## 📝 Question Types

- **MCQ** - Multiple Choice Questions (4 options)
- **Theory** - Theory/Essay Questions
- **Fill Blank** - Fill in the blank questions
- **True/False** - True or false questions
- **Essay** - Long form essay questions

## 📊 Exam Information

- **Scheduled:** Dec 2-13, 2024 (First Term)
- **Duration:** 90 minutes per subject
- **Total Marks:** 100 per subject
- **Number of Questions:** 5+ per exam
- **Status:** Published (ready for students)

## 📚 Library Holdings

**16 Books Total**

### By Category
- Literature: 5 books
- Mathematics: 3 books
- Science: 3 books
- Social Studies: 3 books
- Reference: 2 books

### Notable Books
- Things Fall Apart (Chinua Achebe)
- The Great Gatsby (F. Scott Fitzgerald)
- Senior School Mathematics (Volumes 1 & 2)
- Senior School Physics, Chemistry, Biology

## 🔧 Troubleshooting

### No data created?
1. Check MongoDB connection: `echo $MONGO_URI`
2. Verify .env file exists in root
3. Check permissions on `/scripts` directory

### Duplicate key errors?
- Database already has data
- Solution: Clear collections first or modify seed to skip existing

### Out of memory?
- Reduce students per class: `const studentsPerClass = 20;`
- Create fewer schools or skip some data types

### Missing collections?
- Ensure all models are properly imported
- Check `/models` directory for missing files

## 🎯 Testing the Seed Data

### In MongoDB Shell

```javascript
// Count schools
db.schools.count()  // Should be 3

// Count students
db.users.count({ role: "student" })  // Should be ~1440

// Count classes
db.classes.count()  // Should be 36

// Check exam data
db.exams.count()  // Should be 180+

// Get first school
db.schools.findOne()

// Get a class with students
db.classes.findOne().students.length  // Should be 35-45
```

### In Node.js

```javascript
const User = require('./models/userModel');
const School = require('./models/schoolModel');

// Count all users
const userCount = await User.countDocuments();
console.log(`Total users: ${userCount}`);

// Count by role
const students = await User.countDocuments({ role: 'student' });
console.log(`Students: ${students}`);

// Get a school with stats
const school = await School.findOne()
  .populate('owner')
  .populate('classes');
console.log(school);
```

## 📞 Support

For issues or questions:
1. Check the full guide: `COMPREHENSIVE_SEED_DATA_GUIDE.md`
2. Review existing seed scripts: `seedDemoSchool.js`, `seedNERDCData.js`
3. Check MongoDB logs for connection issues
4. Verify all models are properly structured

## 🚀 Next Steps

1. ✅ Run seed: `npm run seed:comprehensive`
2. ✅ Test data: Use credentials above to login
3. ✅ Explore: Navigate through all modules
4. ✅ Customize: Modify seed data as needed
5. ✅ Develop: Build features using populated data

---

**Version:** 1.0  
**Last Updated:** May 2026
**Platform:** Educore v2.0.0
