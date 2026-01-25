# EduCore Admin Data Creation Guide

This guide walks you through creating accounts and populating data manually in your EduCore platform. Follow the steps in order to build a complete, functional system.

---

## Overview

You'll create data in this sequence:
1. **School Profile** (system info)
2. **Admin Account** (your account)
3. **Academic Terms**
4. **Classes**
5. **Subjects**
6. **Staff/Teachers**
7. **Students**
8. **Parents**
9. **Enrollments & Assignments**
10. **Financial Setup**

---

## Prerequisites

- Admin access to Supabase Dashboard
- Access to EduCore Admin Interface
- Phone numbers for all users (required for login)
- Email addresses for all users

---

## STEP 1: School Profile Setup

Your school is already created during initial setup. You can verify/update it:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to check your school:
   ```sql
   SELECT id, name, address, phone, contact_email FROM schools;
   ```

**Update school details if needed:**
```sql
UPDATE schools 
SET name = 'Your School Name',
    address = 'Full Address',
    phone = '+234 XXX XXXX XXX',
    contact_email = 'admin@yourschool.edu.ng',
    website = 'https://yourschool.edu.ng'
WHERE id = '<your_school_id>';
```

**Copy your School ID** - you'll need it for all subsequent operations.

---

## STEP 2: Create Admin Account

### Option A: Via Supabase Dashboard (Recommended for first admin)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `admin@yourschool.edu.ng`
   - Password: Create a strong password (min 8 chars, uppercase, lowercase, number, special char)
4. Copy the new User ID

### Option B: Via EduCore If Admin Exists
Skip this if you already have admin access.

### Create Admin Profile

Once you have the auth user ID, create the profile in the database:

```sql
INSERT INTO users (
  id,
  school_id,
  full_name,
  email,
  role,
  phone_number
) VALUES (
  '<admin_auth_user_id>',
  '<your_school_id>',
  'Chief Administrator',
  'admin@yourschool.edu.ng',
  'admin',
  '+234 801 111 1111'
);
```

---

## STEP 3: Create Academic Terms

Terms define the academic calendar. Create at least one term.

```sql
INSERT INTO terms (
  school_id,
  name,
  start_date,
  end_date,
  is_active,
  grade_scale
) VALUES (
  '<your_school_id>',
  'First Term 2025/2026',
  '2025-09-01',
  '2025-12-15',
  true,
  '{"A": {"min": 80, "max": 100}, "B": {"min": 70, "max": 79}, "C": {"min": 60, "max": 69}, "D": {"min": 50, "max": 59}, "F": {"min": 0, "max": 49}}'::jsonb
);
```

**Create multiple terms by repeating with different dates:**

| Term | Start Date | End Date | Active |
|------|-----------|----------|--------|
| First Term | 2025-09-01 | 2025-12-15 | true |
| Second Term | 2026-01-12 | 2026-04-15 | false |
| Third Term | 2026-05-01 | 2026-07-31 | false |

---

## STEP 4: Create Classes

Classes are academic groups (e.g., SS1A, SS2A).

```sql
INSERT INTO classes (
  school_id,
  name,
  level,
  class_teacher_id,
  capacity
) VALUES (
  '<your_school_id>',
  'SS1A',
  'Secondary 1',
  NULL,
  45
);

INSERT INTO classes (
  school_id,
  name,
  level,
  class_teacher_id,
  capacity
) VALUES (
  '<your_school_id>',
  'SS2A',
  'Secondary 2',
  NULL,
  40
);

INSERT INTO classes (
  school_id,
  name,
  level,
  class_teacher_id,
  capacity
) VALUES (
  '<your_school_id>',
  'SS3A',
  'Secondary 3',
  NULL,
  35
);
```

**Copy the Class IDs** - needed when assigning teachers and students.

---

## STEP 5: Create Subjects

Subjects are courses taught in your school.

```sql
INSERT INTO subjects (school_id, name, code, description) 
VALUES 
  ('<your_school_id>', 'Mathematics', 'MTH101', 'Pure and applied mathematics'),
  ('<your_school_id>', 'English Language', 'ENG101', 'English communication and literature'),
  ('<your_school_id>', 'Physics', 'PHY101', 'Physics and practical experiments'),
  ('<your_school_id>', 'Chemistry', 'CHM101', 'Chemistry and laboratory work'),
  ('<your_school_id>', 'Biology', 'BIO101', 'Biology and life sciences');
```

**Copy the Subject IDs** - needed for staff assignments.

---

## STEP 6: Create Staff/Teachers

### Step 6A: Create Auth Accounts for Teachers

For each teacher, create an auth account in Supabase Dashboard:
1. Go to **Authentication** → **Users** → **Add User**
2. Enter email and generate temporary password
3. Copy the User ID

### Step 6B: Create Teacher Profiles

Once you have the auth user IDs, create profiles:

```sql
INSERT INTO users (
  id,
  school_id,
  full_name,
  email,
  role,
  staff_id,
  phone_number
) VALUES
  ('<teacher1_auth_id>', '<your_school_id>', 'Mr. Adebayo Toheeb', 'teacher1@school.edu.ng', 'staff', 'STAFF/2026/001', '+234 802 222 2222'),
  ('<teacher2_auth_id>', '<your_school_id>', 'Mrs. Patrick Oladipupo', 'teacher2@school.edu.ng', 'staff', 'STAFF/2026/002', '+234 803 333 3333'),
  ('<teacher3_auth_id>', '<your_school_id>', 'Dr. Chioma Njoku', 'teacher3@school.edu.ng', 'staff', 'STAFF/2026/003', '+234 804 444 4444');
```

### Step 6C: Assign Teachers to Classes and Subjects

After creating teacher profiles, assign them:

```sql
INSERT INTO staff_assignments (
  school_id,
  staff_id,
  class_id,
  subject_id,
  start_date
) VALUES
  ('<your_school_id>', '<teacher1_id>', '<ss1a_class_id>', '<mathematics_subject_id>', '2025-09-01'),
  ('<your_school_id>', '<teacher2_id>', '<ss1a_class_id>', '<english_subject_id>', '2025-09-01'),
  ('<your_school_id>', '<teacher3_id>', '<ss2a_class_id>', '<physics_subject_id>', '2025-09-01');
```

### Step 6D: Assign Class Teachers

Once you have staff assigned to classes, set them as class teachers:

```sql
UPDATE classes 
SET class_teacher_id = '<teacher1_id>'
WHERE name = 'SS1A' AND school_id = '<your_school_id>';

UPDATE classes 
SET class_teacher_id = '<teacher2_id>'
WHERE name = 'SS2A' AND school_id = '<your_school_id>';
```

---

## STEP 7: Create Students

### Step 7A: Create Auth Accounts for Students

For each student:
1. Go to **Supabase** → **Authentication** → **Users** → **Add User**
2. Enter email (e.g., `student1@school.edu.ng`)
3. Generate temporary password
4. Copy the User ID

### Step 7B: Create Student Profiles

```sql
INSERT INTO users (
  id,
  school_id,
  full_name,
  email,
  role,
  admission_number,
  phone_number
) VALUES
  ('<student1_auth_id>', '<your_school_id>', 'John Doe', 'student1@school.edu.ng', 'student', 'STUD/2026/001', '+234 706 111 1111'),
  ('<student2_auth_id>', '<your_school_id>', 'Jane Smith', 'student2@school.edu.ng', 'student', 'STUD/2026/002', '+234 707 222 2222'),
  ('<student3_auth_id>', '<your_school_id>', 'Chidi Obi', 'student3@school.edu.ng', 'student', 'STUD/2026/003', '+234 708 333 3333'),
  ('<student4_auth_id>', '<your_school_id>', 'Amara Eze', 'student4@school.edu.ng', 'student', 'STUD/2026/004', '+234 709 444 4444'),
  ('<student5_auth_id>', '<your_school_id>', 'Tunde Alabi', 'student5@school.edu.ng', 'student', 'STUD/2026/005', '+234 710 555 5555');
```

---

## STEP 8: Create Parents

### Step 8A: Create Auth Accounts for Parents

For each parent:
1. Go to **Supabase** → **Authentication** → **Users** → **Add User**
2. Enter email (e.g., `parent1@yourmail.com`)
3. Generate temporary password
4. Copy the User ID

### Step 8B: Create Parent Profiles

Note: `linked_students` is an array of student IDs that the parent supervises.

```sql
INSERT INTO users (
  id,
  school_id,
  full_name,
  email,
  role,
  phone_number,
  linked_students
) VALUES
  ('<parent1_auth_id>', '<your_school_id>', 'Mr. James Doe', 'parent1@mail.com', 'parent', '+234 811 111 1111', ARRAY['<student1_id>', '<student2_id>']),
  ('<parent2_auth_id>', '<your_school_id>', 'Mrs. Ngozi Obi', 'parent2@mail.com', 'parent', '+234 812 222 2222', ARRAY['<student3_id>']),
  ('<parent3_auth_id>', '<your_school_id>', 'Mr. Bade Alabi', 'parent3@mail.com', 'parent', '+234 813 333 3333', ARRAY['<student4_id>', '<student5_id>']);
```

---

## STEP 9: Enroll Students in Classes

Link students to their classes:

```sql
INSERT INTO student_classes (
  school_id,
  student_id,
  class_id,
  enrollment_date,
  status
) VALUES
  ('<your_school_id>', '<student1_id>', '<ss1a_class_id>', '2025-09-01', 'active'),
  ('<your_school_id>', '<student2_id>', '<ss1a_class_id>', '2025-09-01', 'active'),
  ('<your_school_id>', '<student3_id>', '<ss2a_class_id>', '2025-09-01', 'active'),
  ('<your_school_id>', '<student4_id>', '<ss2a_class_id>', '2025-09-01', 'active'),
  ('<your_school_id>', '<student5_id>', '<ss3a_class_id>', '2025-09-01', 'active');
```

---

## STEP 10: Link Parents to Students

Create parent-student relationships:

```sql
INSERT INTO parent_student_links (
  school_id,
  student_id,
  parent_id,
  relationship
) VALUES
  ('<your_school_id>', '<student1_id>', '<parent1_id>', 'Father'),
  ('<your_school_id>', '<student2_id>', '<parent1_id>', 'Father'),
  ('<your_school_id>', '<student3_id>', '<parent2_id>', 'Mother'),
  ('<your_school_id>', '<student4_id>', '<parent3_id>', 'Father'),
  ('<your_school_id>', '<student5_id>', '<parent3_id>', 'Father');
```

---

## STEP 11: Financial Setup - Create Parent Wallets

Parents need wallet accounts to pay fees:

```sql
INSERT INTO parent_wallets (
  school_id,
  parent_id,
  balance,
  total_funded,
  total_spent
) VALUES
  ('<your_school_id>', '<parent1_id>', 500000.00, 500000.00, 0.00),
  ('<your_school_id>', '<parent2_id>', 250000.00, 250000.00, 0.00),
  ('<your_school_id>', '<parent3_id>', 750000.00, 750000.00, 0.00);
```

---

## STEP 12: Create Invoices (Optional - For Testing)

Create sample invoices for students:

```sql
INSERT INTO invoices (
  school_id,
  student_id,
  amount,
  status,
  due_date,
  description
) VALUES
  ('<your_school_id>', '<student1_id>', 150000.00, 'unpaid', '2025-10-15', 'Second Term Tuition'),
  ('<your_school_id>', '<student2_id>', 150000.00, 'unpaid', '2025-10-15', 'Second Term Tuition'),
  ('<your_school_id>', '<student3_id>', 140000.00, 'unpaid', '2025-10-15', 'Second Term Tuition');
```

---

## STEP 13: Add Sample Attendance (Optional)

Track attendance for students:

```sql
INSERT INTO attendance (
  school_id,
  student_id,
  class_id,
  teacher_id,
  date,
  status,
  remarks
) VALUES
  ('<your_school_id>', '<student1_id>', '<ss1a_class_id>', '<teacher1_id>', CURRENT_DATE, 'present', NULL),
  ('<your_school_id>', '<student2_id>', '<ss1a_class_id>', '<teacher1_id>', CURRENT_DATE, 'present', NULL),
  ('<your_school_id>', '<student3_id>', '<ss2a_class_id>', '<teacher2_id>', CURRENT_DATE, 'late', 'Traffic delay'),
  ('<your_school_id>', '<student4_id>', '<ss2a_class_id>', '<teacher2_id>', CURRENT_DATE, 'absent', 'Medical appointment');
```

---

## STEP 14: Add Sample Results (Optional)

Create academic results:

```sql
INSERT INTO results (
  school_id,
  student_id,
  class_id,
  subject_id,
  teacher_id,
  term,
  session,
  ca_score,
  exam_score,
  total_score,
  grade,
  remarks
) VALUES
  ('<your_school_id>', '<student1_id>', '<ss1a_class_id>', '<mathematics_subject_id>', '<teacher1_id>', 'First Term', '2025/2026', 25, 60, 85, 'A', 'Excellent performance'),
  ('<your_school_id>', '<student1_id>', '<ss1a_class_id>', '<english_subject_id>', '<teacher2_id>', 'First Term', '2025/2026', 22, 55, 77, 'A', 'Very good'),
  ('<your_school_id>', '<student2_id>', '<ss1a_class_id>', '<mathematics_subject_id>', '<teacher1_id>', 'First Term', '2025/2026', 20, 45, 65, 'B', 'Good performance');
```

---

## Quick Reference: Sample Data Template

Print and fill in this table as you create accounts:

| User Type | Full Name | Email | Phone | Role | Auth ID | Profile ID |
|-----------|-----------|-------|-------|------|---------|-----------|
| Admin | Chief Admin | admin@school.edu.ng | +234 801 111 1111 | admin | ? | ? |
| Teacher 1 | Mr. Teacher | teacher1@school.edu.ng | +234 802 222 2222 | staff | ? | ? |
| Teacher 2 | Mrs. Teacher | teacher2@school.edu.ng | +234 803 333 3333 | staff | ? | ? |
| Student 1 | John Doe | student1@school.edu.ng | +234 706 111 1111 | student | ? | ? |
| Student 2 | Jane Smith | student2@school.edu.ng | +234 707 222 2222 | student | ? | ? |
| Parent 1 | Mr. Parent | parent1@mail.com | +234 811 111 1111 | parent | ? | ? |

---

## Troubleshooting

**Users can't log in:**
- Ensure phone numbers are formatted correctly (+234 XXX XXXX XXX)
- Verify user accounts exist in Supabase Authentication
- Check that profiles exist in the `users` table with matching IDs

**Missing data in dashboard:**
- Verify school_id is correct in all INSERT statements
- Check that class/subject/teacher IDs match exactly
- Confirm enrollments are created before assigning results

**Staff assignments not showing:**
- Ensure `staff_id` matches the teacher's user ID
- Verify `class_id` and `subject_id` exist
- Check that the teacher profile has `role = 'staff'`

---

## Next Steps After Data Creation

1. **Log in** with admin account
2. Go to `/admin` to access admin dashboard
3. Use **User Management** to verify all accounts created
4. Use **Payment Tracking** to monitor financial data
5. Check **Audit Logs** to see activity
