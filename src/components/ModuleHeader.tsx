/* BLOQUE 1 · CABECERA (ab-masthead) — logo Archibots (imagen unificada para los 4
   temas, public/Logo-Archibots.png) + [_Archibots] link a inicio + subtítulo. */
import { useNavigate } from 'react-router-dom';

export default function ModuleHeader() {
  const navigate = useNavigate();
  return (
    <header className="ab-masthead">
      <div className="ab-masthead-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/Logo-Archibots.png" alt="Archibots Logo" style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
      <div className="ab-masthead-text">
        <a
          href="/"
          className="ab-logo-link"
          title="Ir al inicio"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
        >
          <span className="ab-pulse">_</span>Archibots
        </a>
        <div className="ab-masthead-sub">
          MÓDULO · <strong style={{ color: 'var(--destructive)' }}>WORKSPACE UNIFICADO</strong>{' '}
          · LABORATORIO DE ARQUITECTURA &amp; INGENIERÍA · OPERANDO BAJO NORMATIVA CHILENA VIGENTE
        </div>
      </div>
    </header>
  );
}
