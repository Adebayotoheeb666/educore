# Educore Data Structure & Relationships

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            EDUCORE PLATFORM                              │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  SCHOOL  │
                              └────┬─────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼──┐      ┌────▼────┐   ┌────▼──────┐
              │  USER  │      │  CLASS  │   │ ACADEMIC  │
              └─────┬──┘      └────┬────┘   │ CALENDAR  │
                    │              │        └───────────┘
        ┌───────────┼───────────┐  │
        │           │           │  │
   ┌────▼──┐  ┌────▼───┐  ┌───▼──────┐
   │STUDENT│  │TEACHER │  │ADMIN_STAFF
   └────┬──┘  └────┬───┘  └───────────
        │          │
   ┌────▼──┐  ┌────▼──────────────┐
   │PARENT │  │ SUBJECT (TEACHES) │
   └───────┘  └────┬──────────────┘
                   │
        ┌──────────┼──────────────┐
        │          │              │
    ┌───▼───┐  ┌──▼────┐  ┌──────▼────┐
    │ EXAM  │  │QUESTION  │ TIMETABLE
    └───┬───┘  └──────────┘ └──────────┘
        │
    ┌───▼────┐
    │ RESULT │
    └────────┘

Additional Entities:
├── ATTENDANCE (CLASS, STUDENT, SCHOOL)
├── FEE (CLASS, SCHOOL)
├── LIBRARY_BOOK (SCHOOL)
└── BEHAVIOR_LOG (STUDENT, SCHOOL)
```

## Detailed Entity Definitions

### 1. SCHOOL
```json
{
  "_id": "ObjectId",
  "name": "String - Pinnacle Academy Lagos",
  "subDomain": "String - optional unique subdomain",
  "email": "String - school@example.com",
  "address": "String",
  "phone": "String",
  "state": "String",
  "type": "String - enum: secondary, primary, vocational",
  "owner": "ObjectId -> USER",
  "subscription": {
    "status": "String - enum: active, inactive, trial",
    "plan": "String - basic, premium, enterprise",
    "aiTokenBudget": "Number",
    "usedAiTokens": "Number",
    "expiresAt": "Date"
  },
  "settings": {
    "academicSession": "String - 2024/2025",
    "currentTerm": "String - enum: first, second, third"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 2. USER (Polymorphic - Multiple Roles)
```json
{
  "_id": "ObjectId",
  "name": "String - First and Last Name",
  "email": "String - Unique",
  "password": "String - Hashed",
  "role": "String - enum: [
    'school_owner',
    'principal',
    'vp_academics',
    'vp_admin',
    'admin_staff',
    'class_teacher',
    'subject_teacher',
    'bursar',
    'parent',
    'student',
    'super_admin'
  ]",
  "schoolId": "ObjectId -> SCHOOL (null for super_admin)",
  "phone": "String",
  "isActive": "Boolean - default: true",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 3. CLASS
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "name": "String - JSS1, SS2, etc.",
  "arm": "String - A, B, C, etc.",
  "level": "String - JSS1, JSS2, JSS3, SS1, SS2, SS3",
  "session": "String - 2024/2025",
  "classTeacher": "ObjectId -> USER (role: class_teacher)",
  "students": ["ObjectId -> USER (role: student)"],
  "subjects": ["ObjectId -> SUBJECT"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4. SUBJECT
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "name": "String - English Language, Mathematics, etc.",
  "code": "String - ENG, MTH, PHY, etc.",
  "nerdcCode": "String - Optional NERDC code",
  "category": "String - core, science, arts, commercial, vocational, elective",
  "classes": ["ObjectId -> CLASS"],
  "teachers": ["ObjectId -> USER (role: subject_teacher)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 5. TIMETABLE
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "class": "ObjectId -> CLASS",
  "term": "String - first, second, third",
  "slots": [
    {
      "day": "String - enum: Monday, Tuesday, Wednesday, Thursday, Friday",
      "period": "Number - 1-6",
      "startTime": "String - HH:MM",
      "endTime": "String - HH:MM",
      "subject": "ObjectId -> SUBJECT",
      "teacher": "ObjectId -> USER (role: subject_teacher)"
    }
  ],
  "aiGenerated": "Boolean - false",
  "status": "String - enum: draft, published",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 6. EXAM
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "subject": "ObjectId -> SUBJECT",
  "class": "ObjectId -> CLASS",
  "term": "String - first, second, third",
  "type": "String - enum: ca, exam",
  "scheduledDate": "Date - Dec 2, 2024",
  "duration": "Number - 90 minutes",
  "totalMarks": "Number - 100",
  "questions": ["ObjectId -> QUESTION"],
  "status": "String - enum: draft, published, completed",
  "randomizeQuestions": "Boolean - false",
  "uniquePaperPerStudent": "Boolean - false",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7. QUESTION
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "subject": "ObjectId -> SUBJECT",
  "class": "ObjectId -> CLASS - optional",
  "topic": "String - Algebra, Geometry, etc.",
  "type": "String - enum: mcq, theory, essay, true_false, fill_blank",
  "difficulty": "String - enum: easy, medium, hard",
  "examPattern": "String - enum: waec, neco, jamb, internal, ca",
  "question": "String - The question text",
  "options": ["String - MCQ options"],
  "answer": "Mixed - String or Number index",
  "rubric": ["String - Grading rubric points"],
  "marks": "Number - 1-5",
  "aiGenerated": "Boolean - false",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 8. RESULT
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "student": "ObjectId -> USER (role: student)",
  "class": "ObjectId -> CLASS",
  "term": "String - first, second, third",
  "session": "String - 2024/2025",
  "subjects": [
    {
      "subject": "ObjectId -> SUBJECT",
      "caScore": "Number - 0-20",
      "examScore": "Number - 0-80",
      "totalScore": "Number - 0-100",
      "grade": "String - A, B, C, D, F"
    }
  ],
  "overallPercentage": "Number - 0-100",
  "positionInClass": "Number - 1-50",
  "principalComment": "String - Optional comment",
  "reportCardUrl": "String - Optional URL",
  "status": "String - enum: draft, approved, released",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 9. ATTENDANCE
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "class": "ObjectId -> CLASS",
  "date": "Date - Dec 2, 2024",
  "term": "String - first, second, third",
  "session": "String - 2024/2025",
  "takenBy": "ObjectId -> USER (role: class_teacher)",
  "records": [
    {
      "student": "ObjectId -> USER (role: student)",
      "status": "String - enum: present, absent, late, excused",
      "notifiedParent": "Boolean - false"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date",
  "indexes": {
    "unique": "school + class + date",
    "compound": "school + class + date"
  }
}
```

### 10. FEE
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "title": "String - First Term 2024/2025 - JSS1-A",
  "session": "String - 2024/2025",
  "term": "String - first, second, third",
  "class": "ObjectId -> CLASS",
  "items": [
    {
      "name": "String - Tuition Fee",
      "amount": "Number - 150000",
      "mandatory": "Boolean - true"
    }
  ],
  "totalAmount": "Number - Sum of all items",
  "dueDate": "Date - Sep 30, 2024",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 11. LIBRARY_BOOK
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "title": "String - Things Fall Apart",
  "author": "String - Chinua Achebe",
  "isbn": "String - 978-0385474542",
  "subject": "ObjectId -> SUBJECT - optional",
  "classLevel": ["String - JSS1, JSS2, SS1, etc."],
  "quantity": "Number - Total copies",
  "available": "Number - Copies available for borrowing",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 12. ACADEMIC_CALENDAR
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "session": "String - 2024/2025",
  "terms": [
    {
      "term": "String - enum: first, second, third",
      "name": "String - First Term 2024/2025",
      "startDate": "Date - Sep 9, 2024",
      "endDate": "Date - Dec 13, 2024",
      "events": [
        {
          "title": "String - School Resumption",
          "date": "Date - Sep 9, 2024",
          "type": "String - enum: holiday, exam, activity, other"
        }
      ]
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 13. BEHAVIOR_LOG
```json
{
  "_id": "ObjectId",
  "school": "ObjectId -> SCHOOL",
  "student": "ObjectId -> USER (role: student)",
  "class": "ObjectId -> CLASS",
  "date": "Date",
  "behavior": "String - Positive/Negative behavior description",
  "category": "String - Academic, Conduct, Discipline, etc.",
  "severity": "String - enum: minor, moderate, severe",
  "recordedBy": "ObjectId -> USER (role: teacher/admin)",
  "resolvedDate": "Date - optional",
  "comments": "String - optional",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Data Flow & Operations

### Enrollment Flow
```
STUDENT (created)
    ↓
CLASS (added to students array)
    ↓
TIMETABLE (student sees scheduled classes)
    ↓
ATTENDANCE (tracked per class)
    ↓
EXAM (student takes exams)
    ↓
RESULT (computed from exam scores)
```

### Assessment Flow
```
QUESTION (created/AI-generated)
    ↓
EXAM (questions organized)
    ↓
SUBMISSION (student completes)
    ↓
RESULT (grades computed)
    ↓
REPORT_CARD (printed/shared)
```

### Academic Timeline
```
START OF TERM (Academic Calendar)
    ↓
TIMETABLE (Classes scheduled)
    ↓
ATTENDANCE (Daily tracking)
    ↓
MID-TERM (Exams, CA assessments)
    ↓
RESULTS (Mid-term scores)
    ↓
END OF TERM (Final exams)
    ↓
RESULTS (Final grades)
    ↓
REPORT_CARD (Generated & Released)
```

## Cardinality Relationships

| Relationship | Cardinality | Description |
|---|---|---|
| SCHOOL → USER | 1:Many | One school has many users |
| SCHOOL → CLASS | 1:Many | One school has many classes |
| SCHOOL → SUBJECT | 1:Many | One school has many subjects |
| SCHOOL → FEE | 1:Many | One school has multiple fee structures |
| SCHOOL → LIBRARY_BOOK | 1:Many | One school has many books |
| CLASS → STUDENT | 1:Many | One class has 35-45 students |
| CLASS → SUBJECT | Many:Many | Classes take multiple subjects |
| CLASS → TIMETABLE | 1:1 | One timetable per class per term |
| CLASS → ATTENDANCE | 1:Many | Many attendance records per class |
| CLASS → FEE | 1:1 | One fee structure per class per term |
| SUBJECT → TEACHER | Many:Many | Subject has multiple teachers, teacher teaches multiple subjects |
| SUBJECT → QUESTION | 1:Many | Subject has many questions |
| EXAM → QUESTION | Many:Many | Exam has questions from a subject |
| STUDENT → RESULT | 1:Many | One student has multiple results (per term) |
| STUDENT → ATTENDANCE | 1:Many | One student has many attendance records |
| STUDENT → BEHAVIOR_LOG | 1:Many | One student has many behavior logs |

## Database Indexing Strategy

```javascript
// SCHOOL Collection
db.schools.createIndex({ email: 1 }, { unique: true })
db.schools.createIndex({ subDomain: 1 }, { sparse: true, unique: true })

// USER Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ schoolId: 1, role: 1 })
db.users.createIndex({ schoolId: 1 })

// CLASS Collection
db.classes.createIndex({ school: 1, session: 1, level: 1 })
db.classes.createIndex({ school: 1 })

// SUBJECT Collection
db.subjects.createIndex({ school: 1, code: 1 })

// ATTENDANCE Collection
db.attendances.createIndex({ school: 1, class: 1, date: 1 }, { unique: true })
db.attendances.createIndex({ school: 1, createdAt: -1 })

// EXAM Collection
db.exams.createIndex({ school: 1, class: 1, term: 1 })
db.exams.createIndex({ school: 1, createdAt: -1 })

// RESULT Collection
db.results.createIndex({ school: 1, student: 1, term: 1, session: 1 }, { unique: true })
db.results.createIndex({ school: 1, class: 1, term: 1 })
db.results.createIndex({ school: 1, createdAt: -1 })

// QUESTION Collection
db.questions.createIndex({ school: 1, subject: 1 })
db.questions.createIndex({ school: 1, difficulty: 1 })
```

## Transaction Consistency Points

**Critical Transactions:**
1. **Enrollment**: Create student → Add to class → Add to timetable
2. **Grading**: Create result → Update student record → Generate report card
3. **Fee Payment**: Deduct from balance → Add to payment log → Update student account
4. **Attendance**: Record attendance → Check absences → Notify parent if needed

## Query Patterns

### Frequent Queries
```javascript
// Get all classes for a school
db.classes.find({ school: schoolId, session: "2024/2025" })

// Get all students in a class
db.classes.findById(classId).populate('students')

// Get student results by term
db.results.find({ student: studentId, term: "first" })

// Get attendance for a class
db.attendances.find({ class: classId, date: { $gte: startDate, $lte: endDate } })

// Get exams for a class-subject
db.exams.find({ class: classId, subject: subjectId, term: "first" })

// Get timetable for a class
db.timetables.findOne({ class: classId, term: "first" })

// Get all teachers for a subject
db.subjects.findById(subjectId).populate('teachers')

// Get fees for a class
db.fees.findOne({ class: classId, term: "first", session: "2024/2025" })
```

---

**Version:** 1.0  
**Last Updated:** May 2026
**Database:** MongoDB 6.x+
**Platform:** Educore v2.0.0
