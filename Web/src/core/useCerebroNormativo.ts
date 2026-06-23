/* =============================================================================
   useCerebroNormativo.ts — Hook "Dos Cerebros" (v3 · Tintero #9)
   -----------------------------------------------------------------------------
   Cruza un punto (lat,lng) con la capa PRC BASE de la comuna y resuelve su ficha
   normativa. SIN Firestore ni Storage: la capa GeoJSON se carga vía GeoJsonService
   (Hosting /geo-data + caché IndexedDB) y la ficha desde los archivos locales
   (NormativaService → /norma-data). API estable: { isLoading, error, data }.
   Tolerancia: si el punto cae en un hueco de topología (borde de calle, sliver
   entre polígonos), se asigna la zona base MÁS CERCANA dentro de TOL_METROS.
   No se usan capas overlay (_AP/_R/seccionales): son restricciones, no zonas.
   ============================================================================= */
import { useState, useEffect } from 'react';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { pointToPolygonDistance } from '@turf/point-to-polygon-distance';
import { point } from '@turf/helpers';
import type { NormativaPRC } from './types';
import { loadComunaGeoJSON } from './GeoJsonService';
import { getNormativa, codigoZonaDeProperties } from './NormativaService';

const TOL_METROS = 30; // tolerancia de snap a la zona base más cercana (huecos de borde)

export function useCerebroNormativo(lat: number | null, lng: number | null, comuna: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NormativaPRC | null>(null);

  useEffect(() => {
    if (lat === null || lng === null || !comuna) return;
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);
      setData(null);
      try {
        // 1) Cerebro Espacial: capa PRC BASE (Hosting + IndexedDB) e intersección punto↔polígono.
        const geojson = await loadComunaGeoJSON(comuna);
        const pt = point([lng, lat]); // GeoJSON usa orden [lng, lat]
        let zona: string | null = null;
        let mejorDist = Infinity;
        let zonaCercana: string | null = null;
        for (const feature of geojson.features) {
          const t = feature.geometry?.type;
          if (t !== 'Polygon' && t !== 'MultiPolygon') continue;
          // Match exacto: punto dentro del polígono.
          if (booleanPointInPolygon(pt as never, feature as never)) {
            zona = codigoZonaDeProperties(feature.properties);
            break;
          }
          // Fallback: distancia a la zona base más cercana (para huecos de borde).
          const d = Math.abs(pointToPolygonDistance(pt as never, feature as never, { units: 'meters' }));
          if (d < mejorDist) { mejorDist = d; zonaCercana = codigoZonaDeProperties(feature.properties); }
        }
        // Si no hubo match exacto pero hay una zona base a < TOL_METROS, se usa (snap).
        if (!zona && zonaCercana && mejorDist <= TOL_METROS) zona = zonaCercana;
        if (!zona) throw new Error('El punto cae fuera de toda zona PRC de la comuna.');

        // 2) Cerebro Normativo: ficha desde archivos locales (/norma-data).
        const normativa = await getNormativa(comuna, zona);
        if (!normativa) throw new Error(`Zona ${zona} detectada, pero sin ficha local en /norma-data para ${comuna}.`);

        if (isMounted) setData(normativa);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error al procesar la normativa espacial.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [lat, lng, comuna]);

  return { isLoading, error, data };
}
