// src/Frontend/NewUser/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2"; 
import "react-phone-input-2/lib/style.css";
import { useTheme } from "../Other/Theam";
import "./register.css"; // ✅ same folder


const Register = () => {
	// 🔹 Form state
	const [form, setForm] = useState({
		name: "",
		email: "",
		mobile: "",
		countryCode: "+91",
		emailOtp: "",
		mobileOtp: "",
		password: "",
		confirmPassword: "",
	});

	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	// 🔹 Flags to enable OTP inputs only after sending
	const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
	const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);
	const [isEmailVerified, setIsEmailVerified] = useState(false);
	// 🔹 Handle text input change
	const handleChange = (e) => {
		setForm({ ...form, [e.target.id]: e.target.value });
	};

	// 🔹 Handle phone number input change
	const handlePhoneChange = (value, data) => {
		setForm({
			...form,
			countryCode: `+${data.dialCode}`, // set country code (e.g., +91)
			mobile: value.replace(data.dialCode, ""), // remove dial code and keep only number
		});
	};

	// 🔹 Send OTP (email or mobile)
	const sendOTP = (type) => {
		if (type === "email") {
			// Ensure email exists before sending OTP
			if (!form.email) return alert("Please enter your Email before sending OTP.");
			fetch(`${import.meta.env.VITE_API_URL}/api/auth/sendEmailOTP?email=${form.email}`, {
			  method: "POST"
			})
				.then((res) => res.json())
				.then((data) => {
					alert(data.message || "Email OTP sent successfully!");
					setEmailOtpEnabled(true); // enable email OTP input
				})
				.catch(() => alert("Error sending Email OTP."));
		}

		if (type === "mobile") {
		    // Ensure mobile exists before sending OTP
		    if (!form.mobile) {
		        return alert("Please enter your Mobile Number before sending OTP.");
		    }

		    const fullNumber = `${form.countryCode}${form.mobile}`;

		    fetch(`${import.meta.env.VITE_API_URL}/api/sendMobileOTP?phone=${encodeURIComponent(fullNumber)}`, {
		        method: "POST"
		    })
		        .then((res) => res.json())
		        .then((data) => {
		            alert(data.message || "Mobile OTP sent successfully!");
		            setMobileOtpEnabled(true);
		        })
		        .catch(() => alert("Error sending Mobile OTP."));
		}
	};

	// 🔹 Handle Register Submit
	const registerUser = (e) => {
		e.preventDefault();
		if (!isEmailVerified) {
		  return alert("Please verify email first!");
		}
		// Password validation
		if (form.password !== form.confirmPassword) {
			return alert("Passwords do not match!");
		}

		const fullNumber = `${form.countryCode}${form.mobile}`;

		// Send registration request
		fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...form, phone: fullNumber }),
		})
			.then((res) => res.json())
			.then((data) => {
				alert(data.message || "Successfully Registered!");
				// Redirect to login after success
				setTimeout(() => navigate("/login"), 2000);
			})
			.catch(() => alert("Registration failed! Please try again."));
	};
	const verifyEmailOtp = async () => {
	  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verifyEmailOTP`, {
	    method: "POST",
	    headers: {"Content-Type": "application/json"},
	    body: JSON.stringify({
	      email: form.email,
	      otp: form.emailOtp
	    })
	  });

	  const data = await res.json();

	  if (!res.ok) {
	    alert(data.message);
	  } else {
	    alert("Email Verified ✅");
	    setIsEmailVerified(true); // ✅ IMPORTANT
	  }
	};
	return (
		<div className="register-page">
			<div className="register-container">
				{/* Logo */}
				<div className="logo-container">
					<img src="/logoimg3.png" alt="Map Icon" className="logo" />
				</div>

				{/* Title */}
				<h2 className="title">Create Account</h2>
				<p className="subtitle">Join our Navigation App to start your journey</p>

				{/* Registration Form */}
				<form onSubmit={registerUser}>
					{/* Full Name */}
					<div className="form-group">
						<label htmlFor="name">Full Name</label>
						<input id="name" type="text" placeholder="Enter your full name"	value={form.name} 
						onChange={handleChange}	required/>
					</div>

					{/* Email + OTP */}
					<div className="form-group">
						<label htmlFor="email">Email Address</label>
						<div className="otp-row">
							<input id="email" type="email" placeholder="your@email.com" value={form.email}
								onChange={handleChange}	required/>
							<button type="button" className="otp-btn" onClick={() => sendOTP("email")}>
								Send OTP
							</button>
						</div>
					</div>

					{/* Email OTP Input */}
					<div className="form-group">
					  <label htmlFor="emailOtp">Email OTP</label>
					  <input
					    id="emailOtp"
					    type="text"
					    placeholder="Enter Email OTP"
					    maxLength="6"
					    value={form.emailOtp}
					    onChange={handleChange}
					    disabled={!emailOtpEnabled}
					  />

					  {/* ✅ ADD THIS BUTTON */}
					  <button type="button" onClick={verifyEmailOtp} style={{ marginTop: "8px" }}>
					    Verify Email OTP
					  </button>
					</div>

					{/* Mobile + OTP */}
					<div className="form-group">
						<label htmlFor="mobile">Mobile Number</label>
						<div className="otp-row">
							<PhoneInput	country={"in"} // default country
								value={`${form.countryCode}${form.mobile}`}	onChange={handlePhoneChange} 
								inputProps={{ name: "mobile", required: true }}/>
							<button type="button" className="otp-btn" onClick={() => sendOTP("mobile")}>
								Send OTP
							</button>
						</div>
					</div>

					{/* Mobile OTP Input */}
					<div className="form-group">
						<label htmlFor="mobileOtp">Mobile OTP</label>
						<input
							id="mobileOtp"
							type="text"
							placeholder="Enter Mobile OTP"
							maxLength="6"
							value={form.mobileOtp}
							onChange={handleChange}
							disabled={!mobileOtpEnabled} // disabled until OTP sent
						/>
					</div>

					{/* Password */}
					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							placeholder="Min 6 characters"
							minLength="6"
							value={form.password}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Confirm Password */}
					<div className="form-group">
						<label htmlFor="confirmPassword">Confirm Password</label>
						<input
							id="confirmPassword"
							type="password"
							placeholder="Re-enter password"
							minLength="6"
							value={form.confirmPassword}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Submit Button */}
					<button type="submit" className="btn">Register</button>

					{/* Already have account → Link to Login */}
					<div className="links">
						Already have an account? <Link to="/login">Login</Link>
					</div>

					{/* Theme toggle button */}
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
				</form>
			</div>
		</div>
	);
};

export default Register;
