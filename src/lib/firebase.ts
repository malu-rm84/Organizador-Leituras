
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

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

// Para resolver o problema de domínio não autorizado durante o desenvolvimento
// Detecta se estamos em um ambiente de desenvolvimento
const isLocalhost = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" ||
                    window.location.hostname.includes("192.168.") ||
                    window.location.hostname.includes("10.0.") ||
                    window.location.hostname.includes("172.16.") ||
                    window.location.hostname.includes("::1");

// Conecta aos emuladores do Firebase localmente quando estamos em desenvolvimento
if (isLocalhost) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("Connected to Firebase Emulators");
  } catch (error) {
    console.warn("Failed to connect to Firebase Emulators:", error);
  }
}

export default app;
