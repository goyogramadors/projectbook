/* =============================================================================
   GeneradorEETTView.tsx — Generador de Especificaciones Técnicas (Construcción).
   -----------------------------------------------------------------------------
   Colapsa "EETT Generales" y "EETT Estructuras" en UNA herramienta guiada por
   selector. Ensambla el documento por inclusión condicional (activaSi.ts) sobre
   el catálogo de datos generado del .md (catalogo.eett.ts). Prellena desde el
   ProjectMaster (nombre/comuna/dirección/naturaleza). Persiste con useToolData.
   Vista previa imprimible + Exportar a PDF vía DocumentExportWrapper (mismo visor
   PDF que el resto de herramientas documentales).
   ============================================================================= */
import { useMemo } from 'react';
import { FileText, Building2 } from 'lucide-react';
import type { ToolProps } from '../core/types';
import { useProjects } from '../core/db/ProjectProvider';
import { useToolData } from '../hooks/useToolData';
import DocumentExportWrapper from '../components/DocumentExportWrapper';
import './construccion/construccion.css';
import { CATALOGO_EETT } from './construccion/catalogo.eett';
import { evalActivaSi, naturalezaDeTipoProyecto, type SeleccionConstruccion } from './construccion/activaSi';
import {
  SELECCION_VACIA, NATURALEZAS, ESTRUCTURAS, TECHUMBRE_EST, CUBIERTAS, CIELOS, REV_MUROS,
  PISOS, PUERTAS, VENTANAS, INSTALACIONES, URBANIZACION, MOBILIARIO, COMPLEMENTARIAS,
  labelOf, joinLabels, type Opcion,
} from './construccion/meta';

interface EettState extends SeleccionConstruccion {
  region: string;
  opcionales: string[];   // ids de partidas 'opcional' incluidas manualmente
  verNch: boolean;
  verIndice: boolean;
}
const FALLBACK: EettState = { ...SELECCION_VACIA, region: '', opcionales: [], verNch: true, verIndice: true };

const CAP_TITULOS: Record<number, string> = {
  0: 'Antecedentes Generales y Marco Normativo', 1: 'Obras Preliminares e Instalación de Faenas',
  2: 'Obras de Habilitación del Terreno', 3: 'Demoliciones, Desarmes y Obras Previas',
  4: 'Obra Gruesa', 5: 'Terminaciones', 6: 'Instalaciones (Especialidades)',
  8: 'Obras de Urbanización y Exteriores', 9: 'Aseo, Entrega y Recepción',
};

export default function GeneradorEETTView({ projectId, access = 'edit' }: ToolProps) {
  const { getProject } = useProjects();
  const master = getProject(projectId);
  const { data, setData, save } = useToolData<EettState>('eett-generador', projectId, FALLBACK);
  const ro = access !== 'edit';

  // Naturaleza inicial desde el ProjectMaster si el usuario no la ha tocado.
  const sel: EettState = useMemo(() => {
    if (data.naturaleza) return data;
    return { ...data, naturaleza: naturalezaDeTipoProyecto(master?.tipoProyecto) };
  }, [data, master?.tipoProyecto]);

  const commit = (patch: Partial<EettState>) => {
    if (ro) return;
    const next = { ...sel, ...patch };
    setData(next); void save(next);
  };
  const toggleArr = (key: keyof EettState, v: string) => {
    const arr = (sel[key] as string[]) ?? [];
    commit({ [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] } as Partial<EettState>);
  };

  // ── Ensamblado del documento ──
  const partidas = useMemo(() => {
    return CATALOGO_EETT.filter((p) =>
      p.activaSi === 'opcional' ? sel.opcionales.includes(p.id) : evalActivaSi(p.activaSi, sel),
    );
  }, [sel]);

  const subst = (txt: string): string => {
    const map: Record<string, string> = {
      nombre_proyecto: master?.name || '[Proyecto]',
      direccion: master?.direccion || '[dirección]',
      comuna: master?.comuna || '[comuna]',
      region: master?.region || sel.region || '[Región]',
      naturaleza: labelOf(NATURALEZAS, sel.naturaleza),
      lista_eett_complementarias: joinLabels(COMPLEMENTARIAS, sel.eett_complementarias, 'las EETT de especialidad del proyecto'),
      estructura: joinLabels(ESTRUCTURAS, sel.estructura, 'el sistema estructural de proyecto'),
      techumbre_estructura: joinLabels(TECHUMBRE_EST, sel.techumbre_estructura, 'la estructura de techumbre de proyecto'),
      cubierta_material: labelOf(CUBIERTAS, sel.cubierta_material),
      pisos: joinLabels(PISOS, sel.pisos, 'los pavimentos de proyecto'),
      rev_muros: joinLabels(REV_MUROS, sel.rev_muros, 'los revestimientos de proyecto'),
      ventanas: joinLabels(VENTANAS, sel.ventanas, 'las ventanas de proyecto'),
      puertas: joinLabels(PUERTAS, sel.puertas, 'las puertas de proyecto'),
      espesor: 'el espesor indicado en planos',
    };
    return txt.replace(/\{([a-z_]+)\}/g, (_m, k: string) => map[k] ?? '');
  };

  const porCapitulo = useMemo(() => {
    const caps = [...new Set(partidas.map((p) => p.cap))].sort((a, b) => a - b);
    return caps.map((c) => ({ cap: c, items: partidas.filter((p) => p.cap === c) }));
  }, [partidas]);

  const opcionalesDisponibles = CATALOGO_EETT.filter((p) => p.activaSi === 'opcional');

  // ── Render: chip / toggle helpers ──
  const Chips = ({ ops, field, single }: { ops: Opcion[]; field: keyof EettState; single?: boolean }) => (
    <div className="cx-chips">
      {ops.map((o) => {
        const on = single ? sel[field] === o.value : ((sel[field] as string[]) ?? []).includes(o.value);
        return (
          <button key={o.value} type="button" disabled={ro}
            className={`cx-chip${on ? ' active' : ''}`}
            onClick={() => single ? commit({ [field]: o.value } as Partial<EettState>) : toggleArr(field, o.value)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
  const Toggle = ({ k, label }: { k: keyof EettState; label: string }) => (
    <label className="cx-sw-row">
      <input type="checkbox" disabled={ro} checked={Boolean(sel[k])} onChange={(e) => commit({ [k]: e.target.checked } as Partial<EettState>)} />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="cx-2col">
      {/* ── COLUMNA SELECTOR ── */}
      <div className="cx-form">
        <div className="module-header">| GENERADOR DE EETT <FileText size={14} /></div>
        {ro && <p className="tech-quote">Modo solo lectura.</p>}

        <h4 className="cx-sec">00 · Identificación</h4>
        <div className="tech-input-group"><label>Región {master?.region ? '(auto · Ubicación)' : '(opcional)'}</label>
          <input className="tech-input" disabled={ro} value={sel.region} placeholder={master?.region || 'Metropolitana'}
            onChange={(e) => commit({ region: e.target.value })} /></div>
        <p className="tech-quote">Proyecto: <b>{master?.name ?? '—'}</b> · {master?.comuna ?? '—'}{master?.region ? `, ${master.region}` : ''}</p>

        <h4 className="cx-sec">01 · Naturaleza de la intervención</h4>
        <Chips ops={NATURALEZAS} field={'naturaleza'} single />

        {sel.naturaleza !== 'obra_menor' && (<>
          <h4 className="cx-sec">02 · Sistema estructural</h4>
          <Chips ops={ESTRUCTURAS} field={'estructura'} />
        </>)}

        <h4 className="cx-sec">03 · Obra gruesa</h4>
        <div className="cx-sw-grid">
          <Toggle k="fundaciones" label="Fundaciones" /><Toggle k="radier" label="Radier / sobrecimiento" />
          <Toggle k="sobrelosa" label="Sobrelosas" /><Toggle k="demoliciones" label="Demoliciones / desarmes" />
          <Toggle k="techumbre" label="Techumbre y cubierta" />
        </div>
        {sel.techumbre && (<>
          <label className="cx-sub">Estructura de techumbre</label>
          <Chips ops={TECHUMBRE_EST} field={'techumbre_estructura'} />
          <label className="cx-sub">Material de cubierta</label>
          <Chips ops={CUBIERTAS} field={'cubierta_material'} single />
        </>)}

        <h4 className="cx-sec">04 · Terminaciones</h4>
        <div className="cx-sw-grid">
          <Toggle k="tabiqueria" label="Tabiquería interior" /><Toggle k="pinturas" label="Pinturas" />
          <Toggle k="banos" label="Baños / húmedos" /><Toggle k="mobiliario" label="Mobiliario en obra" />
          <Toggle k="cumplir_termica" label="Cumplir norma térmica" /><Toggle k="resistencia_fuego" label="Resist. fuego" />
        </div>
        {sel.mobiliario && (<><label className="cx-sub">Mobiliario</label><Chips ops={MOBILIARIO} field={'mobiliario_items'} /></>)}
        <label className="cx-sub">Cielos</label><Chips ops={CIELOS} field={'cielos'} />
        <label className="cx-sub">Revestimiento de muros</label><Chips ops={REV_MUROS} field={'rev_muros'} />
        <label className="cx-sub">Pisos / pavimentos</label><Chips ops={PISOS} field={'pisos'} />
        <label className="cx-sub">Puertas</label><Chips ops={PUERTAS} field={'puertas'} />
        <label className="cx-sub">Ventanas</label><Chips ops={VENTANAS} field={'ventanas'} />

        <h4 className="cx-sec">05 · Instalaciones presentes</h4>
        <Chips ops={INSTALACIONES} field={'instalaciones'} />

        {sel.naturaleza !== 'obra_menor' && (<>
          <h4 className="cx-sec">06 · Urbanización y exteriores</h4>
          <Chips ops={URBANIZACION} field={'urbanizacion'} />
        </>)}

        <h4 className="cx-sec">07 · EETT complementarias (declara)</h4>
        <Chips ops={COMPLEMENTARIAS} field={'eett_complementarias'} />

        {opcionalesDisponibles.length > 0 && (<>
          <h4 className="cx-sec">08 · Partidas opcionales</h4>
          <div className="cx-chips">
            {opcionalesDisponibles.map((p) => (
              <button key={p.id} type="button" disabled={ro}
                className={`cx-chip${sel.opcionales.includes(p.id) ? ' active' : ''}`}
                onClick={() => toggleArr('opcionales', p.id)}>{p.id} {p.titulo}</button>
            ))}
          </div>
        </>)}

        <h4 className="cx-sec">09 · Opciones del documento</h4>
        <div className="cx-sw-grid">
          <label className="cx-sw-row"><input type="checkbox" disabled={ro} checked={sel.verNch} onChange={(e) => commit({ verNch: e.target.checked })} /><span>Trazabilidad NCh 1150</span></label>
          <label className="cx-sw-row"><input type="checkbox" disabled={ro} checked={sel.verIndice} onChange={(e) => commit({ verIndice: e.target.checked })} /><span>Índice</span></label>
        </div>
      </div>

      {/* ── COLUMNA PREVIEW ── */}
      <div className="cx-preview">
        <div className="cx-prevbar">
          <span><Building2 size={13} /> {partidas.length} partidas · {porCapitulo.length} capítulos</span>
          <button type="button" className="technical-btn" onClick={() => window.print()}>[ EXPORTAR A PDF ]</button>
        </div>
        <DocumentExportWrapper documentName="Especificaciones Técnicas" documentId="eett-generador" projectId={projectId}>
          <h2 style={{ textAlign: 'center', fontSize: 15, margin: '0 0 4px' }}>ESPECIFICACIONES TÉCNICAS</h2>
          <p style={{ textAlign: 'center', fontSize: 11, marginTop: 0 }}>
            {master?.name || '[Proyecto]'} · {labelOf(NATURALEZAS, sel.naturaleza)}
          </p>
          {sel.verIndice && (
            <div style={{ margin: '12px 0', fontSize: 11 }}>
              <b>ÍNDICE</b>
              <ol style={{ margin: '4px 0 0 18px', padding: 0 }}>
                {porCapitulo.map(({ cap }) => <li key={cap}>Capítulo {cap} — {CAP_TITULOS[cap]}</li>)}
              </ol>
            </div>
          )}
          {porCapitulo.map(({ cap, items }) => (
            <div key={cap} style={{ marginTop: 14 }}>
              <h3 style={{ fontSize: 12.5, borderBottom: '1px solid #999', paddingBottom: 2 }}>
                CAPÍTULO {cap} — {(CAP_TITULOS[cap] ?? '').toUpperCase()}
              </h3>
              {items.map((p) => (
                <div key={p.id} style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 11.5 }}>
                    {p.id} {p.titulo}{sel.verNch && p.nch1150 ? <span style={{ fontWeight: 400, color: '#888' }}> · NCh 1150: {p.nch1150}</span> : null}
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, textAlign: 'justify', lineHeight: 1.45 }}>{subst(p.texto)}</p>
                </div>
              ))}
            </div>
          ))}
        </DocumentExportWrapper>
      </div>
    </div>
  );
}
