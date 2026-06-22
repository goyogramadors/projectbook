/**
 * functions/src/index.ts — Cloud Functions (Constitución §12, §13, §16)
 *
 * onProjectDeleted  — cascade delete sub-colecciones al borrar proyecto
 * sendInviteEmail   — envía correo de invitación a colaboradores (SendGrid)
 * apiProxy          — proxy autenticado a Gemini API (BIM wizard §5)
 * setUserState      — admin suspende/activa usuarios vía Admin SDK (§13)
 *
 * Deploy: cd functions && npm run build && cd .. && firebase deploy --only functions
 * Secretos requeridos: SENDGRID_API_KEY, GEMINI_API_KEY
 * Región: southamerica-west1
 */

import * as functions from 'firebase-functions/v2';
import * as admin      from 'firebase-admin';

admin.initializeApp();

const REGION = 'southamerica-west1';
const db     = admin.firestore();
const auth   = admin.auth();

// ── 1. onProjectDeleted — cascade delete ─────────────────────────────────────

/** Sub-colecciones de un proyecto que deben borrarse en cascada. Fuente única:
 *  debe mantenerse alineada con las sub-colecciones declaradas en firestore.rules
 *  (H-06: antes faltaban participantes/seguimiento/dim-publicos/volumen → huérfanos). */
const PROJECT_SUBCOLLECTIONS = [
  'formularios', 'simulaciones', 'bitacora', 'documentos',
  'participantes', 'seguimiento', 'dim-publicos', 'volumen', 'toolData',
] as const;

export const onProjectDeleted = functions.firestore.onDocumentDeleted(
  { document: 'projects/{projectId}', region: REGION },
  async (event) => {
    const { projectId } = event.params;
    const batch = db.batch();

    // Lecturas concurrentes de todas las sub-colecciones + invitaciones.
    const [subSnaps, invSnap] = await Promise.all([
      Promise.all(
        PROJECT_SUBCOLLECTIONS.map((sub) =>
          db.collection(`projects/${projectId}/${sub}`).get(),
        ),
      ),
      db.collection('invitations').where('projectId', '==', projectId).get(),
    ]);

    subSnaps.forEach((snap) => snap.docs.forEach((d) => batch.delete(d.ref)));
    invSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    functions.logger.info('Cascade delete OK', {
      projectId,
      subcollections: PROJECT_SUBCOLLECTIONS.length,
    });
  }
);

// ── 2. sendInviteEmail ────────────────────────────────────────────────────────

interface InvitePayload {
  projectId:    string;
  projectName:  string;
  invitedEmail: string;
  rol:          'editor' | 'viewer';
  token:        string;
}

export const sendInviteEmail = functions.https.onCall(
  { region: REGION, secrets: ['SENDGRID_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    const { projectId, projectName, invitedEmail, rol, token } =
      request.data as InvitePayload;

    const inviteUrl = `https://archibots-497423.web.app/invite/${token}`;
    const rolLabel  = rol === 'editor' ? 'Editor' : 'Lector';

    const sgApiKey = process.env.SENDGRID_API_KEY;
    if (!sgApiKey) throw new functions.https.HttpsError('internal', 'SENDGRID_API_KEY no configurado.');

    const body = {
      personalizations: [{ to: [{ email: invitedEmail }] }],
      from:    { email: 'crearco@gmail.com', name: 'ArchiBots' },
      subject: `Te invitaron a colaborar en "${projectName}"`,
      content: [{
        type:  'text/html',
        value: `<p>Fuiste invitado como <strong>${rolLabel}</strong> al proyecto <strong>${projectName}</strong>.</p>
                <p><a href="${inviteUrl}" style="padding:10px 20px;background:#171717;color:#fff;text-decoration:none;font-weight:700;">Aceptar invitación</a></p>
                <p style="font-size:12px;color:#666;">El enlace expira en 7 días.</p>`,
      }],
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:  'POST',
      headers: { Authorization: `Bearer ${sgApiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      functions.logger.error('SendGrid error', { status: resp.status, err });
      throw new functions.https.HttpsError('internal', 'Error al enviar el correo.');
    }

    // Guardar invitación en Firestore
    await db.collection('invitations').add({
      projectId, projectName, invitedEmail, rol, token,
      invitedBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ),
      status: 'pending',
    });

    functions.logger.info('Invitación enviada', { invitedEmail, projectId });
    return { ok: true };
  }
);

// ── 2b. sendPremiumInviteEmail — invitación Premium desde el Panel Admin ──────

interface PremiumInvitePayload {
  email: string;
}

export const sendPremiumInviteEmail = functions.https.onCall(
  { region: REGION, secrets: ['SENDGRID_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    if (request.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Solo un administrador puede invitar usuarios Premium.');
    }

    const { email } = request.data as PremiumInvitePayload;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Correo inválido.');
    }

    const sgApiKey = process.env.SENDGRID_API_KEY;
    if (!sgApiKey) throw new functions.https.HttpsError('failed-precondition', 'SENDGRID_API_KEY no configurado.');

    const appUrl = 'https://archibots-497423.web.app/';
    const body = {
      personalizations: [{ to: [{ email }] }],
      from:    { email: 'crearco@gmail.com', name: 'ArchiBots' },
      subject: 'Tu acceso Premium a ArchiBots está activo',
      content: [{
        type:  'text/html',
        value: `<p>¡Hola! Un administrador te activó una cuenta <strong>Premium</strong> en ArchiBots.</p>
                <p>Ingresa (o crea tu cuenta) con este mismo correo para desbloquear todas las herramientas:</p>
                <p><a href="${appUrl}" style="padding:10px 20px;background:#171717;color:#fff;text-decoration:none;font-weight:700;">Entrar a ArchiBots</a></p>
                <p style="font-size:12px;color:#666;">Si no esperabas este correo, puedes ignorarlo.</p>`,
      }],
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:  'POST',
      headers: { Authorization: `Bearer ${sgApiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.text();
      functions.logger.error('SendGrid error (premium invite)', { status: resp.status, err });
      throw new functions.https.HttpsError('internal', 'Error al enviar el correo Premium.');
    }

    await db.collection('premiumInvitations').add({
      email,
      invitedBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
    });
    functions.logger.info('Invitación Premium enviada', { email });
    return { ok: true };
  }
);

// ── 3. apiProxy — proxy a Gemini ─────────────────────────────────────────────

interface GeminiPayload {
  prompt: string;
}

/** Forma mínima de la respuesta de Gemini que consumimos (evita `any`). */
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export const apiProxy = functions.https.onCall(
  { region: REGION, secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    // Solo Premium puede usar el proxy. En v2 onCall el token YA viene decodificado
    // y verificado en `request.auth.token`; NO se re-verifica (eso causaba el crash).
    const { plan, admin: isAdminClaim } = request.auth.token;
    if (plan !== 'Premium' && isAdminClaim !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Requiere plan Premium.');
    }

    const { prompt } = request.data as GeminiPayload;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new functions.https.HttpsError('internal', 'GEMINI_API_KEY no configurado.');

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!resp.ok) throw new functions.https.HttpsError('internal', 'Error al consultar Gemini.');

    const data = await resp.json() as GeminiResponse;
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' };
  }
);

// ── 4. setUserState — admin suspende/activa (§13) ────────────────────────────

interface SetUserStatePayload {
  targetUid: string;
  disabled:  boolean;
}

export const setUserState = functions.https.onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    // El claim ya viene verificado en request.auth.token (v2 onCall); no re-verificar.
    if (request.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores.');
    }

    const { targetUid, disabled } = request.data as SetUserStatePayload;

    await auth.updateUser(targetUid, { disabled });
    await db.doc(`users/${targetUid}`).update({
      estado: disabled ? 'Suspendido' : 'Activo',
    });

    functions.logger.info('Estado usuario actualizado', { targetUid, disabled });
    return { ok: true };
  }
);
