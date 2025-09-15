// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDoMXA0CjZvORq0D8uFUfUACLIIa--6Huk",
  authDomain: "arthanote.firebaseapp.com",
  projectId: "arthanote",
  storageBucket: "arthanote.firebasestorage.app",
  messagingSenderId: "29404261375",
  appId: "1:29404261375:web:05aebf88665a239d4115ca",
  measurementId: "G-SRCPD778W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);