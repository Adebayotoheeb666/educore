import axios from 'axios';

export const getSchoolDashboard = () => axios.get('/api/analytics/dashboard');
export const getSubjectPerformance = (params) =>
  axios.get('/api/analytics/subject-performance', { params });
export const getAttendanceAnalytics = (params) =>
  axios.get('/api/analytics/attendance', { params });
export const getFeeAnalytics = (params) =>
  axios.get('/api/analytics/fees', { params });
export const getTeacherEffectiveness = (params) =>
  axios.get('/api/analytics/teacher-effectiveness', { params });
export const getStudentProgressReport = (studentId) =>
  axios.get(`/api/analytics/student-progress/${studentId}`);
export const generateEMISReport = (params) =>
  axios.get('/api/analytics/emis', { params, responseType: 'blob' });
export const generateNEMISReport = (params) =>
  axios.get('/api/analytics/nemis', { params, responseType: 'blob' });
