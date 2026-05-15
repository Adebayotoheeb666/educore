import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
                <div className="modal-header-premium">
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body-premium">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
