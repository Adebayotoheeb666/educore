import React, { useState } from 'react';
import { toast } from 'sonner';
import feedbackService from '../../services/feedbackService';

const FeedbackForm = ({ user, onSuccess, targetSchoolId }) => {
    const [formData, setFormData] = useState({
        targetType: user.role === 'super_admin' ? 'school' : 'platform',
        schoolId: targetSchoolId || user.schoolId || '',
        category: 'general',
        subject: '',
        content: '',
        rating: 5
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.content) {
            return toast.error("Please fill in all required fields");
        }

        setLoading(true);
        try {
            await feedbackService.createFeedback(formData);
            toast.success("Feedback submitted successfully! Thank you for helping us improve.");
            setFormData({
                ...formData,
                subject: '',
                content: '',
                rating: 5
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
                <label>Category</label>
                <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                    <option value="general">General</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="complaint">Complaint</option>
                    <option value="kudos">Kudos / Praise</option>
                </select>
            </div>

            <div className="form-group">
                <label>Subject</label>
                <input 
                    type="text" 
                    className="form-control"
                    placeholder="Brief summary..."
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
            </div>

            <div className="form-group">
                <label>Your Message</label>
                <textarea 
                    className="form-control"
                    rows="4"
                    placeholder="How can we improve?"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                ></textarea>
            </div>

            <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                            key={star}
                            className={`rating-star ${formData.rating >= star ? 'active' : ''}`}
                            onClick={() => setFormData({...formData, rating: star})}
                        >
                            ★
                        </span>
                    ))}
                </div>
            </div>

            <button 
                type="submit" 
                className="btn btn-primary w-100 mt-3"
                disabled={loading}
            >
                {loading ? "Submitting..." : "Send Feedback"}
            </button>
        </form>
    );
};

export default FeedbackForm;
