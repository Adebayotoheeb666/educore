import axios from 'axios';

export const getTeachers = (params) => axios.get('/api/teachers', { params });
export const getTeacherById = (id) => axios.get(`/api/teachers/${id}`);
export const createTeacher = (data) => axios.post('/api/teachers', data);
export const updateTeacher = (id, data) => axios.patch(`/api/teachers/${id}`, data);
export const deleteTeacher = (id) => axios.delete(`/api/teachers/${id}`);
export const assignSubjects = (id, subjectIds) => axios.patch(`/api/teachers/${id}/subjects`, { subjectIds });
export const getTeacherWorkload = (id) => axios.get(`/api/teachers/${id}/workload`);
