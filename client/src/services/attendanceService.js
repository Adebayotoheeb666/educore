import axios from 'axios';

const handleError = (error, context) => {
  const errorMessage = error.response?.data?.message || error.message || 'Request failed';
  console.error(`[${context}]`, errorMessage, error);
  throw {
    status: error.response?.status,
    message: errorMessage,
    originalError: error
  };
};

export const markAttendance = async (data) => {
  try {
    return await axios.post('/api/attendance', data);
  } catch (error) {
    handleError(error, 'markAttendance');
  }
};

export const getAttendanceByDate = async (classId, date) => {
  try {
    return await axios.get(`/api/attendance/${classId}`, { params: { date } });
  } catch (error) {
    handleError(error, 'getAttendanceByDate');
  }
};

export const getStudentAttendance = async (studentId) => {
  try {
    return await axios.get(`/api/attendance/student/${studentId}`);
  } catch (error) {
    handleError(error, 'getStudentAttendance');
  }
};

export const getClassAttendanceReport = async (classId, params = {}) => {
  try {
    return await axios.get(`/api/attendance/report/${classId}`, { params });
  } catch (error) {
    handleError(error, 'getClassAttendanceReport');
  }
};

export const getAttendanceSummary = async (params = {}) => {
  try {
    return await axios.get('/api/attendance/summary', { params });
  } catch (error) {
    handleError(error, 'getAttendanceSummary');
  }
};

export const notifyAbsentParents = async (data) => {
  try {
    return await axios.post('/api/attendance/notify-absent', data);
  } catch (error) {
    handleError(error, 'notifyAbsentParents');
  }
};
