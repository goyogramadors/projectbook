/**
 * geo.worker.ts — F4.1 · Web Worker Turf.js (Constitución §9)
 *
 * CONST §9: el bucle de punto-en-polígono NUNCA corre en el hilo principal.
 * Protocolo: GeoWorkerRequest → GeoWorkerResponse (ver src/core/types.ts)
 *
 * Dependencias: @turf/boolean-point-in-polygon, @turf/area
 * (sub-paquetes para tree-shaking; no importar @turf/turf completo)
 */

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import area from '@turf/area';
import { point } from '@turf/helpers';
import type { GeoWorkerRequest, GeoWorkerResponse } from '../core/types';

// ── Handler principal ─────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<GeoWorkerRequest>) => {
  const { type, id, lat, lng, geojson } = e.data;

  if (type === 'PUNTO_EN_ZONA') {
    try {
      const pt = point([lng, lat]); // GeoJSON usa [lng, lat]

      for (const feature of geojson.features) {
        if (
          feature.geometry.type !== 'Polygon' &&
          feature.geometry.type !== 'MultiPolygon'
        ) continue;

        if (booleanPointInPolygon(pt, feature as any)) {
          const response: GeoWorkerResponse = {
            type: 'ZONA_ENCONTRADA',
            id,
            zona: feature.properties?.['ZONA'] ?? feature.properties?.['zona'] ?? 'SIN_NOMBRE',
            properties: feature.properties ?? {},
          };
          self.postMessage(response);
          return;
        }
      }

      // No se encontró zona que contenga el punto
      self.postMessage({ type: 'ZONA_NO_ENCONTRADA', id } as GeoWorkerResponse);
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        id,
        error: err instanceof Error ? err.message : String(err),
      } as GeoWorkerResponse);
    }
  }
};

/** Calcula el área en m² de un FeatureCollection (llamada adicional opcional) */
export function calcularAreaM2(geojson: GeoJSON.Feature): number {
  return area(geojson as any);
}
