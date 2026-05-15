import React, { useState } from 'react';
import './Timetable.css';

const GenerateTimetable = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleGenerate = () => {
        setIsGenerating(true);
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setIsGenerating(false);
            }
        }, 150);
    };

    return (
        <div className="timetable-container">
            <header className="timetable-header-premium">
                <div className="header-left">
                    <h1 className="display-4 fw-bold text-dark mb-2">AI Timetable Studio</h1>
                    <p className="lead text-secondary">Constraint-based automated scheduling</p>
                </div>
                <div className="header-right">
                    <button 
                        className={`btn btn-lg px-5 rounded-pill shadow ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Optimizing Schedule...' : '✨ Generate Master Timetable'}
                    </button>
                </div>
            </header>

            <div className="generator-layout">
                <aside className="config-panel">
                    <h3 className="fw-bold mb-4">Constraints & Rules</h3>
                    
                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-muted">Optimization Priority</label>
                        <select className="form-select premium-select">
                            <option>Teacher Satisfaction (No gaps)</option>
                            <option>Student Performance (Core morning slots)</option>
                            <option>Room Efficiency (Minimize travel)</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-uppercase text-muted">Daily Period Count</label>
                        <div className="d-flex align-items-center gap-3">
                            <input type="range" className="form-range" min="4" max="10" defaultValue="8" />
                            <span className="fw-bold fs-4">8</span>
                        </div>
                    </div>

                    <div className="form-check form-switch mb-3">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                        <label className="form-check-label fw-bold">Avoid Teacher Double-Booking</label>
                    </div>

                    <div className="form-check form-switch mb-3">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                        <label className="form-check-label fw-bold">Balance Subject Distribution</label>
                    </div>

                    <div className="form-check form-switch mb-5">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label fw-bold">Allow Elective Overlaps</label>
                    </div>

                    <div className="p-4 bg-light rounded-4 border">
                        <h5 className="fw-bold mb-2">Resource Check</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2">✅ 45 Teachers Available</li>
                            <li className="mb-2">✅ 32 Classrooms Validated</li>
                            <li>✅ 4 Labs Configured</li>
                        </ul>
                    </div>
                </aside>

                <main className="generation-preview">
                    {isGenerating && (
                        <div className="processing-card">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold m-0">AI Optimization in Progress</h3>
                                <span className="fs-3 fw-bold text-primary">{progress}%</span>
                            </div>
                            <p className="text-secondary mb-4">
                                Analyzing 1,450 possible combinations based on teacher availability and curriculum requirements.
                            </p>
                            <div className="progress" style={{ height: '12px', borderRadius: '10px' }}>
                                <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                    role="progressbar" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className="stats-row">
                                <div className="stat-item">
                                    <h3>{Math.floor(progress * 12.5)}</h3>
                                    <p>Slots Filled</p>
                                </div>
                                <div className="stat-item">
                                    <h3>0</h3>
                                    <p>Conflicts</p>
                                </div>
                                <div className="stat-item">
                                    <h3>98.2%</h3>
                                    <p>Efficiency</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="timetable-card opacity-75">
                        <div className="d-flex justify-content-between align-items-center mb-5">
                            <h2 className="fw-bold m-0">Master Preview</h2>
                            <span className="badge bg-soft-info text-info p-2 px-3">DRAFT VERSION</span>
                        </div>
                        
                        <div className="text-center py-5">
                            <img src="/assets/homepageicons/stats.png" alt="Empty" style={{ width: '120px', opacity: 0.3 }} />
                            <h3 className="text-muted mt-4">The master preview will appear here<br/>after generation is complete.</h3>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GenerateTimetable;
