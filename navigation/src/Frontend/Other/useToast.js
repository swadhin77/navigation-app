export const showToast = (message) => {
	if (document.getElementById("global-toast")) return;

	const toast = document.createElement("div");
	toast.id = "global-toast";
  toast.innerText = message;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#333",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    zIndex: 99999,
    fontSize: "14px",
  });

  document.body.appendChild(toast);

  setTimeout(() => {
	toast.remove();
  }, 2500);
};
