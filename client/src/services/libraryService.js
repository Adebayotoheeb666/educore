import axios from 'axios';

export const getBooks = (params) => axios.get('/api/library', { params });
export const addBook = (data) => axios.post('/api/library', data);
export const getOverdueBooks = () => axios.get('/api/library/overdue');
export const getActiveBorrows = () => axios.get('/api/library/borrows');
export const borrowBook = (data) => axios.post('/api/library/borrow', data);
export const returnBook = (borrowId) => axios.post(`/api/library/return/${borrowId}`);
