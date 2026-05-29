import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjh5oaoWhUQh83EJ_lrVSx3S-ctuzPMd4",
  authDomain: "chandlai-media.firebaseapp.com",
  databaseURL: "https://chandlai-media-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chandlai-media",
  storageBucket: "chandlai-media.firebasestorage.app",
  messagingSenderId: "418845095666",
  appId: "1:418845095666:web:787fa0ad9d5d96b1c1426b",
  measurementId: "G-815BWB6138"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
