import React from 'react';

const ModernModal = ({ isOpen, onClose, title, message, type = 'info', icon }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        if (icon) return <i className={`${icon} fa-3x`}></i>;
        switch (type) {
            case 'success': return <i className="fa-solid fa-circle-check fa-3x" style={{ color: '#28a745' }}></i>;
            case 'error': return <i className="fa-solid fa-circle-xmark fa-3x" style={{ color: '#dc3545' }}></i>;
            case 'warning': return <i className="fa-solid fa-triangle-exclamation fa-3x" style={{ color: '#ffc107' }}></i>;
            default: return <i className="fa-solid fa-circle-info fa-3x" style={{ color: '#17a2b8' }}></i>;
        }
    };

    return (
        <div className="modern-modal-overlay" onClick={onClose}>
            <div className="modern-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-icon-container">
                    {getIcon()}
                </div>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <button className="btn btn-warning w-100 py-3 fw-bold" style={{ borderRadius: '1rem' }} onClick={onClose}>Aceptar</button>
            </div>
            <style>{`
                .modern-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }
                .modern-modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 2rem;
                    width: 90%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .modal-icon-container {
                    margin-bottom: 1.5rem;
                }
                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    color: #333;
                }
                .modal-message {
                    font-size: 1rem;
                    color: #666;
                    margin-bottom: 2rem;
                    line-height: 1.5;
                }
                .modal-btn-primary {
                    background: #ffc107;
                    color: #fff;
                    border: none;
                    padding: 1rem 2.5rem;
                    border-radius: 1rem;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
                    width: 100%;
                }
                .modal-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
                    background: #ffb300;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ModernModal;
