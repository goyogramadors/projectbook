/* =============================================================================
   MapaTerrenoView.tsx — MAPA DE TERRENO (T-08)
   -----------------------------------------------------------------------------
   Dibujo del polígono del terreno sobre Google Maps y cálculo de su superficie
   con el Web Worker (Turf area, fuera del hilo principal). El polígono se archiva
   en localStorage (ab-mapa-terreno-${projectId}); la superficie puede sincronizarse
   al ProjectMaster vía useDimensionadorSync (superficieCalculada, CONST §6). Si no
   hay API Key de Maps, degrada a ingreso manual de la superficie.
   ============================================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { useToast } from '../core/ui/ToastProvider';
import { useDimensionadorSync } from '../hooks/useDimensionadorSync';
import type { ToolProps } from '../core/types';

const DEFAULT_CENTER = { lat: -33.4569, lng: -70.6483 };
const MAPS_KEY = ((import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) ?? '';
const STORAGE_KEY = (pid: string) => `ab-mapa-terreno-${pid}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
type MapsAny = any;
interface WorkerArea { id: number; ok: boolean; areaM2: number; error?: string; }
interface TerrenoGuardado { ring: Array<[number, number]>; areaM2: number; }

export default function MapaTerrenoView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const { triggerToast } = useToast();
  const { syncSuperficie } = useDimensionadorSync();
  const project = getProject(projectId);

  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [areaManual, setAreaManual] = useState('');
  const ringRef = useRef<Array<[number, number]>>([]);

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

  /* ── carga del polígono guardado ── */
  useEffect(() => {
    if (!project) return;
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        const d = JSON.parse(raw) as TerrenoGuardado;
        ringRef.current = d.ring ?? [];
        setAreaM2(d.areaM2 ?? null);
      } catch { /* datos corruptos — ignorar */ }
    } else {
      ringRef.current = []; setAreaM2(null);
    }
  }, [project?.id]);

  /* ── Google Maps con dibujo de polígono ── */
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!MAPS_KEY) { setMapsError('Falta la API Key de Google Maps (VITE_GOOGLE_MAPS_API_KEY en .env.local). Mientras tanto, ingresa la superficie manualmente.'); return; }
    // Google llama a gm_authFailure cuando la clave es rechazada (API no habilitada,
    // facturación inactiva o dominio/localhost no permitido en las restricciones).
    (window as MapsAny).gm_authFailure = () => setMapsError('Google Maps rechazó la API Key: en Google Cloud habilita "Maps JavaScript API", activa la facturación y permite este dominio (o localhost) en las restricciones de la clave. Mientras tanto, ingresa la superficie manualmente.');
    (async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader: MapsAny = new Loader({ apiKey: MAPS_KEY, version: 'weekly' });
        const mapsLib: MapsAny = await loader.importLibrary('maps');
        const drawingLib: MapsAny = await loader.importLibrary('drawing');
        if (cancelled || !mapDivRef.current) return;

        const map: MapsAny = new mapsLib.Map(mapDivRef.current, { center: DEFAULT_CENTER, zoom: 17, mapTypeId: 'hybrid' });
        const dm: MapsAny = new drawingLib.DrawingManager({
          drawingMode: null,
          drawingControl: !readOnly,
          drawingControlOptions: { drawingModes: ['polygon'] },
          polygonOptions: { fillColor: '#D32F2F', fillOpacity: 0.18, strokeColor: '#D32F2F', strokeWeight: 2, editable: true },
        });
        dm.setMap(map);
        const gmaps: MapsAny = (window as MapsAny).google;
        gmaps.maps.event.addListener(dm, 'polygoncomplete', async (poly: MapsAny) => {
          const path = poly.getPath();
          const ring: Array<[number, number]> = [];
          for (let i = 0; i < path.getLength(); i++) { const p = path.getAt(i); ring.push([p.lng(), p.lat()]); }
          ringRef.current = ring;
          const r = await callWorker<WorkerArea>({ op: 'area', ring });
          if (r.ok) { setAreaM2(r.areaM2); triggerToast(`Superficie del terreno: ${r.areaM2.toLocaleString('es-CL')} m².`); }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMapsError(`No se pudo iniciar Google Maps (${msg}). Revisa en Google Cloud que "Maps JavaScript API" esté habilitada y la facturación activa. Ingresa la superficie manualmente.`);
      }
    })();
    return () => { cancelled = true; };
  }, [readOnly, callWorker, triggerToast]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para dibujar el terreno.</p></div>
  );

  const guardarLocal = () => {
    if (readOnly) return;
    const area = areaM2 ?? (areaManual ? Number(areaManual) : null);
    if (area == null || Number.isNaN(area)) { triggerToast('No hay superficie que guardar.'); return; }
    localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify({ ring: ringRef.current, areaM2: area } satisfies TerrenoGuardado));
    setAreaM2(area);
    triggerToast('Polígono y superficie guardados localmente.');
  };

  const sincronizarMaster = async () => {
    if (readOnly) return;
    const area = areaM2 ?? (areaManual ? Number(areaManual) : null);
    if (area == null || Number.isNaN(area)) { triggerToast('No hay superficie que sincronizar.'); return; }
    const ok = await syncSuperficie(projectId, area, 'DIMENSIONADOR');
    triggerToast(ok ? 'Superficie sincronizada con el proyecto (Ficha).' : 'No se pudo sincronizar.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.Map size={22} strokeWidth={1.4} /> Mapa de Terreno
      </h1>
      <p className="tech-quote" style={{ marginBottom: 18 }}>
        Proyecto: <strong>{project.name}</strong> · Dibuja el polígono del terreno; el área se calcula con Turf.js en un Web Worker.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
        <div className="tool-panel" style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| SUPERFICIE DEL TERRENO</div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, textAlign: 'center', background: 'var(--muted)' }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.6 }}>ÁREA CALCULADA</div>
              <div style={{ fontSize: 26, fontWeight: 'bold', color: 'var(--destructive)' }}>
                {areaM2 != null ? areaM2.toLocaleString('es-CL') : '—'} <span style={{ fontSize: 13 }}>m²</span>
              </div>
            </div>

            {mapsError && (
              <div className="tech-input-group" style={{ marginBottom: 0 }}>
                <label>SUPERFICIE MANUAL (m²)</label>
                <input type="number" className="tech-input" value={areaManual} disabled={readOnly} onChange={(e) => setAreaManual(e.target.value)} placeholder="Ej: 320" />
              </div>
            )}

            <button className="technical-btn secondary" disabled={readOnly} onClick={guardarLocal}>[ GUARDAR POLÍGONO ]</button>
            <button className="technical-btn" disabled={readOnly} onClick={sincronizarMaster}>
              <Icons.Save size={14} style={{ marginRight: 6 }} /> [ SINCRONIZAR SUPERFICIE AL PROYECTO ]
            </button>
            <p style={{ fontSize: 10, opacity: 0.6 }}>
              Sincronizar fija <strong>superficieCalculada</strong> y <strong>superficieOrigen='DIMENSIONADOR'</strong> en el master (CONST §6).
            </p>
          </div>
        </div>

        <div className="tool-panel" style={{ flex: '2 1 520px', minWidth: 360, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          <div className="module-header">| VISOR DE DIBUJO (polígono del predio)</div>
          <div className="panel-content" style={{ padding: 0, position: 'relative', flexGrow: 1, minHeight: 480 }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '100%', minHeight: 480, display: mapsError ? 'none' : 'block' }} />
            {mapsError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30, textAlign: 'center', background: 'var(--muted)' }}>
                <Icons.MapPinOff size={32} style={{ opacity: 0.5 }} />
                <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Visor de mapa no disponible</div>
                <div style={{ fontSize: 11, opacity: 0.7, maxWidth: 360 }}>{mapsError}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
