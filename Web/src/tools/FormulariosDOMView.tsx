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
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import { loadNormativa, type NormativaGuardada } from './normativaStore';
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

/* ── Homologación con Participantes / Cuadro / Geolocalizador (binds del formulario) ── */
interface PartLite { id: string; rol: string; nombre: string; rut: string; direccion: string; email?: string; fono?: string; conDireccion?: boolean; fijo?: boolean; }
interface ParticipantesPayload { participantes?: PartLite[]; }
interface PisoLite { util?: string; comun?: string; }
interface CuadroLite { supOcupacion?: string; supPredio?: string; sobreTerreno?: PisoLite[]; subterraneo?: PisoLite[]; }

/** Roles → clave canónica usada en los binds `participant.<clave>.<attr>`. */
const ROLE_RE: Array<[RegExp, string]> = [
  [/arquitect/i, 'arquitecto'],
  [/propietar|mandante/i, 'propietario'],
  [/calculist/i, 'calculista'],
  [/constructor/i, 'constructor'],
  [/director de obra|\bdom\b/i, 'dom'],
  [/revisor/i, 'revisor'],
  [/\bito\b|inspec/i, 'ito'],
  [/mec[aá]nic/i, 'mecanico'],
  [/paisaj/i, 'paisajista'],
];
const ROLE_LABEL: Record<string, string> = {
  arquitecto: 'Arquitecto', propietario: 'Propietario', calculista: 'Ingeniero Calculista',
  constructor: 'Constructor', dom: 'Director de Obra (DOM)', revisor: 'Revisor Independiente',
  ito: 'ITO', mecanico: 'Ing. Mecánico', paisajista: 'Paisajista',
};
function roleKey(p: PartLite): string {
  if (p.id === 'arquitecto') return 'arquitecto';
  if (p.id === 'propietario') return 'propietario';
  const r = `${p.rol ?? ''} ${p.id ?? ''}`;
  for (const [re, k] of ROLE_RE) if (re.test(r)) return k;
  return '';
}
/** Mapa `clave → {nombre,rut,direccion}` para resolver `participant.*` en los binds. */
function mapaParticipantes(stored: unknown): Record<string, { nombre: string; rut: string; direccion: string; email: string; fono: string }> {
  const out: Record<string, { nombre: string; rut: string; direccion: string; email: string; fono: string }> = {};
  const list = (stored && typeof stored === 'object' ? (stored as ParticipantesPayload).participantes : undefined) ?? [];
  for (const p of list) {
    const k = roleKey(p);
    if (k && !out[k]) out[k] = { nombre: p.nombre ?? '', rut: p.rut ?? '', direccion: p.direccion ?? '', email: p.email ?? '', fono: p.fono ?? '' };
  }
  return out;
}
const num = (v: unknown): number => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isNaN(n) ? 0 : n; };
const sumaPisos = (arr?: PisoLite[]): number => (arr ?? []).reduce((a, p) => a + num(p?.util) + num(p?.comun), 0);
/** Superficies derivadas del Cuadro de Superficies para los binds `superficie.*`. */
function superficiesCtx(c?: CuadroLite): Record<string, string> {
  const st = sumaPisos(c?.sobreTerreno), sub = sumaPisos(c?.subterraneo);
  const primer = c?.sobreTerreno?.[0] ? num(c.sobreTerreno[0].util) + num(c.sobreTerreno[0].comun) : 0;
  const f = (n: number) => (n ? n.toFixed(2) : '');
  return {
    ocupacion: c?.supOcupacion ?? '', predio: c?.supPredio ?? '',
    sobreTerreno: f(st), subterraneo: f(sub), total: f(st + sub), primerPiso: f(primer),
  };
}

export default function FormulariosDOMView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject, setToolState, repo } = useProjects();
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
  const [busy, setBusy] = useState<'' | 'download' | 'storage'>('');
  const [msg, setMsg] = useState('');
  const hidratado = useRef('');

  // ── Fuentes de homologación (todas por el canal gobernado useToolData) ──
  // Participantes (nombre/rut/dirección por rol), Cuadro de Superficies y la
  // ficha del Geolocalizador (normativa). Nube si logueado, local si invitado.
  const participantes = useToolData<ParticipantesPayload>('participantes', projectId, {});
  const cuadro = useToolData<CuadroLite>('cuadro-superficies', projectId, {});
  const [normativa, setNormativa] = useState<NormativaGuardada | null>(null);
  useEffect(() => {
    if (!projectId) { setNormativa(null); return; }
    let alive = true;
    void loadNormativa(projectId, repo.kind === 'cloud').then((n) => { if (alive) setNormativa(n); });
    return () => { alive = false; };
  }, [projectId, repo.kind]);

  const partMap = useMemo(() => mapaParticipantes(participantes.data), [participantes.data]);

  const bindCtx = useMemo(() => {
    const p = projectId ? getProject(projectId) : undefined;
    return {
      project: p ?? {},
      participant: partMap,
      normativa: normativa ?? {},
      superficie: superficiesCtx(cuadro.data),
    } as Record<string, unknown>;
  }, [getProject, projectId, partMap, normativa, cuadro.data]);

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

  /** Write-back BIDIRECCIONAL: si el usuario llenó en el formulario un campo de un
   *  participante (`participant.<rol>.<attr>`), propaga el valor a la herramienta
   *  Participantes (toolData). Solo valores NO vacíos (nunca borra lo existente). */
  const writebackParticipantes = async (): Promise<void> => {
    if (!map) return;
    const cambios: Record<string, Record<string, string>> = {};
    for (const f of map.fields) {
      if (!f.bind || !f.bind.startsWith('participant.')) continue;
      const [, key, attr] = f.bind.split('.');
      const v = (values[f.id] ?? '').trim();
      if (!key || !attr || !v) continue;
      (cambios[key] ??= {})[attr] = v;
    }
    if (!Object.keys(cambios).length) return;
    const cur: PartLite[] = (participantes.data?.participantes ?? []).map((x) => ({ ...x }));
    for (const [key, attrs] of Object.entries(cambios)) {
      let item = cur.find((p) => roleKey(p) === key);
      if (!item) {
        item = { id: `auto-${key}-${Date.now()}`, rol: ROLE_LABEL[key] ?? key, nombre: '', rut: '', direccion: '', conDireccion: false };
        cur.push(item);
      }
      Object.assign(item, attrs);
      if (attrs.direccion) item.conDireccion = true;
    }
    await participantes.save({ participantes: cur });
  };

  const persist = async (): Promise<void> => {
    if (readOnly || !map || !projectId) return;
    const forms = { ...(data?.forms ?? {}) };
    forms[formId] = { values, updatedAt: Date.now() };
    await save({ ...(data ?? FALLBACK), forms });
    await writebackParticipantes();
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
