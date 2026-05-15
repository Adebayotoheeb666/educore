import axios from 'axios';
import '../config/apiConfig';

export const getPosts = (params = {}) =>
  axios.get('/api/blog', { params }).then((res) => res.data);

export const getPost = (id) =>
  axios.get(`/api/blog/${id}`).then((res) => res.data);

export const createPost = (formData) =>
  axios.post('/api/blog', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const updatePost = (id, formData) =>
  axios.patch(`/api/blog/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const deletePost = (id) =>
  axios.delete(`/api/blog/${id}`).then((res) => res.data);

const blogService = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};

export default blogService;
