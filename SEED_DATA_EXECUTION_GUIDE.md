# Seed Data Execution Guide

## 🎯 Quick Execution

### The Simplest Way
```bash
# From the project root directory
npm run seed:comprehensive
```

That's it! The script will create all the seed data automatically.

---

## 📋 Step-by-Step Instructions

### Step 1: Prerequisites Check

**Verify MongoDB is Running**
```bash
# On Linux/Mac
ps aux | grep mongod

# On Windows
tasklist | findstr mongod

# Or check if you can connect
mongo --eval "db.serverStatus()"
```

**Expected Output:**
```
mongodb is running on port 27017
```

**Verify MongoDB URI in .env**
```bash
# Check .env file
cat .env | grep MONGO_URI

# Expected output:
# MONGO_URI=mongodb://localhost:27017/educore
# or
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/educore
```

### Step 2: Navigate to Project Root

```bash
# If you're in a subdirectory
cd /path/to/educore

# Verify you're in the right place
ls -la | grep package.json
```

**Expected Output:**
```
-rw-r--r-- 1 user group 2845 May 7 2026 package.json
```

### Step 3: Run the Seed Script

```bash
npm run seed:comprehensive
```

### Step 4: Expected Output

You should see output similar to this:

```
✓ Connected to MongoDB

📚 Creating Schools and Staff...
  ✓ Created school: Pinnacle Academy Lagos (ObjectId...)
    ✓ Created owner: tunde@pinnacle.ng
    ✓ Created principal: emeka.eze@pinnacle.ng
    ✓ Created vp_academics: ngozi.adeyemi@pinnacle.ng
    ✓ Created vp_admin: bello.ibrahim@pinnacle.ng
    ✓ Created bursar: amaka.obi@pinnacle.ng
  📖 Creating Subjects for Pinnacle Academy Lagos...
    ✓ Created 21 subjects
  👨‍🏫 Creating Teachers...
    ✓ Created 19 teachers
  🏫 Creating Classes and Students...
    ✓ Created class JSS1-A with 38 students
    ✓ Created class JSS1-B with 42 students
    ✓ Created class JSS2-A with 37 students
    ... (more classes)
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
   Run "npm run seed:demo" or "npm run seed:nerdc" for additional seeds
```

**Timing:** The script should complete in 30-60 seconds

### Step 5: Validate the Data

```bash
npm run seed:validate
```

### Step 6: Expected Validation Output

```
✓ Connected to MongoDB

📚 SCHOOL VALIDATION

✓ Schools created: 3 (minimum: 1)
✓ School: "Pinnacle Academy Lagos" - Owner: tunde@pinnacle.ng
✓   Subscription: premium (active)
✓ School: "Excellence International School" - Owner: chioma@excellence.edu.ng
✓   Subscription: premium (active)
... (more schools)

👥 USER VALIDATION

✓ Total users created: 1547
✓ school_owner: 3 users
✓ principal: 3 users
✓ vp_academics: 3 users
... (more roles)
✓ Pinnacle Academy Lagos: 512 users (minimum: 50)
✓ Excellence International School: 518 users (minimum: 50)
✓ Future Leaders Academy Abuja: 517 users (minimum: 50)

🏫 CLASS VALIDATION

✓ Total classes created: 36
✓ JSS1: 6 classes
✓ JSS2: 6 classes
✓ JSS3: 6 classes
✓ SS1: 6 classes
✓ SS2: 6 classes
✓ SS3: 6 classes
✓ Classes with sufficient students: 36/36

... (more validations)

📊 VALIDATION SUMMARY REPORT

✓ Passed: 185
✗ Failed: 0
⚠ Warnings: 2

📈 DATA OVERVIEW

Schools:             3
Total Users:         1547
  - Students:        1440
  - Teachers:        57
  - Admin Staff:     12

Classes:             36
Subjects:            21
Timetables:          36
Questions:           7
Exams:               188
Results:             60
Attendance Records:  240
Fee Structures:      36
Library Books:       16
Academic Calendars:  3

✅ VALIDATION COMPLETE

✓ All critical validations passed!
```

---

## 🔐 Testing Login

Now that the seed data is created, you can test logins.

### For Web Application

1. **Start the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Login with school owner credentials:**
   - **Email:** `tunde@pinnacle.ng`
   - **Password:** `Demo@1234`

4. **Or login as teacher:**
   - **Email:** `emeka.eze@pinnacle.ng`
   - **Password:** `Demo@1234`

### For API Testing (Postman/Curl)

**Get Auth Token**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tunde@pinnacle.ng",
    "password": "Demo@1234"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "ObjectId...",
    "name": "Tunde Awotona",
    "email": "tunde@pinnacle.ng",
    "role": "school_owner",
    "schoolId": "ObjectId..."
  }
}
```

**Use Token for Requests**
```bash
curl http://localhost:3000/api/schools \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🔍 Verify Data in MongoDB

### Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select `educore` database
4. Browse collections:
   - `schools` - Should have 3 documents
   - `users` - Should have 1500+ documents
   - `classes` - Should have 36 documents
   - `subjects` - Should have 21 documents
   - `exams` - Should have 180+ documents
   - etc.

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Select database
use educore

# Count schools
db.schools.countDocuments()          # Should return 3

# Count students
db.users.countDocuments({ role: "student" })  # Should return ~1440

# Count classes
db.classes.countDocuments()          # Should return 36

# Get a sample school
db.schools.findOne()

# Get a sample class with students
db.classes.findOne()

# Count exams
db.exams.countDocuments()            # Should return 180+

# Get exam details
db.exams.findOne().pretty()

# Count all collections
db.runCommand("collStats", "schools")
db.runCommand("collStats", "users")
db.runCommand("collStats", "classes")
```

---

## 📊 Sample Queries to Test

### Get All Schools
```javascript
db.schools.find({}).toArray()
```

### Get Students in a Class
```javascript
const classId = ObjectId("..."); // Replace with actual ID
db.classes.aggregate([
  { $match: { _id: classId } },
  { $lookup: { from: "users", localField: "students", foreignField: "_id", as: "studentList" } },
  { $project: { name: 1, arm: 1, "studentList.name": 1, "studentList.email": 1 } }
])
```

### Get Teacher's Subjects
```javascript
const teacherId = ObjectId("...");
db.subjects.find({ teachers: teacherId }).toArray()
```

### Get Exam Questions
```javascript
const examId = ObjectId("...");
db.exams.aggregate([
  { $match: { _id: examId } },
  { $lookup: { from: "questions", localField: "questions", foreignField: "_id", as: "questionList" } },
  { $project: { "questionList.question": 1, "questionList.type": 1, "questionList.marks": 1 } }
])
```

### Get Student Results
```javascript
const studentId = ObjectId("...");
db.results.find({ student: studentId }).toArray()
```

---

## 🚨 Troubleshooting

### Issue 1: Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Start MongoDB
mongod

# Or with Homebrew (Mac)
brew services start mongodb-community

# Or with system service (Linux)
sudo systemctl start mongod
```

### Issue 2: Duplicate Key Error
```
Error: E11000 duplicate key error
```

**Solution Option 1 - Skip existing:**
The script has a check built in that will skip existing schools.

**Solution Option 2 - Clear collections:**
```bash
# In MongoDB shell
use educore
db.schools.deleteMany({})
db.users.deleteMany({})
db.classes.deleteMany({})
# ... delete all other collections

# Then run seed again
npm run seed:comprehensive
```

### Issue 3: Missing Models Error
```
Error: Cannot find module '../models/userModel.js'
```

**Solution:**
```bash
# Verify model files exist
ls models/

# Should show:
# academicCalendarModel.js
# announcementModel.js
# attendanceModel.js
# ... etc
```

### Issue 4: Memory Error
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run seed:comprehensive
```

### Issue 5: Script Running Very Slowly
```bash
# Check MongoDB performance
# Look for the 'takenBy' field in attendance
# Verify all indexes are created

mongosh
use educore
db.collections()  # List all collections
db.users.getIndexes()  # Check indexes
```

---

## ✅ Post-Seed Checklist

- [ ] Seed script ran successfully
- [ ] Validation script passed
- [ ] Can login with test credentials
- [ ] Schools visible in dashboard
- [ ] Classes and students appear correctly
- [ ] Timetables are scheduled
- [ ] Exams are created
- [ ] Results are visible
- [ ] Fees are configured
- [ ] Library books are available
- [ ] No console errors or warnings

---

## 🎯 Next Steps After Successful Seeding

### Immediate Testing (30 minutes)
1. ✅ Login as different user roles
2. ✅ View class schedule (timetable)
3. ✅ Check student attendance
4. ✅ Review exam questions
5. ✅ Look at student results

### Feature Testing (1-2 hours)
1. Create a new exam
2. Generate more questions
3. Record additional attendance
4. Create new results
5. Test fee payment
6. Borrow library books

### Integration Testing (2-4 hours)
1. Test API endpoints with real data
2. Verify notifications (email, SMS)
3. Test report generation
4. Check analytics and dashboards
5. Test bulk operations

### Performance Testing (4+ hours)
1. Load test with additional data
2. Check query response times
3. Monitor database size
4. Test concurrent users
5. Validate caching

---

## 📞 Command Reference

```bash
# Create seed data
npm run seed:comprehensive

# Validate created data
npm run seed:validate

# Run existing demo seed
npm run seed:demo

# Run NERDC seed
npm run seed:nerdc

# Start development server
npm run dev

# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Seed Execution Time | 30-60 seconds |
| Validation Time | 5-10 seconds |
| Total Records Created | 3000+ |
| Database Size | 50-100 MB |
| Average Document | 2-5 KB |

---

## 🎓 Learning Resources

After seeding, learn more about:
1. [Comprehensive Seed Data Guide](./COMPREHENSIVE_SEED_DATA_GUIDE.md)
2. [Quick Reference](./SEED_DATA_QUICK_REFERENCE.md)
3. [Data Structure Guide](./DATA_STRUCTURE_GUIDE.md)
4. [API Documentation](./docs/) (if available)
5. [Database Models](./models/)

---

## 🆘 Getting Help

1. **Check documentation files** - See guides listed above
2. **Check seed script comments** - Well-documented code
3. **Review console output** - Detailed error messages
4. **Check .env file** - Verify database configuration
5. **Check MongoDB logs** - Look for database errors

---

**Ready? Run:** `npm run seed:comprehensive`

Good luck! 🚀
