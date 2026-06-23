/* =============================================================================
   DocumentExportWrapper.tsx — LÁMINA IMPRIMIBLE ESTILO "HOJA DE PAPEL WORD"
   -----------------------------------------------------------------------------
   Membrete (grid perimetrado) + contenido (children, SOLO LECTURA) + pie de firma.
   IMPORTANTE: esta lámina está DELIBERADAMENTE DESVINCULADA del tema de la SPA.
   No usa tokens shadcn (var(--*)) ni clases ab-* temables: aplica colores HARD
   (blanco/negro/gris) y tipografía estándar para verse como un documento de Word,
   sobrio y profesional, sin heredar el modo oscuro ni la estética CAD.
   Los datos del membrete salen del ProjectMaster activo (useProjects().getProject)
   y de la ficha de participantes (rol Arquitecto). {hoy} en DD/MM/YYYY. Faltante → "---".
   El botón [ EXPORTAR A PDF ] ya NO vive aquí: lo renderiza la columna de preview
   de cada herramienta, encima de esta lámina.
   ============================================================================= */
import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useAuth } from '../core/auth/AuthProvider';

interface DocumentExportWrapperProps {
  documentName: string;
  documentId: string;
  projectId?: string;
  children: ReactNode;
}

const PLACEHOLDER = '---';
const TINTA = '#1a1a1a';
const LINEA = '#9a9a9a';
const PAPEL = '#ffffff';
const FUENTE = '"Segoe UI", Calibri, Arial, "Helvetica Neue", sans-serif';

/* ── estilos HARD (sin tokens de tema) ─────────────────────────────────────── */
/* Sin borde exterior en la hoja: la lámina NO va enmarcada por una línea completa. */
const sheet: CSSProperties = { background: PAPEL, color: TINTA, fontFamily: FUENTE, lineHeight: 1.45 };
/* Membrete = UN SOLO grid (no una grilla por fila): así las 4 columnas comparten
   ancho y la 3ª columna deja de desalinearse. El borde del contenedor dibuja el
   perímetro; cada celda aporta sus líneas internas (derecha/abajo). */
const membreteBox: CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', border: `1px solid ${LINEA}` };
const celdaBase: CSSProperties = { padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', borderRight: `1px solid ${LINEA}`, borderBottom: `1px solid ${LINEA}` };
const k: CSSProperties = { fontWeight: 700, textTransform: 'uppercase', fontSize: 10, color: '#444', background: '#f0f0f0', whiteSpace: 'nowrap' };

/** Estilo de celda del membrete: aplica estilo de llave, y suprime borde derecho en
 *  la última columna (col 4) y borde inferior en la última fila (row 3) para no
 *  duplicar el perímetro del contenedor. */
function celda(opts: { isKey?: boolean; col: number; row: number }): CSSProperties {
  return {
    ...celdaBase,
    ...(opts.col === 4 ? { borderRight: 'none' } : null),
    ...(opts.row === 3 ? { borderBottom: 'none' } : null),
    ...(opts.isKey ? k : null),
  } as CSSProperties;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
function fechaHoy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
function leerArquitecto(stored: unknown): string {
  if (!stored || typeof stored !== 'object') return '';
  const data = stored as { participantes?: Array<{ id?: string; rol?: string; nombre?: string }>; arquitecto?: string };
  if (Array.isArray(data.participantes)) {
    const arq = data.participantes.find((p) => p.id === 'arquitecto' || (p.rol || '').toLowerCase().includes('arquitecto'));
    if (arq?.nombre) return arq.nombre;
  }
  if (typeof data.arquitecto === 'string') return data.arquitecto;
  return '';
}

export default function DocumentExportWrapper({ documentName, documentId, projectId, children }: DocumentExportWrapperProps) {
  const params = useParams();
  const pid = projectId ?? params.projectId;
  const { getProject } = useProjects();
  const { user } = useAuth();
  const project = getProject(pid);

  const [nombreArquitecto, setNombreArquitecto] = useState('');

  useEffect(() => {
    if (!pid) return;
    let alive = true;
    try {
      const raw = localStorage.getItem(`ab-participantes-${pid}`);
      if (raw) {
        const nombre = leerArquitecto(JSON.parse(raw));
        if (alive && nombre) { setNombreArquitecto(nombre); return; }
      }
    } catch { /* corrupto — se intenta la nube */ }
    if (user?.plan === 'Premium') {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'projects', pid, 'toolData', 'participantes'));
          if (alive && snap.exists()) setNombreArquitecto(leerArquitecto((snap.data() as { payload?: unknown }).payload));
        } catch { /* offline / reglas */ }
      })();
    }
    return () => { alive = false; };
  }, [pid, user?.plan]);

  const nombreProyecto    = project?.name || PLACEHOLDER;
  const ciudad            = project?.comuna || PLACEHOLDER;
  const direccionProyecto = project?.direccion || PLACEHOLDER;
  const arquitecto        = nombreArquitecto || PLACEHOLDER;
  const hoy               = fechaHoy();

  return (
    <div className="doc-export">
      <div className="doc-sheet" style={sheet}>
        {/* MEMBRETE — grid único de 4 columnas (alineación) + borde perimetral. */}
        <div className="doc-membrete" style={membreteBox}>
          <span style={celda({ isKey: true, col: 1, row: 1 })}>Proyecto:</span>
          <span style={celda({ col: 2, row: 1 })}>{nombreProyecto}</span>
          <span style={celda({ isKey: true, col: 3, row: 1 })}>Ciudad:</span>
          <span style={celda({ col: 4, row: 1 })}>{ciudad}</span>

          <span style={celda({ isKey: true, col: 1, row: 2 })}>Dirección:</span>
          <span style={celda({ col: 2, row: 2 })}>{direccionProyecto}</span>
          <span style={celda({ isKey: true, col: 3, row: 2 })}>Fecha:</span>
          <span style={celda({ col: 4, row: 2 })}>{hoy}</span>

          <span style={celda({ isKey: true, col: 1, row: 3 })}>Producto:</span>
          <span style={celda({ col: 2, row: 3 })}>{documentName}</span>
          <span style={celda({ isKey: true, col: 3, row: 3 })}>Cod.:</span>
          <span style={celda({ col: 4, row: 3 })}>{documentId}</span>
        </div>

        {/* CONTENIDO (solo lectura) */}
        <div className="doc-body" style={{ padding: 22, color: TINTA }}>{children}</div>

        {/* PIE DE FIRMA */}
        <div className="doc-firma" style={{ borderTop: `1px solid ${LINEA}`, padding: '34px 22px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 230, height: 70, borderBottom: `1px solid ${TINTA}`, marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.03em' }}>{arquitecto}</div>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '.08em' }}>Arquitecto</div>
        </div>
      </div>
    </div>
  );
}
