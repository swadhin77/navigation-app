package com.omoikaneinnovation.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.omoikaneinnovation.dto.GoogleLoginRequest;
import com.omoikaneinnovation.dto.LoginRequest;
import com.omoikaneinnovation.dto.LoginResponse;
import com.omoikaneinnovation.dto.OtpRequest;
import com.omoikaneinnovation.dto.RegisterRequest;
import com.omoikaneinnovation.dto.ResetPasswordRequest;
import com.omoikaneinnovation.dto.SaveUserMobileRequest;
import com.omoikaneinnovation.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Autowired
	private AuthService authService;

	// =====================================
	// 🔐 LOGIN
	// =====================================
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest request) {
		try {
			LoginResponse response = authService.login(request);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.status(401).body(new LoginResponse(null, "Invalid mobile number or password"));
		}
	}

	// =====================================
	// 📧 SEND EMAIL OTP
	// =====================================
	@PostMapping("/sendEmailOTP")
	public ResponseEntity<?> sendEmailOtp(@RequestParam String email) {
		authService.sendEmailOtp(email);
		return ResponseEntity.ok(Map.of("message", "Email OTP sent"));
	}

	// =====================================
	// ✅ VERIFY EMAIL OTP
	// =====================================
	@PostMapping("/verifyEmailOTP")
	public ResponseEntity<?> verifyEmailOtp(@RequestBody OtpRequest req) {

		boolean valid = authService.verifyEmailOtp(req.getEmail(), req.getOtp());

		if (!valid) {
			return ResponseEntity.status(400).body(Map.of("message", "Invalid or expired OTP"));
		}

		return ResponseEntity.ok(Map.of("message", "OTP verified"));
	}

	@PostMapping("/saveUserMobile")
	public ResponseEntity<?> saveUserMobile(@RequestBody SaveUserMobileRequest request) {

		try {
			authService.saveUserMobile(request);

			return ResponseEntity.ok(Map.of("token", "final-login-token", "message", "User saved successfully"));

		} catch (Exception e) {
			return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
		}
	}

	// =====================================
	// 🧾 REGISTER
	// =====================================
	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody RegisterRequest req) {

		try {
			String msg = authService.register(req);
			return ResponseEntity.ok(Map.of("message", msg));
		} catch (Exception e) {
			return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
		}
	}

	// =====================================
	// 🔑 RESET PASSWORD
	// =====================================
	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
		authService.resetPassword(req.getPhone(), req.getNewPassword());
		return ResponseEntity.ok(Map.of("message", "Password updated"));
	}

	@PostMapping("/google-login")
	public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {

		// ✅ 1. Token validation
		if (request.getToken() == null || request.getToken().isEmpty()) {
			return ResponseEntity.badRequest().body(Map.of("message", "Token missing"));
		}

		try {
			// ✅ 2. VERIFY TOKEN (IMPORTANT)
			authService.googleLogin(request); // 🔥 THIS WAS MISSING

			String email = request.getEmail();

			String phone = authService.getPhoneByEmail(email);

			if (phone != null) {
				return ResponseEntity.ok(
						Map.of("token", "google-login-token", "requiresMobile", false, "message", "Login successful"));
			}

			Map<String, Object> response = new java.util.HashMap<>();
			response.put("token", null);
			response.put("requiresMobile", true);
			response.put("message", "Mobile number required");

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			e.printStackTrace(); // 🔥 ADD THIS FOR DEBUG
			return ResponseEntity.status(400).body(Map.of("message", "Google login failed"));
		}
	}

	@PostMapping("/sendMobileOTP")
	public ResponseEntity<?> sendMobileOtp(@RequestParam String phone) {

		System.out.println("Mobile OTP requested for: " + phone);

		return ResponseEntity.ok(Map.of("message", "OTP sent (handled by Firebase)"));
	}
}