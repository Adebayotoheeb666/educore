# EduCore AI — Complete Revamp Implementation Plan

## Executive Summary

This is a **full domain replacement**, not an incremental upgrade. Every file touching products, marketplace, buyers, campaigns, automation, social media, and KYC is deleted. The infrastructure scaffolding (Express app factory, Mongoose connection, Redux store shape, SSE/WebSocket event bus, cron system, S3 upload utils, error middleware, JWT auth pattern, service-worker shell) is retained and repurposed. New domain logic is written from scratch on top of the surviving skeleton.

The plan has **10 phases**. Phases 1–3 are blocking prerequisites for all later work.

---

## Inventory: What Survives vs. What Dies

### DELETE — Backend (relative to `/home/adebayo/Desktop/Educore/educore/`)

**All 43 models** — delete entire `models/` directory except `tokenModel.js` and `Activities.js`:
- `businessRegistration.js`, `businessWalletModel.js`, `buyerModel.js`, `buyerWalletModel.js`
- `campaignModel.js`, `campaignExecutionModel.js`, `cartModel.js`, `checkOutSalesModel.js`
- `contentIdeaModel.js`, `discountModel.js`, `DraftModel.js`, `emailModel.js`
- `escrowEntryModel.js`, `expenseModel.js`, `followupCampaignModel.js`
- `integrationSettingsModel.js`, `internalMarketplaceOrderModel.js`, `inventoryHoldModel.js`
- `kycModel.js`, `businessKycModel.js`, `marketplaceOrderModel.js`
- `marketplaceWebhookDeliveryModel.js`, `marketplaceWebhookEndpointModel.js`
- `migrationStateModel.js`, `MonthlyReport.js`, `productGroupModel.js`, `productModel.js`
- `publicApiCredentialModel.js`, `publicIdempotencyKeyModel.js`, `publicRefreshSessionModel.js`
- `publicRequestNonceModel.js`, `registrationFollowupModel.js`, `salesModel.js`
- `socialMediaEngagementModel.js`, `templateModel.js`

**All 25 controllers** — delete entire `controllers/` directory

**All 19 routes** — delete entire `routes/` directory

**Services (domain-specific):**
- `services/campaigns/`, `services/comments/`, `services/contentIdea/`, `services/elevenlabs/`
- `services/insights/`, `services/instagram/`, `services/tiktok/`
- `services/marketplace/` (entire 15-file directory)
- `services/notifications/slackNotificationService.js`
- `services/kycNotificationService.js`

**Jobs:**
- `jobs/automations/` (all 4 automation jobs)
- `jobs/automationScheduler.js`, `jobs/marketplaceHoldExpiryJob.js`, `jobs/variantIdentityRepairJob.js`

**Utils (partial):**
- `utils/campaignExecutionEngine.js`, `utils/campaignTemplateEngine.js`
- `utils/getSendersList.js`, `utils/templateMigration.js`
- `utils/variantIdentityRepairService.js`, `utils/printReceipt.js`
- `utils/pdfTemplate.js`, `utils/linkArrays.js`, `utils/historyTracking.js`
- `utils/flutterwaveHelpers.js` (will be rewritten)

**Middleware (domain-specific):**
- `middleWare/buyerAuthMiddleware.js`, `middleWare/publicAuditMiddleware.js`
- `middleWare/publicDomainAllowlistMiddleware.js`, `middleWare/publicIdempotencyMiddleware.js`
- `middleWare/publicPartnerAuthMiddleware.js`, `middleWare/publicRateLimitMiddleware.js`
- `middleWare/publicRequestSigningMiddleware.js`, `middleWare/requireBusinessOwner.js`

### DELETE — Frontend (`client/src/`)

**All Redux slices:** `automationSlice.js`, `buyerAuthSlice.js`, `buyerOrdersSlice.js`, `buyerWalletSlice.js`, `cartSlice.js`, `discountSlice.js`, `integrationSlice.js`, `kycSlice.js`, `productSlice.js`, `productCacheSlice.js`, `filterSlice.js`, `bulkDataCacheSlice.js`, `dataCacheSlice.js`

**All pages:** `pages/product/` (marketplace, cart, product management), `pages/web/Marketplace/`, `pages/web/MarketingInterns/`

**All client services:** `buyerMarketplaceService.js`, `businessWalletService.js`, `discountService.js`, `marketplaceService.js`, `integrationService.js`, `kycService.js`

### KEEP and MODIFY

| File | Change |
|------|--------|
| `server.js` | Strip all marketplace routes; mount 19 new school routes |
| `start.js` | Strip marketplace jobs; register new school change streams and cron jobs |
| `package.json` | Remove Mailgun, Twilio, Puppeteer, ElevenLabs, social API packages; add OpenAI, Anthropic SDK, Nodemailer, Termii, Paystack, xlsx, pdfkit, idb, Bull |
| `middleWare/authMiddleware.js` | Complete rewrite for 11-role school auth |
| `middleWare/errorMiddleware.js` | Keep as-is |
| `middleWare/logActivityMiddleware.js` | Keep; update action type constants |
| `events/SSEManager.js` | Change `businessId` scope to `schoolId` |
| `events/EventEmitter.js` | Replace `EventTypes` constants with school domain events |
| `events/ChangeStreamManager.js` | Register new school model collections |
| `utils/sendEmail.js` | Complete rewrite using Nodemailer; new school-branded templates |
| `utils/sendSMS.js` | Complete rewrite using Termii (Nigerian SMS gateway) |
| `utils/s3bucket.js` | Keep; add Cloudinary integration |
| `utils/fileUpload.js` | Extend to accept .xlsx, .xls, .csv, .pdf |
| `utils/cronJobs.js` | Replace with school-specific cron tasks |
| `utils/cursorPagination.js` | Keep as-is |
| `utils/secretCrypto.js` | Keep as-is |
| `client/src/App.js` | Full route restructure |
| `client/src/redux/store.js` | Full slice replacement |
| `client/src/components/layout/Layout.js` | Role-based school sidebar/nav |
| `client/src/service-worker.js` | Extend with offline-first caching strategies |
| `models/tokenModel.js` | Update ref from `BusinessRegistration` → `User` |
| `models/Activities.js` | Update action type constants |

---

## Phase 1: Foundation Teardown and Infrastructure Reset
**Timeline:** Days 1–3 | **Blocking:** All other phases

**Goal:** Delete all marketplace/social domain code; set up new environment configuration. Server must boot and MongoDB must connect after this phase.

### package.json changes
**Remove:** `mailgun.js`, `twilio`, `puppeteer`, `chromium`, `electron-pos-printer`, `escpos`, `node-printer`, `node-thermal-printer`, `@sendgrid/client`

**Add:**
```
openai@^4.x
@anthropic-ai/sdk@^0.x
nodemailer@^6.x
xlsx@^0.18.x
pdfkit@^0.14.x
bull@^4.x
redis@^4.x
idb@^8.x
```

### .env.example (full replacement)
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/educore_ai
JWT_SECRET=<min_32_chars>
JWT_EXPIRES_IN=1d

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=educore-ai-uploads
AWS_BUCKET_REGION=us-east-1

# Cloudinary
CLOUDINARY_URL=

# Payment
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@educore.ng

# SMS/WhatsApp
TERMII_API_KEY=
TERMII_SENDER_ID=EduCore
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Admin
SUPER_ADMIN_EMAIL=admin@educore.ng
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### New Files
- `models/userModel.js` — Unified 11-role user model (replaces `businessRegistration.js`)
- `models/schoolModel.js` — School/tenant model with subscription management

**Testing:** Verify server boots, MongoDB connects, `GET /` returns 200. No unit tests needed.

---

## Phase 2: Authentication, RBAC, and School Setup
**Timeline:** Days 4–8 | **Depends on:** Phase 1

**Goal:** Full multi-role auth system with 11 roles, JWT, school registration, invitation system.

### New Files

**`controllers/authController.js`** — Functions:
- `register` — create School + User(school_owner) in transaction; send welcome email
- `login`, `logout`, `loginStatus`, `getMe`
- `forgotPassword`, `resetPassword`, `changePassword`
- `inviteUser` — Principal/Owner generates invite link for staff/parent/student
- `acceptInvite` — accept token, set password, activate account

**`controllers/schoolController.js`** — Functions:
- `getSchool`, `updateSchool`, `updateSettings`, `getSchoolStats`, `getAllSchools` (super_admin), `updateSubscription`

**`routes/authRoute.js`**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/logout
GET    /api/auth/me                     → protect
GET    /api/auth/loggedin
PATCH  /api/auth/changepassword         → protect
POST   /api/auth/forgotpassword
PATCH  /api/auth/resetpassword/:token
POST   /api/auth/invite                 → protect → requireRole(['principal','school_owner'])
POST   /api/auth/accept-invite/:token
```

**`routes/schoolRoute.js`**
```
GET    /api/school                      → protect
PATCH  /api/school                      → protect → requireRole(['school_owner','principal'])
PATCH  /api/school/settings             → protect → requireRole(['school_owner','principal'])
GET    /api/school/stats                → protect
GET    /api/admin/schools               → protect → requireRole(['super_admin'])
```

**`middleWare/authMiddleware.js`** — Complete rewrite:
- Looks up `User` model (not `BusinessRegistration`)
- Sets `req.user = { id, role, schoolId, name, email }`
- Populates `req.school`

**`middleWare/requireRole.js`** — New factory function:
```javascript
// requireRole(['principal', 'school_owner'])
// 403 if req.user.role not in allowed list
```

**`middleWare/requireSchool.js`** — Verifies `req.user.school` exists and subscription is active (allows grace period with degraded access).

**`utils/sendEmail.js`** — Complete rewrite using Nodemailer. New templates: `welcome-school`, `invite-user`, `password-reset`, `fee-reminder`, `result-ready`, `attendance-alert`, `report-card`

**`utils/sendSMS.js`** — Complete rewrite using Termii:
```javascript
// POST https://api.ng.termii.com/api/sms/send
// sendSMS(phoneNumber, message)
// sendBulkSMS(phoneNumbers[], message)
// formatNigerianPhone(phone)  // handles 080x, +2348x, 2348x formats
```

**`services/whatsapp/whatsappService.js`** — Complete rewrite using WhatsApp Business Cloud API (Meta):
```javascript
// sendTextMessage(to, message)
// sendDocumentMessage(to, documentUrl, caption)  // for report cards
// sendTemplateMessage(to, templateName, components[])  // for fee reminders
```

**Testing:** `authController.test.js` (register, login, role access), `requireRole.test.js`

---

## Phase 3: Core School Domain Models
**Timeline:** Days 9–13 | **Depends on:** Phase 1 | **Can overlap with Phase 2**

**Goal:** Create all 21 MongoDB models that the rest of the system depends on.

### New Model Files (all in `models/`)

| File | Key Fields |
|------|------------|
| `classModel.js` | school, name, arm, level, classTeacher, students[], subjects[], session |
| `subjectModel.js` | school, name, code, classes[], teachers[], nerdcCode, category |
| `attendanceModel.js` | school, class, date, term, session, records[{student, status, notifiedParent}], takenBy |
| `lessonPlanModel.js` | school, teacher, subject, class, topic, nerdcReference, bloomsTaxonomyLevel[], objectives[], content{intro,development,conclusion}, teachingAids[], aiGenerated, status |
| `schemeOfWorkModel.js` | school, teacher, subject, class, term, session, weeks[{weekNumber, topic, objectives}] |
| `questionModel.js` | school, subject, class, topic, type(mcq/theory/essay/true_false/fill_blank), difficulty, examPattern(waec/neco/jamb/internal/ca), question, options[], answer, rubric[], marks, aiGenerated |
| `examModel.js` | school, subject, class, term, type, scheduledDate, duration, totalMarks, questions[], status, randomizeQuestions, uniquePaperPerStudent |
| `submissionModel.js` | school, exam, student, answers[{question, mcqAnswer, textAnswer, aiScore, aiFeedback, teacherScore, finalScore}], totalScore, percentage, grade, status |
| `resultModel.js` | school, student, class, term, session, subjects[{subject, caScore, examScore, totalScore, grade}], overallPercentage, positionInClass, principalComment, reportCardUrl, status |
| `feeModel.js` | school, title, session, term, class, items[{name, amount, mandatory}], totalAmount, dueDate |
| `paymentModel.js` | school, student, fee, method, transactionRef, amountDue, amountPaid, balance, installments[], status, receiptUrl |
| `timetableModel.js` | school, class, term, slots[{day, period, startTime, endTime, subject, teacher}], aiGenerated, status |
| `academicCalendarModel.js` | school, session, terms[{term, name, startDate, endDate, events[{title, date, type}]}] |
| `libraryBookModel.js` | school, title, author, isbn, subject, classLevel[], quantity, available |
| `bookBorrowModel.js` | school, book, borrowedBy, borrowedAt, dueDate, returnedAt, status |
| `announcementModel.js` | school, title, body, targetAudience[], targetClasses[], sentViaSMS, sentViaWhatsApp |
| `behaviorLogModel.js` | school, student, recordedBy, type(commendation/warning/suspension), description, parentNotified |
| `staffRecordModel.js` | school, user, staffId, qualification[], certifications[], employedDate, performanceLogs[] |
| `syncLogModel.js` | school, user, offlineId(unique idempotency key), type, status, data, syncedAt |

**Testing:** `__tests__/models/schoolModels.test.js` — all schemas compile and required fields enforce.

---

## Phase 4: Student, Teacher, and Staff Management APIs
**Timeline:** Days 14–20 | **Depends on:** Phase 3

### New Files

**`controllers/studentController.js`**
- `createStudent`, `bulkImportStudents` (XLSX/CSV parse), `getStudents`, `getStudentById`
- `updateStudent`, `promoteStudents` (bulk class promotion), `getStudentAcademicHistory`, `deleteStudent`

**`controllers/teacherController.js`**
- `createTeacher`, `getTeachers`, `getTeacherById`, `updateTeacher`
- `assignSubjects`, `getTeacherWorkload`, `getTeacherPerformance`, `deleteTeacher`

**`controllers/attendanceController.js`**
- `markAttendance` — triggers SMS/WhatsApp for absences
- `getAttendanceByDate`, `getAttendanceSummary`, `getClassAttendanceReport`
- `getStudentAttendance` (parent-accessible), `notifyAbsentParents`

**`controllers/classController.js`** — CRUD + `getClassStudents`

**`controllers/subjectController.js`** — CRUD + `assignTeacher`

**Routes**
```
# studentRoute.js
POST   /api/students                    → requireRole(['principal','vp_admin','admin_staff'])
POST   /api/students/bulk-import        → requireRole(['principal','admin_staff']) → upload.single('file')
GET    /api/students/:id
PATCH  /api/students/:id                → requireRole(['principal','admin_staff'])
DELETE /api/students/:id                → requireRole(['principal'])
POST   /api/students/promote            → requireRole(['principal','vp_academics'])
GET    /api/students/:id/history

# attendanceRoute.js
POST   /api/attendance                  → requireRole(['class_teacher','subject_teacher'])
GET    /api/attendance/:classId
GET    /api/attendance/student/:id
GET    /api/attendance/report/:classId
```

**`utils/fileUpload.js`** — Extend filter for `.xlsx`, `.xls`, `.csv`, `.pdf`; add `memoryStorage` config for Excel parsing.

**`utils/cronJobs.js`** — Add:
- `sendOverdueFeeReminders()` — daily 8am
- `sendLibraryOverdueAlerts()` — daily 9am
- `sendAttendanceDailySummary()` — daily 3pm (if configured)

**Testing:** `studentController.test.js` (bulk import, class assignment), `attendanceController.test.js` (SMS trigger, duplicate prevention)

---

## Phase 5: Examination, Results, and Fee Management APIs
**Timeline:** Days 21–30 | **Depends on:** Phase 4

### New Files

**`controllers/examController.js`**
- `createExam`, `getExams`, `publishExam`
- `enterScores` — bulk score entry by class
- `getExamResults`, `getScoreEntry`

**`controllers/resultController.js`**
- `computeTermResults` — triggers result computation engine
- `getResults`, `approveResults`, `releaseResults`
- `generateReportCard` — PDF via pdfkit → S3/Cloudinary
- `generateBroadsheet` — Excel export
- `getParentResults` — parent/student restricted endpoint
- `addPrincipalComment`

**`services/result/resultComputationService.js`** — Core business logic:
- `computeResultsForClass(classId, term, session)` — reads all Exam + Submission records; computes CA+exam totals, grades, positions; creates/updates `Result` documents
- `applyGradingScale(score)` — Nigerian scale: A1(75+), B2(70–74), B3(65–69), C4(60–64), C5(55–59), C6(50–54), D7(45–49), E8(40–44), F9(0–39)
- `computePositions(results[])` — rank students by percentage

**`services/result/reportCardGenerator.js`**
- `generateReportCardPDF(result, student, school, class)` → Buffer (pdfkit)
- `generateBroadsheetXLSX(results[], class, school)` → Buffer (xlsx)

**`controllers/feeController.js`**
- `createFeeSchedule`, `getFeeSchedules`, `getFeeStatus` (per class)
- `recordPayment` — manual cash/bank entry by Bursar
- `initializePaystackPayment`, `verifyPaystackPayment`, `paystackWebhook`
- `initializeFlutterwavePayment`, `verifyFlutterwavePayment`, `flutterwaveWebhook`
- `getStudentFeeStatement`, `generateReceipt`, `getFeeDefaulters`

**Routes**
```
# examRoute.js
POST   /api/exams                       → requireRole(['subject_teacher','class_teacher','vp_academics'])
GET    /api/exams
PATCH  /api/exams/:id/publish           → requireRole(['principal','vp_academics'])
POST   /api/exams/:id/scores            → requireRole(['subject_teacher','class_teacher'])
GET    /api/exams/:id/results

# resultRoute.js
POST   /api/results/compute             → requireRole(['principal','vp_academics'])
GET    /api/results
POST   /api/results/:id/approve         → requireRole(['principal'])
POST   /api/results/release             → requireRole(['principal'])
GET    /api/results/:studentId/report-card
GET    /api/results/broadsheet/:classId → requireRole(['principal','vp_academics'])
GET    /api/results/parent/:studentId   → requireRole(['parent','student'])

# feeRoute.js
POST   /api/fees                        → requireRole(['principal','bursar'])
GET    /api/fees
GET    /api/fees/status/:classId
POST   /api/fees/payment                → requireRole(['bursar','parent'])
POST   /api/fees/payment/paystack
GET    /api/fees/payment/paystack/verify
POST   /api/fees/webhook/paystack       (HMAC verified, no auth)
POST   /api/fees/payment/flutterwave
POST   /api/fees/webhook/flutterwave
GET    /api/fees/statement/:studentId
GET    /api/fees/defaulters             → requireRole(['bursar','principal'])
```

**Testing:** `resultComputation.test.js` (grade calc, position ranking, tied scores), `feeController.test.js` (Paystack HMAC, installment tracking)

---

## Phase 6: AI Modules
**Timeline:** Days 31–42 | **Depends on:** Phase 3 | **Can run parallel to Phases 4–5**

**Goal:** Four AI capabilities using OpenAI GPT-4o + Anthropic Claude with dual-provider fallback.

### New Files (all in `ai/`)

**`ai/aiClient.js`**
- `getOpenAIClient()`, `getAnthropicClient()`
- `callAI(provider, prompt, options)` — standardized response; `provider='auto'` tries OpenAI first, falls back to Anthropic
- Implements Anthropic prompt caching (`cache_control: ephemeral`)
- Exponential backoff on rate limits

**`ai/nerdc_curriculum.json`** — Static reference file mapping all Nigerian curriculum subjects → topics by class level and term. Injected into every AI prompt as system context.

**`ai/lessonPlanGenerator.js`**
- `generateLessonPlan(params)` → structured JSON matching `LessonPlan` schema
- `generateSchemeOfWork(params)` → week-by-week term breakdown
- `suggestTeachingAids(topic, subject, classLevel)` → string[]

**`ai/questionGenerator.js`**
- `generateQuestions(params)` → `Question[]` — params include type, count, difficulty, examPattern
- `generateExamPaper(params)` → `{ questions[], instructions, totalMarks }`
- `shuffleExamPaper(questions[])` → randomized order + options

**`ai/gradingEngine.js`**
- `gradeMCQ(submission)` — pure function; no AI needed
- `gradeShortAnswer(question, studentAnswer)` — keyword matching + AI semantic analysis
- `gradeEssay(question, studentAnswer, rubric)` — full AI rubric-based grading + written feedback
- `gradeSubmission(submission)` — orchestrates all types
- `computeCAScore(examScores[], caWeight)` → weighted average

**`ai/commentGenerator.js`**
- `generatePrincipalComment(result, schoolName)` — contextual Nigerian English comment; falls back to template if AI unavailable
- `generateClassTeacherComment(result)` → String
- `suggestLearningRecommendations(result)` → String[] (3–5 items)

**`ai/timetableGenerator.js`**
- `generateTimetable(params)` — constraint satisfaction; no teacher double-booked in same period
- `detectClashes(slots[])` → clashes[]

**`controllers/aiController.js`** — Functions:
- `generateLessonPlan`, `generateSchemeOfWork`, `generateQuestions`, `generateExamPaper`
- `gradeSubmission`, `generateComments`, `getAIUsageStats`

**`routes/aiRoute.js`**
```
POST   /api/ai/lesson-plan              → requireRole(['subject_teacher','class_teacher','vp_academics'])
POST   /api/ai/scheme-of-work          → requireRole(['subject_teacher','class_teacher'])
POST   /api/ai/questions               → requireRole(['subject_teacher','class_teacher','vp_academics'])
POST   /api/ai/exam-paper              → requireRole(['subject_teacher','vp_academics'])
POST   /api/ai/grade/:submissionId
POST   /api/ai/comments/:resultId      → requireRole(['principal','vp_academics'])
GET    /api/ai/usage                   → requireRole(['principal','school_owner'])
```

### Key AI Design Decisions
1. **Dual provider with automatic fallback** — critical for Nigerian network reliability
2. **NERDC curriculum embedding** — `nerdc_curriculum.json` loaded at startup, injected into every lesson/question prompt
3. **Token budgeting** — monthly AI token quota tracked in `schoolModel.subscription`; AI calls check budget before executing
4. **Offline graceful degradation** — returns HTTP 503 with `{ offlineMode: true, templateFallback: {...} }` when providers unreachable

**Testing:** `lessonPlanGenerator.test.js` (mock responses, prompt construction, schema compliance), `gradingEngine.test.js` (MCQ accuracy, essay rubric parsing), `questionGenerator.test.js` (WAEC pattern compliance)

---

## Phase 7: Timetable, Library, and Announcements
**Timeline:** Days 43–50 | **Depends on:** Phases 3–4

### New Files

**`controllers/timetableController.js`** — `generateTimetable`, `getTimetable`, `updateTimetableSlot`, `publishTimetable`

**`controllers/calendarController.js`** — CRUD for academic calendar and events; `getPublicCalendar` for parents

**`controllers/libraryController.js`** — Book CRUD; `borrowBook` (decrement available count); `returnBook`; `getOverdueBooks`; `getBorrowHistory`

**`controllers/announcementController.js`** — `createAnnouncement` (queues bulk SMS/WhatsApp if enabled); role-filtered `getAnnouncements`; CRUD + pin

**`controllers/behaviorController.js`** — `logBehavior` (optional parent notification); `getBehaviorLogs`; `updateBehaviorLog`

Routes: `timetableRoute.js`, `calendarRoute.js`, `libraryRoute.js`, `announcementRoute.js`, `behaviorRoute.js`

**`utils/cronJobs.js`** — Add `sendLibraryOverdueAlerts()` (daily 9am; find overdue borrows; SMS/WhatsApp reminder)

**Testing:** `timetableGenerator.test.js` (clash detection), `libraryController.test.js` (borrow/return state machine)

---

## Phase 8: Analytics, Reporting, and Offline-First Backend
**Timeline:** Days 51–58 | **Depends on:** Phases 4–7

### New Files

**`controllers/analyticsController.js`**
- `getSchoolDashboard` — enrollment, attendance rate (30 days), fee collection rate, top/bottom subjects
- `getSubjectPerformance` — per subject averages by class and term
- `getAttendanceAnalytics` — attendance trends; flag students with >20% absences
- `getFeeAnalytics` — expected vs collected, collection rate per class
- `getTeacherEffectiveness` — lesson plan submissions correlated with class outcomes
- `generateEMISReport` — EMIS-compliant JSON + Excel export
- `generateNEMISReport` — NEMIS enrollment format export
- `getStudentProgressReport` — individual trajectory across terms

**`controllers/syncController.js`** — Offline sync:
- `processSyncBatch(req, res)` — body: `{ batches: [{type, data, offlineId, createdAt}] }`; checks idempotency via `offlineId`; returns `{ synced[], failed[], conflicts[] }`
- `getSyncState(req, res)` — last sync timestamp, pending counts

**`routes/analyticsRoute.js`**, **`routes/syncRoute.js`**

**`events/EventEmitter.js`** — Replace EventTypes:
```javascript
const EventTypes = {
  ATTENDANCE_MARKED: 'attendance.marked',
  STUDENT_ABSENT: 'student.absent',
  RESULTS_RELEASED: 'results.released',
  REPORT_CARD_READY: 'report_card.ready',
  PAYMENT_RECEIVED: 'payment.received',
  FEE_DEFAULTER_ALERT: 'fee.defaulter_alert',
  AI_LESSON_GENERATED: 'ai.lesson_generated',
  AI_QUESTIONS_GENERATED: 'ai.questions_generated',
  ANNOUNCEMENT_CREATED: 'announcement.created',
  SYNC_COMPLETED: 'sync.completed',
};
```

**`events/SSEManager.js`** — Replace `businessId` with `schoolId` throughout

**`start.js`** — Register new change streams:
```javascript
changeStreamManager.initializeStream('attendance', Attendance.collection);
changeStreamManager.initializeStream('results', Result.collection);
changeStreamManager.initializeStream('payments', Payment.collection);
changeStreamManager.initializeStream('announcements', Announcement.collection);
```

**Testing:** `analyticsController.test.js` (aggregation pipelines, empty school edge case), `syncController.test.js` (idempotency, conflict detection)

---

## Phase 9: Frontend — React Complete Rebuild
**Timeline:** Days 59–85 | **Can begin auth pages from Phase 2**

### Redux Slices (replace all in `client/src/redux/features/`)

| Slice | Manages |
|-------|---------|
| `authSlice.js` | `{ user, token, isLoggedIn, school, loading }` |
| `schoolSlice.js` | `{ school, settings, stats, loading }` |
| `studentSlice.js` | `{ students, student, pagination, importResult, loading }` |
| `teacherSlice.js` | `{ teachers, teacher, workload, loading }` |
| `attendanceSlice.js` | `{ records, summary, loading, pendingSync[] }` |
| `examSlice.js` | `{ exams, exam, scoreEntry, loading }` |
| `resultSlice.js` | `{ results, result, reportCardUrl, loading }` |
| `feeSlice.js` | `{ schedules, payments, statement, defaulters, loading }` |
| `aiSlice.js` | `{ lessonPlan, questions, schemeOfWork, grading, loading, tokenUsage }` |
| `timetableSlice.js` | `{ timetable, loading }` |
| `calendarSlice.js` | `{ calendar, loading }` |
| `librarySlice.js` | `{ books, borrows, loading }` |
| `announcementSlice.js` | `{ announcements, loading }` |
| `analyticsSlice.js` | `{ dashboard, subjectReport, attendanceReport, feeReport, loading }` |
| `offlineSyncSlice.js` | `{ pendingBatches[], lastSyncAt, syncStatus }` |
| `realtimeSlice.js` | Keep structure; update event types |

### Pages Structure (`client/src/pages/`)

**Auth:** `Login.jsx`, `Register.jsx`, `Forgot.jsx`, `Reset.jsx`, `AcceptInvite.jsx`

**Dashboard:** `dashboard/Dashboard.jsx` — role-aware (principal sees school stats; teacher sees class/lessons; parent sees child info)

**Students:** `Students.jsx`, `StudentDetail.jsx`, `AddStudent.jsx`, `BulkImport.jsx` (drag-drop CSV/Excel with preview)

**Teachers:** `Teachers.jsx`, `TeacherDetail.jsx`, `AddTeacher.jsx`

**Classes & Subjects:** `Classes.jsx`, `ClassDetail.jsx`, `Subjects.jsx`

**Attendance:** `AttendanceMark.jsx` (works offline → IndexedDB), `AttendanceReport.jsx`, `AttendanceHistory.jsx`

**Lesson Plans (AI):** `LessonPlans.jsx`, `GenerateLessonPlan.jsx` (AI generation + editable output), `LessonPlanDetail.jsx`, `SchemeOfWork.jsx`

**Exams & Questions:** `Exams.jsx`, `ExamDetail.jsx`, `CreateExam.jsx`, `ScoreEntry.jsx` (offline capable), `QuestionBank.jsx`, `GenerateQuestions.jsx`

**Results:** `Results.jsx`, `ResultDetail.jsx`, `ReportCard.jsx`, `Broadsheet.jsx` (Excel export)

**Fees:** `FeeSchedules.jsx`, `FeeCollection.jsx`, `PaymentHistory.jsx`, `FeeDefaulters.jsx` (bulk notification button)

**Timetable & Calendar:** `Timetable.jsx`, `GenerateTimetable.jsx`, `AcademicCalendar.jsx`

**Library:** `Library.jsx`, `BorrowReturn.jsx`, `OverdueBooks.jsx`

**Communications:** `Announcements.jsx`, `CreateAnnouncement.jsx` (rich text + audience picker + delivery channels)

**Analytics:** `Analytics.jsx`, `SubjectPerformance.jsx`, `AttendanceAnalytics.jsx`, `TeacherEffectiveness.jsx`, `EMISReport.jsx`

**Parent Portal:** `ParentDashboard.jsx`, `ParentResults.jsx`, `ParentFees.jsx` (Paystack payment initiation)

**Student Portal:** `StudentDashboard.jsx`, `StudentResults.jsx`, `StudentExams.jsx`

**Admin:** `SuperAdmin.jsx`, `SchoolDetail.jsx`

**Profile:** `Profile.jsx`

### Client Services (`client/src/services/`)
`authService.js`, `studentService.js`, `teacherService.js`, `attendanceService.js`, `examService.js`, `resultService.js`, `feeService.js`, `aiService.js` (streaming response handler for long AI calls), `timetableService.js`, `analyticsService.js`, `offlineSyncService.js` (reads IndexedDB, posts batches)

### Offline-First (`client/src/utils/`)

**`offlineDB.js`** — IndexedDB using `idb` library:
```javascript
// Database: educore_offline_v1
// Stores: attendance_pending, submissions_pending, lesson_plans_cache, results_cache
// Functions: addPendingAttendance, getPendingAttendance, clearPendingAttendance,
//            cacheLessonPlan, getCachedLessonPlan, cacheResult
```

**`offlineSync.js`**
- `syncPendingData()` — reads IndexedDB, posts to `/api/sync/batch`, clears synced records
- `registerBackgroundSync()` — ServiceWorker Background Sync API; falls back to polling

**`service-worker.js`** changes:
- `NetworkFirst` for all `/api/` calls
- `CacheFirst` for `/api/lesson-plans/:id`
- `StaleWhileRevalidate` for analytics
- Register `sync` event for Background Sync

### Custom Hooks
**New:** `useOfflineSync.js` (detects online/offline, triggers sync on reconnect), `useRoleGuard.js`, `useSchoolSettings.js`
**Keep:** `useAsyncButton.js`, `useAsyncToast.js`, `useNotification.js`, `useRedirectLoggedOutUser.js`, `useRealtime.js`

### Layout Sidebar
```
Overview: Dashboard
Academic: Classes, Subjects, Timetable, Calendar
People: Students, Teachers, Parents
Teaching: Lesson Plans, Scheme of Work, Question Bank
Assessments: Exams, Results, Report Cards
Finance: Fee Schedules, Payments, Defaulters
Library: Books, Borrows
Communication: Announcements
Analytics (principal+ only)
Admin (super_admin only)
```
Parents and students see a minimal role-filtered sidebar.

### client/package.json changes
**Add:** `idb@^8.x`, `workbox-background-sync@^7.x`, `@paystack/inline-js`
**Remove:** `flutterwave-react-v3`, `electron-pos-printer`
**Keep:** Recharts, Redux Toolkit, React Router, Bootstrap, antd, Sass, Sonner, react-icons, axios, moment

---

## Phase 10: Integration, Hardening, and Production Readiness
**Timeline:** Days 86–100 | **Depends on:** All phases

### server.js — Mount all 19 routes
```javascript
app.use('/api/auth', authRoute);
app.use('/api/school', schoolRoute);
app.use('/api/students', studentRoute);
app.use('/api/teachers', teacherRoute);
app.use('/api/classes', classRoute);
app.use('/api/subjects', subjectRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/lesson-plans', lessonPlanRoute);
app.use('/api/exams', examRoute);
app.use('/api/results', resultRoute);
app.use('/api/fees', feeRoute);
app.use('/api/ai', aiRoute);
app.use('/api/timetable', timetableRoute);
app.use('/api/calendar', calendarRoute);
app.use('/api/library', libraryRoute);
app.use('/api/announcements', announcementRoute);
app.use('/api/behavior', behaviorRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/sync', syncRoute);
```

### New Files

**`middleWare/schoolScopeMiddleware.js`** — Globally filters all queries by `school: req.user.school`. Prevents cross-school data leakage.

**`jobs/feeReminderJob.js`** — Daily 7am cron; finds unpaid/partial fees past due; batches SMS/WhatsApp; rate-limits to 50 messages/min

**`jobs/resultReleaseNotificationJob.js`** — On-demand (called after `releaseResults`); sends WhatsApp/SMS to each student's parents

**`jobs/libraryOverdueJob.js`** — Daily 9am; finds overdue borrows; sends reminders

**`scripts/seedNERDCData.js`** — Seeds NERDC curriculum topics as reference data

**`scripts/seedDemoSchool.js`** — Creates sample school with 10 classes, 15 teachers, 200 students, sample results and fee data

**`validators/schoolValidators.js`** — `express-validator` chains for student creation, bulk import, exam creation, fee schedule, score entry

### Integration Tests
- `__tests__/integration/fullStudentLifecycle.test.js` — register school → create class → add student → mark attendance → create exam → enter scores → compute results → generate report card
- `__tests__/integration/aiWorkflow.test.js` — generate lesson plan → save → generate questions → create exam → grade submission
- `__tests__/integration/paymentFlow.test.js` — create fee → Paystack payment → webhook → balance updated → receipt generated
- `__tests__/integration/offlineSync.test.js` — attendance to sync queue → process batch → verify idempotency

### Performance Hardening
- Add MongoDB compound indexes to all models: `{ school: 1, createdAt: -1 }` on all collections; `{ student: 1, term: 1, session: 1 }` on results; `{ class: 1, date: 1 }` on attendance
- Add `compression` middleware for low-bandwidth optimization
- Apply `cursorPagination.js` to all list endpoints

### NDPR Compliance
- `select: false` on all sensitive fields: `parentProfile.childIds`, student health notes, staff salary
- Data retention: 90-day activity log cleanup (update existing cron)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options` in `server.js`

---

## Phase Dependency Graph

```
Phase 1 (Teardown)
    └── Phase 2 (Auth + School)
            └── Phase 3 (All Models)  ←── can overlap with Phase 2
                    ├── Phase 4 (Student/Teacher/Attendance)
                    ├── Phase 5 (Exam/Results/Fee)        ← needs Phase 4
                    ├── Phase 6 (AI Modules)               ← parallel with 4-5
                    └── Phase 7 (Timetable/Library)        ← needs Phase 3-4
                            └── Phase 8 (Analytics/Offline)
                                    └── Phase 9 (Frontend)  ← can begin at Phase 2
                                            └── Phase 10 (Integration)
```

Phases 4, 5, 6, and 7 can run in parallel once Phase 3 is complete. Frontend Phase 9 can begin auth/school pages as soon as Phase 2 is done.

---

## Complete File Registry

### New Backend Files

**Models (21):** `userModel.js`, `schoolModel.js`, `classModel.js`, `subjectModel.js`, `attendanceModel.js`, `lessonPlanModel.js`, `schemeOfWorkModel.js`, `questionModel.js`, `examModel.js`, `submissionModel.js`, `resultModel.js`, `feeModel.js`, `paymentModel.js`, `timetableModel.js`, `academicCalendarModel.js`, `libraryBookModel.js`, `bookBorrowModel.js`, `announcementModel.js`, `behaviorLogModel.js`, `staffRecordModel.js`, `syncLogModel.js`

**Controllers (18):** `authController.js`, `schoolController.js`, `studentController.js`, `teacherController.js`, `classController.js`, `subjectController.js`, `attendanceController.js`, `examController.js`, `resultController.js`, `feeController.js`, `aiController.js`, `timetableController.js`, `calendarController.js`, `libraryController.js`, `announcementController.js`, `behaviorController.js`, `analyticsController.js`, `syncController.js`

**Routes (19):** `authRoute.js`, `schoolRoute.js`, `studentRoute.js`, `teacherRoute.js`, `classRoute.js`, `subjectRoute.js`, `attendanceRoute.js`, `examRoute.js`, `resultRoute.js`, `feeRoute.js`, `aiRoute.js`, `timetableRoute.js`, `calendarRoute.js`, `libraryRoute.js`, `announcementRoute.js`, `behaviorRoute.js`, `analyticsRoute.js`, `syncRoute.js`, `lessonPlanRoute.js`

**AI Modules (7):** `ai/aiClient.js`, `ai/lessonPlanGenerator.js`, `ai/questionGenerator.js`, `ai/gradingEngine.js`, `ai/commentGenerator.js`, `ai/timetableGenerator.js`, `ai/nerdc_curriculum.json`

**Services (2):** `services/result/resultComputationService.js`, `services/result/reportCardGenerator.js`

**Middleware (3):** `middleWare/requireRole.js`, `middleWare/requireSchool.js`, `middleWare/schoolScopeMiddleware.js`

**Jobs (3):** `jobs/feeReminderJob.js`, `jobs/resultReleaseNotificationJob.js`, `jobs/libraryOverdueJob.js`

**Scripts (2):** `scripts/seedNERDCData.js`, `scripts/seedDemoSchool.js`

**Validators (1):** `validators/schoolValidators.js`

### Critical Files (Implement These First)

1. `models/userModel.js` — every phase references this
2. `middleWare/authMiddleware.js` — gates every API endpoint
3. `ai/aiClient.js` — all four AI modules depend on it
4. `services/result/resultComputationService.js` — most complex business logic; required before report cards
5. `client/src/utils/offlineDB.js` — required before service worker offline strategy can function
