import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-firebase-ee1a8.firebaseapp.com",
  projectId: "react-firebase-ee1a8",
  storageBucket: "react-firebase-ee1a8.appspot.com",
  messagingSenderId: "1054347840734",
  appId: "1:1054347840734:web:0c9121128e72cf5a55464f"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()