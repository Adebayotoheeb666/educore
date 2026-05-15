import axios from "axios";

const API_URL = '/api/feedback';

// Create feedback
const createFeedback = async (feedbackData) => {
    const response = await axios.post(API_URL, feedbackData, { withCredentials: true });
    return response.data;
};

// Get all feedbacks
const getFeedbacks = async () => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
};

// Get single feedback
const getFeedbackById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};

// Update feedback (respond/status)
const updateFeedback = async (id, updateData) => {
    const response = await axios.patch(`${API_URL}/${id}`, updateData, { withCredentials: true });
    return response.data;
};

const feedbackService = {
    createFeedback,
    getFeedbacks,
    getFeedbackById,
    updateFeedback
};

export default feedbackService;
