import axios from 'axios';

export const getStudents = (params) => axios.get('/api/students', { params });
export const getStudentById = (id) => axios.get(`/api/students/${id}`);
export const createStudent = (data) => axios.post('/api/students', data);
export const updateStudent = (id, data) => axios.patch(`/api/students/${id}`, data);
export const deleteStudent = (id) => axios.delete(`/api/students/${id}`);
export const bulkImportStudents = (formData, config = {}) =>
  axios.post('/api/students/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' }, ...config });
export const promoteStudents = (data) => axios.post('/api/students/promote', data);
export const getStudentAcademicHistory = (id) => axios.get(`/api/students/${id}/history`);
