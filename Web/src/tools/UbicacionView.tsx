/* =============================================================================
   UbicacionView.tsx — UBICACIÓN DEL PROYECTO (T-04b)  ·  + Mapa de Terreno (T-08)
   -----------------------------------------------------------------------------
   Ubicación administrativa (región, comuna, calle+número, rol SII) y, debajo, el
   MAPA DE TERRENO integrado (antes herramienta aparte): dibujo del polígono +
   cálculo de superficie con el Web Worker (Turf). Sincronización AL GUARDAR:
     · superficieTerrenoLegal ↔ Datos del Proyecto (mismo campo del ProjectMaster).
     · superficieCalculada (ÁREA CALCULADA) se guarda junto a la legal.
     · El polígono comparte clave de disco con el Geolocalizador (ab-mapa-terreno-*):
       editar uno edita el otro (se relee al abrir).
   ============================================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { getRegionesSorted, getComunasPorRegionSorted } from '../core/data-chile';
import type { ToolProps, ProjectMaster } from '../core/types';

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-ubicacion-${pid}`;
const TERRENO_KEY = (pid: string) => `ab-mapa-terreno-${pid}`; // COMPARTIDA con Geolocalizador
const REGIONES = getRegionesSorted();
const DEFAULT_CENTER = { lat: -33.4569, lng: -70.6483 };
const MAPS_KEY = ((import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) ?? '';

/* eslint-disable @typescript-eslint/no-explicit-any */
type MapsAny = any;
interface WorkerArea { id: number; ok: boolean; areaM2: number; error?: string; }
interface TerrenoGuardado { ring: Array<[number, number]>; areaM2: number; }

/* Estilo SIMPLE blanco y negro (igual que el Geolocalizador). */
const MAP_STYLE_BW: MapsAny = [
  { elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: 18 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', stylers: [{ saturation: -100 }, { lightness: 30 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: -10 }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: 0 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#2b2b2b' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
];

/** Separa "Armando Carrera 5148" → { calle: "Armando Carrera", numero: "5148" }. */
function splitDireccion(d: string): { calle: string; numero: string } {
  const m = d.trim().match(/^(.*?)[\s,]+(\d+\S*)$/);
  if (m && m[1]) return { calle: m[1].trim(), numero: (m[2] ?? '').trim() };
  return { calle: d.trim(), numero: '' };
}

/* ── componente principal ──────────────────────────────────────────────────── */
export default function UbicacionView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, repo, reload } = useProjects();
  const { triggerToast } = useToast();
  const project = getProject(projectId);

  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [rol, setRol] = useState('');
  const [supLegal, setSupLegal] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── terreno (mapa + área) ── */
  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [areaManual, setAreaManual] = useState('');
  const ringRef = useRef<Array<[number, number]>>([]);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapsAny>(null);
  const polygonRef = useRef<MapsAny>(null);
  const geocoderRef = useRef<MapsAny>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  /* ── Web Worker (cálculo de área) ── */
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

  /* ── carga inicial ── */
  useEffect(() => {
    if (!project) return;
    setComuna(project.comuna || '');
    const { calle: c, numero: n } = splitDireccion(project.direccion || '');
    setCalle(c); setNumero(n);
    setRol(project.rol || '');
    setSupLegal(project.superficieTerrenoLegal || '');
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try { setRegion((JSON.parse(raw) as { region?: string }).region ?? ''); }
      catch { /* datos corruptos — ignorar */ }
    } else setRegion('');
    // Terreno guardado (clave compartida).
    const rawT = localStorage.getItem(TERRENO_KEY(project.id));
    if (rawT) {
      try {
        const d = JSON.parse(rawT) as TerrenoGuardado;
        ringRef.current = d.ring ?? [];
        setAreaM2(d.areaM2 ?? (project.superficieCalculada ? Number(project.superficieCalculada) : null));
      } catch { ringRef.current = []; setAreaM2(project.superficieCalculada ? Number(project.superficieCalculada) : null); }
    } else {
      ringRef.current = [];
      setAreaM2(project.superficieCalculada ? Number(project.superficieCalculada) : null);
    }
  }, [project?.id]);

  /* ── Google Maps (degradación a manual) ── */
  const centrarEnDireccion = useCallback(() => {
    const g = geocoderRef.current; const map = mapRef.current;
    if (!g || !map) return;
    const q = [calle, numero, comuna, 'Chile'].filter(Boolean).join(', ');
    if (!q.replace(/Chile|,|\s/g, '')) return;
    g.geocode({ address: q }, (res: MapsAny, status: string) => {
      if (status === 'OK' && res?.[0]) { map.setCenter(res[0].geometry.location); map.setZoom(18); }
    });
  }, [calle, numero, comuna]);

  useEffect(() => {
    let cancelled = false;
    if (!MAPS_KEY) { setMapsError('Falta la API Key de Google Maps (VITE_GOOGLE_MAPS_API_KEY). Ingresa la superficie manualmente.'); return; }
    (window as MapsAny).gm_authFailure = () => setMapsError('Google Maps rechazó la API Key: habilita "Maps JavaScript API", activa la facturación y permite este dominio. Mientras tanto, ingresa la superficie manualmente.');
    (async () => {
      try {
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
        setOptions({ key: MAPS_KEY, v: 'weekly' });
        const mapsLib: MapsAny = await importLibrary('maps');
        const geoLib: MapsAny = await importLibrary('geocoding');
        if (cancelled || !mapDivRef.current) return;

        const map: MapsAny = new mapsLib.Map(mapDivRef.current, {
          center: DEFAULT_CENTER, zoom: 17, mapTypeId: 'roadmap', styles: MAP_STYLE_BW,
          disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
        });
        mapRef.current = map;
        geocoderRef.current = new geoLib.Geocoder();

        const polygon: MapsAny = new mapsLib.Polygon({
          map, editable: !readOnly,
          fillColor: '#111111', fillOpacity: 0.14, strokeColor: '#111111', strokeWeight: 2,
        });
        polygonRef.current = polygon;
        const gmaps: MapsAny = (window as MapsAny).google;
        if (!readOnly) map.addListener('click', (e: MapsAny) => { if (e.latLng) polygon.getPath().push(e.latLng); });

        const recomputeArea = async () => {
          const path: MapsAny = polygon.getPath();
          const ring: Array<[number, number]> = [];
          const len: number = path.getLength();
          for (let i = 0; i < len; i++) { const p = path.getAt(i); ring.push([p.lng(), p.lat()]); }
          ringRef.current = ring;
          if (len < 3) { setAreaM2(null); return; }
          const r = await callWorker<WorkerArea>({ op: 'area', ring });
          if (r.ok) {
            setAreaM2(r.areaM2);
            // Persiste en la clave COMPARTIDA: el Geolocalizador lo redibuja al abrir.
            if (project) { try { localStorage.setItem(TERRENO_KEY(project.id), JSON.stringify({ ring, areaM2: r.areaM2 } satisfies TerrenoGuardado)); } catch { /* ignore */ } }
          }
        };
        const pPath: MapsAny = polygon.getPath();
        gmaps.maps.event.addListener(pPath, 'insert_at', recomputeArea);
        gmaps.maps.event.addListener(pPath, 'set_at', recomputeArea);
        gmaps.maps.event.addListener(pPath, 'remove_at', recomputeArea);

        // Redibuja el polígono guardado (clave compartida) y lo encuadra.
        const saved = ringRef.current;
        if (saved.length >= 3) {
          polygon.setPath(saved.map(([ln, la]) => ({ lat: la, lng: ln })));
          const bounds = new gmaps.maps.LatLngBounds();
          saved.forEach(([ln, la]) => bounds.extend({ lat: la, lng: ln }));
          map.fitBounds(bounds);
        }
        setMapReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMapsError(`No se pudo iniciar Google Maps (${msg}). Ingresa la superficie manualmente.`);
      }
    })();
    return () => { cancelled = true; };
  }, [readOnly, callWorker, project?.id]);

  useEffect(() => {
    if (mapReady && ringRef.current.length < 3) centrarEnDireccion();
  }, [mapReady, centrarEnDireccion]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para definir su ubicación.</p></div>
  );

  const limpiar = () => {
    if (readOnly) return;
    polygonRef.current?.getPath()?.clear();
    ringRef.current = [];
    setAreaM2(null);
    setAreaManual('');
    centrarEnDireccion();
    triggerToast('Polígono limpiado. Vuelve a dibujar sobre el mapa.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify({ region }));
      const direccion = [calle.trim(), numero.trim()].filter(Boolean).join(' ');
      const area = areaM2 ?? (areaManual ? Number(areaManual) : null);
      const updated: ProjectMaster = {
        ...project,
        comuna, direccion, rol,
        superficieTerrenoLegal: supLegal,
        superficieCalculada: area != null && !Number.isNaN(area) ? String(area) : project.superficieCalculada,
      };
      if (area != null && !Number.isNaN(area)) {
        try { localStorage.setItem(TERRENO_KEY(project.id), JSON.stringify({ ring: ringRef.current, areaM2: area } satisfies TerrenoGuardado)); } catch { /* ignore */ }
      }
      await repo.save(updated);
      await reload();
      triggerToast('Ubicación y terreno guardados correctamente.');
    } catch {
      triggerToast('Error al guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Navigation size={22} strokeWidth={1.4} /> Ubicación del Proyecto
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Ubicación administrativa y terreno (se complementa con el Geolocalizador).
      </p>

      <form onSubmit={handleSave} className="tool-panel">
        <div className="module-header">| LOCALIZACIÓN ADMINISTRATIVA</div>
        <div className="panel-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15 }}>
            <div className="tech-input-group">
              <label>Región</label>
              <select className="tech-select" value={region} disabled={readOnly} onChange={e => { setRegion(e.target.value); setComuna(''); }}>
                <option value="">Seleccione...</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="tech-input-group">
              <label>Comuna</label>
              <input className="tech-input" value={comuna} disabled={readOnly} onChange={e => setComuna(e.target.value)} placeholder="Ej: Ñuñoa" list="ab-comunas-datalist" />
              <datalist id="ab-comunas-datalist">{region && getComunasPorRegionSorted(region).map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="tech-input-group"><label>Calle</label><input className="tech-input" value={calle} disabled={readOnly} onChange={e => setCalle(e.target.value)} placeholder="Ej: Armando Carrera" /></div>
            <div className="tech-input-group"><label>Número</label><input className="tech-input" value={numero} disabled={readOnly} onChange={e => setNumero(e.target.value)} placeholder="Ej: 5148" /></div>
            <div className="tech-input-group"><label>Rol SII</label><input className="tech-input" value={rol} disabled={readOnly} onChange={e => setRol(e.target.value)} placeholder="000-00" /></div>
            <div className="tech-input-group"><label>Superficie Terreno Legal (Escritura) m²</label><input type="number" className="tech-input" value={supLegal} disabled={readOnly} onChange={e => setSupLegal(e.target.value)} placeholder="Ej: 320" /></div>
            <div className="tech-input-group">
              <label>Área Calculada (terreno) m²</label>
              <input className="tech-input" value={areaM2 != null ? areaM2.toLocaleString('es-CL') : ''} readOnly disabled placeholder="Se calcula en el mapa" style={{ fontWeight: 'bold', color: 'var(--destructive)' }} />
            </div>
          </div>

          {/* ── TERRENO: mapa grande + controles compactos ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch', marginTop: 16 }}>
            <div style={{ flex: '3 1 560px', minWidth: 320, minHeight: 360, position: 'relative', border: '2px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div ref={mapDivRef} style={{ width: '100%', height: '100%', minHeight: 360, display: mapsError ? 'none' : 'block' }} />
              {mapsError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center', background: 'var(--muted)' }}>
                  <Icons.MapPinOff size={28} style={{ opacity: 0.5 }} />
                  <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>Visor de mapa no disponible</div>
                  <div style={{ fontSize: 10, opacity: 0.7, maxWidth: 320 }}>{mapsError}</div>
                </div>
              )}
            </div>
            <div style={{ flex: '1 1 150px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6, textTransform: 'uppercase' }}>Terreno (polígono)</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Dibuja clic a clic sobre el mapa; el área se calcula con Turf.js y se guarda al presionar Guardar Sección.</span>
              {mapsError && (
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label>Superficie manual (m²)</label>
                  <input type="number" className="tech-input" value={areaManual} disabled={readOnly} onChange={(e) => setAreaManual(e.target.value)} placeholder="Ej: 320" />
                </div>
              )}
              <button type="button" className="technical-btn secondary" style={{ fontSize: 10, padding: '6px 8px' }} disabled={readOnly || !mapReady} onClick={limpiar}>
                <Icons.Eraser size={12} style={{ marginRight: 6 }} /> [ LIMPIAR ]
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving || readOnly} className="technical-btn" style={{ marginTop: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {saving ? '⎔' : <Icons.Save size={14} />} [ GUARDAR SECCIÓN ]
          </button>
        </div>
      </form>
    </motion.div>
  );
}
