/* =============================================================================
   BimWizardView.tsx — ASISTENTE DE USOS BIM (T-17) · PREMIUM
   -----------------------------------------------------------------------------
   Herramienta premium (CONST §2/§14). Guarda de acceso: si access==='locked'
   (usuario Free sin plan) muestra el banner de bloqueo y retorna temprano, tal
   como exige el Prompt Maestro §5. El ToolHost además intercepta el caso premium
   con el Paywall, de modo que esta guarda es la última línea de defensa.
   Esqueleto funcional del wizard de 7 pasos (Planbim/CORFO); la ficha asistida por
   IA se conecta vía Cloud Function (apiProxy) en una iteración posterior.
   ============================================================================= */
import { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import type { ToolProps } from '../core/types';

const PASOS = [
  'Objetivos y usos BIM del proyecto',
  'Roles y responsabilidades (BEP)',
  'Nivel de información requerido (LOIN)',
  'Estrategia de federación de modelos',
  'Entornos común de datos (CDE)',
  'Estándares y nomenclatura (ISO 19650)',
  'Entregables y matriz de responsabilidades',
];

export default function BimWizardView({ projectId, access = 'edit' }: ToolProps) {
  const { getProject } = useProjects();
  const project = getProject(projectId);

  /* ── guarda de acceso premium (CONST §2/§14, Prompt Maestro §5) ── */
  if (access === 'locked') {
    return (
      <div className="ab-tool-root">
        <div className="ab-locked-banner" style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, textAlign: 'center', background: 'var(--muted)' }}>
          <Icons.Lock size={22} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 13 }}>Asistente de Usos BIM — Premium</div>
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>Actualiza a Premium para usar el wizard BIM (Planbim/CORFO · ISO 19650).</p>
        </div>
      </div>
    );
  }

  const readOnly = access === 'read';
  const [paso, setPaso] = useState(0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Cpu size={22} strokeWidth={1.4} /> Asistente de Usos BIM
        <span className="ab-badge premium" style={{ fontSize: 10 }}>PREMIUM</span>
      </h1>
      <p className="tech-quote" style={{ marginBottom: 18 }}>
        {project ? <>Proyecto: <strong>{project.name}</strong> · </> : null}Wizard de 7 pasos (Planbim/CORFO · ISO 19650).
      </p>

      <div className="tool-panel">
        <div className="module-header">| PASO {paso + 1} DE {PASOS.length}</div>
        <div className="panel-content">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {PASOS.map((_, i) => (
              <div key={i} style={{ height: 6, flex: 1, minWidth: 24, background: i <= paso ? 'var(--destructive)' : 'var(--muted)', border: '1px solid var(--border)' }} />
            ))}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>{PASOS[paso]}</h3>
          <textarea className="tech-input" rows={5} disabled={readOnly} placeholder="Define este punto del plan de ejecución BIM (BEP)…" style={{ width: '100%' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="technical-btn secondary" disabled={paso === 0} onClick={() => setPaso(p => Math.max(0, p - 1))}>[ ◂ ANTERIOR ]</button>
            <button className="technical-btn" disabled={paso === PASOS.length - 1} onClick={() => setPaso(p => Math.min(PASOS.length - 1, p + 1))}>[ SIGUIENTE ▸ ]</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
