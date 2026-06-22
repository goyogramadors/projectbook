/**
 * functions/src/index.ts — F5.2 · Cloud Functions (Constitución §12, §13, §16)
 *
 * Funciones:
 *   onProjectDeleted   — cascade delete sub-colecciones
 *   sendInviteEmail    — correo de invitación a colaboradores
 *   apiProxy           — proxy para Gemini (BIM wizard §5)
 *   setUserState       — admin suspende/activa usuarios (§13)
 *
 * Deploy: firebase deploy --only functions
 * Región recomendada: southamerica-west1
 */

import * as functions from 'firebase-functions/v2';
import * as admin      from 'firebase-admin';

admin.initializeApp();

const REGION  = 'southamerica-west1';
const db      = admin.firestore();
const auth    = admin.auth();

// ── 1. onProjectDeleted — cascade delete (§F5.2) ─────────────────────────────

export const onProjectDeleted = functions.firestore.onDocumentDeleted(
  { document: 'projects/{projectId}', region: REGION },
  async (event) => {
    const { projectId } = event.params;
    const batch = db.batch();

    // Eliminar sub-colecciones
    for (const sub of ['formularios', 'simulaciones']) {
      const snap = await db.collection(`projects/${projectId}/${sub}`).get();
      snap.docs.forEach(d => batch.delete(d.ref));
    }

    // Eliminar invitaciones asociadas
    const invSnap = await db.collection('invitations')
      .where('projectId', '==', projectId).get();
    invSnap.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
    functions.logger.info(`Cascade delete completado para proyecto ${projectId}`);
  }
);

// ── 2. sendInviteEmail (§F5.5) ────────────────────────────────────────────────

interface InviteData {
  projectId:    string;
  projectName:  string;
  invitedEmail: string;
  invitedBy:    string;
  rol:          'editor' | 'viewer';
  token:        string;
}

export const sendInviteEmail = functions.https.onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado');

    const { projectId, projectName, invitedEmail, rol, token } = request.data as InviteData;

    // Guardar invitación en Firestore
    await db.collection('invitations').doc(token).set({
      projectId,
      projectName,
      invitedEmail,
      invitedBy:   request.auth.uid,
      rol,
      token,
      status:      'pending',
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    });

    // Enviar correo vía proveedor transaccional (requiere H-F5.7: SendGrid/Resend)
    const INVITE_URL = `https://archibots.cl/invite/${token}`;
    const emailPayload = {
      to:      invitedEmail,
      from:    'invitaciones@archibots.cl',
      subject: `Te invitaron a colaborar en "${projectName}" en ArchiBots`,
      html: `
        <p>Hola,</p>
        <p><strong>${request.auth.token.email}</strong> te ha invitado a colaborar como
        <strong>${rol === 'editor' ? 'Editor' : 'Lector'}</strong>
        en el proyecto <strong>"${projectName}"</strong>.</p>
        <p><a href="${INVITE_URL}" style="background:#D32F2F;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block">
          Aceptar invitación
        </a></p>
        <p style="font-size:12px;color:#666">El enlace expira en 7 días. Si no esperabas esta invitación, ignora este mensaje.</p>
        <hr/>
        <p style="font-size:11px;color:#999">ArchiBots · Plataforma de Arquitectura Paramétrica · archibots.cl</p>
      `,
    };

    // Llamada al proveedor de email (config vía Secret Manager)
    const EMAIL_API_KEY = process.env.EMAIL_API_KEY ?? '';
    if (EMAIL_API_KEY) {
      try {
        // Compatible con SendGrid y Resend (ambos exponen POST /v1/mail/send o /emails)
        await fetch(process.env.EMAIL_ENDPOINT ?? 'https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${EMAIL_API_KEY}`,
          },
          body: JSON.stringify(emailPayload),
        });
      } catch (err) {
        functions.logger.warn('sendInviteEmail: fallo email transaccional', err);
      }
    }

    return { success: true, token };
  }
);

// ── 3. apiProxy — Gemini para BIM (§5, §F4.7) ────────────────────────────────

export const apiProxy = functions.https.onCall(
  { region: REGION, secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado');

    // Verificar que el usuario tiene plan Premium (§5)
    const userRecord = await auth.getUser(request.auth.uid);
    const userDoc    = await db.collection('users').doc(request.auth.uid).get();
    const isPremium  = userDoc.data()?.plan === 'premium' || userDoc.data()?.compPremium === true;
    void userRecord;

    if (!isPremium) {
      throw new functions.https.HttpsError('permission-denied', 'Requiere plan Premium');
    }

    const { model = 'gemini-2.0-flash', prompt, context } = request.data as {
      model?: string;
      prompt: string;
      context?: string;
    };

    const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';
    if (!GEMINI_KEY) throw new functions.https.HttpsError('internal', 'API key Gemini no configurada (H-F4.6)');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: context ? `${context}\n\n${prompt}` : prompt }] }],
        }),
      }
    );

    if (!res.ok) throw new functions.https.HttpsError('internal', `Gemini HTTP ${res.status}`);
    const data = await res.json();
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' };
  }
);

// ── 4. setUserState — admin activa/suspende (§13) ─────────────────────────────

export const setUserState = functions.https.onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth?.token?.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Requiere rol admin (§12)');
    }

    const { targetUid, estado, compPremium } = request.data as {
      targetUid:    string;
      estado?:      'activo' | 'suspendido';
      compPremium?: boolean;
    };

    const updates: Record<string, unknown> = {};

    if (estado !== undefined) {
      // §13: suspender = disabled:true en Auth + campo en Firestore
      await auth.updateUser(targetUid, { disabled: estado === 'suspendido' });
      updates.estado = estado;
    }

    if (compPremium !== undefined) {
      // §14: cortesía premium sin tocar Stripe
      updates.compPremium = compPremium;
      if (compPremium) updates.plan = 'premium';
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('users').doc(targetUid).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    functions.logger.info(`setUserState: uid=${targetUid}`, updates);
    return { success: true };
  }
);
