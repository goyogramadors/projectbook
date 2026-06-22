/**
 * BibliotecaView.tsx — F3.6 · Biblioteca de Recursos (T-48)
 *
 * Vista data-driven: lee la colección `biblioteca` de Firestore.
 * Fallback: datos mock si Firebase no está configurado.
 *
 * Filtros: categoria ('formulario' | 'guia' | 'normativa' | 'template' | 'todos')
 * Acción: descarga del downloadUrl (Storage o CDN).
 * Clases CSS: .tool-panel / .panel-content de archibots.css (temables).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { BibliotecaItem } from '../core/types';

// ── Datos mock (fallback sin Firebase) ───────────────────────────────────────

const MOCK_ITEMS: BibliotecaItem[] = [
  { id: 'b-001', titulo: 'Formulario F-1.1-PE — Permiso de Edificación', descripcion: 'Solicitud de permiso de edificación ante la Dirección de Obras Municipales.', categoria: 'formulario', tags: ['DOM', 'permiso', 'OGUC art. 5.1.1'], downloadUrl: '#', fileSize: '120 KB', updatedAt: new Date('2025-03-01') },
  { id: 'b-002', titulo: 'Guía de Accesibilidad Universal DS 50', descripcion: 'Manual técnico para la aplicación del Decreto Supremo N° 50 MINVU sobre accesibilidad.', categoria: 'guia', tags: ['DS 50', 'accesibilidad', 'MINVU'], downloadUrl: '#', fileSize: '2.4 MB', updatedAt: new Date('2025-08-15') },
  { id: 'b-003', titulo: 'OGUC Actualizada 2025 — Arts. 5 a 8', descripcion: 'Ordenanza General de Urbanismo y Construcciones vigente, capítulos de edificación.', categoria: 'normativa', tags: ['OGUC', 'LGUC', 'MINVU'], downloadUrl: '#', fileSize: '4.1 MB', updatedAt: new Date('2025-11-01') },
  { id: 'b-004', titulo: 'Template Contrato de Proyecto Básico', descripcion: 'Plantilla word de contrato de servicios profesionales de arquitectura para proyectos medianos.', categoria: 'template', tags: ['contrato', 'honorarios', 'legal'], downloadUrl: '#', fileSize: '85 KB', updatedAt: new Date('2026-01-20') },
  { id: 'b-005', titulo: 'Formulario Acreditación Térmica', descripcion: 'Formulario oficial para la acreditación de estándares térmicos según MINVU.', categoria: 'formulario', tags: ['térmica', 'MINVU', 'acreditación'], downloadUrl: '#', fileSize: '95 KB', updatedAt: new Date('2025-06-10') },
  { id: 'b-006', titulo: 'Guía Planbim Chile — Usos BIM para Proyectos Públicos', descripcion: 'Documento oficial Planbim/CORFO para implementación BIM en proyectos de inversión pública.', categoria: 'guia', tags: ['BIM', 'Planbim', 'ISO 19650', 'CORFO'], downloadUrl: '#', fileSize: '6.8 MB', updatedAt: new Date('2025-09-01') },
];

// ── Tipos de filtro ───────────────────────────────────────────────────────────

type CategoriaFiltro = 'todos' | BibliotecaItem['categoria'];

const CATEGORIAS: { valor: CategoriaFiltro; label: string; icon: string }[] = [
  { valor: 'todos',      label: 'Todos',       icon: 'Library'       },
  { valor: 'formulario', label: 'Formularios',  icon: 'FileText'      },
  { valor: 'guia',       label: 'Guías',        icon: 'BookOpen'      },
  { valor: 'normativa',  label: 'Normativa',    icon: 'Scale'         },
  { valor: 'template',   label: 'Templates',    icon: 'FileTemplate'  },
];

const CATEGORIA_COLORS: Record<string, string> = {
  formulario: 'var(--primary)',
  guia:       'var(--success, #4EC9B0)',
  normativa:  'var(--destructive)',
  template:   'var(--accent, #DCDCAA)',
};

// ── Carga desde Firestore ─────────────────────────────────────────────────────

async function fetchBiblioteca(): Promise<BibliotecaItem[]> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  if (!projectId) return MOCK_ITEMS;

  try {
    const { getApps, getApp, initializeApp } = await import('firebase/app');
    const { getFirestore, collection, query, orderBy, getDocs, Timestamp } = await import('firebase/firestore');
    const cfg = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY ?? '',
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId:             import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    };
    const app = getApps().length ? getApp() : initializeApp(cfg);
    const db = getFirestore(app);
    const snap = await getDocs(query(collection(db, 'biblioteca'), orderBy('updatedAt', 'desc')));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        titulo:      data.titulo ?? '',
        descripcion: data.descripcion ?? '',
        categoria:   data.categoria ?? 'formulario',
        tags:        data.tags ?? [],
        downloadUrl: data.downloadUrl ?? '#',
        fileSize:    data.fileSize,
        updatedAt:   (data.updatedAt as InstanceType<typeof Timestamp>).toDate(),
      } satisfies BibliotecaItem;
    });
  } catch (err) {
    console.warn('[BibliotecaView] Firestore no disponible — usando mock:', err);
    return MOCK_ITEMS;
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function BibliotecaView() {
  const [items,     setItems]     = useState<BibliotecaItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filtro,    setFiltro]    = useState<CategoriaFiltro>('todos');
  const [busqueda,  setBusqueda]  = useState('');
  const [isMock,    setIsMock]    = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBiblioteca()
      .then((data) => {
        setItems(data);
        setIsMock(!import.meta.env.VITE_FIREBASE_PROJECT_ID);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = items.filter((it) => {
    if (filtro !== 'todos' && it.categoria !== filtro) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      it.titulo.toLowerCase().includes(q) ||
      it.descripcion.toLowerCase().includes(q) ||
      it.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const Icon = ({ name, ...p }: any) => {
    const C = (Icons as any)[name] || Icons.File;
    return <C strokeWidth={1.5} {...p} />;
  };

  return (
    <div className="tool-panel">
      {/* ── Barra de controles ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
          <Icons.Library size={15} /> Biblioteca de Recursos
        </span>

        {/* Mock badge */}
        {isMock && (
          <span className="bg-muted text-muted-foreground" style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', letterSpacing: '0.05em', border: 'var(--border-thickness) solid var(--border)', marginLeft: 2 }}>
            datos demo
          </span>
        )}

        {/* Buscador */}
        <input
          className="tech-input"
          placeholder="Buscar…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: 180, marginLeft: 'auto' }}
        />
      </div>

      {/* ── Tabs de categoría ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: 'var(--border-thickness) solid var(--border)', overflowX: 'auto' }}>
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.valor}
            onClick={() => setFiltro(cat.valor)}
            style={{
              padding: '8px 14px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'inherit',
              border: 'none',
              borderBottom: filtro === cat.valor ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              color: filtro === cat.valor ? 'var(--primary)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              transition: 'color 0.1s',
            }}
          >
            <Icon name={cat.icon} size={12} />
            {cat.label}
            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>
              ({cat.valor === 'todos' ? items.length : items.filter((i) => i.categoria === cat.valor).length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div className="panel-content" style={{ padding: 14 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 24, color: 'var(--muted-foreground)', fontSize: 12 }}>
            <Icons.Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando biblioteca…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)', fontSize: 12 }}>
            <Icons.SearchX size={24} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div>Sin resultados para <strong>«{busqueda}»</strong></div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {visible.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: idx * 0.03, duration: 0.18 }}
                  className="bg-card border-theme"
                  style={{ display: 'flex', flexDirection: 'column', padding: 14, gap: 8 }}
                >
                  {/* Badge de categoría */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 800, textTransform: 'uppercase',
                      padding: '2px 7px', letterSpacing: '0.06em',
                      background: CATEGORIA_COLORS[item.categoria] ?? 'var(--muted)',
                      color: 'var(--primary-foreground)',
                      border: 'var(--border-thickness) solid transparent',
                    }}>
                      {item.categoria}
                    </span>
                    {item.fileSize && (
                      <span className="text-muted-foreground" style={{ fontSize: 10, marginLeft: 'auto' }}>
                        {item.fileSize}
                      </span>
                    )}
                  </div>

                  {/* Título y descripción */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.35, marginBottom: 4 }}>{item.titulo}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 11, lineHeight: 1.5 }}>{item.descripcion}</div>
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.tags.map((tag) => (
                        <span key={tag} className="bg-muted text-muted-foreground" style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', border: 'var(--border-thickness) solid var(--border)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: fecha + descarga */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 8, borderTop: 'var(--border-thickness) solid var(--border)' }}>
                    <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                      {item.updatedAt.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ab-btn sm"
                      style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onClick={(e) => { if (item.downloadUrl === '#') { e.preventDefault(); } }}
                    >
                      <Icons.Download size={11} /> Descargar
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
