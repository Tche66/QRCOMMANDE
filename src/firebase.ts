import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'commande-qr-demo',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  app = initializeApp(config);
  return app;
}

export function getDb(): Firestore {
  if (db) return db;

  const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

  if (useEmulators) {
    db = initializeFirestore(getFirebaseApp(), {});
  } else {
    db = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }

  if (useEmulators && !emulatorsConnected) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    emulatorsConnected = true;
  }

  return db;
}

export function getAuthInstance(): Auth {
  if (auth) return auth;

  auth = getAuth(getFirebaseApp());

  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }

  return auth;
}
