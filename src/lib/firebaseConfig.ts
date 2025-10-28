import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
// PointBridge Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCi3Kn-8E82r4RaZwJpqD9GhJ1DtaRCTpk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pointbridge-cc2e7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pointbridge-cc2e7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pointbridge-cc2e7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "917028311143",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:917028311143:web:a84c12b6fe685891d0c4c2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DDYBMEQ7PD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export Firebase auth methods
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };

// Export phone auth methods
export { signInWithPhoneNumber, PhoneAuthProvider, RecaptchaVerifier, signInWithCredential } from 'firebase/auth';

// Export app instance
export default app;
