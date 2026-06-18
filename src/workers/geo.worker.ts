/// <reference lib="webworker" />
/* =============================================================================
   geo.worker.ts — CEREBRO ESPACIAL (Web Worker dedicado) · CONST §9
   -----------------------------------------------------------------------------
   El cálculo geométrico pesado NUNCA corre en el hilo principal. Importa SOLO los
   sub-paquetes de Turf que usa (tree-shaking real): boolean-point-in-polygon +
   area + helpers. El componente envía un mensaje por postMessage y recibe el
   resultado; React nunca se congela.

   Contrato de mensajes (op opcional, por defecto 'intersect'):
     IN  intersect : { id, op?:'intersect', lat, lng, geojson:FeatureCollection|Feature }
     OUT intersect : { id, ok:true, feature:{ properties } | null, areaM2:number | null }
     IN  area      : { id, op:'area', ring:[number,number][] }   // anillo [lng,lat]
     OUT area      : { id, ok:true, feature:null, areaM2:number }
     OUT error     : { id, ok:false, error:string }
   ============================================================================= */
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { area } from '@turf/area';
import { point, polygon as turfPolygon } from '@turf/helpers';

type AnyFeature = { geometry?: { type?: string }; properties?: Record<string, unknown> };

interface MsgBase { id: number; op?: 'intersect' | 'area'; }
interface MsgIntersect extends MsgBase { lat: number; lng: number; geojson: unknown; }
interface MsgArea extends MsgBase { op: 'area'; ring: Array<[number, number]>; }

function post(payload: Record<string, unknown>) {
  (self as unknown as Worker).postMessage(payload);
}

/** Cierra el anillo si el primer y último vértice no coinciden (requisito GeoJSON). */
function cerrarAnillo(ring: Array<[number, number]>): Array<[number, number]> {
  if (ring.length < 3) return ring;
  const a = ring[0]; const b = ring[ring.length - 1];
  return a && b && a[0] === b[0] && a[1] === b[1] ? ring : [...ring, ring[0] as [number, number]];
}

self.onmessage = (e: MessageEvent) => {
  const data = (e.data ?? {}) as MsgBase;
  const id = data.id;
  try {
    /* ── OP: área de un polígono dibujado ─────────────────────────────────── */
    if (data.op === 'area') {
      const { ring } = data as MsgArea;
      if (!Array.isArray(ring) || ring.length < 3) throw new Error('Polígono con menos de 3 vértices.');
      const poly = turfPolygon([cerrarAnillo(ring)]);
      post({ id, ok: true, feature: null, areaM2: Math.round(area(poly)) });
      return;
    }

    /* ── OP: intersección punto → polígono PRC (por defecto) ──────────────── */
    const { lat, lng, geojson } = data as MsgIntersect;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error('Coordenadas inválidas.');
    }

    const g = geojson as { type?: string; features?: AnyFeature[] } | AnyFeature | null;
    const features: AnyFeature[] =
      g && (g as { type?: string }).type === 'FeatureCollection' && Array.isArray((g as { features?: AnyFeature[] }).features)
        ? ((g as { features: AnyFeature[] }).features)
        : g && Array.isArray((g as { features?: AnyFeature[] }).features)
          ? ((g as { features: AnyFeature[] }).features)
          : g ? [g as AnyFeature]
            : [];

    if (!features.length) throw new Error('GeoJSON sin features.');

    const pt = point([lng, lat]); // GeoJSON usa orden [lng, lat]
    let hit: AnyFeature | null = null;
    for (const f of features) {
      const t = f?.geometry?.type;
      if (t !== 'Polygon' && t !== 'MultiPolygon') continue;
      if (booleanPointInPolygon(pt as never, f as never)) { hit = f; break; }
    }

    if (!hit) { post({ id, ok: true, feature: null, areaM2: null }); return; }

    let areaM2: number | null = null;
    try { areaM2 = Math.round(area(hit as never)); } catch { areaM2 = null; }
    post({ id, ok: true, feature: { properties: hit.properties ?? {} }, areaM2 });
  } catch (err) {
    post({ id, ok: false, error: err instanceof Error ? err.message : 'Error en el cerebro espacial.' });
  }
};

export {};
