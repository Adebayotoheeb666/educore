import axios from 'axios';

const handleError = (error, context) => {
  const status = error.response?.status;
  const errorMessage = error.response?.data?.message || error.message || 'Request failed';
  const errorData = {
    status,
    message: errorMessage,
    context,
    originalError: error
  };

  if (status === 503) {
    console.warn(`[${context}] Service unavailable (503)`, errorData);
  } else {
    console.error(`[${context}]`, errorMessage, error);
  }

  throw errorData;
};

export const generateLessonPlan = async (data) => {
  try {
    return await axios.post('/api/lesson-plans/generate', data);
  } catch (error) {
    handleError(error, 'generateLessonPlan');
  }
};

export const saveLessonPlan = async (data) => {
  try {
    return await axios.post('/api/lesson-plans', data);
  } catch (error) {
    handleError(error, 'saveLessonPlan');
  }
};

export const getLessonPlans = async (params = {}) => {
  try {
    return await axios.get('/api/lesson-plans', { params });
  } catch (error) {
    handleError(error, 'getLessonPlans');
  }
};

export const getLessonPlanById = async (id) => {
  try {
    return await axios.get(`/api/lesson-plans/${id}`);
  } catch (error) {
    handleError(error, 'getLessonPlanById');
  }
};

export const updateLessonPlan = async (id, data) => {
  try {
    return await axios.patch(`/api/lesson-plans/${id}`, data);
  } catch (error) {
    handleError(error, 'updateLessonPlan');
  }
};

export const generateSchemeOfWork = async (data) => {
  try {
    return await axios.post('/api/lesson-plans/schemes/generate', data);
  } catch (error) {
    handleError(error, 'generateSchemeOfWork');
  }
};

export const saveSchemeOfWork = async (data) => {
  try {
    return await axios.post('/api/lesson-plans/schemes', data);
  } catch (error) {
    handleError(error, 'saveSchemeOfWork');
  }
};

export const getSchemesOfWork = async (params = {}) => {
  try {
    return await axios.get('/api/lesson-plans/schemes/list', { params });
  } catch (error) {
    handleError(error, 'getSchemesOfWork');
  }
};

export const generateQuestions = async (data) => {
  try {
    return await axios.post('/api/ai/questions', data);
  } catch (error) {
    handleError(error, 'generateQuestions');
  }
};

export const generateExamPaper = async (data) => {
  try {
    return await axios.post('/api/ai/exam-paper', data);
  } catch (error) {
    handleError(error, 'generateExamPaper');
  }
};

export const gradeSubmission = async (submissionId) => {
  try {
    return await axios.post(`/api/ai/grade/${submissionId}`);
  } catch (error) {
    handleError(error, 'gradeSubmission');
  }
};

export const generateComments = async (resultId) => {
  try {
    return await axios.post(`/api/ai/comments/${resultId}`);
  } catch (error) {
    handleError(error, 'generateComments');
  }
};

export const getAIUsageStats = async () => {
  try {
    return await axios.get('/api/ai/usage');
  } catch (error) {
    handleError(error, 'getAIUsageStats');
  }
};

export const suggestTeachingAids = async (data) => {
  try {
    return await axios.post('/api/lesson-plans/teaching-aids', data);
  } catch (error) {
    handleError(error, 'suggestTeachingAids');
  }
};
