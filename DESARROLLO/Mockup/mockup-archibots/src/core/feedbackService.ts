/**
 * feedbackService.ts — Fase 5.7 · Capa de Feedback Dual (Regla §16)
 *
 * Envío concurrente:
 *   1. addDoc → colección `feedback` en Firestore (respaldo exacto)
 *   2. POST /api/feedback → correo transaccional a goyogramador@gmail.com
 *
 * Dependencia externa: `npm install firebase`
 * Configurar FIREBASE_CONFIG con las credenciales del proyecto antes del deploy.
 * Mockup fallback: si Firebase no está disponible, registra en consola sin crashear.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type TipoFeedback = 'sugerencia' | 'error' | 'elogio' | 'otro';

export interface FeedbackPayload {
  email: string;
  mensaje: string;
  tipo: TipoFeedback | string;
  satisfaccion?: number; // 1-4 (1=muy malo, 4=excelente)
  timestamp: Date;
  app: 'archibots';
  origen: string;       // e.g. 'footer', 'soporte-modal'
}

// ── Configuración Firebase (completar antes de producción) ───────────────────

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

// ── Inicialización lazy ──────────────────────────────────────────────────────

async function resolveFirestore() {
  if (!FIREBASE_CONFIG.projectId) return null;
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    return getFirestore(app);
  } catch {
    return null;
  }
}

// ── Función principal ────────────────────────────────────────────────────────

export async function enviarFeedback(
  email: string,
  mensaje: string,
  tipo: TipoFeedback | string,
  opciones?: { satisfaccion?: number; origen?: string }
): Promise<void> {
  const payload: FeedbackPayload = {
    email: email.trim(),
    mensaje: mensaje.trim(),
    tipo,
    satisfaccion: opciones?.satisfaccion,
    timestamp: new Date(),
    app: 'archibots',
    origen: opciones?.origen ?? 'footer',
  };

  // ── 1. Backup en Firestore ─────────────────────────────────────────────────
  const db = await resolveFirestore();
  if (db) {
    try {
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'feedback'), {
        ...payload,
        timestamp: Timestamp.fromDate(payload.timestamp),
      });
    } catch (err) {
      console.warn('[feedbackService] Firestore write failed:', err);
    }
  } else {
    console.info('[feedbackService] Firestore no configurado — payload registrado localmente:', payload);
  }

  // ── 2. Correo transaccional (silencioso en error) ──────────────────────────
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[feedbackService] API email respondió', res.status);
    }
  } catch {
    // Best-effort: no propagar error al usuario por fallo de email
  }
}
