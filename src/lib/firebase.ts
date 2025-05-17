// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, serverTimestamp as fsServerTimestamp } from "firebase/firestore"; // Added serverTimestamp

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Check if all required environment variables are set
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId ||
  !process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL
) {
  console.error(
    "Firebase configuration or NEXT_PUBLIC_SUPERADMIN_EMAIL is missing. Make sure all NEXT_PUBLIC_FIREBASE_* and NEXT_PUBLIC_SUPERADMIN_EMAIL environment variables are set in your .env.local file."
  );
}


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const serverTimestamp = fsServerTimestamp; // Export serverTimestamp

export { app, auth, db, serverTimestamp };
