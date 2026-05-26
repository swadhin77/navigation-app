// src/Frontend/ForgotPassword/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./ForgotPassword.css"; // ✅ same folder
import logo from "/images/logoimg.jpg";
import { useTheme } from "../Other/Theam";
import { auth, setupRecaptcha } from "../../firebase";
import { signInWithPhoneNumber } from "firebase/auth";

const ForgotPassword = () => {
	const [phone, setPhone] = useState("");
	const [otp, setOtp] = useState("");
	const [isOtpVerified, setIsOtpVerified] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [message, setMessage] = useState("");
	const [msgColor, setMsgColor] = useState("red");

	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	const handleSendOtp = async () => {
		if (!phone) {
			setMessage("Enter valid phone");
			setMsgColor("red");
			return;
		}

		try {
			setupRecaptcha();

			const appVerifier = window.recaptchaVerifier;
			console.log("Phone sent:", "+" + phone);
			const confirmationResult = await signInWithPhoneNumber(
			    auth,
			    "+" + phone.replace("+", ""),
			    appVerifier
			);

			window.confirmationResult = confirmationResult;

			setMessage("OTP sent successfully!");
			setMsgColor("green");

		} catch (err) {
			console.error(err);
			setMessage("Failed to send OTP");
			setMsgColor("red");
		}
	};

	const handleVerifyOtp = async () => {
		try {
			const result = await window.confirmationResult.confirm(otp);

			if (result.user) {
				setIsOtpVerified(true);
				setMessage("OTP verified!");
				setMsgColor("green");
			}

		} catch (err) {
			console.error(err);

			if (err.code === "auth/code-expired") {
				setMessage("OTP expired");
			} else if (err.code === "auth/invalid-verification-code") {
				setMessage("Invalid OTP");
			} else {
				setMessage("Verification failed");
			}

			setMsgColor("red");
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			setMessage("Passwords do not match");
			return;
		}

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone, newPassword }),
			});

			const data = await res.json();

			if (!res.ok) {
				setMessage(data.message);
				return;
			}

			setMessage("Password changed successfully!");
			setTimeout(() => navigate("/login"), 2000);

		} catch {
			setMessage("Error resetting password");
		}
	};

	return (
		<div className="forgot-page">
			{/* Overlay */}
			<div className="overlay"></div>
			<div id="recaptcha-container"></div>
			<div className="forgot-container">
				{/* Logo */}
				<img src={logo} alt="Logo" className="logo" />

				<h1 className="title">Forgot Password</h1>
				<p className="subtitle">Verify your mobile to reset password</p>

				<form onSubmit={handleSubmit}>
				<PhoneInput
				  country={"in"}
				  value={phone}
				  onChange={(value) => setPhone(value)}
				  countryCodeEditable={false}   // 🔥 IMPORTANT FIX
				  enableSearch={true}
				  disableSearchIcon={false}
				  inputStyle={{
				    width: "100%",
				    height: "48px",
				    paddingLeft: "58px"
				  }}
				/>

					{!isOtpVerified && (
						<div className="otp-section">
							<input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}	placeholder="Enter OTP"/>
							<div className="otp-buttons">
								<button type="button" className="otp-btn" onClick={handleSendOtp}>
									Send OTP
								</button>
								<button	type="button" className="otp-btn" onClick={handleVerifyOtp}	disabled={!otp}>
									Verify OTP
								</button>
							</div>
						</div>
					)}

					{isOtpVerified && (
						<>
							<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Enter New Password" required minLength={6}	autoComplete="new-password"/>
							<input type="password" value={confirmPassword}	onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm New Password"	required minLength={6} autoComplete="new-password"/>
							<input type="submit" value="Change Password" className="btn" />
						</>
					)}
				</form>

				{/* Messages */}
				{message && (
					<p style={{ color: msgColor, fontSize: "13px", margin: "8px 0" }}>
						{message}
					</p>
				)}

				{/* Links */}
				<div className="links">
					<button	type="button" onClick={() => navigate("/login")}>
						Back to Login
					</button>
				</div>

				{/* Theme toggle */}
				<div style={{ marginTop: "12px" }}>
				<button
				  onClick={toggleTheme}
				  style={{
				    padding: "10px 16px",
				    borderRadius: "8px",
				    cursor: "pointer",
				    background: isDark ? "#f1f1f1" : "#121212",
				    color: isDark ? "#121212" : "#ffffff",
				    fontWeight: "600",
				    transition: "0.3s"
				  }}
				>
				  {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
				</button>
				</div>
			</div>
		</div>
	);
};

export default ForgotPassword;
