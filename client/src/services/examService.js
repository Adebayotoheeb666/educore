import axios from 'axios';

export const getExams = (params) => axios.get('/api/exams', { params });
export const getExamById = (id) => axios.get(`/api/exams/${id}`);
export const createExam = (data) => axios.post('/api/exams', data);
export const updateExam = (id, data) => axios.patch(`/api/exams/${id}`, data);
export const publishExam = (id) => axios.patch(`/api/exams/${id}/publish`);
export const enterScores = (id, scores) => axios.post(`/api/exams/${id}/scores`, { scores });
export const getExamResults = (id) => axios.get(`/api/exams/${id}/results`);
export const getQuestions = (params) => axios.get('/api/exams/questions', { params });
export const generateAIQuestions = (data) => axios.post('/api/ai/questions', data);
export const generateExamPaper = (data) => axios.post('/api/ai/exam-paper', data);
