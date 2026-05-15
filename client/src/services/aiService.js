import axios from 'axios';

export const generateLessonPlan = (data) => axios.post('/api/lesson-plans/generate', data);
export const saveLessonPlan = (data) => axios.post('/api/lesson-plans', data);
export const getLessonPlans = (params) => axios.get('/api/lesson-plans', { params });
export const getLessonPlanById = (id) => axios.get(`/api/lesson-plans/${id}`);
export const updateLessonPlan = (id, data) => axios.patch(`/api/lesson-plans/${id}`, data);

export const generateSchemeOfWork = (data) =>
  axios.post('/api/lesson-plans/schemes/generate', data);
export const saveSchemeOfWork = (data) => axios.post('/api/lesson-plans/schemes', data);
export const getSchemesOfWork = (params) =>
  axios.get('/api/lesson-plans/schemes/list', { params });

export const generateQuestions = (data) => axios.post('/api/ai/questions', data);
export const generateExamPaper = (data) => axios.post('/api/ai/exam-paper', data);
export const gradeSubmission = (submissionId) =>
  axios.post(`/api/ai/grade/${submissionId}`);
export const generateComments = (resultId) =>
  axios.post(`/api/ai/comments/${resultId}`);
export const getAIUsageStats = () => axios.get('/api/ai/usage');
export const suggestTeachingAids = (data) =>
  axios.post('/api/lesson-plans/teaching-aids', data);
