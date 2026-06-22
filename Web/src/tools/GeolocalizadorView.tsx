/* =============================================================================
   GeolocalizadorView.tsx — GEOLOCALIZADOR NORMATIVO (T-07) · "Dos Cerebros"
   -----------------------------------------------------------------------------
   Coreografía espacial-normativa (CONST §8/§9):
     1) Google Maps (@googlemaps/js-api-loader): punto + dibujo de polígono.
     2) Cerebro Espacial — Web Worker (geo.worker): intersección punto↔polígono PRC
        y cálculo de área del polígono dibujado, fuera del hilo de React.
     3) Capa PRC desde CDN (GeoJsonService: /geo-data + IndexedDB).
     4) Cerebro Normativo — ficha desde la DB nombrada 'coordenadasnormativas'
        (NormativaService → normativas_prc).
   Degrada con elegancia a ingreso manual de coordenadas si no hay API Key de Maps.
   ============================================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useDimensionadorSync } from '../hooks/useDimensionadorSync';
import { loadComunaGeoJSON } from '../core/GeoJsonService';
import { getNormativaDesdeFeature } from '../core/NormativaService';
import type { ToolProps, NormativaPRC } from '../core/types';

const DEFAULT_CENTER = { lat: -33.4569, lng: -70.6483 }; // Ñuñoa (capa de muestra)
const MAPS_KEY = ((import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) ?? '';

interface WorkerIntersect { id: number; ok: boolean; feature: { properties: Record<string, unknown> } | null; areaM2: number | null; error?: string; }
interface WorkerArea { id: number; ok: boolean; areaM2: number; error?: string; }

// Alias laxo para los objetos del SDK de Google Maps (sin @types/google.maps en el repo).
/* eslint-disable @typescript-eslint/no-explicit-any */
type MapsAny = any;

const pick = (n: NormativaPRC | null, keys: string[]): string => {
  if (!n) return 'N/A';
  for (const k of keys) {
    const v = (n as Record<string, unknown>)[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return 'N/A';
};

/** Ficha normativa ESTIMADA por defecto (contingencia paramétrica): se usa cuando la
 *  zona se detecta geométricamente pero aún no hay documento sembrado en normativas_prc.
 *  Permite previsualizar el expediente con parámetros estándar — NO es dato oficial. */
function fichaEstimada(zona: string | null): NormativaPRC {
  return {
    zona_codigo: zona ?? '—',
    zona_nombre: 'Parámetros estimados (sin ficha oficial)',
    zona_descripcion: 'La ficha de esta zona aún no está cargada en normativas_prc. Se muestran valores ESTIMADOS por defecto para previsualizar el expediente; no constituyen dato normativo oficial.',
    plan_regulador_comunal: 'ESTIMACIÓN — verifique el PRC vigente',
    fuente: 'ESTIMACIÓN — verifique el PRC vigente',
    usosPermitidos: 'Residencial · Equipamiento · Comercio menor (estimado)',
    usosProhibidos: 'Industria molesta o peligrosa (estimado)',
    constructibilidad: 2.0,
    coeficienteOcupacion: 0.6,
    alturaMaxima: '10,5 m (≈ 3 pisos)',
    sistemaAgrupamiento: 'Aislado / Pareado',
    superficiePredialMinima: '160 m²',
    antejardin: '3 m',
    estimada: true,
  };
}

export default function GeolocalizadorView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { syncSuperficie } = useDimensionadorSync();
  const project = getProject(projectId);

  const [comuna, setComuna] = useState(project?.comuna || 'Ñuñoa');
  const [direccion, setDireccion] = useState(project?.direccion || '');
  const [lat, setLat] = useState(String(DEFAULT_CENTER.lat));
  const [lng, setLng] = useState(String(DEFAULT_CENTER.lng));
  const [zona, setZona] = useState<string | null>(null);
  const [ficha, setFicha] = useState<NormativaPRC | null>(null);
  const [areaTerreno, setAreaTerreno] = useState<number | null>(null);
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'sinDato'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2600); };

  /* ── Web Worker (cerebro espacial) ── */
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<Map<number, (r: unknown) => void>>(new Map());
  const seq = useRef(0);
  useEffect(() => {
    const w = new Worker(new URL('../workers/geo.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent) => {
      const data = e.data as { id: number };
      const res = pending.current.get(data.id);
      if (res) { res(e.data); pending.current.delete(data.id); }
    };
    workerRef.current = w;
    return () => { w.terminate(); };
  }, []);
  const callWorker = useCallback(<T,>(payload: Record<string, unknown>): Promise<T> => new Promise((resolve) => {
    const id = ++seq.current;
    pending.current.set(id, resolve as (r: unknown) => void);
    workerRef.current?.postMessage({ ...payload, id });
  }), []);

  /* ── Google Maps (degradación a manual) ── */
  // Google Maps se tipa de forma laxa (sin @types/google.maps) igual que el resto
  // del repo: el SDK se carga en runtime vía js-api-loader.
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapsAny>(null);
  const markerRef = useRef<MapsAny>(null);
  const geocoderRef = useRef<MapsAny>(null);
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
    // Google llama a gm_authFailure cuando la clave es rechazada (API no habilitada,
    // facturación inactiva o dominio/localhost no permitido en las restricciones).
    (window as MapsAny).gm_authFailure = () => setMapsError('Google Maps rechazó la API Key: en Google Cloud habilita "Maps JavaScript API", activa la facturación y permite este dominio (o localhost) en las restricciones de la clave. Mientras tanto, usa el ingreso manual.');
    (async () => {
      try {
        // @googlemaps/js-api-loader v2: la clase Loader fue removida. Se usa la API
        // funcional — setOptions() una vez + importLibrary() por cada librería.
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
        setOptions({ key: MAPS_KEY, v: 'weekly' });
        const mapsLib: MapsAny = await importLibrary('maps');
        const markerLib: MapsAny = await importLibrary('marker');
        const geoLib: MapsAny = await importLibrary('geocoding');
        if (cancelled || !mapDivRef.current) return;

        const map: MapsAny = new mapsLib.Map(mapDivRef.current, { center: DEFAULT_CENTER, zoom: 16, mapTypeId: 'hybrid' });
        const marker: MapsAny = new markerLib.Marker({ position: DEFAULT_CENTER, map, draggable: !readOnly });
        marker.addListener('dragend', (e: MapsAny) => { if (e.latLng) setPoint(e.latLng.lat(), e.latLng.lng()); });

        // DrawingManager fue ELIMINADO de la Maps JS API (v3.65). Se reemplaza por un
        // Polygon editable estandar: cada click fija el punto de analisis Y agrega un
        // vertice (push al getPath()); arrastrar vertices lo edita. El area se recalcula
        // en el Web Worker (Turf) ante cualquier cambio del trazo.
        const polygon: MapsAny = new mapsLib.Polygon({
          map,
          editable: !readOnly,
          fillColor: '#D32F2F', fillOpacity: 0.15, strokeColor: '#D32F2F', strokeWeight: 2,
        });
        const gmaps: MapsAny = (window as MapsAny).google;

        map.addListener('click', (e: MapsAny) => {
          if (readOnly || !e.latLng) return;
          setPoint(e.latLng.lat(), e.latLng.lng()); // mantiene el punto de analisis
          polygon.getPath().push(e.latLng);          // y construye el poligono del terreno
        });

        const recomputeArea = async () => {
          const path: MapsAny = polygon.getPath();
          const ring: Array<[number, number]> = [];
          const len: number = path.getLength();
          for (let i = 0; i < len; i++) { const p = path.getAt(i); ring.push([p.lng(), p.lat()]); }
          if (len < 3) return;
          const r = await callWorker<WorkerArea>({ op: 'area', ring });
          if (r.ok) { setAreaTerreno(r.areaM2); notify(`Polígono: ${r.areaM2.toLocaleString('es-CL')} m².`); }
        };
        const pPath: MapsAny = polygon.getPath();
        gmaps.maps.event.addListener(pPath, 'insert_at', recomputeArea);
        gmaps.maps.event.addListener(pPath, 'set_at', recomputeArea);
        gmaps.maps.event.addListener(pPath, 'remove_at', recomputeArea);

        mapRef.current = map; markerRef.current = marker; geocoderRef.current = new geoLib.Geocoder();
        setMapReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMapsError(`No se pudo iniciar Google Maps (${msg}). Revisa en Google Cloud que "Maps JavaScript API" esté habilitada y la facturación activa. Usa el ingreso manual de coordenadas.`);
      }
    })();
    return () => { cancelled = true; };
  }, [readOnly, setPoint, callWorker]);

  const buscarDireccion = useCallback(() => {
    if (!geocoderRef.current) { notify('Geocoder no disponible (modo manual).'); return; }
    geocoderRef.current.geocode(
      { address: `${direccion}, ${comuna}, Chile` },
      (res: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        const first = res?.[0];
        if (status === google.maps.GeocoderStatus.OK && first) {
          const loc = first.geometry.location;
          setPoint(loc.lat(), loc.lng(), true);
          notify('Dirección centrada en el mapa.');
        } else notify('Dirección no encontrada.');
      },
    );
  }, [direccion, comuna, setPoint]);

  /* ── Coreografía: CDN → Worker → Firestore ── */
  const intersectar = async () => {
    const la = parseFloat(lat); const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) { notify('Coordenadas inválidas.'); return; }
    if (!comuna.trim()) { notify('Indica la comuna del predio.'); return; }
    setEstado('cargando'); setError(null); setFicha(null); setZona(null);
    try {
      const geojson = await loadComunaGeoJSON(comuna);                                   // CDN + IndexedDB
      const r = await callWorker<WorkerIntersect>({ op: 'intersect', lat: la, lng: ln, geojson });
      if (!r.ok) throw new Error(r.error || 'Error en el cerebro espacial.');
      if (!r.feature) { setEstado('sinDato'); setError('El punto cae fuera de toda zona PRC de la comuna.'); return; }
      const resuelto = await getNormativaDesdeFeature(comuna, r.feature.properties);      // named DB
      const zonaCod = resuelto?.zona ?? null;
      setZona(zonaCod);
      // Contingencia paramétrica: si la zona no tiene ficha en normativas_prc, se hidrata
      // una ficha ESTIMADA por defecto para que el expediente renderice la tabla técnica.
      setFicha(resuelto?.normativa ?? fichaEstimada(zonaCod));
      setEstado('ok');
      if (!resuelto?.normativa) setError(`Zona ${zonaCod ?? '—'} detectada SIN ficha oficial en normativas_prc — se muestran PARÁMETROS ESTIMADOS por defecto (verifique el PRC vigente antes de un expediente formal).`);
    } catch (err) {
      setEstado('sinDato');
      setError(err instanceof Error ? err.message : 'Error de coreografía espacial.');
    }
  };
  const limpiar = () => { setEstado('idle'); setError(null); setFicha(null); setZona(null); setAreaTerreno(null); };

  const guardarSuperficie = async () => {
    if (areaTerreno == null) return;
    const ok = await syncSuperficie(projectId, areaTerreno, 'DIMENSIONADOR');
    notify(ok ? 'Superficie del terreno sincronizada con el proyecto.' : 'Selecciona un proyecto activo primero.');
  };

  return (
    <div>
      <p className="tech-quote" style={{ marginBottom: 18 }}>
        Motor de inteligencia geoespacial. Punto o polígono del predio → intersección PRC con Turf.js en
        Web Worker → ficha normativa desde <strong>coordenadasnormativas</strong>.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
        {/* Parámetros */}
        <div className="tool-panel" style={{ flex: '1 1 320px', minWidth: 300, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| PARÁMETROS DE UBICACIÓN</div>
          <div className="panel-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>COMUNA</label>
              <input className="tech-input" value={comuna} disabled={readOnly} onChange={(e) => setComuna(e.target.value)} placeholder="Ej: Ñuñoa" />
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>DIRECCIÓN</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="tech-input" value={direccion} disabled={readOnly} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle N, Comuna" />
                <button className="technical-btn" style={{ padding: '0 15px' }} disabled={readOnly || !mapReady} onClick={buscarDireccion}>BUSCAR</button>
              </div>
            </div>
            <div className="tech-input-group" style={{ marginBottom: 0 }}>
              <label>COORDENADAS (LAT / LNG)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="tech-input" value={lat} disabled={readOnly} onChange={(e) => setLat(e.target.value)} placeholder="-33.45" />
                <input className="tech-input" value={lng} disabled={readOnly} onChange={(e) => setLng(e.target.value)} placeholder="-70.64" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 5 }}>ESTADO</div>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{estado === 'cargando' ? 'CRUZANDO...' : estado === 'ok' ? 'FICHA OK' : estado === 'sinDato' ? 'SIN DATO' : 'IDLE'}</div>
              </div>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, textAlign: 'center', background: zona ? 'var(--muted)' : 'var(--card)' }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 5 }}>ZONA PRC</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: zona ? 'var(--destructive)' : 'inherit' }}>{zona ?? 'NO DETECTADA'}</div>
              </div>
            </div>

            {areaTerreno != null && (
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>POLÍGONO: {areaTerreno.toLocaleString('es-CL')} m²</span>
                <button className="technical-btn secondary" style={{ fontSize: 10, padding: '4px 8px' }} disabled={readOnly} onClick={guardarSuperficie}>[ USAR COMO SUPERFICIE ]</button>
              </div>
            )}

            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="technical-btn" style={{ flex: 1, padding: 12 }} disabled={readOnly || estado === 'cargando'} onClick={intersectar}>
                {estado === 'cargando' ? '[ INTERSECTANDO... ]' : '[ INTERSECTAR NORMATIVA ]'}
              </button>
              <button className="technical-btn secondary" style={{ padding: 12 }} disabled={estado === 'cargando'} onClick={limpiar}>[ LIMPIAR ]</button>
            </div>
          </div>
        </div>

        {/* Visor */}
        <div className="tool-panel" style={{ flex: '2 1 560px', minWidth: 380, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| VISOR CARTOGRÁFICO (dibuja el polígono del predio)</div>
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

      <AnimatePresence>
        {estado === 'cargando' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tool-panel" style={{ marginTop: 20, padding: 30, textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 }}>
            <Icons.Loader size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Intersectando punto con la capa PRC y resolviendo ficha...
          </motion.div>
        )}
      </AnimatePresence>

      {error && estado !== 'cargando' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="tool-panel" style={{ marginTop: 20 }}>
          <div className="module-header" style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>| AVISO DE COREOGRAFÍA</div>
          <div className="panel-content" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Icons.AlertTriangle size={18} /> {error}
          </div>
        </motion.div>
      )}

      {ficha && estado === 'ok' && <ExpedienteNormativo n={ficha} zona={zona} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 180, right: 20, zIndex: 9999, background: 'var(--foreground)', color: 'var(--background)', padding: '10px 18px', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', border: '1.5px solid var(--border)' }}>{toast}</div>
      )}
    </div>
  );
}

/** Ficha desplegada, tolerante al esquema real de Firestore. */
function ExpedienteNormativo({ n, zona }: { n: NormativaPRC; zona: string | null }) {
  const celdas: Array<[string, string, boolean]> = [
    ['USOS PERMITIDOS', pick(n, ['usos_permitidos_txt', 'usosPermitidos', 'UPERM']), false],
    ['USOS PROHIBIDOS', pick(n, ['usos_prohibidos_txt', 'usosProhibidos', 'UPROH']), false],
    ['COEF. CONSTRUCTIBILIDAD', pick(n, ['coef_constructibilidad', 'constructibilidad']), true],
    ['COEF. OCUPACIÓN DE SUELO', pick(n, ['cos_primer_piso', 'coeficienteOcupacion']), true],
    ['ALTURA MÁXIMA', pick(n, ['altura_maxima_txt', 'alturaMaxima']), false],
    ['SISTEMA AGRUPAMIENTO', pick(n, ['sistema_agrupamiento_txt', 'sistemaAgrupamiento']), false],
    ['SUPERFICIE PREDIAL MÍN.', pick(n, ['superficie_predial_minima_txt', 'superficiePredialMinima']), false],
    ['ANTEJARDÍN MÍNIMO', pick(n, ['antejardin_txt', 'antejardin']), false],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="tool-panel" style={{ marginTop: 20 }}>
      <div className="module-header" style={{ background: 'var(--foreground)', color: 'var(--background)', borderBottom: 'none' }}>
        | EXPEDIENTE NORMATIVO: ZONA {pick(n, ['zona_codigo', 'zonaCodigo', 'ZONA']) === 'N/A' ? (zona ?? '—') : pick(n, ['zona_codigo', 'zonaCodigo', 'ZONA'])}
      </div>
      <div className="panel-content">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase' }}>{pick(n, ['zona_nombre', 'zonaNombre', 'NOM'])}</h2>
          <p style={{ opacity: 0.8, fontSize: 12, maxWidth: 800, marginTop: 10 }}>{pick(n, ['zona_descripcion', 'zonaDescripcion', 'OBS'])}</p>
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
