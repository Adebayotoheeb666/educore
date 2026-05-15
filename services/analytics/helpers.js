const Attendance = require('../../models/attendanceModel');

const studentAttendanceRate = async (schoolId, studentId) => {
  const attendances = await Attendance.find({ school: schoolId });
  let total = 0;
  let present = 0;
  for (const att of attendances) {
    const rec = (att.records || []).find(
      (r) => r.student?.toString() === studentId.toString()
    );
    if (!rec) continue;
    total += 1;
    if (rec.status === 'present' || rec.status === 'late') present += 1;
  }
  return total > 0 ? Math.round((present / total) * 100) : 0;
};

const formatRelativeTime = (date) => {
  if (!date) return '—';
  const createdAt = new Date(date);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

module.exports = { studentAttendanceRate, formatRelativeTime };
