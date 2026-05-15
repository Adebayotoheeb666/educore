import axios from 'axios';

export const getClasses = () => axios.get('/api/classes');
export const getClass = (id) => axios.get(`/api/classes/${id}`);
export const getClassStudents = (id) => axios.get(`/api/classes/${id}/students`);
export const createClass = (data) => axios.post('/api/classes', data);
export const updateClass = (id, data) => axios.patch(`/api/classes/${id}`, data);
export const deleteClass = (id) => axios.delete(`/api/classes/${id}`);
