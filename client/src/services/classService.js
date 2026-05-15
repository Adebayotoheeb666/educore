import axios from 'axios';

export const getClasses = () => axios.get('/api/classes');
export const getClass = (id) => axios.get(`/api/classes/${id}`);
export const getClassStudents = (id) => axios.get(`/api/classes/${id}/students`);
