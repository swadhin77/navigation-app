// Function to send OTP

function sendOTP(type) 
{
	let email = document.getElementById("email").value.trim();
	let phone = document.getElementById("phone").value.trim();

	if (type === 'email') 
	{
		
		if (email === "") 
		{
			alert("Please enter your Email before sending OTP.");
			return;
		}
		
		// Call backend API to send Email OTP
		fetch(`/api/sendEmailOTP?email=${encodeURIComponent(email)}`)
			.then(res => res.json())
			.then(data => alert(data.message || "Email OTP sent successfully!"))
			.catch(() => alert("Error sending Email OTP."));
			
	}

	if (type === 'phone') 
	{
		
		if (phone === "") 
		{
			alert("Please enter your Mobile Number before sending OTP.");
			return;
		}
		
		// Call backend API to send Mobile OTP
		fetch(`/api/sendMobileOTP?phone=${encodeURIComponent(phone)}`)
			.then(res => res.json())
			.then(data => alert(data.message || "Mobile OTP sent successfully!"))
			.catch(() => alert("Error sending Mobile OTP."));
	}
}

// Function to handle registration

function registerUser(event) 
{
	event.preventDefault();

	let password = document.getElementById("password").value.trim();
	let confirmPassword = document.getElementById("confirmPassword").value.trim();

	if (password !== confirmPassword) 
	{
		alert("Passwords do not match!");
		return;
	}
	// getting user detail's from the form
	let formData = 
	{
		name: document.getElementById("name").value.trim(),
		email: document.getElementById("email").value.trim(),
		phone: document.getElementById("phone").value.trim(),
		emailOTP: document.getElementById("emailOTP").value.trim(),
		mobileOTP: document.getElementById("mobileOTP").value.trim(),
		password: password
	};

	// Send data to backend for registration
	
	fetch("/api/register", 
	{
		method: "POST",
		headers: { "Content-Type": "application/json" }, // tells backend data is JSON
		body: JSON.stringify(formData)   	// converts JS object into JSON string
	})
		.then(res => res.json())
		.then(data => 
		{
			alert(data.message || "Successfully Registered!");
			window.location.href = "login.html"; // Redirect to login page
		})
		.catch(() => alert("Registration failed! Please try again."));
}
