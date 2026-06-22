import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../core/firebase';
import { NormativaPRC } from '../core/types';
import { generarLlaveMaestra } from '../utils/geoUtils';
import { booleanPointInPolygon, point } from '@turf/turf';

// Caché en memoria para evitar volver a descargar el GeoJSON de una comuna en la misma sesión
const geoJsonCache: Record<string, any> = {};

export function useCerebroNormativo(lat: number | null, lng: number | null, comuna: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NormativaPRC | null>(null);

  useEffect(() => {
    // Si faltan parámetros clave, no hacemos nada aún
    if (lat === null || lng === null || !comuna) return;

    let isMounted = true;

    const descargarYCruzarGeoJSON = async () => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        // 1. Manejo de Caché & Descarga de Storage
        let geojson = geoJsonCache[comuna];
        if (!geojson) {
          const fileRef = ref(storage, `geojson/${comuna.toLowerCase()}.json`);
          const url = await getDownloadURL(fileRef);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error al descargar el archivo de ${comuna}`);
          
          geojson = await response.json();
          geoJsonCache[comuna] = geojson; // Guardamos en memoria
        }

        // 2. Cerebro Espacial: Cruzar coordenadas con polígonos
        const pt = point([lng, lat]); // turf usa formato [lng, lat]
        let codigoZonaCrudo: string | null = null;

        for (const feature of geojson.features) {
          if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
            if (booleanPointInPolygon(pt, feature)) {
              // Nota: Ajusta 'codigoZona' si la propiedad en tu GeoJSON se llama distinto (ej. 'ZONA', 'ID_ZONA')
              codigoZonaCrudo = feature.properties?.codigoZona || feature.properties?.ZONA;
              break;
            }
          }
        }

        if (!codigoZonaCrudo) {
          throw new Error('Punto fuera de polígono');
        }

        // 3. Middleware Traductor
        const llaveMaestra = generarLlaveMaestra(comuna, codigoZonaCrudo);

        // 4. Búsqueda de Normativa en Firestore
        const docRef = doc(db, 'normativas_prc', llaveMaestra);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Normativa no encontrada');
        }

        if (isMounted) setData(docSnap.data() as NormativaPRC);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error al procesar la normativa espacial');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    descargarYCruzarGeoJSON();

    return () => { isMounted = false; };
  }, [lat, lng, comuna]);

  return { isLoading, error, data };
}