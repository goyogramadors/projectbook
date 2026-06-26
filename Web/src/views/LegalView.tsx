/* Rutas /legal/terminos y /legal/privacidad (P21/CONST §17).
   Renderiza el contenido legal VERSIONADO desde src/core/legal/legalContent.ts
   (Ley 19.628 / Ley 21.719). El texto se escapa por React (sin innerHTML). */
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { LEGAL_DOCS } from '../core/legal/legalContent';

export default function LegalView() {
  const { doc } = useParams();
  const navigate = useNavigate();
  const data = doc === 'privacidad' ? LEGAL_DOCS.privacidad : LEGAL_DOCS.terminos;

  return (
    <div className="ab-render" style={{ display: 'block', textAlign: 'left', width: '100%' }}>
      <div className="ab-render-title"><Icon name="Scale" size={18} /> {data.titulo}</div>
      <div className="ab-render-sub" style={{ margin: '6px 0 16px' }}>
        Versión {data.version} · Vigente desde {data.fechaVigencia}
      </div>

      {data.intro.map((par, i) => (
        <p key={`intro-${i}`} style={{ margin: '0 0 10px', lineHeight: 1.6, opacity: 0.92 }}>{par}</p>
      ))}

      {data.secciones.map((sec, si) => (
        <section key={`sec-${si}`} style={{ margin: '18px 0 0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>{sec.h}</h3>
          {sec.p.map((par, pi) => (
            <p key={`sec-${si}-p-${pi}`} style={{ margin: '0 0 8px', lineHeight: 1.6, opacity: 0.9 }}>{par}</p>
          ))}
        </section>
      ))}

      <p style={{ margin: '22px 0 16px', fontSize: 12, opacity: 0.65 }}>
        Este documento puede ser actualizado; la versión vigente es la publicada en esta página.
      </p>

      <button className="ab-btn sec" onClick={() => navigate('/')}>
        <Icon name="ArrowLeft" size={13} /> Volver
      </button>
    </div>
  );
}
