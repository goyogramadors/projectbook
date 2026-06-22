/* BLOQUE 6 · BARRA INFERIOR PERSISTENTE (ab-toptools-bar, sticky bottom)
   "Herramienta en trabajo" + selector de proyecto angosto + INICIO + TEMA.
   CONST §2: una herramienta anclada premium se muestra CON CANDADO; al pulsarla
   sin plan, abre el Paywall (/pricing). Contenido configurable por admin
   (config/topTools); aquí se consume el default + ids provistos. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import Icon from './Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { getManifest } from '../core/registry';
import { TOP_TOOLS_DEFAULT } from '../core/catalog';
import type { ProjectMaster, TopToolsConfig } from '../core/types';

export default function TopToolsBar({
  topToolIds = TOP_TOOLS_DEFAULT,
  projects = [],
}: {
  topToolIds?: string[];
  projects?: ProjectMaster[];
}) {
  const navigate = useNavigate();
  const { projectId, toolId } = useParams();
  const { user } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const plan = user?.plan ?? 'Free';
  const active = getManifest(toolId);

  // CONST §2 — ranking de Top Tools configurable por admin en Firestore
  // (config/topTools.ids). Si el documento existe y trae ids válidos, prevalece
  // sobre el default; cualquier fallo degrada a TOP_TOOLS_DEFAULT / prop.
  const [anchoredIds, setAnchoredIds] = useState<string[]>(topToolIds);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'topTools'));
        if (!alive || !snap.exists()) return;
        const ids = (snap.data() as TopToolsConfig).ids;
        if (Array.isArray(ids) && ids.length > 0 && ids.every((x) => typeof x === 'string')) {
          setAnchoredIds(ids);
        }
      } catch {
        /* offline / reglas: conserva el default */
      }
    })();
    return () => { alive = false; };
  }, [topToolIds]);

  const openTool = (id: string) => {
    const m = getManifest(id);
    if (!m) return;
    if (m.tier === 'premium' && plan === 'Free') { navigate('/pricing'); return; } // CONST §2
    navigate(projectId ? `/p/${projectId}/m/${id}` : `/pricing`);
  };

  return (
    <div className="ab-toptools-bar">
      <div className="ab-tt-active">
        <span className="ab-tt-active-label"><Icon name="Wrench" size={13} /> Herramienta en trabajo</span>
        <span className="ab-tt-active-name">
          {active
            ? <><Icon name={active.icon} size={17} color="var(--destructive)" /> {active.label.toUpperCase()} · {active.code}</>
            : '— SIN MÓDULO ACTIVO —'}
        </span>
      </div>

      {/* Accesos rápidos anclados (con candado si premium + Free). */}
      <div className="ab-tt-row" style={{ flexWrap: 'wrap' }}>
        {anchoredIds.map((id) => {
          const m = getManifest(id);
          if (!m) return null;
          const locked = m.tier === 'premium' && plan === 'Free';
          return (
            <button key={id} className="ab-tt" style={{ minWidth: 150 }} onClick={() => openTool(id)} title={locked ? 'Requiere Premium' : m.label}>
              <Icon name={locked ? 'Lock' : m.icon} size={14} /> {m.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="ab-tt-row">
        <div className="ab-tt-select">
          <Icon name="FolderOpen" size={14} color="var(--destructive)" />
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--bar-muted)', textTransform: 'uppercase' }}>Proy:</span>
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <select
              className="ab-select ab-select-dark"
              value={projectId ?? ''}
              onChange={(e) => navigate(e.target.value ? `/p/${e.target.value}` : '/')}
            >
              <option value="">-- MODO LIBRE / INICIO --</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
            </select>
            <Icon name="ChevronDown" size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
          </div>
        </div>
        <button className="ab-tt" style={{ flex: '0 0 auto', minWidth: 140 }} onClick={() => navigate('/')}>
          <Icon name="Home" size={15} /> INICIO
        </button>
        <button className="ab-tt" style={{ flex: '0 0 auto', minWidth: 175, marginLeft: 'auto' }} onClick={cycleTheme} title="Ciclar tema (cad → washi → matrix → white)">
          <Icon name="Palette" size={15} /> TEMA: {theme.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
