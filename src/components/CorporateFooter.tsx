/* BLOQUE 5 · FOOTER CORPORATIVO (ab-cfooter)
   meta-grid (Vista · Versión · Tema activo · DocID · Estatus · Usuario · Proyecto
   · Herramienta) + caja de feedback (P12) + línea legal. */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../core/auth/AuthProvider';
import { useTheme } from '../core/theme/ThemeProvider';
import { useToast } from '../core/ui/ToastProvider';
import { getManifest } from '../core/registry';
import type { ProjectMaster } from '../core/types';

const TODAY = new Date().toISOString().slice(0, 10);

export default function CorporateFooter({ project, view }: {
  project?: ProjectMaster | null;
  view?: string;
}) {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { triggerToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const tool = getManifest(toolId);

  return (
    <div className="ab-cfooter">
      <div className="ab-metagrid">
        <div className="ab-meta"><span className="ab-meta-label">Vista</span><span className="ab-meta-value">{(view ?? 'WORKSPACE').toUpperCase()}</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Versión</span><span className="ab-meta-value">V 1.0.0 · SPA</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Tema activo</span><span className="ab-meta-value">{theme.toUpperCase()}</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Doc ID</span><span className="ab-meta-value">#AB-2026-SPA</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Estatus</span><span className="ab-meta-value ab-sysok"><span className="ab-blink">●</span> SYSTEM_OK</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Usuario · Plan</span><span className="ab-meta-value">{(user?.nombre ?? 'INVITADO').toUpperCase()} · {(user?.plan ?? 'FREE').toUpperCase()}</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Proyecto</span><span className="ab-meta-value" style={{ color: 'var(--destructive)' }}>{project ? project.name.toUpperCase() : 'MODO LIBRE'}</span></div>
        <div className="ab-meta"><span className="ab-meta-label">Herramienta · Fecha</span><span className="ab-meta-value">{tool ? tool.code : '—'} · {TODAY}</span></div>
      </div>

      <div className="ab-feedback">
        <label htmlFor="fb"><Icon name="MessageSquare" size={13} /> ¿Te gusta esta web?</label>
        <input id="fb" type="text" placeholder="Cuéntanos qué mejorarías…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <button className="ab-btn" onClick={() => { triggerToast(feedback.trim() ? '¡Gracias por tu comentario!' : 'Escribe un comentario primero'); if (feedback.trim()) setFeedback(''); }}>
          <Icon name="Send" size={12} /> Enviar
        </button>
      </div>

      <div className="ab-legal">
        <span>© {new Date().getFullYear()} ARCHIBOTS · LABORATORIO DE ARQUITECTURA PARAMÉTRICA</span>
        <span style={{ display: 'flex', gap: 14 }}>
          <a href="/legal/terminos" onClick={(e) => { e.preventDefault(); navigate('/legal/terminos'); }}>Términos y Condiciones</a>
          <a href="/legal/privacidad" onClick={(e) => { e.preventDefault(); navigate('/legal/privacidad'); }}>Política de Privacidad</a>
        </span>
      </div>
    </div>
  );
}
