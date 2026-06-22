/**
 * firebase.ts — F1.2 · Inicialización canónica de Firebase (Constitución §0.0.1)
 *
 * - Valida dos bases Firestore: `(default)` y `coordenadasnormativas`
 * - Selecciona entorno por variable VITE_FIREBASE_ENV (dev | prod)
 * - Exporta helpers tipados; el resto de la app NUNCA llama initializeApp directamente
 *
 * HITL requerido antes de usar en producción:
 *   H-F1.1 Crear proyectos archibots-dev y archibots-prod
 *   H-F1.3 Confirmar DB coordenadasnormativas en Firestore
 *   H-F1.4 Poblar .env.local con VITE_FIREBASE_* correspondientes
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth,        type Auth }       from 'firebase/auth';
import { getFirestore,   type Firestore }  from 'firebase/firestore';
import { getStorage,     type FirebaseStorage } from 'firebase/storage';

// ── Config por entorno (dev / prod) ─────────────────────────────────────────

interface FirebaseConfig {
  apiKey: string; authDomain: string; projectId: string;
  storageBucket: string; messagingSenderId: string; appId: string;
}

const DEV_CONFIG: FirebaseConfig = {
  apiKey:            import.meta.env.VITE_DEV_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_DEV_AUTH_DOMAIN        ?? '',
  projectId:         import.meta.env.VITE_DEV_PROJECT_ID         ?? 'archibots-dev',
  storageBucket:     import.meta.env.VITE_DEV_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_DEV_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_DEV_APP_ID             ?? '',
};

const PROD_CONFIG: FirebaseConfig = {
  apiKey:            import.meta.env.VITE_PROD_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_PROD_AUTH_DOMAIN        ?? '',
  projectId:         import.meta.env.VITE_PROD_PROJECT_ID         ?? 'archibots-497423',
  storageBucket:     import.meta.env.VITE_PROD_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_PROD_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_PROD_APP_ID             ?? '',
};

const IS_PROD = import.meta.env.VITE_FIREBASE_ENV === 'prod';
const ACTIVE_CONFIG = IS_PROD ? PROD_CONFIG : DEV_CONFIG;

// ── Nombre de la DB de coordinadas (constante) ───────────────────────────────

export const DB_COORDENADAS = 'coordenadasnormativas';

// ── Singleton de la app principal ────────────────────────────────────────────

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  if (!ACTIVE_CONFIG.apiKey) {
    // Mockup fallback: sin config, la app sigue funcionando con datos locales
    console.warn('[firebase] VITE_*_API_KEY no configurado — modo mockup activo.');
  }
  return initializeApp(ACTIVE_CONFIG);
}

// ── Exports tipados ──────────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _dbCoords: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseAuth(): Auth {
  _app ??= getFirebaseApp();
  _auth ??= getAuth(_app);
  return _auth;
}

/** Firestore `(default)` — datos de usuario, proyectos, feedback, etc. */
export function getDb(): Firestore {
  _app ??= getFirebaseApp();
  _db ??= getFirestore(_app);
  return _db;
}

/** Firestore `coordenadasnormativas` — fichas PRC (solo lectura desde cliente) */
export function getDbCoordenadas(): Firestore {
  _app ??= getFirebaseApp();
  _dbCoords ??= getFirestore(_app, DB_COORDENADAS);
  return _dbCoords;
}

export function getFirebaseStorage(): FirebaseStorage {
  _app ??= getFirebaseApp();
  _storage ??= getStorage(_app);
  return _storage;
}

export { ACTIVE_CONFIG as firebaseConfig, IS_PROD };
