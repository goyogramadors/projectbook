/* GeolocalizadorView — recuperado de remix geolocalizador (geo + ficha normativa).
   El mapa de Google se reemplaza por un VISOR mock interactivo (SVG): se dibuja
   el polígono haciendo clic, se calcula superficie y se intersecta una ficha PRC
   simulada. Datos normativos MOCK. */
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const VW = 600, VH = 460, METERS_PER_UNIT = 0.6;

// Fichas normativas MOCK (estructura idéntica a la BD PRC real)
const ZONAS_MOCK: Record<string, any> = {
  'ZC-2': {
    zona_codigo: 'ZC-2', zona_nombre: 'Zona Centro Mixto', plan_regulador_comunal: 'PRC La Florida', fuente: 'BD Normativa ArchiBots',
    zona_descripcion: 'Zona de uso mixto residencial y equipamiento de mediana densidad, asociada a corredores de transporte.',
    usos_permitidos_txt: 'Residencial, equipamiento, comercio, servicios y áreas verdes.', usos_prohibidos_txt: 'Industria molesta o peligrosa, bodegaje mayor.',
    coef_constructibilidad: '2.4', cos_primer_piso: '0.6', altura_maxima_txt: '21 m (≈ 7 pisos)', sistema_agrupamiento_txt: 'Aislado y Continuo',
    superficie_predial_minima_txt: '250 m²', antejardín_txt: '3.0 metros',
  },
  'ZU-4': {
    zona_codigo: 'ZU-4', zona_nombre: 'Zona Residencial Densidad Media', plan_regulador_comunal: 'PRC Ñuñoa', fuente: 'BD Normativa ArchiBots',
    zona_descripcion: 'Zona preferentemente residencial con equipamiento complementario de escala vecinal.',
    usos_permitidos_txt: 'Residencial, equipamiento menor, áreas verdes.', usos_prohibidos_txt: 'Industria, talleres, estaciones de servicio.',
    coef_constructibilidad: '1.6', cos_primer_piso: '0.5', altura_maxima_txt: '10.5 m (≈ 3 pisos)', sistema_agrupamiento_txt: 'Aislado / Pareado',
    superficie_predial_minima_txt: '400 m²', antejardín_txt: '5.0 metros',
  },
  'ZE-1': {
    zona_codigo: 'ZE-1', zona_nombre: 'Zona de Equipamiento', plan_regulador_comunal: 'PRC Las Condes', fuente: 'BD Normativa ArchiBots',
    zona_descripcion: 'Zona destinada a equipamiento de escala mayor (salud, educación, cultura).',
    usos_permitidos_txt: 'Equipamiento, servicios, áreas verdes.', usos_prohibidos_txt: 'Residencial exclusivo, industria.',
    coef_constructibilidad: '3.2', cos_primer_piso: '0.7', altura_maxima_txt: '30 m (≈ 10 pisos)', sistema_agrupamiento_txt: 'Aislado',
    superficie_predial_minima_txt: '600 m²', antejardín_txt: '5.0 metros',
  },
};
const ZONA_KEYS = Object.keys(ZONAS_MOCK);

export default function GeolocalizadorView() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [searchAddress, setSearchAddress] = useState('Lientur 7345, La Florida');
  const [poligono, setPoligono] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [superficie, setSuperficie] = useState('');
  const [zonaDetectada, setZonaDetectada] = useState<string | null>(null);
  const [normativa, setNormativa] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2600); };

  const areaM2 = (pts: { x: number; y: number }[]) => {
    if (pts.length < 3) return 0;
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(a / 2) * METERS_PER_UNIT * METERS_PER_UNIT;
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VW;
    const y = ((e.clientY - rect.top) / rect.height) * VH;
    const next = [...poligono, { x, y }];
    setPoligono(next);
    if (next.length >= 3) setSuperficie(areaM2(next).toFixed(1) + ' m²');
  };

  const analizar = () => {
    if (poligono.length < 3) { notify('Traza al menos 3 vértices.'); return; }
    setLoading(true); setNormativa(null); setZonaDetectada(null);
    window.setTimeout(() => {
      // "Intersección" simulada: elige zona según la superficie trazada
      const a = areaM2(poligono);
      const key = a > 3000 ? 'ZE-1' : a > 1500 ? 'ZC-2' : 'ZU-4';
      setZonaDetectada(key);
      setNormativa(ZONAS_MOCK[key]);
      setLoading(false);
      notify(`Normativa cargada: Zona ${key}`);
    }, 1100);
  };

  const toggleDraw = () => {
    const next = !isDrawing;
    setIsDrawing(next);
    if (!next && poligono.length >= 3) analizar();
  };

  const clear = () => { setPoligono([]); setSuperficie(''); setIsDrawing(false); setNormativa(null); setZonaDetectada(null); notify('Polígono borrado.'); };

  const polyStr = poligono.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <p className="tech-quote" style={{ marginBottom: '18px' }}>
        Motor de inteligencia geoespacial. Trace el polígono predial para extraer e intersectar automáticamente los parámetros normativos del Plan Regulador Comunal (PRC). <strong>[VISOR MOCK]</strong>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
        {/* Panel izquierdo: controles */}
        <div className="tool-panel" style={{ flex: '1 1 320px', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| PARÁMETROS DE UBICACIÓN</div>
          <div className="panel-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>DIRECCIÓN O COMUNA</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="tech-input" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} placeholder="Ej: Providencia, Chile" />
                <button onClick={() => notify('Centrando mapa (mock)…')} className="technical-btn" style={{ padding: '0 15px' }}>BUSCAR</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ border: '1.5px solid var(--border-color)', padding: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6, marginBottom: '5px' }}>ÁREA TRAZADA</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{superficie || '0.0 m²'}</div>
              </div>
              <div style={{ border: '1.5px solid var(--border-color)', padding: '15px', textAlign: 'center', backgroundColor: normativa ? 'var(--muted)' : 'var(--card)' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6, marginBottom: '5px' }}>ZONA PRC</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: normativa ? 'var(--accent-red)' : 'inherit' }}>{zonaDetectada || 'NO DETECTADA'}</div>
              </div>
            </div>
            <div style={{ border: '1.5px dashed var(--border-color)', padding: '12px', fontSize: '10px', lineHeight: 1.6, opacity: 0.8 }}>
              <strong>INSTRUCCIONES:</strong><br />1. Pulsa [DIBUJAR POLÍGONO].<br />2. Haz clic en el visor para marcar los vértices del predio.<br />3. Pulsa [FINALIZAR TRAZO] para intersectar la normativa.
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <button onClick={() => notify('✓ Terreno guardado en el proyecto (mock).')} className="technical-btn" style={{ width: '100%', padding: '12px' }}>
              [ ✓ GUARDAR POLÍGONO EN PROYECTO ]
            </button>
          </div>
        </div>

        {/* Panel derecho: visor cartográfico mock */}
        <div className="tool-panel" style={{ flex: '2 1 560px', minWidth: '380px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| VISOR CARTOGRÁFICO DE INTERSECCIÓN</div>
          <div className="panel-content" style={{ padding: 0, position: 'relative', flexGrow: 1, minHeight: '500px' }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, display: 'flex', gap: '10px' }}>
              <button onClick={toggleDraw} className={isDrawing ? 'technical-btn' : 'technical-btn secondary'} style={{ backgroundColor: isDrawing ? 'var(--accent-red)' : 'var(--card)', borderColor: isDrawing ? 'var(--accent-red)' : 'var(--border-color)', color: isDrawing ? '#fff' : 'var(--text-primary)' }}>
                {isDrawing ? '[ ⬟ FINALIZAR TRAZO ]' : '[ ⬟ DIBUJAR POLÍGONO ]'}
              </button>
              <button onClick={clear} className="technical-btn secondary" style={{ backgroundColor: 'var(--card)' }}>[ 🗑 BORRAR ]</button>
            </div>

            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} onClick={handleSvgClick}
              style={{ width: '100%', height: '100%', minHeight: '500px', display: 'block', background: '#fcfaf5', cursor: isDrawing ? 'crosshair' : 'grab' }}>
              <defs>
                <pattern id="geo-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#2E2E2E" strokeOpacity="0.08" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={VW} height={VH} fill="url(#geo-grid)" />
              {/* "calles" decorativas */}
              <path d={`M0,150 L${VW},120`} stroke="#e0ddd6" strokeWidth="14" />
              <path d={`M0,320 L${VW},345`} stroke="#e0ddd6" strokeWidth="18" />
              <path d={`M210,0 L240,${VH}`} stroke="#e0ddd6" strokeWidth="16" />
              <path d={`M430,0 L410,${VH}`} stroke="#e0ddd6" strokeWidth="12" />
              {/* manzanas */}
              {[[60,40,120,80],[300,40,150,70],[60,200,130,90],[300,190,140,110]].map((b,i)=>(
                <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="#f1eee8" stroke="#d8d4cc" strokeWidth="1" />
              ))}
              {/* polígono del usuario */}
              {poligono.length > 0 && (
                <polygon points={polyStr} fill={isDrawing ? 'rgba(211,47,47,0.32)' : 'rgba(46,46,46,0.32)'} stroke={isDrawing ? '#D32F2F' : '#2E2E2E'} strokeWidth="2.5" />
              )}
              {poligono.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="6" fill={isDrawing ? '#D32F2F' : '#2E2E2E'} stroke="#fff" strokeWidth="2" />
                  <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">{i + 1}</text>
                </g>
              ))}
              {poligono.length === 0 && (
                <text x={VW / 2} y={VH / 2} textAnchor="middle" fontSize="13" fill="#2E2E2E" fillOpacity="0.4" fontWeight="bold" style={{ textTransform: 'uppercase' }}>
                  {isDrawing ? '◈ Haz clic para marcar vértices' : '◈ Activa [ DIBUJAR POLÍGONO ]'}
                </text>
              )}
            </svg>

            {superficie && (
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 10, background: '#2E2E2E', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                ÁREA: {superficie}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informe normativo */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tool-panel" style={{ marginTop: '20px', padding: '30px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
            <Icons.Loader size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Intersectando polígono con base PRC…
          </motion.div>
        )}
      </AnimatePresence>

      {normativa && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="tool-panel" style={{ marginTop: '20px' }}>
          <div className="module-header" style={{ backgroundColor: '#2E2E2E', color: '#FFFFFF', borderBottom: 'none' }}>
            | EXPEDIENTE NORMATIVO: ZONA {normativa.zona_codigo}
          </div>
          <div className="panel-content">
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>{normativa.zona_nombre}</h2>
              <p style={{ opacity: 0.8, fontSize: '12px', maxWidth: '800px', marginTop: '10px' }}>{normativa.zona_descripcion}</p>
              <p style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '10px', color: 'var(--accent-red)' }}>FUENTE: {normativa.plan_regulador_comunal} ({normativa.fuente})</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                ['USOS PERMITIDOS', normativa.usos_permitidos_txt, false],
                ['USOS PROHIBIDOS', normativa.usos_prohibidos_txt, false],
                ['COEF. CONSTRUCTIBILIDAD', normativa.coef_constructibilidad, true],
                ['COEF. OCUPACIÓN DE SUELO', normativa.cos_primer_piso, true],
                ['ALTURA MÁXIMA', normativa.altura_maxima_txt, false],
                ['SISTEMA AGRUPAMIENTO', normativa.sistema_agrupamiento_txt, false],
                ['SUPERFICIE PREDIAL MÍN.', normativa.superficie_predial_minima_txt, false],
                ['ANTEJARDÍN MÍNIMO', normativa.antejardín_txt, false],
              ].map(([label, val, big]: any) => (
                <div key={label} style={{ border: '1.5px solid var(--border-color)', padding: '15px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6, marginBottom: '5px' }}>{label}</div>
                  <div style={{ fontSize: big ? '16px' : '12px', fontWeight: big ? 'bold' : 'normal' }}>{val || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '180px', right: '20px', zIndex: 9999, backgroundColor: '#2E2E2E', color: '#FFF', padding: '10px 18px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', border: '1.5px solid var(--border)' }}>◈ {toast}</div>
      )}
    </div>
  );
}
