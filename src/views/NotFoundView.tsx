/* Ruta * — 404. Absorbe links rotos legacy (redirects 301 viven en firebase.json). */
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFoundView() {
  const navigate = useNavigate();
  return (
    <div className="ab-render">
      <div className="ab-render-icon"><Icon name="FileQuestion" size={56} /></div>
      <div className="ab-render-title">[ 404 · RUTA NO ENCONTRADA ]</div>
      <div className="ab-render-sub">El recurso solicitado no existe o fue movido.</div>
      <button className="ab-btn" style={{ marginTop: 16 }} onClick={() => navigate('/')}><Icon name="Home" size={13} /> Ir al inicio</button>
    </div>
  );
}
