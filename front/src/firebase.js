import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, set } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuration Firebase (using environment variables)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation des services Firebase
const analytics = getAnalytics(app);
const db = getDatabase(app); // Realtime Database
const auth = getAuth(app);   // Authentification
const storage = getStorage(app); // Stockage

// Export des services
export { app, analytics, db, auth, storage };

// Export des méthodes courantes (optionnel)
export const firebaseServices = {
  // Méthodes pour la base de données
  database: {
    getRef: (path) => ref(db, path),
    getData: async (path) => {
      const snapshot = await get(ref(db, path));
      return snapshot.exists() ? snapshot.val() : null;
    },
    setData: (path, data) => set(ref(db, path), data)
  },
  
  // Méthodes pour l'authentification
  auth: {
    currentUser: () => auth.currentUser,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth)
  }
};