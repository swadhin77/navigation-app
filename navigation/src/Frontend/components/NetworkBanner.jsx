import React from "react";

const NetworkBanner = ({ isOnline }) => {

	if (isOnline) return null;

	return (
		<div style={styles.banner}>
			⚠ Network connection lost. Some services may not work.
		</div>
	);
};

const styles = {
	banner: {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		background: "#dc2626",
		color: "white",
		textAlign: "center",
		padding: "12px",
		fontWeight: "600",
		zIndex: "999999",
		fontSize: "14px",
		letterSpacing: "0.5px"
	}
};

export default NetworkBanner;