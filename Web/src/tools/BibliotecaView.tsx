/* =============================================================================
   BibliotecaView.tsx — BIBLIOTECA DE RECURSOS (Formularios MINVU)
   -----------------------------------------------------------------------------
   Índice de formularios oficiales MINVU servidos estáticamente desde
   public/Biblioteca/*.pdf. Se agrupan por TIPOLOGÍA DE PROYECTO en un acordeón;
   cada ítem es un hipervínculo directo al PDF (target="_blank").
   Vista de solo lectura: no escribe en Firestore ni en el ProjectMaster.
   ============================================================================= */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { ToolProps } from '../core/types';

interface Doc { label: string; file: string; }
interface Categoria { cat: string; items: Doc[]; }

/* Índice exacto provisto (archivos en public/Biblioteca/). */
const BIBLIOTECA: Categoria[] = [
  { cat: 'OBRA NUEVA', items: [
    { label: 'Solicitud de Anteproyecto', file: 'FORMULARIO-2-1.1.-version-2026.pdf' },
    { label: 'Solicitud de Permiso de Edificación', file: 'FORMULARIO-2-3.1.f.pdf' },
    { label: 'Solicitud de Modificación de Proyecto', file: 'FORMULARIO-2-5.1.pdf' },
    { label: 'Solicitud de Recepción Definitiva', file: 'FORMULARIO-2-7.1.pdf' },
    { label: 'Declaración Jurada de Término', file: '2.1.2.3.1-DJ-de-Termino_Obra-Nueva_FORMULARIO.pdf' },
  ] },
  { cat: 'AMPLIACIÓN MAYOR A 100 M²', items: [
    { label: 'Solicitud de Anteproyecto', file: 'FORMULARIO-2-1.2.-version-2026.pdf' },
    { label: 'Solicitud de Permiso de Edificación', file: 'FORMULARIO-2-3.2.f.pdf' },
    { label: 'Solicitud de Modificación de Proyecto', file: 'FORMULARIO-2-5.2.pdf' },
    { label: 'Solicitud de Recepción Definitiva', file: 'FORMULARIO-2-7.2.pdf' },
  ] },
  { cat: 'ALTERACIÓN', items: [
    { label: 'Solicitud de Anteproyecto', file: 'FORMULARIO-2-1.3.-version-2026.pdf' },
    { label: 'Solicitud de Permiso de Edificación', file: 'FORMULARIO-2-3.3-.pdf' },
    { label: 'Solicitud de Recepción Definitiva', file: 'FORMULARIO-2-7.3.pdf' },
    { label: 'Declaración Jurada de Término', file: '2.1.2.3.3-DJ-de-Termino_Alteracion_FORMULARIO.pdf' },
  ] },
  { cat: 'RECONSTRUCCIÓN', items: [
    { label: 'Solicitud de Anteproyecto', file: 'FORMULARIO-2-1.4.-version-2026.pdf' },
    { label: 'Solicitud de Permiso de Edificación', file: 'FORMULARIO-2-3.4.pdf' },
    { label: 'Solicitud de Modificación de Proyecto', file: 'FORMULARIO-2-5.4.pdf' },
    { label: 'Solicitud de Recepción Definitiva', file: 'FORMULARIO-2-7.4.-1.pdf' },
    { label: 'Declaración Jurada de Término', file: '2.1.2.3.4-DJ-de-Termino_Reconstruccion_FORMULARIO.pdf' },
  ] },
  { cat: 'REPARACIÓN', items: [
    { label: 'Solicitud de Permiso de Edificación', file: 'FORMULARIO-2-3.5.pdf' },
    { label: 'Solicitud de Modificación de Proyecto', file: 'FORMULARIO-2-5.5.pdf' },
    { label: 'Solicitud de Recepción Definitiva', file: 'FORMULARIO-2-7.5.-1.pdf' },
    { label: 'Declaración Jurada de Término', file: '2.1.2.3.5-DJ-de-Termino_Reparacion_FORMULARIO.pdf' },
  ] },
  { cat: 'NORMATIVA Y LEYES GENERALES', items: [
    { label: 'Ordenanza General de Urbanismo y Construcciones', file: 'OGUC-Marzo-2026-D.S.-N°2-D.O.-16-03-2026-vf.pdf' },
  ] },
];

/** Ruta pública del PDF, con los caracteres especiales (p. ej. "°") codificados. */
const hrefDe = (file: string) => `/Biblioteca/${encodeURIComponent(file)}`;

export default function BibliotecaView(_: ToolProps) {
  // Acordeón: primera categoría abierta por defecto.
  const [abiertas, setAbiertas] = useState<string[]>(BIBLIOTECA[0] ? [BIBLIOTECA[0].cat] : []);
  const toggle = (cat: string) =>
    setAbiertas((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.BookOpen size={22} strokeWidth={1.4} /> Biblioteca de Recursos
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Formularios oficiales MINVU agrupados por tipología de proyecto. Cada documento abre el PDF en una pestaña nueva.
      </p>

      <div className="tool-panel" style={{ maxWidth: 920 }}>
        <div className="module-header">| FORMULARIOS MINVU · POR TIPOLOGÍA</div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BIBLIOTECA.map(({ cat, items }) => {
            const open = abiertas.includes(cat);
            return (
              <div key={cat} style={{ border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => toggle(cat)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', background: 'var(--muted)', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, fontFamily: 'inherit' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icons.FolderOpen size={15} strokeWidth={1.6} /> {cat}
                    <span style={{ opacity: 0.5, fontWeight: 700 }}>({items.length})</span>
                  </span>
                  <Icons.ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {items.map(({ label, file }) => (
                          <a
                            key={file}
                            href={hrefDe(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: '1px solid var(--border)', textDecoration: 'none', color: 'var(--foreground)', fontSize: 12.5 }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <Icons.FileText size={15} strokeWidth={1.5} style={{ flexShrink: 0, color: 'var(--destructive)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, flexShrink: 0 }}>
                              PDF <Icons.ExternalLink size={13} strokeWidth={1.8} />
                            </span>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
