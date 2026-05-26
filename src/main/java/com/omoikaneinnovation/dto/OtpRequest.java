package com.omoikaneinnovation.dto;

public class OtpRequest {

	private String phone; 
	private String email; 
	private String otp;

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getEmail() { 
		return email;
	}

	public void setEmail(String email) { 
		this.email = email;
	}

	public String getOtp() {
		return otp;
	}

	public void setOtp(String otp) {
		this.otp = otp;
	}
}