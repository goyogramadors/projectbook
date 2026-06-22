/**
 * useGeoWorker.ts — Hook React para consumir geo.worker.ts (F4.1)
 *
 * Uso:
 *   const { buscarZona, loading, error } = useGeoWorker();
 *   const resultado = await buscarZona(lat, lng, geojson);
 */

import { useRef, useCallback, useState } from 'react';
import type { GeoWorkerResponse } from '../core/types';

type ZonaResult = { zona: string; properties: Record<string, unknown> } | null;

export function useGeoWorker() {
  const workerRef  = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (r: ZonaResult) => void; reject: (e: Error) => void }>>(new Map());
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  // Inicializar worker de forma lazy
  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/geo.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current.onmessage = (e: MessageEvent<GeoWorkerResponse>) => {
        const { type, id, zona, properties, error: wErr } = e.data;
        const pending = pendingRef.current.get(id);
        if (!pending) return;
        pendingRef.current.delete(id);

        if (type === 'ZONA_ENCONTRADA') {
          pending.resolve({ zona: zona!, properties: properties ?? {} });
        } else if (type === 'ZONA_NO_ENCONTRADA') {
          pending.resolve(null);
        } else {
          pending.reject(new Error(wErr ?? 'Worker error'));
        }
      };
    }
    return workerRef.current;
  }

  const buscarZona = useCallback((
    lat: number,
    lng: number,
    geojson: GeoJSON.FeatureCollection,
  ): Promise<ZonaResult> => {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, {
        resolve: (r) => { setLoading(false); resolve(r); },
        reject:  (e) => { setLoading(false); setError(e.message); reject(e); },
      });
      try {
        getWorker().postMessage({ type: 'PUNTO_EN_ZONA', id, lat, lng, geojson });
      } catch (e) {
        pendingRef.current.delete(id);
        setLoading(false);
        reject(e);
      }
    });
  }, []);

  const terminar = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingRef.current.clear();
  }, []);

  return { buscarZona, loading, error, terminar };
}
