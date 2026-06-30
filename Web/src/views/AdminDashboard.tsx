/* =============================================================================
   VISTA /admin (T-60) — Panel de Administración (CONST §12/§14)
   -----------------------------------------------------------------------------
   Conectada a AdminService: lista de usuarios (listUsers), suspender/reactivar
   (setUserState) y Premium de cortesía (setCompPremium). Guard requireAdmin en el
   router. La tabla refleja el estado real de la colección users en Firestore.
   ============================================================================= */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useToast } from '../core/ui/ToastProvider';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../core/firebase';
import { listUsers, setUserState, setCompPremium, setUserPlan, promoteByEmail, getTopTools, setTopTools, type AdminUserRow } from '../core/AdminService';
import { CATALOG, TOP_TOOLS_DEFAULT } from '../core/catalog';

/** Fila local: extiende AdminUserRow con la marca de "invitado" (alta desde panel). */
type Row = AdminUserRow & { invitado?: boolean };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerToast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  /* ── Invitación Premium (UI + elevación real si el usuario existe) ── */
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  /* ── Auto-ascenso del admin a Premium ── */
  const [ascending, setAscending] = useState(false);

  /* ── Editor de Top Tools (barra inferior anclada · config/topTools) ── */
  const [topIds, setTopIds] = useState<string[]>(TOP_TOOLS_DEFAULT);
  const [savingTop, setSavingTop] = useState(false);
  useEffect(() => { (async () => { const ids = await getTopTools(); if (ids && ids.length) setTopIds(ids); })(); }, []);
  const toggleTop = (id: string) =>
    setTopIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const guardarTopTools = async () => {
    setSavingTop(true);
    try { await setTopTools(topIds); triggerToast('Top Tools actualizadas. Se reflejan al recargar la barra.'); }
    catch { triggerToast('No se pudo guardar (revisa reglas Firestore: escritura admin en config/topTools).'); }
    finally { setSavingTop(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || inviting) return;
    setInviting(true);
    try {
      // Elevación REAL: si el correo ya existe en Firestore, cambia su plan a Premium.
      let existia = false;
      try { existia = await promoteByEmail(email); }
      catch { /* offline / reglas */ }
      // Envío REAL del correo vía Cloud Function. La función también crea el doc
      // users/{uid} si el usuario ya existe en Auth, o registra la invitación
      // pendiente en premiumInvitations si aún no se registró.
      let correoEnviado = false;
      try {
        await httpsCallable(functions, 'sendPremiumInviteEmail')({ email });
        correoEnviado = true;
      } catch { /* función no desplegada / SendGrid sin configurar — no rompe el flujo */ }
      setInviteMsg(
        `${existia ? `Usuario ${email} elevado a Premium en la base de datos.` : `Premium reservado para ${email}: quedará activo automáticamente al registrarse con este correo.`} ` +
        (correoEnviado ? 'Correo de invitación enviado.' : 'Aviso: el correo NO se envió (revisa el despliegue de Functions y SENDGRID_API_KEY).'),
      );
      setInviteEmail('');
      triggerToast(correoEnviado ? 'Invitación Premium enviada por correo.' : 'Premium aplicado (sin correo).');
      // Recargar la tabla para mostrar la fila real (registrado o pendiente)
      void recargar();
    } finally {
      setInviting(false);
    }
  };

  const handleAscenderme = async () => {
    if (!user || ascending) return;
    setAscending(true);
    try {
      await setUserPlan(user.uid, 'Premium');
      triggerToast('Cuenta elevada a Premium. Recargando…');
      // Recarga el contexto de usuario: onAuthStateChanged re-resuelve el plan
      // desde Firestore (plan/compPremium) y desbloquea las herramientas Premium.
      setTimeout(() => window.location.reload(), 700);
    } catch {
      triggerToast('No se pudo elevar la cuenta. Revisa permisos de Firestore.');
      setAscending(false);
    }
  };

  const recargar = async () => {
    setLoading(true);
    try { setRows(await listUsers()); }
    catch { triggerToast('No se pudo cargar la lista de usuarios.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { recargar(); }, []);

  const toggleEstado = async (r: AdminUserRow) => {
    setBusyUid(r.uid);
    const next = r.estado === 'Suspendido' ? 'Activo' : 'Suspendido';
    try {
      await setUserState(r.uid, next);
      setRows((prev) => prev.map((x) => x.uid === r.uid ? { ...x, estado: next } : x));
      triggerToast(`Usuario ${next === 'Suspendido' ? 'suspendido' : 'reactivado'}.`);
    } catch { triggerToast('No se pudo cambiar el estado.'); }
    finally { setBusyUid(null); }
  };

  const togglePremium = async (r: AdminUserRow) => {
    setBusyUid(r.uid);
    const next = !r.compPremium;
    try {
      await setCompPremium(r.uid, next);
      setRows((prev) => prev.map((x) => x.uid === r.uid ? { ...x, compPremium: next, plan: next ? 'Premium' : 'Free' } : x));
      triggerToast(next ? 'Premium de cortesía activado.' : 'Premium de cortesía revocado.');
    } catch { triggerToast('No se pudo cambiar el plan.'); }
    finally { setBusyUid(null); }
  };

  const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, textTransform: 'uppercase', opacity: 0.6, padding: '8px 10px', borderBottom: '1.5px solid var(--border)' };
  const td: React.CSSProperties = { fontSize: 12, padding: '8px 10px', borderBottom: '1px solid var(--border)' };

  return (
    <div className="ab-render" style={{ display: 'block', textAlign: 'left', width: '100%' }}>
      <div className="ab-render-title"><Icon name="ShieldCheck" size={18} /> Panel de Administración</div>
      <div className="ab-render-sub" style={{ margin: '6px 0 16px' }}>
        role: admin · {user?.email} · gestión de usuarios y plan ({rows.length} usuarios)
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="ab-btn sec" onClick={() => navigate('/')}><Icon name="ArrowLeft" size={13} /> Volver</button>
        <button className="ab-btn sec" onClick={recargar} disabled={loading}><Icon name="RefreshCw" size={13} /> Recargar</button>
        {user?.plan === 'Premium' ? (
          <span className="ab-badge premium" style={{ alignSelf: 'center' }}><Icon name="Crown" size={11} /> TU CUENTA: PREMIUM</span>
        ) : (
          <button className="ab-btn" onClick={handleAscenderme} disabled={ascending} style={{ marginLeft: 'auto' }}>
            <Icon name="Crown" size={13} /> {ascending ? 'ELEVANDO…' : '[ ASCENDERME A PREMIUM ]'}
          </button>
        )}
      </div>

      {/* ── INVITACIÓN PREMIUM (alta de usuario desde el panel) ── */}
      <form onSubmit={handleInvite} className="tool-panel" style={{ marginBottom: 16 }}>
        <div className="module-header"><Icon name="UserPlus" size={14} /> &nbsp;| INVITAR USUARIO PREMIUM</div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="tech-input-group" style={{ marginBottom: 0, flex: '1 1 280px' }}>
              <label>Correo electrónico</label>
              <input
                type="email"
                className="tech-input"
                placeholder="nombre@correo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="technical-btn" disabled={inviting} style={{ whiteSpace: 'nowrap' }}>
              <Icon name="Plus" size={14} /> {inviting ? 'ENVIANDO…' : '[ + INVITAR USUARIO PREMIUM ]'}
            </button>
          </div>
          {inviteMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--success)', border: '1.5px solid var(--success)', background: 'color-mix(in srgb, var(--success) 8%, transparent)', padding: '8px 12px' }}>
              <Icon name="CheckCircle2" size={15} /> {inviteMsg}
            </div>
          )}
        </div>
      </form>

      {/* ── EDITOR DE TOP TOOLS (barra inferior anclada) ── */}
      <div className="tool-panel" style={{ marginBottom: 16 }}>
        <div className="module-header" style={{ justifyContent: 'space-between' }}>
          <span><Icon name="Star" size={14} /> &nbsp;| TOP TOOLS (BARRA INFERIOR ANCLADA)</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{topIds.length} seleccionadas</span>
        </div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topIds.map((id) => {
              const t = CATALOG.find((c) => c.id === id);
              return (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, background: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '3px 8px' }}>
                  <Icon name={t?.icon ?? 'Wrench'} size={12} /> {t?.label ?? id}
                  <button type="button" onClick={() => toggleTop(id)} title="Quitar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', display: 'inline-flex' }}><Icon name="X" size={12} /></button>
                </span>
              );
            })}
            {topIds.length === 0 && <span style={{ fontSize: 11, opacity: 0.6 }}>Sin herramientas ancladas — la barra usará el default.</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '4px 14px', maxHeight: 260, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 10 }}>
            {CATALOG.filter((t) => t.estado === 'active').map((t) => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={topIds.includes(t.id)} onChange={() => toggleTop(t.id)} />
                <Icon name={t.icon} size={13} /> <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                {t.tier === 'premium' && <Icon name="Lock" size={10} />}
              </label>
            ))}
          </div>
          <div>
            <button type="button" className="technical-btn" disabled={savingTop} onClick={guardarTopTools}>
              <Icon name="Save" size={14} /> {savingTop ? 'GUARDANDO…' : '[ GUARDAR TOP TOOLS ]'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ab-empty">Cargando usuarios…</div>
      ) : rows.length === 0 ? (
        <div className="ab-empty">No hay usuarios registrados en la colección users.</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>Usuario</th><th style={th}>Correo</th><th style={th}>Plan</th><th style={th}>Estado</th><th style={th}>Acciones</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uid}>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {r.nombre}
                      {r.invitado && <span className="ab-badge premium" style={{ fontSize: 8 }}>PREMIUM</span>}
                    </span>
                  </td>
                  <td style={td}>{r.email}</td>
                  <td style={td}><span style={{ fontWeight: 700, color: r.plan === 'Premium' ? 'var(--primary)' : 'inherit' }}>{r.plan}</span></td>
                  <td style={td}><span style={{ fontWeight: 700, color: r.estado === 'Suspendido' ? 'var(--destructive)' : r.estado === 'Pendiente' ? 'var(--muted-foreground)' : 'inherit' }}>{r.estado}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.estado === 'Pendiente' ? (
                        <span style={{ fontSize: 10, opacity: 0.5, alignSelf: 'center' }}>Esperando registro</span>
                      ) : (
                        <>
                          <button className="ab-btn sec sm" disabled={busyUid === r.uid} onClick={() => toggleEstado(r)}>
                            {r.estado === 'Suspendido' ? 'Reactivar' : 'Suspender'}
                          </button>
                          <button className="ab-btn sec sm" disabled={busyUid === r.uid} onClick={() => togglePremium(r)}>
                            {r.compPremium ? 'Quitar Premium' : 'Dar Premium'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
