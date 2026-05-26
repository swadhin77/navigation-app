import React, { useState } from "react";
import "./ContactUs.css";

const ContactUs = ({ onClose }) => {

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("message", message);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch("http://localhost:8081/contact", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("Your message has been sent!");
      onClose();
    } else {
      alert("Failed to send message");
    }
  };
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="contactus-overlay" onClick={handleOverlayClick}>
	<div className="contactus-content">
	  <button className="close-top-btn" onClick={onClose}>×</button>

	  {/* HEADER */}
	  <div className="contactus-header">
	    <div className="contactus-icon">🆘</div>
	    <h2>Help & Support</h2>
	    <p className="contactus-subtitle">
	      If you’re facing any issues, reach out to us
	    </p>
	  </div>

	  {/* SUPPORT INFO */}
	  <div className="support-info">
	    <div className="support-row">
	      <span className="support-label">📧 Email</span>
	      <span className="support-value">support@navigationapp.com</span>
	    </div>

	    <div className="support-row">
	      <span className="support-label">📞 Phone</span>
	      <span className="support-value">+91 98765 43210</span>
	    </div>
	  </div>

	  {/* ACTION */}
	  <div className="contactus-buttons single">
	    <button className="send-btn" onClick={onClose}>Close</button>
	  </div>
	</div>

    </div>
  );
};

export default ContactUs;
