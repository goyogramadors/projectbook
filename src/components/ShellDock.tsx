/* =============================================================================
   SHELL · DOCK INFERIOR (ab-dock) — S7.1
   -----------------------------------------------------------------------------
   Reemplaza TopToolsBar + CorporateFooter en un footer de ancho completo (en
   flujo normal, al final de la columna del shell): fila de Herramientas Top
   (con candado premium → Paywall, CONST §2, ranking desde config/topTools),
   fila de navegación (proyecto/inicio/tema) y fila de feedback + legal.
   ============================================================================= */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import Icon from './Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { getManifest } from '../core/registry';
import { TOP_TOOLS_DEFAULT } from '../core/catalog';
import type { TopToolsConfig } from '../core/types';

export default function ShellDock() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const { projects } = useProjects();
  const { triggerToast } = useToast();
  const plan = user?.plan ?? 'Free';
  const [feedback, setFeedback] = useState('');
  const [anchoredIds, setAnchoredIds] = useState<string[]>(TOP_TOOLS_DEFAULT);

  // CONST §2 — ranking configurable por admin (config/topTools.ids); fallo → default.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'topTools'));
        if (!alive || !snap.exists()) return;
        const ids = (snap.data() as TopToolsConfig).ids;
        if (Array.isArray(ids) && ids.length > 0 && ids.every((x) => typeof x === 'string')) setAnchoredIds(ids);
      } catch { /* offline / reglas: conserva el default */ }
    })();
    return () => { alive = false; };
  }, []);

  const openTool = (id: string) => {
    const m = getManifest(id);
    if (!m) return;
    if (m.tier === 'premium' && plan === 'Free') { navigate('/pricing'); return; } // CONST §2
    navigate(projectId ? `/p/${projectId}/m/${id}` : '/pricing');
  };

  const activeName = projects.find((p) => p.id === projectId)?.name;

  return (
    <footer className="ab-dock">
      <div className="ab-dock-tools">
        <span className="lbl"><Icon name="Star" size={12} /> Herramientas Top</span>
        {anchoredIds.map((id) => {
          const m = getManifest(id);
          if (!m) return null;
          const locked = m.tier === 'premium' && plan === 'Free';
          return (
            <button key={id} className="ab-dock-btn" onClick={() => openTool(id)} title={locked ? 'Requiere Premium' : m.label}>
              <Icon name={locked ? 'Lock' : m.icon} size={14} /> {m.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="ab-dock-nav">
        <button className="ab-dock-btn" onClick={() => projectId && navigate(`/p/${projectId}`)}>
          <Icon name="FolderOpen" size={14} /> {(activeName ?? '-- MODO LIBRE / INICIO --').toUpperCase()}
        </button>
        <button className="ab-dock-btn" onClick={() => navigate('/')}><Icon name="Home" size={14} /> INICIO</button>
        <button className="ab-dock-btn" onClick={cycleTheme}><Icon name="Palette" size={14} /> TEMA: {theme.toUpperCase()}</button>
      </div>

      <div className="ab-dock-last">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: '1 1 280px', minWidth: 240 }}>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="MessageSquare" size={13} /> ¿Te gusta esta web?
          </span>
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Cuéntanos…"
            style={{ flex: 1, minWidth: 120, padding: '4px 8px', fontSize: 10 }}
          />
          <button
            className="ab-dock-btn"
            style={{ flex: '0 0 auto', minWidth: 0, padding: '6px 12px', borderRight: 'none' }}
            onClick={() => { triggerToast(feedback.trim() ? '¡Gracias por tu comentario!' : 'Escribe un comentario primero'); if (feedback.trim()) setFeedback(''); }}
          >
            <Icon name="Send" size={12} /> Enviar
          </button>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', opacity: 0.85 }}>
          <span>© {new Date().getFullYear()} ARCHIBOTS · LABORATORIO DE ARQUITECTURA PARAMÉTRICA</span>
          <a href="/legal/terminos" onClick={(e) => { e.preventDefault(); navigate('/legal/terminos'); }}>Términos y Condiciones</a>
          <a href="/legal/privacidad" onClick={(e) => { e.preventDefault(); navigate('/legal/privacidad'); }}>Política de Privacidad</a>
        </span>
      </div>
    </footer>
  );
}
