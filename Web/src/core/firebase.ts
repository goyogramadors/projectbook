import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3) — verifica que las solicitudes provienen de la app
// real, no de scripts/bots. Protege Firestore, Storage y las Cloud Functions
// callable (que aplican enforceAppCheck). Solo se activa si hay site key
// configurada (VITE_RECAPTCHA_V3_SITE_KEY), para no romper dev local.
// En desarrollo, define window.FIREBASE_APPCHECK_DEBUG_TOKEN antes de cargar.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
// Cloud Functions (callables) en la región del proyecto. Necesario para invocar
// sendPremiumInviteEmail / sendInviteEmail desde el cliente.
export const functions = getFunctions(app, "southamerica-west1");

// Base de datos principal: (default). Es la base protegida por `firestore.rules`
// e indexada por `firestore.indexes.json` (ver firebase.json). El Cerebro
// Normativo usa una base NOMBRADA aparte ('coordenadasnormativas'), instanciada
// de forma independiente en NormativaService.ts.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
