import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Search, Users, GraduationCap, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface ParentWithStudents {
  parentId: string;
  parentName: string;
  parentEmail: string;
  phoneNumber?: string;
  studentCount: number;
  students: Array<{
    studentId: string;
    studentName: string;
    admissionNumber?: string;
    relationship: string;
  }>;
}

export const ParentStudentDirectory = () => {
  const { user, role, loading: authLoading, schoolId } = useAuth();
  const [parentsWithStudents, setParentsWithStudents] = useState<ParentWithStudents[]>([]);
  const [filteredData, setFilteredData] = useState<ParentWithStudents[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // Handle auth loading first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check authorization
  if (role?.toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch parents with their linked students
  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const fetchParentsWithStudents = async () => {
      setLoading(true);
      try {
        // First, fetch all parents in the school
        const { data: parentsData, error: parentsError } = await supabase
          .from('users')
          .select('id, full_name, email, phone_number')
          .eq('school_id', schoolId)
          .eq('role', 'parent')
          .order('full_name', { ascending: true });

        if (parentsError) throw parentsError;

        // For each parent, fetch their linked students
        const result: ParentWithStudents[] = await Promise.all(
          (parentsData || []).map(async (parent) => {
            const { data: links, error: linksError } = await supabase
              .from('parent_student_links')
              .select('student_id, relationship')
              .eq('school_id', schoolId)
              .eq('parent_id', parent.id);

            if (linksError) throw linksError;

            // For each link, fetch student details
            const students = await Promise.all(
              (links || []).map(async (link) => {
                const { data: studentData } = await supabase
                  .from('users')
                  .select('id, full_name, admission_number')
                  .eq('id', link.student_id)
                  .single();

                return {
                  studentId: link.student_id,
                  studentName: studentData?.full_name || 'Unknown',
                  admissionNumber: studentData?.admission_number,
                  relationship: link.relationship,
                };
              })
            );

            return {
              parentId: parent.id,
              parentName: parent.full_name,
              parentEmail: parent.email || 'N/A',
              phoneNumber: parent.phone_number,
              studentCount: students.length,
              students: students.sort((a, b) => a.studentName.localeCompare(b.studentName)),
            };
          })
        );

        // Filter out parents with no students
        const parentsWithStudentsOnly = result.filter((p) => p.studentCount > 0);
        setParentsWithStudents(parentsWithStudentsOnly);
        setFilteredData(parentsWithStudentsOnly);
      } catch (err) {
        console.error('Error fetching parents with students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParentsWithStudents();
  }, [schoolId]);

  // Handle search
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = parentsWithStudents.filter((parent) =>
      parent.parentName.toLowerCase().includes(query) ||
      parent.parentEmail.toLowerCase().includes(query) ||
      parent.students.some((s) => s.studentName.toLowerCase().includes(query))
    );
    setFilteredData(filtered);
  }, [searchQuery, parentsWithStudents]);

  const toggleParentExpanded = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-teal-500" />
          <h1 className="text-3xl font-bold">Parents & Students Directory</h1>
        </div>
        <p className="text-gray-400">View all parents and their linked students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Parents</p>
              <p className="text-2xl font-bold text-teal-500">{parentsWithStudents.length}</p>
            </div>
            <Users className="w-8 h-8 text-teal-500/30" />
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Links</p>
              <p className="text-2xl font-bold text-emerald-500">
                {parentsWithStudents.reduce((sum, p) => sum + p.studentCount, 0)}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Students per Parent</p>
              <p className="text-2xl font-bold text-blue-500">
                {parentsWithStudents.length > 0
                  ? (parentsWithStudents.reduce((sum, p) => sum + p.studentCount, 0) / parentsWithStudents.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-500/30" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by parent name, email, or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-white/5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-dark-card border border-white/5 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Parents Found</h3>
          <p className="text-gray-400">
            {parentsWithStudents.length === 0
              ? 'No parents with linked students in your school yet.'
              : 'No results match your search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((parent) => (
            <div key={parent.parentId} className="bg-dark-card border border-white/5 rounded-lg overflow-hidden">
              {/* Parent Header */}
              <button
                onClick={() => toggleParentExpanded(parent.parentId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{parent.parentName}</h3>
                    <p className="text-gray-400 text-sm">{parent.parentEmail}</p>
                    {parent.phoneNumber && <p className="text-gray-500 text-sm">{parent.phoneNumber}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-emerald-500 font-semibold">{parent.studentCount}</p>
                    <p className="text-gray-400 text-xs">
                      {parent.studentCount === 1 ? 'Student' : 'Students'}
                    </p>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {expandedParents.has(parent.parentId) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Students List */}
              {expandedParents.has(parent.parentId) && (
                <div className="border-t border-white/5 bg-dark-bg/50">
                  <div className="divide-y divide-white/5">
                    {parent.students.map((student, idx) => (
                      <div key={idx} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{student.studentName}</p>
                          {student.admissionNumber && (
                            <p className="text-gray-400 text-sm">Admission #: {student.admissionNumber}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-gray-400 text-sm">{student.relationship}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
