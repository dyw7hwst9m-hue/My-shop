import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from '../types';

const STORAGE_KEY = 'my_shop_custom_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored Firebase config', e);
  }

  // Check env vars safely
  const metaEnv = (import.meta as any).env || {};
  const envConfig: FirebaseConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const config = getStoredFirebaseConfig();
  return !!(config && config.apiKey && config.projectId);
}

export function saveStoredFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearStoredFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      isConfigured: false,
    };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);

    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      storage: storageInstance,
      isConfigured: true,
    };
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      isConfigured: false,
    };
  }
}

export const firebase = initFirebase();
