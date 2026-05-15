import axios from 'axios';

export const getSubjects = () => axios.get('/api/subjects');
export const getSubject = (id) => axios.get(`/api/subjects/${id}`);
export const createSubject = (data) => axios.post('/api/subjects', data);
export const updateSubject = (id, data) => axios.patch(`/api/subjects/${id}`, data);
export const deleteSubject = (id) => axios.delete(`/api/subjects/${id}`);
export const assignTeacher = (id, teacherId) =>
  axios.post(`/api/subjects/${id}/assign`, { teacherId });
export const unassignTeacher = (id, teacherId) =>
  axios.post(`/api/subjects/${id}/unassign`, { teacherId });
