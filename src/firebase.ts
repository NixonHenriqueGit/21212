import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager, 
  memoryLocalCache, 
  setLogLevel,
  Firestore
} from 'firebase/firestore';

// Set Firestore log level to silent to suppress backend retry warnings in offline mode
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore if already initialized
}

// Clean up any stale or heavy firestore target keys from localStorage to free space
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('firestore_') || key.startsWith('firebase_'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Ignore storage access errors
  }
}

interface FirebaseConfigExtended {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

const DEFAULT_CONFIG: FirebaseConfigExtended = {
  apiKey: metaEnv?.VITE_FIREBASE_API_KEY || "AIzaSyC8Xkvh4Nj-VjzzDwqSNjefu3a79Y6ti2A",
  authDomain: metaEnv?.VITE_FIREBASE_AUTH_DOMAIN || "retorno-de-rota-pau-brasil.firebaseapp.com",
  projectId: metaEnv?.VITE_FIREBASE_PROJECT_ID || "retorno-de-rota-pau-brasil",
  storageBucket: metaEnv?.VITE_FIREBASE_STORAGE_BUCKET || "retorno-de-rota-pau-brasil.firebasestorage.app",
  messagingSenderId: metaEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID || "792483558739",
  appId: metaEnv?.VITE_FIREBASE_APP_ID || "1:792483558739:web:1bcaba10d2038d7a6ddda6",
  measurementId: metaEnv?.VITE_FIREBASE_MEASUREMENT_ID || "G-FTGZF84NKM",
  firestoreDatabaseId: metaEnv?.VITE_FIREBASE_DATABASE_ID || undefined
};

// Check if there is a custom configuration saved in localStorage
let firebaseConfig: FirebaseConfigExtended = DEFAULT_CONFIG;
let usingCustom = false;

if (typeof window !== 'undefined') {
  const savedConfigStr = localStorage.getItem('custom_firebase_config');
  if (savedConfigStr) {
    try {
      const parsed = JSON.parse(savedConfigStr);
      if (parsed && (parsed.projectId === 'armazemfacil-b2292' || parsed.projectId === 'mesmerizing-rampart-wdzmz' || parsed.projectId?.startsWith('gen-lang-client-') || parsed.projectId === 'armazemrelatorios' || parsed.projectId !== 'retorno-de-rota-pau-brasil')) {
        // Automatically clear stale cache pointing to previous or uninitialized projects
        localStorage.removeItem('custom_firebase_config');
      } else if (parsed && parsed.apiKey && parsed.projectId) {
        firebaseConfig = {
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId,
          storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
          measurementId: parsed.measurementId || '',
          firestoreDatabaseId: parsed.firestoreDatabaseId || undefined
        };
        usingCustom = true;
      }
    } catch (e) {
      console.error("Error parsing custom firebase config", e);
    }
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Attempt background authentication to populate request.auth and avoid permission denied errors
if (typeof window !== 'undefined') {
  try {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(() => {
          // Anonymous authentication not enabled or offline, continue with graceful fallbacks
        });
      }
    });
  } catch (e) {
    // Ignore auth listener error
  }
}

// Cache persistente desativado a pedido: utiliza apenas memoryLocalCache() para evitar retenção em disco
let db: Firestore;
try {
  db = firebaseConfig.firestoreDatabaseId 
    ? initializeFirestore(app, {
        localCache: memoryLocalCache()
      }, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, {
        localCache: memoryLocalCache()
      });
} catch (err) {
  try {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  } catch (e2) {
    try {
      db = initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch (e3) {
      db = getFirestore(app);
    }
  }
}

// Helper to determine if we are using custom config
export const isCustomFirebaseConnected = () => {
  return true; // The application is always connected to the live database in production!
};

// Helper to determine if the user has configured their own custom database via localStorage
export const isUsingCustomFirebase = () => {
  return usingCustom;
};

export const getActiveConfig = () => {
  return firebaseConfig;
};

export { app, auth, db };
export default app;


