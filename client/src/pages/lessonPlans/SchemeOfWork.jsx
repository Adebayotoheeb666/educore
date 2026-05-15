import React from 'react';
import './Planning.css';

const SchemeOfWork = () => {
    const weeklyBreakdown = [
        { week: 1, topic: 'Introduction to Calculus', objectives: 'Understand limits and continuity', materials: 'Graphing calculators, Desmos', status: 'Completed' },
        { week: 2, topic: 'Differentiation Basics', objectives: 'Power rule and basic derivatives', materials: 'Derivative charts', status: 'In Progress' },
        { week: 3, topic: 'Product and Quotient Rules', objectives: 'Apply rules to complex functions', materials: 'Practice worksheets', status: 'Pending' },
        { week: 4, topic: 'Chain Rule', objectives: 'Differentiating composite functions', materials: 'Video tutorials', status: 'Pending' },
    ];

    return (
        <div className="planning-container">
            <header className="planning-header mb-5">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="display-4 fw-bold text-dark mb-2">Scheme of Work</h1>
                        <p className="lead text-secondary">Academic roadmap for SSS 3 - Mathematics (First Term)</p>
                    </div>
                    <button className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">
                        💾 Export PDF
                    </button>
                </div>
            </header>

            <div className="ai-roadmap-banner mb-5">
                <div className="banner-icon">🎯</div>
                <div className="banner-content">
                    <h3>AI Curriculum Insights</h3>
                    <p>Based on last term's performance, we've increased the duration for "Chain Rule" by 1 week to ensure mastery.</p>
                </div>
            </div>

            <div className="scheme-table-card">
                <table className="premium-scheme-table">
                    <thead>
                        <tr>
                            <th width="80">Week</th>
                            <th width="300">Topic & Focus</th>
                            <th>Learning Objectives</th>
                            <th width="250">Instructional Materials</th>
                            <th width="150">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeklyBreakdown.map((item) => (
                            <tr key={item.week} className={item.status.toLowerCase().replace(' ', '-')}>
                                <td className="week-number">{item.week}</td>
                                <td className="topic-cell">
                                    <h4 className="m-0">{item.topic}</h4>
                                </td>
                                <td className="obj-cell">
                                    <p className="m-0 text-secondary">{item.objectives}</p>
                                </td>
                                <td className="materials-cell">
                                    <div className="material-tags">
                                        {item.materials.split(',').map((tag, i) => (
                                            <span key={i} className="m-tag">{tag.trim()}</span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-5 d-flex justify-content-center">
                <button className="btn btn-outline-indigo btn-lg rounded-pill px-5 fw-bold" style={{ borderColor: '#4f46e5', color: '#4f46e5' }}>
                    ➕ Add Weekly Slot
                </button>
            </div>
        </div>
    );
};

export default SchemeOfWork;
