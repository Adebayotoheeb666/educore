import axios from 'axios';
import '../config/apiConfig';

export const getPlatformDashboard = () =>
  axios.get('/api/admin/dashboard').then((r) => r.data);

export const getAllSchools = (params) =>
  axios.get('/api/admin/schools', { params }).then((r) => r.data);

export const getSchoolById = (id) =>
  axios.get(`/api/admin/schools/${id}`).then((r) => r.data);

export const updateSchoolAdmin = (id, data) =>
  axios.patch(`/api/admin/schools/${id}`, data).then((r) => r.data);

export const getPlatformUsers = (params) =>
  axios.get('/api/admin/users', { params }).then((r) => r.data);

export const updatePlatformUser = (id, data) =>
  axios.patch(`/api/admin/users/${id}`, data).then((r) => r.data);

export const getAdminBlogPosts = (params) =>
  axios.get('/api/admin/blog', { params }).then((r) => r.data);

export const getAdminBlogPost = (id) =>
  axios.get(`/api/admin/blog/${id}`).then((r) => r.data);

export const createAdminBlogPost = (formData) =>
  axios.post('/api/admin/blog', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateAdminBlogPost = (id, formData) =>
  axios.patch(`/api/admin/blog/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deleteAdminBlogPost = (id) =>
  axios.delete(`/api/admin/blog/${id}`).then((r) => r.data);
