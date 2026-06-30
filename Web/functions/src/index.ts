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
import { randomUUID } from 'crypto';

admin.initializeApp();

const REGION = 'southamerica-west1';
const db     = admin.firestore();
const auth   = admin.auth();

/**
 * Rate limiter de ventana fija sobre Firestore (colección `rateLimits`, escrita
 * solo por Admin SDK → no requiere reglas). Lanza HttpsError 'resource-exhausted'
 * al superar `max` solicitudes en `windowSec`. Evita abuso/DDoS y disparo de
 * costos (p. ej. tokens de Gemini). Llave típica: `${fnName}:${uid}`.
 */
async function enforceRateLimit(key: string, max: number, windowSec: number): Promise<void> {
  const ref = db.collection('rateLimits').doc(key);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { count: number; windowStart: number }) : null;
    if (!data || now - data.windowStart >= windowSec * 1000) {
      tx.set(ref, { count: 1, windowStart: now });
      return;
    }
    if (data.count >= max) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Demasiadas solicitudes. Intenta nuevamente en unos momentos.',
      );
    }
    tx.update(ref, { count: data.count + 1 });
  });
}

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
  { region: REGION, secrets: ['SENDGRID_API_KEY'], enforceAppCheck: true, maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    // Anti-abuso de envío de correos: 30 invitaciones por hora por usuario.
    await enforceRateLimit(`sendInvite:${request.auth.uid}`, 30, 3600);

    const { projectId, projectName, invitedEmail, rol, token } =
      request.data as InvitePayload;

    const inviteUrl = `https://archibots.cl/invite/${token}`;
    const rolLabel  = rol === 'editor' ? 'Editor' : 'Lector';

    const sgApiKey = process.env.SENDGRID_API_KEY;
    if (!sgApiKey) throw new functions.https.HttpsError('internal', 'SENDGRID_API_KEY no configurado.');

    const body = {
      personalizations: [{ to: [{ email: invitedEmail }] }],
      from:    { email: 'contacto@archibots.cl', name: 'Archiblocks' },
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
  { region: REGION, secrets: ['SENDGRID_API_KEY'], enforceAppCheck: true, maxInstances: 5 },
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

    const appUrl = 'https://archibots.cl/';

    // ¿El correo ya tiene cuenta en Firebase Auth?
    let existingUid: string | null = null;
    try {
      const rec = await auth.getUserByEmail(email);
      existingUid = rec.uid;
    } catch { /* 'user-not-found' → se PRE-CREA la cuenta más abajo */ }

    let setPasswordLink: string | null = null;
    let preCreated = false;

    if (existingUid) {
      // Ya registrado → eleva su doc a Premium activo (efecto inmediato).
      await db.doc(`users/${existingUid}`).set({
        uid: existingUid, email, plan: 'Premium', compPremium: true, estado: 'Activo',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      // No registrado → PRE-CREAR la cuenta ahora. Contraseña aleatoria desechable
      // (la persona fija la suya con el enlace) y emailVerified:true para que pueda
      // entrar con Google con el mismo correo (Firebase enlaza al mismo usuario).
      try {
        const created = await auth.createUser({
          email, emailVerified: true, password: randomUUID() + randomUUID(),
        });
        existingUid = created.uid;
        preCreated = true;
        await db.doc(`users/${existingUid}`).set({
          uid: existingUid, email, nombre: email.split('@')[0],
          plan: 'Premium', compPremium: true, estado: 'Pendiente',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Enlace para que la persona fije su PRIMERA contraseña (página Firebase).
        try { setPasswordLink = await auth.generatePasswordResetLink(email, { url: appUrl }); }
        catch (e) { functions.logger.warn('No se generó el enlace de contraseña', { email, e: String(e) }); }
      } catch (e) {
        functions.logger.error('No se pudo pre-crear la cuenta de invitación', { email, e: String(e) });
        throw new functions.https.HttpsError('internal', 'No se pudo crear la cuenta de invitación.');
      }
    }

    // Correo de invitación (SendGrid). Si se pre-creó, el CTA fija la contraseña.
    const ctaLink  = setPasswordLink ?? appUrl;
    const ctaLabel = setPasswordLink ? 'Definir mi contraseña' : 'Entrar a ArchiBots';
    const cuerpo = preCreated
      ? `<p>¡Hola! Un administrador te creó una cuenta <strong>Premium</strong> en ArchiBots con este correo.</p>
         <p>Para activarla, define tu contraseña:</p>
         <p><a href="${ctaLink}" style="padding:10px 20px;background:#171717;color:#fff;text-decoration:none;font-weight:700;">${ctaLabel}</a></p>
         <p style="font-size:13px;color:#444;">También puedes entrar directamente con <strong>Google</strong> usando este mismo correo: tu cuenta queda asociada a tu acceso de Google.</p>
         <p style="font-size:12px;color:#666;">Si no esperabas este correo, puedes ignorarlo.</p>`
      : `<p>¡Hola! Un administrador activó tu cuenta <strong>Premium</strong> en ArchiBots.</p>
         <p>Ingresa con este mismo correo para desbloquear todas las herramientas:</p>
         <p><a href="${appUrl}" style="padding:10px 20px;background:#171717;color:#fff;text-decoration:none;font-weight:700;">Entrar a ArchiBots</a></p>
         <p style="font-size:12px;color:#666;">Si no esperabas este correo, puedes ignorarlo.</p>`;

    const body = {
      personalizations: [{ to: [{ email }] }],
      from:    { email: 'contacto@archibots.cl', name: 'Archiblocks' },
      subject: 'Tu acceso Premium a ArchiBots',
      content: [{ type: 'text/html', value: cuerpo }],
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

    // Registrar invitación (pendiente=true mientras la persona no haya ingresado).
    await db.collection('premiumInvitations').add({
      email,
      invitedBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      pendiente: preCreated,
      plan: 'Premium',
      compPremium: true,
      uid: existingUid,
    });
    functions.logger.info('Invitación Premium enviada', { email, existingUid, preCreated });
    return { ok: true };
  }
);

// ── 2c. activateMyAccount — el invitado activa su propia cuenta al primer ingreso ──
// Las reglas no permiten que un usuario cambie su propio `estado`; esta función
// (Admin SDK) lo hace de forma segura solo para request.auth.uid: Pendiente → Activo,
// y marca su invitación Premium como aceptada. La llama el cliente tras autenticarse.

export const activateMyAccount = functions.https.onCall(
  { region: REGION, enforceAppCheck: true, maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    const uid = request.auth.uid;
    const ref = db.doc(`users/${uid}`);
    const snap = await ref.get();
    if (snap.exists && (snap.data() as { estado?: string }).estado === 'Pendiente') {
      await ref.set(
        { estado: 'Activo', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    const email = request.auth.token.email as string | undefined;
    if (email) {
      const invs = await db.collection('premiumInvitations')
        .where('email', '==', email).where('pendiente', '==', true).get();
      await Promise.all(invs.docs.map((d) =>
        d.ref.update({ pendiente: false, acceptedBy: uid, acceptedAt: Date.now() })));
    }
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
  { region: REGION, secrets: ['GEMINI_API_KEY'], enforceAppCheck: true, maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    // Solo Premium puede usar el proxy. En v2 onCall el token YA viene decodificado
    // y verificado en `request.auth.token`; NO se re-verifica (eso causaba el crash).
    const { plan, admin: isAdminClaim } = request.auth.token;
    if (plan !== 'Premium' && isAdminClaim !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Requiere plan Premium.');
    }

    // Rate limit por usuario: tope de costo Gemini (20/min, 200/día).
    await enforceRateLimit(`apiProxy:min:${request.auth.uid}`, 20, 60);
    await enforceRateLimit(`apiProxy:day:${request.auth.uid}`, 200, 86400);

    // Validación/saneamiento del input: nunca se confía en el cliente.
    const { prompt } = (request.data ?? {}) as GeminiPayload;
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'El prompt es obligatorio.');
    }
    if (prompt.length > 8000) {
      throw new functions.https.HttpsError('invalid-argument', 'El prompt excede el largo máximo (8000).');
    }
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
