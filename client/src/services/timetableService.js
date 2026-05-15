import axios from 'axios';

export const getTimetable = (params) => axios.get('/api/timetable', { params });
export const generateAITimetable = (data) => axios.post('/api/timetable/generate', data);
export const updateTimetableSlot = (id, slotIndex, slot) =>
  axios.patch(`/api/timetable/${id}/slot`, { slotIndex, slot });
export const publishTimetable = (id) => axios.patch(`/api/timetable/${id}/publish`);
export const deleteTimetable = (id) => axios.delete(`/api/timetable/${id}`);
