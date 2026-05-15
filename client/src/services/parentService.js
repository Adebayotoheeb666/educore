import axios from "axios";

const API_URL = '/api/parents';

// Create parent
const createParent = async (parentData) => {
    const response = await axios.post(API_URL, parentData, { withCredentials: true });
    return response.data;
};

// Get all parents
const getParents = async () => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
};

// Get single parent
const getParentById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};

// Update parent
const updateParent = async (id, updateData) => {
    const response = await axios.patch(`${API_URL}/${id}`, updateData, { withCredentials: true });
    return response.data;
};

// Delete parent
const deleteParent = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};

// Assign child
const assignChild = async (data) => {
    const response = await axios.post(`${API_URL}/assign-child`, data, { withCredentials: true });
    return response.data;
};

// Unlink child
const unlinkChild = async (data) => {
    const response = await axios.post(`${API_URL}/unlink-child`, data, { withCredentials: true });
    return response.data;
};

const parentService = {
    createParent,
    getParents,
    getParentById,
    updateParent,
    deleteParent,
    assignChild,
    unlinkChild
};

export default parentService;
