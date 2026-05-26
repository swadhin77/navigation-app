document.getElementById("forgotForm").addEventListener("submit", function(event)
 {
	event.preventDefault();

	let phone = document.getElementById("phoneno").value.trim();
	let newPassword = document.getElementById("new_password").value.trim();
	let confirmPassword = document.getElementById("confirm_password").value.trim();
	let errorMsg = document.getElementById("error-msg");

	// Validate phone number (must be 10 digits)
	let phonePattern = /^[0-9]{10}$/;
	
	if (!phonePattern.test(phone)) 
	{
		errorMsg.textContent = "Enter a valid 10-digit mobile number.";
		errorMsg.style.color = "red";
		return;
	}

	// Validate password length
	if (newPassword.length < 6) 
	{
		errorMsg.textContent = "Password must be at least 6 characters long.";
		errorMsg.style.color = "red";
		return;
	}

	// Validate passwords match
	if (newPassword !== confirmPassword) 
	{
		errorMsg.textContent = "Passwords do not match!";
		errorMsg.style.color = "red";
		return;
	}

	// Clear error if all good
	errorMsg.style.color = "green";
	errorMsg.textContent = "✅ Password changed successfully! (Frontend only)";

	// reset form
	document.getElementById("forgotForm").reset();

});
