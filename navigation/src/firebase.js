import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA04fqjr8QhvEwLPfNuGYcJEMLHi209mdY",
  authDomain: "navigationapp-e43a1.firebaseapp.com",
  projectId: "navigationapp-e43a1",
  appId: "1:640394444975:web:32ead992665feafe46d45a",
};

// ✅ Prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// ✅ FIXED Recaptcha (IMPORTANT CHANGE)
export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth, // 🔥 FIRST PARAM (FIXED)
      "recaptcha-container", // 🔥 SECOND PARAM
      {
        size: "invisible",
      }
    );
  }
};