/* =============================================================================
   CalculadoraArquitectonica.tsx — GEOLOCALIZADOR NORMATIVO (T-07)
   -----------------------------------------------------------------------------
   Contrato visual extraido 1:1 del Mockup (GeolocalizadorView). Inyecta el hook
   de produccion useCerebroNormativo(lat,lng,comuna) -> { isLoading, error, data }.
   Flujo: Maps/coords -> Cerebro Espacial (Turf) -> Llave Maestra -> Firestore.
   Usa SOLO clases .tool-panel/.panel-content/.module-header/.tech-input/.technical-btn
   ya definidas en archibots.css -> hereda los 4 temas (CAD, Washi, Matrix, White).
   ============================================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useCerebroNormativo } from '../core/useCerebroNormativo';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import type { ToolProps, NormativaPRC } from '../core/types';

const DEFAULT_CENTER = { lat: -33.4263, lng: -70.6200 };
const MAPS_KEY = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

/** Devuelve el primer campo definido de la ficha (tolerante a snake_case / camelCase). */
const pick = (n: any, keys: string[]): string => {
  if (!n) return 'N/A';
  for (const k of keys) {
    const v = n[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return 'N/A';
};

export default function CalculadoraArquitectonica({ access }: ToolProps) {
  const readOnly = access === 'read';
  const [comuna, setComuna] = useState('Providencia');
  const [direccion, setDireccion] = useState('Av. Providencia 1550, Providencia');
  const [lat, setLat] = useState<string>(String(DEFAULT_CENTER.lat));
  const [lng, setLng] = useState<string>(String(DEFAULT_CENTER.lng));
  const [applied, setApplied] = useState<{ lat: number; lng: number; comuna: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2600); };

  // Hook reactivo: se dispara cuando cambian las coordenadas "aplicadas".
  const { isLoading, error, data } = useCerebroNormativo(
    applied?.lat ?? null, applied?.lng ?? null, applied?.comuna ?? null,
  );
  const zonaCodigo = pick(data, ['zona_codigo', 'zonaCodigo', 'codigo']);

  /* -- Google Maps (paso 1): carga perezosa con degradacion a coords manuales -- */
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const setPoint = useCallback((la: number, ln: number, pan = false) => {
    setLat(la.toFixed(6)); setLng(ln.toFixed(6));
    if (mapRef.current && markerRef.current) {
      const pos = { lat: la, lng: ln };
      markerRef.current.setPosition(pos);
      if (pan) mapRef.current.panTo(pos);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!MAPS_KEY) { setMapsError('Falta la API Key de Google Maps (VITE_GOOGLE_MAPS_API_KEY en .env.local). Mientras tanto, usa el ingreso manual de coordenadas.'); return; }
    (window as any).gm_authFailure = () => setMapsError('Google Maps rechazó la API Key: en Google Cloud habilita "Maps JavaScript API", activa la facturación y permite este dominio (o localhost) en las restricciones de la clave. Mientras tanto, usa el ingreso manual.');
    (async () => {
      try {
        // @googlemaps/js-api-loader v2: la clase Loader fue removida. Se usa la API
        // funcional — setOptions() una vez + importLibrary() por cada librería.
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
        setOptions({ key: MAPS_KEY, v: 'weekly' });
        const g = await importLibrary('maps');
        const markerLib = await importLibrary('marker');
        const geo = await importLibrary('geocoding');
        if (cancelled || !mapDivRef.current) return;
        const map = new g.Map(mapDivRef.current, { center: DEFAULT_CENTER, zoom: 16, mapTypeId: 'hybrid' });
        const marker = new markerLib.Marker({ position: DEFAULT_CENTER, map, draggable: !readOnly });
        map.addListener('click', (e: any) => { if (!readOnly) setPoint(e.latLng.lat(), e.latLng.lng()); });
        marker.addListener('dragend', (e: any) => setPoint(e.latLng.lat(), e.latLng.lng()));
        mapRef.current = map; markerRef.current = marker; geocoderRef.current = new geo.Geocoder();
        setMapReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMapsError(`No se pudo iniciar Google Maps (${msg}). Revisa en Google Cloud que "Maps JavaScript API" esté habilitada y la facturación activa. Usa el ingreso manual de coordenadas.`);
      }
    })();
    return () => { cancelled = true; };
  }, [readOnly, setPoint]);

  const buscarDireccion = useCallback(() => {
    if (!geocoderRef.current) { notify('Geocoder no disponible (modo manual).'); return; }
    geocoderRef.current.geocode({ address: `${direccion}, ${comuna}, Chile` }, (res: any[], status: string) => {
      if (status === 'OK' && res && res[0]) {
        const loc = res[0].geometry.location;
        setPoint(loc.lat(), loc.lng(), true);
        notify('Direccion centrada en el mapa.');
      } else notify('Direccion no encontrada.');
    });
  }, [direccion, comuna, setPoint]);

  const intersectar = () => {
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) { notify('Coordenadas invalidas.'); return; }
    if (!comuna.trim()) { notify('Indica la comuna del predio.'); return; }
    setApplied({ lat: la, lng: ln, comuna });
  };
  const limpiar = () => { setApplied(null); notify('Analisis reiniciado.'); };

  return (
    <div>
      <p className="tech-quote" style={{ marginBottom: 18 }}>
        Motor de inteligencia geoespacial. Elige el punto del predio (mapa o coordenadas) para
        intersectar el poligono PRC con Turf.js y cargar la ficha normativa desde la base
        {' '}<strong>normativas_prc</strong>.
      </p>

      <div className="ab-split">
      <div className="ab-split-left">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
        {/* Panel izquierdo: parametros */}
        <div className="tool-panel" style={{ flex: '1 1 320px', minWidth: 300, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| PARAMETROS DE UBICACION</div>
          <div className="panel-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>COMUNA</label>
              <input className="tech-input" value={comuna} disabled={readOnly} onChange={(e) => setComuna(e.target.value)} placeholder="Ej: Providencia" />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>DIRECCION</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="tech-input" value={direccion} disabled={readOnly} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle N, Comuna" />
                <button className="technical-btn" style={{ padding: '0 15px' }} disabled={readOnly || !mapReady} onClick={buscarDireccion}>BUSCAR</button>
              </div>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>COORDENADAS (LAT / LNG)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="tech-input" value={lat} disabled={readOnly} onChange={(e) => setLat(e.target.value)} placeholder="-33.42" />
                <input className="tech-input" value={lng} disabled={readOnly} onChange={(e) => setLng(e.target.value)} placeholder="-70.62" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 5 }}>ESTADO</div>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{isLoading ? 'CRUZANDO...' : data ? 'FICHA OK' : applied ? 'SIN DATO' : 'IDLE'}</div>
              </div>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, textAlign: 'center', background: data ? 'var(--muted)' : 'var(--card)' }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 5 }}>ZONA PRC</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: data ? 'var(--destructive)' : 'inherit' }}>{data ? zonaCodigo : 'NO DETECTADA'}</div>
              </div>
            </div>

            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="technical-btn" style={{ flex: 1, padding: 12 }} disabled={readOnly || isLoading} onClick={intersectar}>
                {isLoading ? '[ INTERSECTANDO... ]' : '[ INTERSECTAR NORMATIVA ]'}
              </button>
              <button className="technical-btn secondary" style={{ padding: 12 }} disabled={isLoading} onClick={limpiar}>[ LIMPIAR ]</button>
            </div>
          </div>
        </div>

        {/* Panel derecho: visor cartografico (Maps) / fallback */}
        <div className="tool-panel" style={{ flex: '2 1 560px', minWidth: 380, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| VISOR CARTOGRAFICO DE INTERSECCION</div>
          <div className="panel-content" style={{ padding: 0, position: 'relative', flexGrow: 1, minHeight: 500 }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '100%', minHeight: 500, display: mapsError ? 'none' : 'block' }} />
            {mapsError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30, textAlign: 'center', background: 'var(--muted)' }}>
                <Icons.MapPinOff size={32} style={{ opacity: 0.5 }} />
                <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Visor de mapa no disponible</div>
                <div style={{ fontSize: 11, opacity: 0.7, maxWidth: 360 }}>{mapsError} El cruce espacial y la ficha funcionan igual con las coordenadas de la izquierda.</div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>{/* /ab-split-left */}

      {/* ── COLUMNA DERECHA · VISTA PREVIA DE EXPORTACIÓN ── */}
      <div className="ab-split-right">
        <div className="ab-preview-head">
          <h2 className="ab-preview-title"><Icons.FileText size={14} /> Vista Previa de Exportación</h2>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Expediente Normativo" documentId="T-07">
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', borderBottom: '2px solid #1a1a1a', paddingBottom: 6, textTransform: 'uppercase' }}>Expediente Normativo{data ? ` · Zona ${zonaCodigo}` : ''}</h3>
            {data ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#1a1a1a' }}><tbody>
                <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700, width: '46%' }}>Usos Permitidos</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{pick(data, ['usos_permitidos_txt', 'usosPermitidos'])}</td></tr>
                <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Constructibilidad</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{pick(data, ['coef_constructibilidad', 'constructibilidad'])}</td></tr>
                <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Ocupación de Suelo</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{pick(data, ['cos_primer_piso', 'coeficienteOcupacion'])}</td></tr>
                <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Altura Máxima</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{pick(data, ['altura_maxima_txt', 'alturaMaxima'])}</td></tr>
                <tr><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8', fontWeight: 700 }}>Sistema de Agrupamiento</td><td style={{ padding: '6px 8px', borderBottom: '1px solid #d8d8d8' }}>{pick(data, ['sistema_agrupamiento_txt', 'sistemaAgrupamiento'])}</td></tr>
              </tbody></table>
            ) : (
              <p style={{ color: '#666', fontSize: 12 }}>Intersecta una normativa (coordenadas + comuna) para generar el expediente.</p>
            )}
          </div>
        </DocumentExportWrapper>
      </div>
      </div>{/* /ab-split */}

      {/* Estados reactivos */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tool-panel" style={{ marginTop: 20, padding: 30, textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 }}>
            <Icons.Loader size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Intersectando punto con la capa PRC y resolviendo ficha...
          </motion.div>
        )}
      </AnimatePresence>

      {error && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="tool-panel" style={{ marginTop: 20 }}>
          <div className="module-header" style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>| ERROR DE COREOGRAFIA</div>
          <div className="panel-content" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Icons.AlertTriangle size={18} /> {error}
          </div>
        </motion.div>
      )}

      {data && !isLoading && <ExpedienteNormativo n={data} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 180, right: 20, zIndex: 9999, background: 'var(--foreground)', color: 'var(--background)', padding: '10px 18px', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', border: '1.5px solid var(--border)' }}>{toast}</div>
      )}
    </div>
  );
}

/** Ficha desplegada (layout del Mockup, tolerante al esquema real de Firestore). */
function ExpedienteNormativo({ n }: { n: NormativaPRC }) {
  const celdas: Array<[string, string, boolean]> = [
    ['USOS PERMITIDOS', pick(n, ['usos_permitidos_txt', 'usosPermitidos']), false],
    ['USOS PROHIBIDOS', pick(n, ['usos_prohibidos_txt', 'usosProhibidos']), false],
    ['COEF. CONSTRUCTIBILIDAD', pick(n, ['coef_constructibilidad', 'constructibilidad']), true],
    ['COEF. OCUPACION DE SUELO', pick(n, ['cos_primer_piso', 'coeficienteOcupacion']), true],
    ['ALTURA MAXIMA', pick(n, ['altura_maxima_txt', 'alturaMaxima']), false],
    ['SISTEMA AGRUPAMIENTO', pick(n, ['sistema_agrupamiento_txt', 'sistemaAgrupamiento']), false],
    ['SUPERFICIE PREDIAL MIN.', pick(n, ['superficie_predial_minima_txt', 'superficiePredialMinima']), false],
    ['ANTEJARDIN MINIMO', pick(n, ['antejardin_txt', 'antejardín_txt', 'antejardin']), false],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="tool-panel" style={{ marginTop: 20 }}>
      <div className="module-header" style={{ background: 'var(--foreground)', color: 'var(--background)', borderBottom: 'none' }}>
        | EXPEDIENTE NORMATIVO: ZONA {pick(n, ['zona_codigo', 'zonaCodigo', 'codigo'])}
      </div>
      <div className="panel-content">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase' }}>{pick(n, ['zona_nombre', 'zonaNombre'])}</h2>
          <p style={{ opacity: 0.8, fontSize: 12, maxWidth: 800, marginTop: 10 }}>{pick(n, ['zona_descripcion', 'zonaDescripcion'])}</p>
          <p style={{ fontSize: 10, fontWeight: 'bold', marginTop: 10, color: 'var(--destructive)' }}>FUENTE: {pick(n, ['plan_regulador_comunal', 'fuente'])}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {celdas.map(([label, val, big]) => (
            <div key={label} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 15 }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: big ? 16 : 12, fontWeight: big ? 'bold' : 'normal' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
