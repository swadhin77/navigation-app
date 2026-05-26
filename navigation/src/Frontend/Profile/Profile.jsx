import React, { useState } from "react";
import "./Profile.css";

const Profile = ({ isProfileOpen, setIsProfileOpen }) => {
  const [profile] = useState({
    name: "John Doe",
    phone: "+91 9876543210",
    email: "johndoe@example.com",
    profilePic: "https://via.placeholder.com/120",
  });

  const handleOverlayClick = (e, closeFunction) => {
    if (e.target === e.currentTarget) {
      closeFunction(false);
    }
  };

  return (
    <div>
	<div
	  className={`profile-overlay ${isProfileOpen ? "show" : ""}`}
	  onClick={(e) => handleOverlayClick(e, setIsProfileOpen)}
	>
	  <div className="profile-modal">
	    {/* CLOSE BUTTON */}
	    <span
	      className="profile-close-btn"
	      onClick={() => setIsProfileOpen(false)}
	    >
	      &times;
	    </span>

	    {/* PROFILE HEADER */}
	    <div className="profile-header">
	      <img
	        src={profile.profilePic}
	        alt="Profile"
	        className="profile-avatar"
	      />
	      <h3 className="profile-name">{profile.name}</h3>
	    </div>

	    {/* PROFILE INFO */}
	    <div className="profile-info">
		<div className="info-row">
		  <span className="label">📞 Phone</span>
		  <span className="value">{profile.phone}</span>
		</div>

		<div className="info-row">
		  <span className="label">✉️ Email</span>
		  <span className="value">{profile.email}</span>
		</div>

	    </div>
	  </div>
	</div>
    </div>
  );
};

export default Profile;
