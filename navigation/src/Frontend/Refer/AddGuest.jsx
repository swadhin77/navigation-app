import React, { useState } from "react";
import "./AddGuest.css";
import { ref, set, onValue } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const AddGuest = ({ isOpen, onClose, setGroupCode }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [message, setMessage] = useState("");

  const auth = getAuthInstance();

  const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
    setMessage("");

    set(ref(db, `groups/${code}`), {
      createdAt: Date.now(),
      members: {},
    }).then(() => {
      setGroupCode && setGroupCode(code);
      setMessage(`Group created! Code: ${code}`);
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setMessage("Code copied to clipboard!");
  };

  const shareCode = () => {
    const shareData = {
      title: "Join my trip",
      text: "Join my trip using this invite code!",
      url: window.location.origin + `/dashboard?code=${inviteCode}`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  const handleJoin = () => {
    const code = guestCode.trim().toUpperCase();
    if (code.length !== 6) {
      setMessage("Invalid code! Must be 6 characters.");
      return;
    }

    const groupRef = ref(db, `groups/${code}`);
    onValue(
      groupRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userId = auth.currentUser?.uid || uuidv4();
          const userName = auth.currentUser?.displayName || "Guest";
          const avatar =
            auth.currentUser?.photoURL ||
            "https://via.placeholder.com/40";

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              set(ref(db, `groups/${code}/members/${userId}`), {
                uid: userId,
                name: userName,
                avatar,
                location: loc,
              });
              setGroupCode && setGroupCode(code);
              setMessage(`You joined group: ${code}`);
            },
            () => {
              set(ref(db, `groups/${code}/members/${userId}`), {
                uid: userId,
                name: userName,
                avatar,
                location: { lat: 0, lng: 0 },
              });
              setGroupCode && setGroupCode(code);
              setMessage(
                `You joined group: ${code} (location not available)`
              );
            }
          );
        } else {
          setMessage("Group not found!");
        }
      },
      { onlyOnce: true }
    );
  };

  const handleClose = () => {
    setInviteCode("");
    setGuestCode("");
    setMessage("");
    onClose && onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("guest-overlay")) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="guest-overlay" onClick={handleOverlayClick}>
      <div className="guest-modal">
        {/* ✅ ADDGUEST-SCOPED CLOSE BUTTON */}
        <span className="guest-close-btn" onClick={handleClose}>
          &times;
        </span>

		<h2>Add Guest</h2>
		<p className="guest-subtitle">
		  Invite someone to join your live trip
		</p>

        <div className="invite-section">
          <button className="generate-btn" onClick={generateInviteCode}>
            Generate Invite Code
          </button>

          {inviteCode && (
            <div className="invite-box">
              <p className="invite-label">Share this code:</p>
              <div className="invite-code">{inviteCode}</div>
			  <div className="invite-actions">
			    <button className="copy-btn" onClick={copyToClipboard}>Copy</button>
			    <button className="share-btn" onClick={shareCode}>Share</button>
			  </div>
            </div>
          )}
        </div>

        <hr />

        <div className="join-section">
          <p>Enter an invite code to join:</p>
          <input
            type="text"
            maxLength="6"
            value={guestCode}
            onChange={(e) =>
              setGuestCode(e.target.value.toUpperCase())
            }
            placeholder="Enter code"
          />
          <button className="join-btn" onClick={handleJoin}>
            Join
          </button>
        </div>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default AddGuest;