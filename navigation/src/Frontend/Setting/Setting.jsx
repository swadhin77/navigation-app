import React, { useState } from "react";
import "./Setting.css";

const Setting = ({ isSettingOpen, onClose }) => {
	// State to control which view is active
	const [activeView, setActiveView] = useState("main");

	// Profile update option
	const [profileOption, setProfileOption] = useState("");

	// Controlled input states
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [isOtpSent, setIsOtpSent] = useState(false);
	const [otp, setOtp] = useState("");

	if (!isSettingOpen) return null;

	const isValidEmail = (email) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const sendOtp = () => {
		if (!isValidEmail(email)) {
			alert("Please enter a valid email address.");
			return;
		}
		setIsOtpSent(true);
		alert(`OTP sent to ${email}. Use 123456 for demo.`);
	};

	const confirmOtp = () => {
		if (otp === "123456") {
			alert(`Email changed successfully to ${email}`);
			setIsOtpSent(false);
			setOtp("");
			setEmail("");
			setProfileOption("");
			setActiveView("main");
		} else {
			alert("Invalid OTP! Try again.");
		}
	};

	const handleOtpChange = (index, value) => {
		if (!/^\d?$/.test(value)) return;

		const otpArr = otp.padEnd(6, "-").split("");
		otpArr[index] = value || "-";
		setOtp(otpArr.join("").replace(/-/g, ""));

		if (value && index < 5) {
			const next = document.getElementById(`otp-${index + 1}`);
			if (next) next.focus();
		}
	};

	return (
		<div className="setting-overlay show" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				{/* SETTING CLOSE BUTTON */}
				<span className="setting-close-btn" onClick={onClose}>
					&times;
				</span>

				<h2>Settings</h2>

				{activeView === "main" && (
					<div className="setting-options">
						<button onClick={() => setActiveView("profile")}>
							Update Profile
						</button>
						<button onClick={() => setActiveView("password")}>
							Change Password
						</button>
					</div>
				)}

				{activeView === "profile" && (
					<div className="form-section">
						<h3>Update Profile</h3>

						<select
							value={profileOption}
							onChange={(e) => setProfileOption(e.target.value)}
						>
							<option value="">-- Select an option --</option>
							<option value="username">Change Username</option>
							<option value="email">Change Email</option>
						</select>

						{profileOption === "username" && (
							<input
								type="text"
								placeholder="Enter new username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						)}

						{profileOption === "email" && !isOtpSent && (
							<>
								<input
									type="email"
									placeholder="Enter new email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
								<button className="send-otp-btn" onClick={sendOtp}>
									Send OTP
								</button>
							</>
						)}

						{profileOption === "email" && isOtpSent && (
							<div className="otp-container">
								<label>OTP:</label>
								<div className="otp-boxes">
									{Array(6)
										.fill(0)
										.map((_, i) => (
											<input
												key={i}
												id={`otp-${i}`}
												type="text"
												maxLength="1"
												value={otp[i] || ""}
												onChange={(e) =>
													handleOtpChange(i, e.target.value)
												}
											/>
										))}
								</div>
								<button
									className="confirm-otp-btn"
									onClick={confirmOtp}
								>
									Confirm OTP
								</button>
							</div>
						)}

						<div className="modal-actions">
							<button onClick={() => setActiveView("main")}>
								⬅ Back
							</button>
							<button onClick={onClose}>Close</button>
						</div>
					</div>
				)}

				{activeView === "password" && (
					<div className="form-section">
						<h3>Change Password</h3>
						<input type="password" placeholder="Old Password" />
						<input type="password" placeholder="New Password" />
						<input type="password" placeholder="Confirm New Password" />
						<div className="modal-actions">
							<button onClick={() => setActiveView("main")}>
								⬅ Back
							</button>
							<button>Save</button>
							<button onClick={onClose}>Close</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Setting;
