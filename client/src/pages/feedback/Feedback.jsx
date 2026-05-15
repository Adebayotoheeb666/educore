import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import feedbackService from '../../services/feedbackService';
import FeedbackForm from '../../components/feedback/FeedbackForm';
import './Feedback.css';

const Feedback = () => {
    const { user } = useSelector((state) => state.auth);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, sent, received
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const data = await feedbackService.getFeedbacks();
            setFeedbacks(data);
        } catch (error) {
            toast.error("Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText) return;

        try {
            await feedbackService.updateFeedback(replyingTo._id, { 
                response: replyText,
                status: 'resolved'
            });
            toast.success("Response sent!");
            setReplyingTo(null);
            setReplyText('');
            fetchFeedbacks();
        } catch (error) {
            toast.error("Failed to send response");
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        if (activeTab === 'all') return true;
        if (activeTab === 'sent') return f.sender?._id === user._id;
        if (activeTab === 'received') return f.sender?._id !== user._id;
        return true;
    });

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'reviewed': return 'status-reviewed';
            case 'resolved': return 'status-resolved';
            default: return '';
        }
    };

    return (
        <div className="feedback-container">
            <header className="feedback-header">
                <div>
                    <h1>Feedback & Improvements</h1>
                    <p>We value your input. Help us make EduCore AI better for everyone.</p>
                </div>
            </header>

            <div className="feedback-grid">
                <div className="feedback-main">
                    <div className="feedback-tabs">
                        <button 
                            className={`feedback-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Feedback
                        </button>
                        {user.role !== 'super_admin' && (
                            <>
                                <button 
                                    className={`feedback-tab ${activeTab === 'sent' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('sent')}
                                >
                                    My Sent Feedback
                                </button>
                                <button 
                                    className={`feedback-tab ${activeTab === 'received' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('received')}
                                >
                                    Received from Admin
                                </button>
                            </>
                        )}
                    </div>

                    <div className="feedback-list-card">
                        {loading ? (
                            <div className="empty-state">Loading feedbacks...</div>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✉️</div>
                                <p>No feedback found.</p>
                            </div>
                        ) : (
                            filteredFeedbacks.map((f) => (
                                <div key={f._id} className="feedback-item">
                                    <div className="feedback-item-header">
                                        <div>
                                            <span className="feedback-category">{f.category.replace('_', ' ')}</span>
                                            <span className={`feedback-status ms-2 ${getStatusClass(f.status)}`}>
                                                {f.status}
                                            </span>
                                        </div>
                                        <div className="feedback-stars">
                                            {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                                        </div>
                                    </div>
                                    <h3 className="feedback-subject">{f.subject}</h3>
                                    <p className="feedback-content">{f.content}</p>
                                    
                                    <div className="feedback-meta">
                                        <span>From: <strong>{f.sender?.name} ({f.sender?.role})</strong></span>
                                        {f.schoolId && <span>School: <strong>{f.schoolId.name}</strong></span>}
                                        <span>Date: {new Date(f.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {f.response && (
                                        <div className="feedback-response">
                                            <div className="response-header">
                                                Response from {f.respondedBy?.name || 'Admin'}
                                            </div>
                                            <p className="mb-0">{f.response}</p>
                                            <small className="text-muted d-block mt-2">
                                                {new Date(f.responseDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                    )}

                                    {!f.response && (user.role === 'super_admin' || (f.targetType === 'school' && f.schoolId?._id === user.schoolId)) && (
                                        <div className="mt-3">
                                            {replyingTo?._id === f._id ? (
                                                <form onSubmit={handleReply}>
                                                    <textarea 
                                                        className="form-control mb-2"
                                                        placeholder="Write your response..."
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    ></textarea>
                                                    <div className="d-flex gap-2">
                                                        <button type="submit" className="btn btn-sm btn-primary">Send Response</button>
                                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => setReplyingTo(f)}>Reply</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <aside className="feedback-sidebar">
                    <div className="feedback-form-card">
                        <h3>Share your thoughts</h3>
                        <p className="text-muted mb-4">Have an idea or found a bug? Let us know!</p>
                        <FeedbackForm user={user} onSuccess={fetchFeedbacks} />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Feedback;
