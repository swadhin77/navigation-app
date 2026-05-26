// src/utils/deviceInfo.js

function getDeviceInfo() {
	let deviceInfo = {
		os: "Unknown",
		osVersion: "Unknown",
		browser: "Unknown",
		ram: navigator.deviceMemory || "N/A",
		gpu: "Unknown",
		userAgent: navigator.userAgent
	};

	// Browser detection
	if (navigator.userAgentData) {
		deviceInfo.browser = navigator.userAgentData.brands
			.map(b => b.brand + " " + b.version)
			.join(", ");
	}

	// OS detection from UA
	const ua = navigator.userAgent;
	if (ua.indexOf("Win") !== -1) deviceInfo.os = "Windows";
	else if (ua.indexOf("Mac") !== -1) deviceInfo.os = "MacOS";
	else if (ua.indexOf("Linux") !== -1) deviceInfo.os = "Linux";
	else if (/Android/.test(ua)) deviceInfo.os = "Android";
	else if (/iPhone|iPad|iPod/.test(ua)) deviceInfo.os = "iOS";

	// WebGL GPU detection
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl");
		const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
		if (debugInfo) {
			deviceInfo.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		}
	} catch (e) {
		deviceInfo.gpu = "Not available";
	}

	return deviceInfo;
}

export default getDeviceInfo;
