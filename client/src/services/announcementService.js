import axios from 'axios';

export const getAnnouncements = () => axios.get('/api/announcements');
export const createAnnouncement = (data) => axios.post('/api/announcements', data);
export const deleteAnnouncement = (id) => axios.delete(`/api/announcements/${id}`);
