/* MapaTerrenoView.tsx — F4.5 · Editor de Polígono de Terreno (T-08)
 *
 * Modo actual: SVG interactivo (mock sin Google Maps — bloqueado por H-F4.3).
 * Modo producción: reemplazar el SVG por <GoogleMap> y useGeoWorker() para área real.
 *
 * Flujo:
 *   1. Click en canvas SVG → agrega vértice al polígono
 *   2. "Cerrar" → dibuja el polígono completo y calcula área con fórmula de Shoelace
 *   3. "Guardar en proyecto" → llama onSaveTerreno(poligono, areaM2)
 *
 * Props:
 *   currentProject  — proyecto activo (nombre y datos básicos)
 *   onSaveTerreno   — callback que persiste el polígono+área al master §6
 *   triggerToast    — función de notificación del shell
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

// ── Dimensiones del canvas SVG ────────────────────────────────────────────────

const VW = 640, VH = 420;
// Escala mock: 1 unidad SVG ≈ 0.5 m (zona residencial urbana típica ~20×30 m)
const METERS_PER_UNIT = 0.5;

// ── Helpers matemáticos ───────────────────────────────────────────────────────

/** Fórmula de Shoelace (Gauss) — área de polígono en unidades SVG² */
function shoelaceArea(pts: { x: number; y: number }[]): number {
  const n = pts.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function areaM2(pts: { x: number; y: number }[]): number {
  return shoelaceArea(pts) * METERS_PER_UNIT * METERS_PER_UNIT;
}

function formatArea(m2: number): string {
  return m2.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Calcula el centroide del polígono para colocar la etiqueta de área */
function centroid(pts: { x: number; y: number }[]): { x: number; y: number } {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return { x: cx, y: cy };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  currentProject?: { id?: string; name?: string; destino?: string; region?: string; comuna?: string };
  onSaveTerreno?: (poligono: [number, number][], areaM2: number) => Promise<void>;
  triggerToast?: (message: string) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function MapaTerrenoView({
  currentProject,
  onSaveTerreno,
  triggerToast: propToast,
}: Props) {
  const [localToast, setLocalToast] = useState<string | null>(null);
  const toast = propToast ?? ((m: string) => {
    setLocalToast(m);
    window.setTimeout(() => setLocalToast(null), 2800);
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vertices, setVertices] = useState<{ x: number; y: number }[]>([]);
  const [closed, setClosed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Handlers SVG ───────────────────────────────────────────────────────────

  const svgPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) * (VW / rect.width)),
      y: Math.round((e.clientY - rect.top) * (VH / rect.height)),
    };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (closed) return;
    const pt = svgPoint(e);

    // Click cerca del primer vértice → cerrar polígono
    if (vertices.length >= 3) {
      const first = vertices[0];
      const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
      if (dist < 14) {
        setClosed(true);
        toast(`Polígono cerrado: ${formatArea(areaM2(vertices))} m²`);
        return;
      }
    }
    setVertices((prev) => [...prev, pt]);
    setSaved(false);
  };

  const handleReset = () => {
    setVertices([]);
    setClosed(false);
    setSaved(false);
  };

  const handleClose = () => {
    if (vertices.length < 3) { toast('Necesitas al menos 3 vértices para cerrar el polígono.'); return; }
    setClosed(true);
    toast(`Polígono cerrado: ${formatArea(areaM2(vertices))} m²`);
  };

  const handleSave = async () => {
    if (!closed || vertices.length < 3) { toast('Cierra el polígono antes de guardar.'); return; }
    const m2 = areaM2(vertices);
    setSaving(true);
    try {
      // Convertir a coordenadas geográficas mock (lat/lng centradas en Santiago)
      const LAT_CENTER = -33.45, LNG_CENTER = -70.65;
      const SCALE = METERS_PER_UNIT / 111_320; // 1 grado lat ≈ 111320 m
      const geoPolygon: [number, number][] = vertices.map((v) => [
        LNG_CENTER + (v.x - VW / 2) * SCALE,
        LAT_CENTER - (v.y - VH / 2) * SCALE,
      ]);
      if (onSaveTerreno) {
        await onSaveTerreno(geoPolygon, m2);
        setSaved(true);
        toast(`✓ Terreno guardado: ${formatArea(m2)} m²`);
      } else {
        // Mock fallback
        toast(`[Mock] Terreno: ${formatArea(m2)} m² (sin ProjectRepository conectado)`);
        setSaved(true);
      }
    } catch (err) {
      toast('Error al guardar el terreno. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Geometría SVG derivada ─────────────────────────────────────────────────

  const polyStr = vertices.map((v) => `${v.x},${v.y}`).join(' ');
  const area = closed ? areaM2(vertices) : 0;
  const c = closed && vertices.length >= 3 ? centroid(vertices) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="tool-panel">
      {/* Toast local */}
      <AnimatePresence>
        {localToast && (
          <motion.div className="ab-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <span className="dot">◈</span>{localToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: 'var(--border-thickness) solid var(--border)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
          <Icons.Map size={15} /> Mapa de Terreno
        </span>
        <span className="text-muted-foreground" style={{ fontSize: 10, fontFamily: 'monospace' }}>T-08</span>
        {currentProject?.name && (
          <span className="bg-muted text-muted-foreground" style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', border: 'var(--border-thickness) solid var(--border)', marginLeft: 4 }}>
            {currentProject.name}
          </span>
        )}
        <span className="bg-muted text-muted-foreground" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', marginLeft: 'auto', border: 'var(--border-thickness) solid var(--border)' }}>
          SVG mock · H-F4.3 pendiente
        </span>
      </div>

      <div className="panel-content" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Instrucciones */}
        <div className="bg-muted" style={{ padding: '8px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, border: 'var(--border-thickness) solid var(--border)' }}>
          <Icons.Info size={13} />
          {!closed
            ? vertices.length === 0
              ? 'Haz clic en el canvas para marcar los vértices del polígono. Cuando termines, haz clic cerca del primer punto (●) para cerrar.'
              : `${vertices.length} vértice${vertices.length > 1 ? 's' : ''} marcado${vertices.length > 1 ? 's' : ''}. Sigue dibujando o haz clic cerca del primer vértice (●) para cerrar.`
            : `Polígono cerrado — ${vertices.length} vértices · Superficie: ${formatArea(area)} m²`
          }
        </div>

        {/* Canvas SVG */}
        <div style={{ border: 'var(--border-thickness) solid var(--border)', overflow: 'hidden', cursor: closed ? 'default' : 'crosshair', position: 'relative', background: 'var(--card)' }}>
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${VW} ${VH}`}
            onClick={handleClick}
            style={{ display: 'block', maxHeight: 420 }}
          >
            {/* Grid de referencia */}
            <defs>
              <pattern id="grid-mt" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect width={VW} height={VH} fill="url(#grid-mt)" />

            {/* Escala visual */}
            <g transform={`translate(${VW - 120}, ${VH - 30})`}>
              <line x1="0" y1="0" x2="40" y2="0" stroke="var(--muted-foreground)" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--muted-foreground)" strokeWidth="1.5" />
              <line x1="40" y1="-4" x2="40" y2="4" stroke="var(--muted-foreground)" strokeWidth="1.5" />
              <text x="20" y="-7" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" fontFamily="monospace">20 m</text>
            </g>

            {/* Polígono cerrado (relleno) */}
            {closed && vertices.length >= 3 && (
              <polygon
                points={polyStr}
                fill="var(--primary)"
                fillOpacity="0.12"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}

            {/* Líneas del polígono abierto */}
            {!closed && vertices.length >= 2 && (
              <polyline
                points={polyStr}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeDasharray="6 3"
              />
            )}

            {/* Vértices */}
            {vertices.map((v, i) => (
              <g key={i}>
                {i === 0 ? (
                  <circle cx={v.x} cy={v.y} r={closed ? 5 : 8} fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
                ) : (
                  <circle cx={v.x} cy={v.y} r={4} fill="var(--primary)" stroke="var(--card)" strokeWidth="1.5" />
                )}
                <text x={v.x + 8} y={v.y - 5} fontSize="10" fill="var(--foreground)" fontFamily="monospace" fontWeight="bold">{i + 1}</text>
              </g>
            ))}

            {/* Etiqueta de área centrada */}
            {c && closed && (
              <g>
                <rect x={c.x - 52} y={c.y - 14} width={104} height={22} fill="var(--primary)" fillOpacity="0.85" rx="2" />
                <text x={c.x} y={c.y + 2} textAnchor="middle" fontSize="11" fill="var(--primary-foreground)" fontFamily="monospace" fontWeight="bold">
                  {formatArea(area)} m²
                </text>
              </g>
            )}

            {/* Indicador "modo edición" */}
            {!closed && (
              <text x={12} y={20} fontSize="10" fill="var(--muted-foreground)" fontFamily="monospace">EDICIÓN ACTIVA</text>
            )}
          </svg>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {!closed && vertices.length >= 3 && (
            <button className="ab-btn" onClick={handleClose}>
              <Icons.CheckCircle size={13} /> Cerrar polígono
            </button>
          )}
          {closed && (
            <button
              className="ab-btn"
              onClick={handleSave}
              disabled={saving || saved}
              style={{ opacity: (saving || saved) ? 0.7 : 1 }}
            >
              {saving
                ? <><Icons.Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
                : saved
                  ? <><Icons.Check size={13} /> Guardado</>
                  : <><Icons.Save size={13} /> Guardar en proyecto</>
              }
            </button>
          )}
          {vertices.length > 0 && (
            <button className="ab-btn sec" onClick={handleReset}>
              <Icons.RotateCcw size={13} /> Reiniciar
            </button>
          )}

          {/* Métricas */}
          {closed && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <div>
                <div className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>Superficie terreno</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>{formatArea(area)} m²</div>
              </div>
              <div>
                <div className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>Vértices</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>{vertices.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nota de producción */}
        <div className="text-muted-foreground" style={{ fontSize: 10, borderTop: 'var(--border-thickness) solid var(--border)', paddingTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <Icons.Lock size={11} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Modo productivo (BLOQUE IV · H-F4.3):</strong> Reemplaza el SVG por Google Maps con herramienta de dibujo de polígonos. El área se recalcula con <code>@turf/area</code> vía <code>geo.worker.ts</code> (§9). Requiere API Key Maps + billing activo.
          </span>
        </div>
      </div>
    </div>
  );
}
