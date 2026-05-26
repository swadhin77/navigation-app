import React from "react";
import "./Help.css";

const Help = ({ onClose }) => {

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="help-overlay" onClick={handleOverlayClick}>
      <div className="help-content">
        <h2>Help & Support</h2>
        <p>If you’re facing any issues, please contact our support team.</p>
        <ul>
          <li>Email: support@navigationapp.com</li>
          <li>Phone: +91 98765 43210</li>
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
export default Help;
