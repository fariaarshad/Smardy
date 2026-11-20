// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// App Check debug token: lets you test on localhost and record your demo.
// This line MUST run before initializeAppCheck.
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  // Paste the reCAPTCHA v3 site key from the App Check page in the Firebase console.
  provider: new ReCaptchaV3Provider("6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"),
  isTokenAutoRefreshEnabled: true,
});

// Firebase AI Logic with the Gemini Developer API
const ai = getAI(app, { backend: new GoogleAIBackend() });

// MODEL 1: tries the on-device AI first (runs inside Chrome, works offline)
export const cleanModel = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
});

// MODEL 2: tries the cloud AI first (more powerful)
export const hookModel = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_IN_CLOUD,
});

export const db = getFirestore(app);
export const auth = getAuth(app);