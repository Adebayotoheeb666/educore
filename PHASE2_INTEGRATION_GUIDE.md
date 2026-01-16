# Phase 2: Student Portal - Integration & Implementation Guide

**Status**: Components Complete & Ready for Integration  
**Files Created**: 5 new components (1,600+ lines of code)  
**Estimated Integration Time**: 4-6 hours  
**Testing Time**: 2-3 hours  

---

## 📦 Components Created

### 1. PerformanceChart.tsx (302 lines)
**Purpose**: Interactive visualization of student's academic progress over time

**Features**:
- Line chart showing average score trend across terms
- Bar chart showing current term performance by subject
- Subject trend indicators (improving/declining/stable)
- Performance gauge for each subject
- Grade distribution summary

**Props**:
```typescript
interface PerformanceChartProps {
  results: ExamResult[];
  terms?: Array<{ id: string; name: string; startDate: string; endDate: string }>;
}
```

**Usage**:
```typescript
import { PerformanceChart } from '../components/StudentPortal/PerformanceChart';

<PerformanceChart 
  results={studentResults}
  terms={schoolTerms}
/>
```

---

### 2. SubjectBreakdown.tsx (373 lines)
**Purpose**: Detailed breakdown of performance in each subject

**Features**:
- Subject cards with CA, Exam, Total, Grade
- Performance status indicators
- Trend comparison with previous term
- Expandable cards for detailed information
- Overall subject summary statistics
- Recommended actions based on performance

**Props**:
```typescript
interface SubjectBreakdownProps {
  results: ExamResult[];
  currentTermId?: string;
}
```

**Usage**:
```typescript
import { SubjectBreakdown } from '../components/StudentPortal/SubjectBreakdown';

<SubjectBreakdown 
  results={studentResults}
  currentTermId={activeTerm.id}
/>
```

---

### 3. StudyPlan.tsx (327 lines)
**Purpose**: AI-generated personalized study recommendations

**Features**:
- Auto-generates on component mount
- Shows overall academic assessment
- Lists strengths and areas to improve
- Provides prioritized action plan
- Rate limiting for API calls (protects from excessive Gemini usage)
- Loading states and error handling
- "Regenerate Plan" button for manual updates

**Props**:
```typescript
interface StudyPlanProps {
  results: ExamResult[];
  attendanceRate: number;
  studentName?: string;
  userId: string;
}
```

**Usage**:
```typescript
import { StudyPlan } from '../components/StudentPortal/StudyPlan';

const attendanceRate = (presentDays / totalDays) * 100;

<StudyPlan 
  results={studentResults}
  attendanceRate={attendanceRate}
  studentName={userProfile.fullName}
  userId={userProfile.id}
/>
```

---

### 4. ReportCard.tsx (278 lines)
**Purpose**: Official student report card with print/PDF export

**Features**:
- Professional report card layout
- Student information header
- Results table with all subjects
- GPA and average score calculation
- Class position (if available)
- Teacher comments section
- Print functionality
- PDF export using html2canvas + jsPDF

**Props**:
```typescript
interface ReportCardProps {
  results: ExamResult[];
  school?: School;
  student: UserProfile;
  term?: string;
  session?: string;
  teacherComments?: string;
  classPosition?: number;
  totalStudentsInClass?: number;
}
```

**Usage**:
```typescript
import { ReportCard } from '../components/StudentPortal/ReportCard';

<ReportCard 
  results={studentResults}
  school={schoolInfo}
  student={userProfile}
  term="Term 1"
  session="2024/2025"
  teacherComments="Excellent work overall."
  classPosition={5}
  totalStudentsInClass={45}
/>
```

---

### 5. ResourceRecommendations.tsx (375 lines)
**Purpose**: Curated learning resources based on weak subjects

**Features**:
- 20+ resource recommendations across subjects
- Resource types: Videos, Websites, Articles, Interactive
- Difficulty levels: Beginner, Intermediate, Advanced
- Only recommends for subjects below threshold (default: 70%)
- Links to external resources (Khan Academy, YouTube, etc.)
- Premium resource badges
- Grouped by subject

**Props**:
```typescript
interface ResourceRecommendationsProps {
  results: ExamResult[];
  weaknessThreshold?: number; // Default: 70
}
```

**Usage**:
```typescript
import { ResourceRecommendations } from '../components/StudentPortal/ResourceRecommendations';

<ResourceRecommendations 
  results={studentResults}
  weaknessThreshold={70}
/>
```

---

## 🔗 Integration into StudentPortal

### Step 1: Update StudentPortal.tsx

```typescript
// src/pages/StudentPortal.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PerformanceChart } from '../components/StudentPortal/PerformanceChart';
import { SubjectBreakdown } from '../components/StudentPortal/SubjectBreakdown';
import { StudyPlan } from '../components/StudentPortal/StudyPlan';
import { ResourceRecommendations } from '../components/StudentPortal/ResourceRecommendations';
import { ReportCard } from '../components/StudentPortal/ReportCard';
import type { ExamResult, AttendanceRecord, Term } from '../lib/types';

export function StudentPortal() {
  const { userProfile } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'study' | 'resources' | 'report'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch results
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select(`
            *,
            subjects (name, code),
            terms (name, start_date, end_date)
          `)
          .eq('student_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (resultsError) throw resultsError;

        // Fetch attendance
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', userProfile.id);

        if (attendanceError) throw attendanceError;

        // Fetch terms
        const { data: termsData, error: termsError } = await supabase
          .from('terms')
          .select('*')
          .eq('school_id', userProfile.schoolId)
          .order('start_date', { ascending: false });

        if (termsError) throw termsError;

        // Map data to types
        const mappedResults: ExamResult[] = (resultsData || []).map(r => ({
          id: r.id,
          schoolId: r.school_id,
          studentId: r.student_id,
          classId: r.class_id,
          subjectId: r.subject_id,
          subject: r.subjects?.name || '',
          teacherId: r.teacher_id,
          term: r.term,
          session: r.session,
          caScore: r.ca_score,
          examScore: r.exam_score,
          totalScore: r.total_score,
          grade: r.grade,
          remarks: r.remarks,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        setResults(mappedResults);
        setAttendance(attendanceData || []);
        setTerms(termsData || []);

        // Set active term (most recent)
        const active = termsData?.[0];
        if (active) setActiveTerm(active);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  // Calculate attendance rate
  const attendanceRate = results.length > 0
    ? Math.round(
        (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg p-6">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 font-semibold">Error Loading Dashboard</p>
          <p className="text-red-400/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-dark-text mb-2">
            Welcome, {userProfile.fullName}!
          </h1>
          <p className="text-dark-text/70">Track your academic progress and get personalized recommendations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Subjects" value={results.length > 0 ? new Set(results.map(r => r.subjectId)).size : 0} icon="📚" />
          <StatCard
            label="Average Score"
            value={results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length) + '%' : 'N/A'}
            icon="📊"
          />
          <StatCard label="Attendance" value={attendanceRate + '%'} icon="📅" />
          <StatCard
            label="Current Term"
            value={activeTerm?.name || 'N/A'}
            icon="🎓"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-teal-500/20">
          <div className="flex gap-4 overflow-x-auto">
            {(['overview', 'breakdown', 'study', 'resources', 'report'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-teal-400 border-teal-500'
                    : 'text-dark-text/70 border-transparent hover:text-dark-text'
                }`}
              >
                {tab === 'overview' && '📈 Overview'}
                {tab === 'breakdown' && '📊 Breakdown'}
                {tab === 'study' && '🎯 Study Plan'}
                {tab === 'resources' && '📚 Resources'}
                {tab === 'report' && '📄 Report Card'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <PerformanceChart results={results} terms={terms} />}
          {activeTab === 'breakdown' && <SubjectBreakdown results={results} currentTermId={activeTerm?.id} />}
          {activeTab === 'study' && (
            <StudyPlan
              results={results}
              attendanceRate={attendanceRate}
              studentName={userProfile.fullName}
              userId={userProfile.id}
            />
          )}
          {activeTab === 'resources' && <ResourceRecommendations results={results} weaknessThreshold={70} />}
          {activeTab === 'report' && (
            <ReportCard
              results={results}
              student={userProfile}
              term={activeTerm?.name}
              session="2024/2025"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-4 bg-dark-card rounded-lg border border-teal-500/20 hover:border-teal-500/50 transition-colors">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-dark-text/70 text-sm">{label}</p>
      <p className="text-2xl font-bold text-teal-400">{value}</p>
    </div>
  );
}
```

---

## 📝 Database Queries Needed

Ensure your database has:

### Tables Required
- ✅ `results` - Exam scores (already exists)
- ✅ `attendance` - Attendance records (already exists)
- ✅ `terms` - School terms (already exists)
- ✅ `subjects` - Subject information (already exists)

### Query Patterns Used
```typescript
// Get student's results with subjects and terms
supabase
  .from('results')
  .select(`
    *,
    subjects (name, code),
    terms (name, start_date, end_date)
  `)
  .eq('student_id', userId)

// Get student's attendance
supabase
  .from('attendance')
  .select('*')
  .eq('student_id', userId)

// Get school terms
supabase
  .from('terms')
  .select('*')
  .eq('school_id', schoolId)
```

---

## 🎨 Styling & Theme

All components use the project's existing dark theme:
- Colors: `teal-500` (primary), `dark-bg`, `dark-card`, `dark-text`
- Responsive: Mobile-first with Tailwind breakpoints
- Icons: Lucide-react (already installed)
- Charts: Recharts (already installed)

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All 5 components created and tested
- [ ] StudentPortal.tsx updated with imports
- [ ] Database queries verified working
- [ ] Rate limiting tested (Gemini calls)
- [ ] Print/PDF export tested
- [ ] Mobile responsiveness checked
- [ ] Accessibility (a11y) reviewed
- [ ] Performance optimized (lazy loading if needed)
- [ ] Error states handled
- [ ] Team trained on new features

---

## 📊 Performance Considerations

### Component Load Time
- **PerformanceChart**: Renders 2 charts - ~500ms
- **SubjectBreakdown**: Renders card grid - ~300ms
- **StudyPlan**: Waits for Gemini - ~3-5 seconds
- **ResourceRecommendations**: Static rendering - ~100ms
- **ReportCard**: Large DOM - ~1 second

### Optimization Tips
1. Lazy load tabs (only render active tab)
2. Memoize expensive calculations
3. Use `useCallback` for event handlers
4. Consider pagination for large result sets

---

## 🧪 Testing Guide

### Unit Tests
```typescript
// Test PerformanceChart
- Renders with valid results
- Calculates trends correctly
- Displays grade indicators

// Test SubjectBreakdown
- Groups results by subject
- Calculates performance status
- Handles missing data

// Test StudyPlan
- Calls Gemini API correctly
- Validates input before calling
- Respects rate limits

// Test ReportCard
- Generates valid PDF
- Calculates GPA correctly
- Prints without errors

// Test ResourceRecommendations
- Filters by weakness threshold
- Only shows beginner/intermediate resources
- Groups by subject
```

### Manual Testing Scenarios
```
Scenario 1: New student (no results)
→ All components should handle gracefully
→ Show helpful message instead of blank

Scenario 2: Student with excellent grades
→ Should show "no improvements needed"
→ Study plan should focus on consolidation

Scenario 3: Student with failing grades
→ Should show resources prominently
→ Study plan should prioritize urgent areas

Scenario 4: Print report card
→ Should match school's official format
→ PDF should be high quality
→ Print preview should look correct

Scenario 5: Generate multiple study plans
→ Rate limiting should enforce 5/minute limit
→ User should see warning after limit
```

---

## 🔧 Troubleshooting

### Issue: "No performance data available"
**Cause**: Student has no results yet  
**Solution**: Create sample results for testing

### Issue: Study plan not generating
**Cause**: Gemini API call failing  
**Solution**: 
- Check API key in Supabase secrets
- Check Edge Function is deployed
- Check rate limit hasn't been exceeded

### Issue: PDF export blank
**Cause**: DOM elements not rendered when capturing  
**Solution**: Ensure ReportCard renders fully before calling html2canvas

### Issue: Resources showing for all subjects
**Cause**: Weakness threshold too high  
**Solution**: Lower threshold or review grading scale

---

## 📚 Next Steps

After Phase 2 is complete:

1. **Phase 3**: Complete Parent Portal
   - Multi-child switcher
   - Live notifications
   - Parent-teacher messaging
   - Fee payment

2. **Enhancements**:
   - Add class comparison (anonymized)
   - Peer learning groups
   - Teacher feedback system
   - Mobile app version

---

## ✅ Success Metrics

Phase 2 is successful when:

- ✅ All 5 components integrate seamlessly
- ✅ StudentPortal is engaging and useful
- ✅ Students can view performance clearly
- ✅ Study plans help students improve
- ✅ Report cards are professional and printable
- ✅ Resources are relevant and accessible
- ✅ No rate limiting or API issues
- ✅ Mobile experience is smooth
- ✅ Accessibility standards met (WCAG 2.1 AA)

---

**Status**: Ready for Integration  
**Estimated Time to Complete**: 4-6 hours  
**Estimated Testing Time**: 2-3 hours  
**Expected Launch**: This week

🚀 Ready to integrate Phase 2? Let's go!
