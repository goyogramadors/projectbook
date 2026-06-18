/* =============================================================================
   ExpedienteMunicipalView.tsx — EXPEDIENTE MUNICIPAL (T-24)
   -----------------------------------------------------------------------------
   Genera tres documentos imprimibles DOM (Declaración Jurada Art. 1.2.2,
   Solicitud de Permiso F2-3.1 e INE) sembrados desde el ProjectMaster activo.
   Los datos propios del trámite (arquitecto, RUT) se archivan en localStorage
   bajo ab-expediente-dom-${projectId}. Exporta vía window.print() (PDF/impresora).
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import { superficieProyecto, type ToolProps } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
type DocId = 'declaracion' | 'f231' | 'ine';
interface DatosTramite { arquitecto: string; rutArquitecto: string; }

/* ── constantes ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = (pid: string) => `ab-expediente-dom-${pid}`;

/* ── componente principal ──────────────────────────────────────────────────── */
export default function ExpedienteMunicipalView({ projectId, access = 'edit' }: ToolProps) {
  const readOnly = access !== 'edit';
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [selectedDoc, setSelectedDoc] = useState<DocId>('declaracion');
  const [arquitecto, setArquitecto] = useState('');
  const [rutArquitecto, setRutArquitecto] = useState('');

  /* ── carga de datos propios del trámite ── */
  useEffect(() => {
    if (!project) return;
    const raw = localStorage.getItem(STORAGE_KEY(project.id));
    if (raw) {
      try {
        const d = JSON.parse(raw) as DatosTramite;
        setArquitecto(d.arquitecto ?? '');
        setRutArquitecto(d.rutArquitecto ?? '');
      } catch {
        // datos corruptos — ignorar
      }
    }
  }, [project?.id]);

  if (!project) return (
    <div><p className="tech-quote">Selecciona un proyecto para gestionar el Expediente Municipal.</p></div>
  );

  /* ── variables maestras sembradas desde el proyecto ── */
  const propietario = project.propietario || '';
  const direccion = project.direccion || '';
  const comuna = project.comuna || '';
  const superficie = superficieProyecto(project) || '';
  const presupuesto = project.presupuestoUF || '';

  const persistTramite = (next: DatosTramite) => {
    if (readOnly) return;
    localStorage.setItem(STORAGE_KEY(project.id), JSON.stringify(next));
  };
  const onArquitecto = (v: string) => { setArquitecto(v); persistTramite({ arquitecto: v, rutArquitecto }); };
  const onRut = (v: string) => { setRutArquitecto(v); persistTramite({ arquitecto, rutArquitecto: v }); };

  const docBtn = (id: DocId, label: string, last = false) => (
    <button onClick={() => setSelectedDoc(id)} className="technical-btn secondary" style={{ justifyContent: 'flex-start', border: 'none', borderBottom: last ? 'none' : '1.5px solid var(--border)', background: selectedDoc === id ? 'var(--muted)' : 'transparent', fontSize: 11, padding: 15 }}>
      {selectedDoc === id ? '◈' : '◇'} {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <style>{`@media print { body * { visibility: hidden; } #ab-printable-dom, #ab-printable-dom * { visibility: visible; } #ab-printable-dom { position: absolute; left: 0; top: 0; width: 21.59cm; min-height: 27.94cm; padding: 0 !important; border: none !important; background: #FFF !important; } }`}</style>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        <Icons.FileCheck size={22} strokeWidth={1.4} /> Expediente Municipal (DOM)
      </h1>
      <p className="tech-quote" style={{ marginBottom: 20 }}>
        Proyecto: <strong>{project.name}</strong> · Complete, verifique y exporte las carpetas de tramitación bajo el estándar OGUC.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {/* COLUMNA IZQUIERDA */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="tool-panel">
            <div className="module-header">| CARPETA DE DOCUMENTOS (DOM)</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {docBtn('declaracion', '1. DECLARACIÓN JURADA (ART 1.2.2)')}
              {docBtn('f231', '2. FORMULARIO 2-3.1 SOLICITUD DE PERMISO')}
              {docBtn('ine', '3. FORMULARIO EDIFICACIÓN INE', true)}
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header">| VERIFICACIÓN DE VARIABLES MAESTRAS</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="tech-input-group"><label>PROPIETARIO / CLIENTE</label><input type="text" className="tech-input" value={propietario} disabled placeholder="(Definir en Participantes)" /></div>
              <div className="tech-input-group"><label>ARQUITECTO PATROCINANTE</label><input type="text" className="tech-input" value={arquitecto} disabled={readOnly} onChange={e => onArquitecto(e.target.value)} placeholder="Nombre completo" /></div>
              <div className="tech-input-group"><label>RUT ARQUITECTO</label><input type="text" className="tech-input" value={rutArquitecto} disabled={readOnly} onChange={e => onRut(e.target.value)} placeholder="Ej: 12.345.678-9" /></div>
              <div className="tech-input-group"><label>DIRECCIÓN PREDIO</label><input type="text" className="tech-input" value={direccion} disabled placeholder="(Definir en Ubicación)" /></div>
              <div className="tech-input-group"><label>COMUNA</label><input type="text" className="tech-input" value={comuna} disabled placeholder="(Definir en Ubicación)" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="tech-input-group"><label>SUP. m²</label><input type="text" className="tech-input" value={superficie} disabled placeholder="0.0" /></div>
                <div className="tech-input-group"><label>PRESUPUESTO UF</label><input type="text" className="tech-input" value={presupuesto} disabled placeholder="0" /></div>
              </div>
              <p style={{ fontSize: 10, opacity: 0.6 }}>Las variables maestras se editan en sus herramientas de origen (Participantes, Ubicación, Datos del Proyecto).</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISOR IMPRIMIBLE */}
        <div style={{ flex: '2 1 550px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="tool-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="module-header" style={{ justifyContent: 'space-between' }}>
              <span>| VISTA PREVIA DEL REGISTRO IMPRIMIBLE</span>
              <button onClick={() => window.print()} className="technical-btn" style={{ padding: '4px 12px', fontSize: 10 }}>[ ⎙ IMPRIMIR / PDF ]</button>
            </div>
            <div style={{ padding: 30, background: 'var(--muted)', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              <div id="ab-printable-dom" style={{ width: '21.59cm', minHeight: '27.94cm', background: '#FFFFFF', border: '1.5px solid var(--border)', padding: '2cm', fontFamily: 'serif', color: '#000000', boxSizing: 'border-box' }}>

                {selectedDoc === 'declaracion' && (
                  <div style={{ fontSize: '12pt', lineHeight: 1.6, textAlign: 'justify' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3cm', fontSize: '14pt' }}>DECLARACIÓN JURADA SIMPLE DE CALIDAD Y DOMINIO<br />(ART. 1.2.2 OGUC)</div>
                    <p style={{ marginBottom: '1.5cm' }}>Yo, <strong>{propietario || '__________________________________'}</strong>, en mi calidad de propietario de la faena constructiva correspondiente al proyecto denominado temporalmente como <strong>{project.name?.toUpperCase() || '____________________'}</strong>, ubicado en la arteria vial de <strong>{direccion || '____________________'}</strong>, comuna de <strong>{comuna || '___________'}</strong>, declaro bajo mi total responsabilidad ante la Dirección de Obras Municipales ser titular civil del dominio predial.</p>
                    <p style={{ marginBottom: '3cm' }}>Asimismo, se ratifica que el Arquitecto Patrocinante del expediente técnico es Don/Doña <strong>{arquitecto || '__________________________________'}</strong>, cédula de identidad número <strong>{rutArquitecto || '___________'}</strong>, encargado de visar la planimetría paramétrica de superficies calculadas, las cuales computan un metraje estimado oficial de <strong>{superficie || '______'} m²</strong> con un presupuesto proyectado de <strong>{presupuesto || '______'} Unidades de Fomento</strong>.</p>
                    <div style={{ marginTop: '5cm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, textAlign: 'center' }}>
                      <div><div style={{ borderTop: '1px solid #000', width: '80%', margin: '2cm auto 0' }}></div><div style={{ fontSize: '10pt', marginTop: 10, fontWeight: 'bold' }}>FIRMA PROPIETARIO</div></div>
                      <div><div style={{ borderTop: '1px solid #000', width: '80%', margin: '2cm auto 0' }}></div><div style={{ fontSize: '10pt', marginTop: 10, fontWeight: 'bold' }}>FIRMA ARQUITECTO</div></div>
                    </div>
                  </div>
                )}

                {selectedDoc === 'f231' && (
                  <div style={{ fontFamily: 'monospace', fontSize: 10 }}>
                    <div style={{ border: '2px dashed #D32F2F', padding: 15, color: '#D32F2F', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>[ CAPA DE MONTAJE PARA FORMULARIO F2-3.1 DOM ]</div>
                    <p style={{ opacity: 0.6 }}>Los datos se posicionarán sobre las casillas del PDF original:</p>
                    <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>◈ CAMPO DOM DIRECCIÓN: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{direccion || '---'}</span></div>
                      <div>◈ CAMPO DOM PROPIETARIO: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{propietario || '---'}</span></div>
                      <div>◈ CAMPO DOM ARQUITECTO: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{arquitecto || '---'} (RUT: {rutArquitecto || '---'})</span></div>
                      <div>◈ CAMPO DOM SUPERFICIE: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{superficie || '---'} M²</span></div>
                    </div>
                  </div>
                )}

                {selectedDoc === 'ine' && (
                  <div style={{ fontSize: '11pt', lineHeight: 1.5 }}>
                    <div style={{ border: '1px solid #000', padding: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>INSTITUTO NACIONAL DE ESTADÍSTICAS (INE) - HOJA RESUMEN INTERNA</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                      <tbody>
                        <tr><td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold', width: '40%' }}>COMUNA:</td><td style={{ border: '1px solid #000', padding: 8 }}>{comuna || '---'}</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold' }}>DIRECCIÓN DE LA OBRA:</td><td style={{ border: '1px solid #000', padding: 8 }}>{direccion || '---'}</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold' }}>SUPERFICIE TOTAL (M²):</td><td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold' }}>{superficie || '0'} m²</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: 8, fontWeight: 'bold' }}>COSTO ESTIMADO REAL (UF):</td><td style={{ border: '1px solid #000', padding: 8 }}>{presupuesto || '0'} UF</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
