/* =============================================================================
   PRODUCTO (host-aware) — F-LDO 1
   -----------------------------------------------------------------------------
   El mismo build sirve dos productos sobre el mismo backend:
     · archiblocks  → archibots.cl (experiencia completa)
     · librodeobra  → librodeobra.archibots.cl (solo Libro de Obras + Carpeta Digital)

   El producto se deriva del HOSTNAME en tiempo de carga del módulo. Para pruebas
   en local / *.pages.dev se admite override por query (?product=librodeobra) que
   se persiste en localStorage para sobrevivir a la navegación SPA.
   ============================================================================= */

export type ProductId = 'archiblocks' | 'librodeobra';

export interface ProductConfig {
  id:       ProductId;
  brandTop: string;   // marca en la barra superior
  brandPro: string;   // parte resaltada (rojo) de la marca
  brandSub: string;   // línea pequeña bajo la marca
  /** Whitelist de toolIds visibles; null = todas (Archiblocks). */
  toolset:  string[] | null;
  /** Etiqueta de la unidad de trabajo (Proyecto vs Obra). */
  unit:     { singular: string; plural: string };
}

const CONFIGS: Record<ProductId, ProductConfig> = {
  archiblocks: {
    id: 'archiblocks',
    brandTop: 'Archi', brandPro: 'blocks',
    brandSub: 'Gestión documental y digital de proyectos',
    toolset: null,
    unit: { singular: 'Proyecto', plural: 'Proyectos' },
  },
  librodeobra: {
    id: 'librodeobra',
    brandTop: 'Libro de Obra ', brandPro: 'Digital',
    brandSub: 'un producto de Archiblocks',
    toolset: ['libro-obras', 'carpeta-digital'],
    unit: { singular: 'Obra', plural: 'Obras' },
  },
};

const LS_KEY = 'ab.product.override';

function resolveId(): ProductId {
  // 1) Override por query (?product=...) — persiste para la sesión SPA.
  try {
    const qs = new URLSearchParams(window.location.search);
    const q = qs.get('product');
    if (q === 'archiblocks' || q === 'librodeobra') {
      window.localStorage.setItem(LS_KEY, q);
      return q;
    }
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved === 'archiblocks' || saved === 'librodeobra') return saved;
  } catch { /* SSR / storage bloqueado: cae a hostname */ }

  // 2) Hostname: librodeobra.* → librodeobra.
  const host = (typeof window !== 'undefined' ? window.location.hostname : '').toLowerCase();
  if (host.startsWith('librodeobra.') || host === 'librodeobra.cl') return 'librodeobra';
  return 'archiblocks';
}

/** Producto resuelto una sola vez por carga de módulo. */
export const PRODUCT: ProductConfig = CONFIGS[resolveId()];

export const isLibroDeObra = PRODUCT.id === 'librodeobra';

/** ¿La herramienta es visible en el producto actual? */
export function toolAllowed(toolId: string): boolean {
  return PRODUCT.toolset === null || PRODUCT.toolset.includes(toolId);
}
