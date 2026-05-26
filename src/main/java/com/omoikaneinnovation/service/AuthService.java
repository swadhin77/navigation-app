package com.omoikaneinnovation.service;

import com.omoikaneinnovation.dto.GoogleLoginRequest;
import com.omoikaneinnovation.dto.LoginRequest;
import com.omoikaneinnovation.dto.LoginResponse;
import com.omoikaneinnovation.dto.RegisterRequest;
import com.omoikaneinnovation.dto.SaveUserMobileRequest;

public interface AuthService {
	LoginResponse login(LoginRequest request);

	void resetPassword(String phone, String newPassword);

	void sendEmailOtp(String email);

	boolean verifyEmailOtp(String email, String otp);

	String register(RegisterRequest request);

	String googleLogin(GoogleLoginRequest request);

	String saveUserMobile(SaveUserMobileRequest request);

	String getPhoneByEmail(String email);
}