import React, { useState } from "react";
import "./ReferFriend.css";

const ReferFriend = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Referral link sent to ${email}`);
    setEmail("");
    onClose();
  };

  return (
	<div className="refer-overlay" onClick={onClose}>
	  <div className="refer-modal" onClick={(e) => e.stopPropagation()}>

	    <button className="refer-close-btn" onClick={onClose}>×</button>

	    {/* ICON HEADER */}
	    <div className="refer-icon">🎁</div>

	    <h2>Refer a Friend</h2>
	    <p className="refer-subtitle">
	      Invite your friends to try this app and travel together
	    </p>

	    <form onSubmit={handleSubmit} className="refer-form">
	      <input
	        type="email"
	        placeholder="Friend’s email address"
	        value={email}
	        onChange={(e) => setEmail(e.target.value)}
	        required
	      />

	      <button type="submit">Send Invite</button>
	    </form>
	  </div>
	</div>

  );
};

export default ReferFriend;
