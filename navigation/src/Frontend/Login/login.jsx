import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../Other/Theam";
import "./login.css";
import { auth } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { signInWithPhoneNumber } from "firebase/auth";
import { setupRecaptcha } from "../../firebase";
const Login = () => {
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	const [otp, setOtp] = useState("");
	const [confirmationResult, setConfirmationResult] = useState(null);
	const [mobileNumber, setMobileNumber] = useState("");
	const [otpSending, setOtpSending] = useState(false);
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!phone && !email) {
		  alert("Enter mobile number or email");
		  return;
		}
		if (!password) {
			alert("Please enter your password");
			return;
		}

		setLoading(true);

		try {
			const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;

			const res = await fetch(apiUrl, {
			  method: "POST",
			  headers: { "Content-Type": "application/json" },
			  body: JSON.stringify({ phone, email, password }),
			});

			const data = await res.json(); 

			if (!res.ok) {
			  alert(data.message || "Login failed");
			  return;
			}

			localStorage.setItem("userToken", data.token || "dummyToken");
			navigate("/dashboard", { replace: true });
		} catch (err) {
			console.error(err);
			alert("Something went wrong! Please try again later.");
		} finally {
			setLoading(false);
		}
	};
	const [isGoogleLoginRunning, setIsGoogleLoginRunning] = useState(false);
	const [showMobilePopup, setShowMobilePopup] = useState(false);
	const [googleUserData, setGoogleUserData] = useState(null);
	const handleGoogleLogin = async () => {
		if (isGoogleLoginRunning) return;

		setIsGoogleLoginRunning(true);

	  try {
	    const provider = new GoogleAuthProvider();

	    const result = await signInWithPopup(auth, provider);

	    const user = result.user;

	    const token = await user.getIdToken();

	    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
	      method: "POST",
	      headers: {
	        "Content-Type": "application/json",
	      },
	      body: JSON.stringify({
	        token,
	        name: user.displayName,
	        email: user.email,
	        photo: user.photoURL
	      }),
	    });

	    const data = await res.json();

	    if (!res.ok) {
	      alert(data.message || "Google login failed");
	      return;
	    }

		if (data.requiresMobile) {
		  setGoogleUserData({
		    email: user.email,
		    name: user.displayName,
		    token: token
		  });

		  setShowMobilePopup(true);
		} else {
		  localStorage.setItem("userToken", data.token);
		  navigate("/dashboard");
		}

	  } catch (error) {
	    console.error("Google Login Error:", error);

	    if (error.code === "auth/popup-closed-by-user") {
	      alert("Login cancelled");
	    } else if (error.code === "auth/cancelled-popup-request") {
	      console.warn("Popup request cancelled");
	    } else {
	      alert("Google Login Failed");
	    }

	  } finally {
		setIsGoogleLoginRunning(false);
	  }
	};
	const sendOtp = async () => {
	  try {
	    setOtpSending(true);

	    if (!window.recaptchaVerifier) {
	      setupRecaptcha();
	    }

	    const appVerifier = window.recaptchaVerifier;

	    if (!/^[0-9]{10}$/.test(mobileNumber)) {
	      setOtpSending(false);
	      return alert("Enter valid mobile number");
	    }

	    const result = await signInWithPhoneNumber(
	      auth,
	      "+91" + mobileNumber,
	      appVerifier
	    );

	    setConfirmationResult(result);
	    alert("OTP sent");

	  } catch (error) {
	    console.error(error);
	    alert("OTP send failed");
	  } finally {
	    setOtpSending(false);
	  }
	};

	const verifyOtp = async () => {
	  try {
		if (!confirmationResult) {
		  return alert("Please send OTP first");
		}
	    const result = await confirmationResult.confirm(otp);

	    const verifiedPhone = result.user.phoneNumber;

	    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/saveUserMobile`, {
	      method: "POST",
	      headers: {
	        "Content-Type": "application/json"
	      },
	      body: JSON.stringify({
	        email: googleUserData.email,
	        name: googleUserData.name,
	        phone: verifiedPhone
	      })
	    });

	    const data = await res.json();

	    if (!res.ok) {
	      alert(data.message);
	      return;
	    }

	    localStorage.setItem("userToken", data.token);
		// 🔥 ADD THIS BLOCK
		setShowMobilePopup(false);
		setConfirmationResult(null);
		setOtp("");
		setMobileNumber("");
	    navigate("/dashboard");

	  } catch (error) {
	    console.error(error);
	    alert("Invalid OTP");
	  }
	};
	return (
		<div className="login-page">
			<div className="login-card card">
				<img src="/logoimg3.png" alt="App Logo" className="logo" />
				<h1 className="title">Navigation App</h1>
				<p className="subtitle">Your journey starts here 🚗</p>

				<form onSubmit={handleSubmit}>
					<div className="form-group">
					<label>Mobile or Email</label>
					<input
					  type="text"
					  placeholder="Enter mobile or email"
					  value={phone ? phone : email}
					  onChange={(e) => {
					    const value = e.target.value;

					    if (/^[0-9]+$/.test(value)) {
					      setPhone(value);
					      setEmail("");
					    } else {
					      setEmail(value);
					      setPhone("");
					    }
					  }}
					/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							placeholder="Enter your password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<button type="submit" className="btn" disabled={loading}>
						{loading ? "Logging in..." : "Log In"}
					</button>
					<button 
					  type="button" 
					  className="btn" 
					  onClick={handleGoogleLogin}
					  disabled={loading}
					>
					  Continue with Google
					</button>
					<p className="links">
						<button
							type="button"
							className="link-btn"
							onClick={() => navigate("/forgot-password")}
						>
							Forgot password?
						</button>
					</p>

					<p className="signup-text">
						Don’t have an account?{" "}
						<button
							type="button"
							className="link-btn"
							onClick={() => navigate("/register")}
						>
							Sign Up
						</button>
					</p>
				</form>

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
			{showMobilePopup && (
			  <div className="mobile-overlay">
			    <div className="mobile-card">
				<button
				  onClick={() => setShowMobilePopup(false)}
				  style={{
				    position: "absolute",
				    top: "10px",
				    right: "10px",
				    background: "transparent",
				    color: "#000",
				    fontSize: "18px",
				    border: "none",
				    cursor: "pointer"
				  }}
				>
				  ✕
				</button>
			      <h2>Complete Profile</h2>

				  <input
				    placeholder="Enter mobile number"
				    value={mobileNumber}
				    onChange={(e) => setMobileNumber(e.target.value)}
				  />

				  <button onClick={sendOtp} disabled={otpSending}>
				    {otpSending ? "Sending..." : "Send OTP"}
				  </button>

			      <div id="recaptcha-container"></div>

			      {confirmationResult && (
			        <>
					<input
					  placeholder="Enter 6-digit OTP"
					  maxLength={6}
					  value={otp}
					  onChange={(e) => setOtp(e.target.value)}
					/>

					<button onClick={verifyOtp} disabled={!otp}>
					  Verify & Continue
					</button>
			        </>
			      )}

			    </div>
			  </div>
			)}
		</div>
		
	);
	
};

export default Login;
