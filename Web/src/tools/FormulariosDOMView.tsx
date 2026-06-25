/* =============================================================================
   FormulariosDOMView.tsx — UNA herramienta data-driven para los formularios DOM.
   Renderiza el PDF elegido como imagen de fondo + inputs superpuestos por coordenadas,
   prellena con datos del proyecto (ProjectMaster + Arquitecto) y exporta el PDF llenado
   (descarga + guardado en el expediente / Storage). Motor: ./forms/fillForm.ts (pdf-lib lazy).
   Montada en el catálogo como 'solicitud-permiso' (Expedientes de Permisos · Expediente DOM).
   ============================================================================= */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Save, FileText } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../core/firebase';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { FORM_MAPS } from '../forms';
import { fillForm, downloadPdf } from './forms/fillForm';
import { subirAdjunto } from './obra/storageUpload';
import type { ToolProps, FormFieldMap, FormField, FormValues, FormulariosDOMState, TipoProyecto } from '../core/types';

const FALLBACK: FormulariosDOMState = { forms: {}, adjuntos: [] };

/** Slot del catálogo (toolId) → trámite. */
const SLOT_TRAMITE: Record<string, string> = {
  'solicitud-permiso': 'anteproyecto',
  'permiso-edificacion': 'permiso',
  'modificacion-proyecto': 'modificacion',
  'recepcion-final': 'recepcion',
  'dj-termino': 'dj',
};

/** Tipo de proyecto (OGUC) + trámite → formId del field-map (ver src/forms/index.ts). */
const FORM_BY_TIPO: Partial<Record<TipoProyecto, Record<string, string>>> = {
  'Obra nueva': {
    anteproyecto: '2-1.1', permiso: '2-3.1', modificacion: '2-5.1',
    recepcion: '2-7.1', dj: 'dj-termino-on',
  },
  'Ampliación mayor a 100 m²': {
    anteproyecto: '2-1.2', permiso: '2-3.2', modificacion: '2-5.2', recepcion: '2-7.2',
  },
  'Alteración': {
    anteproyecto: '2-1.3', permiso: '2-3.3', recepcion: '2-7.3', dj: 'dj-termino-alt',
  },
  'Reconstrucción': {
    anteproyecto: '2-1.4', permiso: '2-3.4', modificacion: '2-5.4',
    recepcion: '2-7.4', dj: 'dj-termino-rec',
  },
  'Reparación': {
    permiso: '2-3.5', modificacion: '2-5.5', recepcion: '2-7.5', dj: 'dj-termino-rep',
  },
};

/** Resuelve un path de bind ("project.name", "participant.arquitecto.nombre"). */
function resolveBind(path: string | null, ctx: Record<string, unknown>): string {
  if (!path) return '';
  const v = path.split('.').reduce<unknown>(
    (o, k) => (o == null ? o : (o as Record<string, unknown>)[k]),
    ctx,
  );
  return v == null ? '' : String(v);
}

/** Lee el nombre del Arquitecto desde el payload de 'participantes'. */
function leerArquitecto(stored: unknown): string {
  if (!stored || typeof stored !== 'object') return '';
  const data = stored as { participantes?: Array<{ id?: string; rol?: string; nombre?: string }> };
  if (Array.isArray(data.participantes)) {
    const arq = data.participantes.find(
      (p) => p.id === 'arquitecto' || (p.rol ?? '').toLowerCase().includes('arquitecto'),
    );
    if (arq?.nombre) return arq.nombre;
  }
  return '';
}

export default function FormulariosDOMView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, setToolState } = useProjects();
  const { toolId } = useParams();
  const TOOL_ID = toolId ?? 'solicitud-permiso';
  const { data, save } = useToolData<FormulariosDOMState>(TOOL_ID, projectId, FALLBACK);

  // Resolución del PDF por trámite (slot) + Tipo de proyecto del master.
  const tramite = SLOT_TRAMITE[TOOL_ID];
  const tipoProyecto = (projectId ? getProject(projectId)?.tipoProyecto : undefined) as TipoProyecto | undefined;
  const resolvedFormId = (tramite && tipoProyecto) ? FORM_BY_TIPO[tipoProyecto]?.[tramite] : undefined;
  const locked = Boolean(resolvedFormId && FORM_MAPS[resolvedFormId]);

  const formIds = useMemo(() => Object.keys(FORM_MAPS), []);
  const [formId, setFormId] = useState<string>(resolvedFormId && FORM_MAPS[resolvedFormId] ? resolvedFormId : (formIds[0] ?? ''));
  useEffect(() => {
    if (resolvedFormId && FORM_MAPS[resolvedFormId]) setFormId(resolvedFormId);
  }, [resolvedFormId]);
  const map: FormFieldMap | undefined = FORM_MAPS[formId];

  const [values, setValues] = useState<FormValues>({});
  const [arquitecto, setArquitecto] = useState('');
  const [busy, setBusy] = useState<'' | 'download' | 'storage'>('');
  const [msg, setMsg] = useState('');
  const hidratado = useRef('');

  // Nombre del arquitecto (local mirror → nube), igual que DocumentExportWrapper.
  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    const local = localStorage.getItem(`ab-participantes-${projectId}`);
    if (local) {
      const n = leerArquitecto(JSON.parse(local));
      if (n) { setArquitecto(n); return; }
    }
    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'projects', projectId, 'toolData', 'participantes'));
        if (alive && snap.exists()) {
          setArquitecto(leerArquitecto((snap.data() as { payload?: unknown }).payload));
        }
      } catch { /* offline */ }
    })();
    return () => { alive = false; };
  }, [projectId]);

  const bindCtx = useMemo(() => {
    const p = projectId ? getProject(projectId) : undefined;
    return { project: p ?? {}, participant: { arquitecto: { nombre: arquitecto } } } as Record<string, unknown>;
  }, [getProject, projectId, arquitecto]);

  // Hidratación: valores guardados ∪ prefill por bind (lo guardado manda).
  useEffect(() => {
    if (!map || !projectId) return;
    const key = `${projectId}:${formId}`;
    if (hidratado.current === key) return;
    hidratado.current = key;
    const saved = data?.forms?.[formId]?.values ?? {};
    const next: FormValues = {};
    for (const f of map.fields) {
      next[f.id] = saved[f.id] ?? (resolveBind(f.bind, bindCtx) || f.default || '');
    }
    setValues(next);
  }, [map, formId, projectId, data, bindCtx]);

  const setVal = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }));

  const persist = async (): Promise<void> => {
    if (readOnly || !map || !projectId) return;
    const forms = { ...(data?.forms ?? {}) };
    forms[formId] = { values, updatedAt: Date.now() };
    await save({ ...(data ?? FALLBACK), forms });
    await setToolState(projectId, TOOL_ID, { estado: 'En proceso', fecha: new Date().toISOString() });
  };

  const exportar = async (modo: 'download' | 'storage'): Promise<void> => {
    if (!map || !projectId) return;
    setBusy(modo); setMsg('');
    try {
      const bytes = await fillForm(map, values, modo === 'storage');
      if (modo === 'download') {
        downloadPdf(bytes, `${map.formId}_${projectId}.pdf`);
        setMsg('PDF generado.');
      } else {
        const file = new File([bytes as BlobPart], `${map.formId}.pdf`, { type: 'application/pdf' });
        const meta = await subirAdjunto(projectId, 'formularios', file);
        const adjuntos = [
          ...(data?.adjuntos ?? []),
          { uuid: meta.uuid, formId: map.formId, nombre: meta.name, url: meta.url, fecha: new Date().toISOString() },
        ];
        const forms = { ...(data?.forms ?? {}) };
        forms[formId] = { values, updatedAt: Date.now() };
        await save({ ...(data ?? FALLBACK), forms, adjuntos });
        setMsg('Guardado en el expediente.');
      }
      await persist();
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`);
    } finally {
      setBusy('');
    }
  };

  if (!map) return <div className="panel-content">No hay formularios configurados.</div>;

  const previewW = 760;
  const s = previewW / map.pageSizePt.w;

  return (
    <div className="panel-content">
      <div className="module-header"><FileText size={15} /> {map.titulo}</div>

      {!locked && formIds.length > 1 && (
        <div className="tech-input-group" style={{ maxWidth: 460 }}>
          <label>FORMULARIO</label>
          <select className="tech-select" value={formId} onChange={(e) => { setFormId(e.target.value); hidratado.current = ''; }}>
            {formIds.map((id) => <option key={id} value={id}>{FORM_MAPS[id]?.titulo ?? id}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
        <button className="technical-btn" disabled={busy !== ''} onClick={() => void exportar('download')}>
          <Download size={14} /> {busy === 'download' ? 'Generando…' : 'Descargar PDF'}
        </button>
        <button className="technical-btn sec" disabled={busy !== '' || readOnly} onClick={() => void exportar('storage')}>
          <Save size={14} /> {busy === 'storage' ? 'Guardando…' : 'Guardar en expediente'}
        </button>
        {msg && <span style={{ fontSize: 12, opacity: 0.8 }}>{msg}</span>}
      </div>

      {map.images.map((src, idx) => {
        const pageNo = idx + 1;
        const pageFields = map.fields.filter((f) => f.page === pageNo);
        const hPx = map.pageSizePt.h * s;
        return (
          <div key={src} style={{ position: 'relative', width: previewW, height: hPx, margin: '0 auto 18px', boxShadow: '0 1px 6px rgba(0,0,0,.25)', background: '#fff' }}>
            <img src={src} alt={`página ${pageNo}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
            {pageFields.map((f: FormField) => {
              const [x0, y0, x1, y1] = f.rectPt;
              const base: CSSProperties = {
                position: 'absolute',
                left: x0 * s,
                top: (map.pageSizePt.h - y1) * s,
                width: (x1 - x0) * s,
                height: (y1 - y0) * s,
                boxSizing: 'border-box',
              };
              if (f.type === 'check') {
                return (
                  <input
                    key={f.id}
                    type="checkbox"
                    disabled={readOnly}
                    checked={Boolean(values[f.id]) && values[f.id] !== 'false'}
                    onChange={(e) => { setVal(f.id, e.target.checked ? 'true' : ''); void persist(); }}
                    style={{ ...base, width: Math.min(18, (x1 - x0) * s), height: Math.min(18, (y1 - y0) * s) }}
                  />
                );
              }
              return (
                <input
                  key={f.id}
                  type="text"
                  disabled={readOnly}
                  value={values[f.id] ?? ''}
                  title={f.bind ?? f.id}
                  onChange={(e) => setVal(f.id, e.target.value)}
                  onBlur={() => void persist()}
                  style={{
                    ...base,
                    fontSize: Math.max(9, Math.min(15, (y1 - y0) * s * 0.8)),
                    border: '1px solid rgba(0,120,255,.35)',
                    background: 'rgba(255,255,255,.55)',
                    padding: '0 2px',
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
