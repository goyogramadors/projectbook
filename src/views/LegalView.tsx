/* Rutas /legal/terminos y /legal/privacidad (P21/CONST §17) — placeholder.
   Los borradores legales completos son entregable del Sprint F5. */
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function LegalView() {
  const { doc } = useParams();
  const navigate = useNavigate();
  const title = doc === 'privacidad' ? 'Política de Privacidad' : 'Términos y Condiciones';
  return (
    <div className="ab-render" style={{ display: 'block', textAlign: 'left', width: '100%' }}>
      <div className="ab-render-title"><Icon name="Scale" size={18} /> {title}</div>
      <div className="ab-render-sub" style={{ margin: '6px 0 16px' }}>Borrador base — el texto legal definitivo se incorpora en el Sprint F5 (CONST §17).</div>
      <button className="ab-btn sec" onClick={() => navigate('/')}><Icon name="ArrowLeft" size={13} /> Volver</button>
    </div>
  );
}
