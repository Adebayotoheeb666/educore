import axios from 'axios';

export const markAttendance = (data) => axios.post('/api/attendance', data);
export const getAttendanceByDate = (classId, date) =>
  axios.get(`/api/attendance/${classId}`, { params: { date } });
export const getStudentAttendance = (studentId) =>
  axios.get(`/api/attendance/student/${studentId}`);
export const getClassAttendanceReport = (classId, params) =>
  axios.get(`/api/attendance/report/${classId}`, { params });
export const getAttendanceSummary = (params) =>
  axios.get('/api/attendance/summary', { params });
export const notifyAbsentParents = (data) =>
  axios.post('/api/attendance/notify-absent', data);
