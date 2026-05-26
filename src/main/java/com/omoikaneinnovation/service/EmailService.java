package com.omoikaneinnovation.service;

public interface EmailService {
	void sendOtpEmail(String toEmail, String otp);
}