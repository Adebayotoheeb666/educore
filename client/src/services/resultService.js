import axios from 'axios';

export const getResults = (params) => axios.get('/api/results', { params });
export const getResultById = (id) => axios.get(`/api/results/${id}`);
export const computeResults = (data) => axios.post('/api/results/compute', data);
export const approveResult = (id) => axios.post(`/api/results/${id}/approve`);
export const releaseResults = (data) => axios.post('/api/results/release', data);
export const getReportCard = (studentId, params) =>
  axios.get(`/api/results/${studentId}/report-card`, { params });
export const getBroadsheet = (classId, params) =>
  axios.get(`/api/results/broadsheet/${classId}`, { params, responseType: 'blob' });
export const getParentResults = (studentId) =>
  axios.get(`/api/results/parent/${studentId}`);
export const addPrincipalComment = (id, comment) =>
  axios.patch(`/api/results/${id}/comment`, { comment });
