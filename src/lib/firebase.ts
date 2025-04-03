
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBPRQoxz7J4sWs8gb29Ug6JNt7bfTEkz9E",
  authDomain: "organizador-de-leituras.firebaseapp.com",
  projectId: "organizador-de-leituras",
  storageBucket: "organizador-de-leituras.firebasestorage.app",
  messagingSenderId: "884675539442",
  appId: "1:884675539442:web:da474ba773ad4e35433b6b",
  measurementId: "G-VEYZN56VWZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
