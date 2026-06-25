/* =============================================================================
   ActiveSection — estado compartido de la "sección" activa del sitio.
   -----------------------------------------------------------------------------
   Une el navegador del header (ArchiblocksNav) con la carpeta del Binder
   (WorkspaceView). `section` es la carpeta del Binder (CarpetaId); `navNode` es
   el nodo marcado en el navegador. Mapas de equivalencia abajo.
   ============================================================================= */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CarpetaId } from '../types';

/** Nodo del navegador → carpeta del Binder. (edificio es ruta de Inicio, no carpeta.) */
export const NODE_SECTION: Record<string, CarpetaId> = {
  botonera: 1, terreno: 2, archivador: 3, permisos: 4, carpeta: 5, ductos: 5, libro: 5, galvano: 6,
};
/** Carpeta del Binder → nodo por defecto del navegador. */
export const SECTION_NODE: Record<number, string> = {
  0: 'edificio', 1: 'botonera', 2: 'terreno', 3: 'archivador', 4: 'permisos', 5: 'carpeta', 6: 'galvano',
};

interface Ctx {
  section: CarpetaId;
  navNode: string;
  /** desde el Binder (cambio de pestaña/carpeta) */
  setSection: (f: CarpetaId) => void;
  /** desde el navegador (clic en un nodo) */
  selectNode: (node: string) => void;
  /** desde rutas (Inicio/Admin) */
  setNavNode: (node: string) => void;
}

const ActiveSectionCtx = createContext<Ctx | null>(null);

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<CarpetaId>(0);
  const [navNode, setNavNode] = useState<string>('edificio');

  const setSection = (f: CarpetaId) => {
    setSectionState(f);
    setNavNode(SECTION_NODE[f] ?? '');
  };
  const selectNode = (node: string) => {
    setNavNode(node);
    const f = NODE_SECTION[node];
    if (typeof f === 'number') setSectionState(f);
  };

  return (
    <ActiveSectionCtx.Provider value={{ section, navNode, setSection, selectNode, setNavNode }}>
      {children}
    </ActiveSectionCtx.Provider>
  );
}

export function useActiveSection(): Ctx {
  const c = useContext(ActiveSectionCtx);
  if (!c) throw new Error('useActiveSection debe usarse dentro de <ActiveSectionProvider>');
  return c;
}
