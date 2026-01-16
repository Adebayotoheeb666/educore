import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ExamResult, School, UserProfile } from '../../lib/types';

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

export function ReportCard({
  results,
  school,
  student,
  term = 'Term 1',
  session = '2024/2025',
  teacherComments = '',
  classPosition,
  totalStudentsInClass,
}: ReportCardProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const calculateGPA = (): number => {
    const gradePoints: Record<string, number> = {
      A: 5,
      B: 4,
      C: 3,
      D: 2,
      F: 0,
    };

    const totalPoints = results.reduce((sum, r) => {
      const grade = getGrade(r.totalScore);
      return sum + (gradePoints[grade] || 0);
    }, 0);

    return Math.round((totalPoints / results.length) * 100) / 100;
  };

  const getGrade = (score: number): string => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A':
        return 'text-green-400';
      case 'B':
        return 'text-blue-400';
      case 'C':
        return 'text-yellow-400';
      case 'D':
        return 'text-orange-400';
      case 'F':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handlePrint = () => {
    if (reportRef.current) {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#121212',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`report-card-${student.fullName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const avgScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length);
  const gpa = calculateGPA();

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Download size={18} />
          Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      {/* Report Card */}
      <div ref={reportRef} className="p-8 bg-white text-black min-h-screen" style={{ width: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b-4 border-gray-800">
          {school?.logo && (
            <img src={school.logo} alt="School Logo" className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-1">{school?.name || 'School Name'}</h1>
          <h2 className="text-2xl font-bold text-gray-700 mb-1">OFFICIAL REPORT CARD</h2>
          <p className="text-sm text-gray-600">{school?.address || ''}</p>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b-2 border-gray-300">
          <div>
            <p className="text-sm font-semibold text-gray-600">Student Name</p>
            <p className="text-lg font-bold">{student.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Admission No.</p>
            <p className="text-lg font-bold">{student.admissionNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Class</p>
            <p className="text-lg font-bold">
              {student.assignedClasses?.[0] || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Session</p>
            <p className="text-lg font-bold">{session}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Term</p>
            <p className="text-lg font-bold">{term}</p>
          </div>
          {classPosition && totalStudentsInClass && (
            <div>
              <p className="text-sm font-semibold text-gray-600">Class Position</p>
              <p className="text-lg font-bold">
                {classPosition} of {totalStudentsInClass}
              </p>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-gray-800">
            ACADEMIC RESULTS
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 p-2 text-left font-bold">Subject</th>
                <th className="border border-gray-400 p-2 text-center font-bold">CA</th>
                <th className="border border-gray-400 p-2 text-center font-bold">Exam</th>
                <th className="border border-gray-400 p-2 text-center font-bold">Total</th>
                <th className="border border-gray-400 p-2 text-center font-bold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => {
                const grade = getGrade(result.totalScore);
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-400 p-2 font-semibold">{result.subject}</td>
                    <td className="border border-gray-400 p-2 text-center">{result.caScore}/40</td>
                    <td className="border border-gray-400 p-2 text-center">{result.examScore}/60</td>
                    <td className="border border-gray-400 p-2 text-center font-bold">
                      {result.totalScore}/100
                    </td>
                    <td className="border border-gray-400 p-2 text-center font-bold">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-gray-300">
          <div className="text-center p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold text-gray-600">Total Score</p>
            <p className="text-2xl font-bold">{results.reduce((sum, r) => sum + r.totalScore, 0)}/{results.length * 100}</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold text-gray-600">Average Score</p>
            <p className="text-2xl font-bold">{avgScore}%</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold text-gray-600">GPA</p>
            <p className="text-2xl font-bold">{gpa.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded">
            <p className="text-sm font-semibold text-gray-600">Status</p>
            <p className="text-lg font-bold">
              {avgScore >= 80 ? '✅ PASSED' : avgScore >= 60 ? '⚠️ PASSED' : '❌ FAILED'}
            </p>
          </div>
        </div>

        {/* Teacher Comments */}
        {teacherComments && (
          <div className="mb-8 pb-8 border-b-2 border-gray-300">
            <h3 className="text-lg font-bold mb-2">Teacher's Comment</h3>
            <div className="p-4 bg-gray-50 border-l-4 border-gray-800">
              <p className="text-sm leading-relaxed text-gray-700">{teacherComments}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="grid grid-cols-3 gap-8 text-center mt-12">
          <div>
            <div className="border-t-2 border-gray-800 pt-2 mt-8" style={{ height: '60px' }} />
            <p className="text-sm font-semibold">Class Teacher</p>
          </div>
          <div>
            <div className="border-t-2 border-gray-800 pt-2 mt-8" style={{ height: '60px' }} />
            <p className="text-sm font-semibold">Head of School</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 mt-4">
              This is an official document. Unauthorized reproduction is prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .no-print {
              display: none;
            }
            div[style*="width: 210mm"] {
              margin: 0;
              box-shadow: none;
              page-break-after: always;
            }
          }
        `}
      </style>
    </div>
  );
}
