import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-wrapper animate__animated animate__fadeInDown">
      <div className="notfound-card animate__animated animate__fadeInUp animate__delay-1s">
        <span className="notfound-logo">EduCore AI</span>
        
        <div className="notfound-image">
          {/* Placeholder for the robot image */}
          <img src="/assets/teacher-main.png" alt="404 Robot" />
        </div>

        <h1>Classroom Not Found</h1>
        <p>
          It seems the page you are looking for has moved to a different classroom or never existed in our curriculum.
        </p>

        <div className="notfound-btns">
          <Link to="/" className="btn-home">
            <span>🏠</span> Back to Home
          </Link>
          <Link to="/contact-us" className="btn-support">
            <span>❓</span> Contact Support
          </Link>
        </div>

        <div className="error-code">
          Error Code: 404_PAGE_MISSING
        </div>
      </div>
    </div>
  );
};

export default NotFound;
