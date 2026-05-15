import axios from 'axios';

export const getLessonPlans = (params) => axios.get('/api/lesson-plans', { params });
export const getLessonPlan = (id) => axios.get(`/api/lesson-plans/${id}`);
export const createLessonPlan = (data) => axios.post('/api/lesson-plans', data);
export const updateLessonPlan = (id, data) => axios.patch(`/api/lesson-plans/${id}`, data);
export const deleteLessonPlan = (id) => axios.delete(`/api/lesson-plans/${id}`);
export const getSchemes = () => axios.get('/api/lesson-plans/schemes/list');
