/* =============================================================================
   ArchiblocksNav — logo interactivo + navegador del header (elemento separado).
   -----------------------------------------------------------------------------
   La escena (SVG + estilos) vive en `archiblocks-scene.html` (editable aparte) y
   se inyecta como markup. El comportamiento se conecta a React por DELEGACIÓN de
   eventos sobre el contenedor (robusto frente al innerHTML inyectado):
     · `active`   → nodo marcado (sincronizado con la sección actual del sitio).
     · `dark`     → invierte la paleta para fundirse con barra oscura/clara.
     · `onSelect` → se dispara al hacer clic/Enter en un nodo (9 accesos directos).
   Los 9 nodos: edificio=Inicio · botonera=Datos Proyecto · terreno=Terreno ·
   archivador=Proyecto · permisos=Permisos · carpeta=Carpeta Digital · ductos=Obra ·
   libro=Libro de Obra · galvano=Admin.
   ============================================================================= */
import { useCallback, useEffect, useRef } from 'react';
import sceneArchiblocks from './archiblocks-scene.html?raw';
import sceneLibroDeObra from './librodeobra-scene.html?raw';

export const NODE_LABEL: Record<string, string> = {
  edificio: 'Inicio', terreno: 'Terreno', permisos: 'Permisos', carpeta: 'Carpeta Digital',
  botonera: 'Datos Proyecto', ductos: 'Obra', galvano: 'Admin', archivador: 'Proyecto', libro: 'Libro de Obra', db: 'Carpeta Digital',
};

/** Nodo más cercano (el <g data-node>) a partir del objetivo del evento. */
function nodeKeyFrom(target: EventTarget | null): string | null {
  const el = target as Element | null;
  const g = el?.closest?.('[data-node]');
  return g ? g.getAttribute('data-node') : null;
}

export default function ArchiblocksNav({ active, dark = true, onSelect, allowed, scene = 'archiblocks' }: {
  active?: string;
  dark?: boolean;
  onSelect?: (node: string) => void;
  /** Lista blanca de nodos visibles (F-LDO 3). undefined = todos los de la escena. */
  allowed?: string[];
  /** Qué Block (escena) inyectar: completo (Archiblocks) o reducido (Libro de Obra). */
  scene?: 'archiblocks' | 'librodeobra';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sceneHtml = scene === 'librodeobra' ? sceneLibroDeObra : sceneArchiblocks;

  /** Pinta el nodo/línea activos y la etiqueta isométrica con el nombre de sección. */
  const paint = useCallback((k?: string) => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll('.ab-node.active').forEach((n) => n.classList.remove('active'));
    root.querySelectorAll('.ab-line.active').forEach((n) => n.classList.remove('active'));
    if (k) {
      root.querySelector('#node-' + k)?.classList.add('active');
      root.querySelector('#line-' + k)?.classList.add('active');
    }
    const l1 = root.querySelector('#lab-line1');
    const l2 = root.querySelector('#lab-line2');
    const txt = k ? (NODE_LABEL[k] || k) : '';
    const set = (g: Element | null, t: string) => g?.querySelectorAll('text').forEach((e) => { e.textContent = t; });
    // Siempre en una sola línea (sobre la regla naranja); la línea superior queda vacía.
    set(l1, '');
    set(l2, txt);
  }, []);

  // Inyecta la escena UNA sola vez (fuera de la reconciliación de React) para que
  // las clases .active y los textos de la etiqueta no se borren en cada re-render.
  useEffect(() => {
    const root = ref.current;
    if (root && !root.firstChild) root.innerHTML = sceneHtml;
    // F-LDO 3 · navegador reducido: oculta los nodos fuera de la lista blanca.
    if (root && allowed) {
      root.querySelectorAll<HTMLElement>('[data-node]').forEach((g) => {
        const k = g.getAttribute('data-node') ?? '';
        g.style.display = allowed.includes(k) ? '' : 'none';
      });
    }
    paint(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-pinta el estado activo cada vez que cambia.
  useEffect(() => { paint(active); }, [active, paint]);

  const handleClick = (e: React.MouseEvent) => {
    const k = nodeKeyFrom(e.target);
    if (k) onSelect?.(k);
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const k = nodeKeyFrom(e.target);
    if (k) { e.preventDefault(); onSelect?.(k); }
  };
  // Hover: enciende la línea del nodo bajo el cursor (sin pisar el activo).
  const handleOver = (e: React.MouseEvent) => {
    const k = nodeKeyFrom(e.target);
    if (k && k !== active) ref.current?.querySelector('#line-' + k)?.classList.add('active');
  };
  const handleOut = (e: React.MouseEvent) => {
    const k = nodeKeyFrom(e.target);
    if (k && k !== active) ref.current?.querySelector('#line-' + k)?.classList.remove('active');
  };

  return (
    <div
      id="ab-nav-root"
      ref={ref}
      data-theme={dark ? 'dark' : 'light'}
      onClick={handleClick}
      onKeyDown={handleKey}
      onMouseOver={handleOver}
      onMouseOut={handleOut}
    />
  );
}
