import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ,
};

// Initialize Firebase safely for SSR / Next.js Fast Refresh
let app: FirebaseApp;
let database: Database;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error);
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export { app, database, database as db };
export default database;
