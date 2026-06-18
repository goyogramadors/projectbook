/* =============================================================================
   GeneradorContratosView.tsx — GENERADOR DE CONTRATOS (T-45 / id: contratos)
   -----------------------------------------------------------------------------
   Contrato visual 1:1 con el Mockup. Autosiembra los campos del ProjectMaster
   activo (name → nombreProyecto, dirección, propietario → nombreMandante).
   El documento HTML es @media-print limpio y compatible con DocPrintService (F4).
   ============================================================================= */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Edit2,
  FileText,
  Handshake,
  Printer,
  Save,
  Trash2,
} from 'lucide-react';
import { useProjects } from '../core/db/ProjectProvider';
import type { ToolProps } from '../core/types';

/* ── tipos locales ─────────────────────────────────────────────────────────── */
interface ContractFormData {
  fechaContrato: string;
  nombreMandante: string;
  rutMandante: string;
  direccionMandante: string;
  nombreOficina: string;
  nombreArquitecto: string;
  rutArquitecto: string;
  direccionArquitecto: string;
  nombreProyecto: string;
  direccionProyecto: string;
  precioServicios: string;
  impuesto: string;
  pago1: string;
  pago2: string;
  pago3: string;
  pago4: string;
  pago5: string;
}

interface SavedContract {
  id: string;
  resultTitle: string;
  mandante: string;
  precio: string;
  data: ContractFormData;
}

/* ── estado inicial base (mismo contrato que el Mockup) ────────────────────── */
const BASE_FORM: ContractFormData = {
  fechaContrato: new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  nombreMandante: '',
  rutMandante: '',
  direccionMandante: '',
  nombreOficina: 'Estudio de Arquitectura',
  nombreArquitecto: '',
  rutArquitecto: '',
  direccionArquitecto: '',
  nombreProyecto: '',
  direccionProyecto: '',
  precioServicios: '',
  impuesto: '15.25',
  pago1: '20%',
  pago2: '20%',
  pago3: '20%',
  pago4: '20%',
  pago5: '20%',
};

const MOCK_CONTRACTS: SavedContract[] = [
  {
    id: 'c1',
    resultTitle: 'Contrato V1 — Definitivo',
    mandante: 'Inmobiliaria Lientur SpA',
    precio: '45.000 UF',
    data: {
      ...BASE_FORM,
      nombreMandante: 'Inmobiliaria Lientur SpA',
      rutMandante: '76.543.210-K',
      direccionMandante: 'Av. Apoquindo 4501, Las Condes',
      nombreProyecto: 'Edificio Los Alerces',
      direccionProyecto: 'Lientur 7345, La Florida',
      precioServicios: '45.000 UF',
    },
  },
];

/* ── estilos compactos reutilizados ────────────────────────────────────────── */
const cInput: React.CSSProperties = { padding: '4px 8px', fontSize: '11px', height: '28px' };
const cLabel: React.CSSProperties = { fontSize: '9px', marginBottom: '2px', opacity: 0.8 };

/* ── highlight de variable en el documento ──────────────────────────────────── */
function V({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        backgroundColor: 'rgba(211,47,47,0.08)',
        borderBottom: '1.5px dashed var(--accent-red)',
        padding: '0 4px',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '10pt',
        fontWeight: 'bold',
        color: 'var(--accent-red)',
      }}
    >
      {children}
    </span>
  );
}

const DOTS = (n = 20) => '.'.repeat(n);

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════════ */
export default function GeneradorContratosView({ projectId }: ToolProps) {
  const { getProject } = useProjects();
  const project = getProject(projectId);

  const [formData, setFormData] = useState<ContractFormData>(BASE_FORM);
  const [contractName, setContractName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedContract[]>(MOCK_CONTRACTS);

  /* ── siembra datos del ProjectMaster activo ── */
  useEffect(() => {
    if (!project) return;
    setFormData((prev) => ({
      ...prev,
      nombreMandante: project.propietario || prev.nombreMandante,
      nombreProyecto: project.name || prev.nombreProyecto,
      direccionProyecto:
        project.direccion
          ? `${project.direccion}, ${project.comuna}`
          : prev.direccionProyecto,
      precioServicios: project.presupuestoUF
        ? `${project.presupuestoUF} UF`
        : prev.precioServicios,
    }));
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── handlers ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!contractName.trim()) return;
    const entry: SavedContract = {
      id: editingId ?? `c-${Date.now()}`,
      resultTitle: contractName,
      mandante: formData.nombreMandante || 'No definido',
      precio: formData.precioServicios || '—',
      data: { ...formData },
    };
    setSaved((prev) =>
      editingId ? prev.map((c) => (c.id === editingId ? entry : c)) : [entry, ...prev],
    );
    setEditingId(null);
    setContractName('');
  };

  const handleEdit = (c: SavedContract) => {
    setFormData({ ...c.data });
    setContractName(c.resultTitle);
    setEditingId(c.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setContractName('');
  };

  const handleDelete = (id: string) => setSaved((prev) => prev.filter((c) => c.id !== id));

  const handlePrint = () => window.print();

  /* ── render ── */
  return (
    <div style={{ marginTop: 0 }}>
      {/* ── ESTILOS DE DOCUMENTO / PRINT ── */}
      <style>{`
        .ab-doc-wrapper {
          background: #fff;
          color: #000;
          padding: 4rem 3rem;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.6;
          min-height: 297mm;
          border: 1.5px solid var(--border-color);
        }
        .ab-doc-title {
          text-align: center;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 2.5rem;
          font-size: 13pt;
        }
        .ab-doc-clause {
          margin-top: 1.5rem;
          text-align: justify;
        }
        .ab-doc-clause strong { text-transform: uppercase; }
        .ab-doc-sigs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 6rem;
          text-align: center;
          gap: 2rem;
        }
        .ab-doc-sig-line {
          border-top: 1px solid #000;
          width: 80%;
          margin: 0 auto 0.5rem auto;
        }
        @media print {
          body * { visibility: hidden; }
          .ab-doc-wrapper,
          .ab-doc-wrapper * { visibility: visible; }
          .ab-doc-wrapper {
            position: absolute;
            left: 0; top: 0;
            padding: 2cm;
            border: none;
            min-height: auto;
            width: 100%;
          }
        }
      `}</style>

      {/* ENCABEZADO */}
      <div className="free-text-section" style={{ marginBottom: '20px' }}>
        <h1
          className="page-main-title"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Handshake size={24} strokeWidth={1.2} />
          GENERADOR DE CONTRATO TIPO{' '}
          <span className="tech-pulse" style={{ color: 'var(--accent-red)' }}>
            _
          </span>
        </h1>
        {project && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '11px',
              opacity: 0.6,
              fontFamily: 'monospace',
            }}
          >
            PROYECTO: {project.name.toUpperCase()} · PROPIETARIO:{' '}
            {project.propietario || '—'}
          </p>
        )}
      </div>

      {/* GRID PRINCIPAL: formulario izq · vista previa der */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* ── COLUMNA IZQUIERDA: FORMULARIOS ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '82vh',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {/* 01. MANDANTE */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="tool-panel">
              <div
                className="module-header"
                style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}
              >
                | 01. DATOS DEL MANDANTE
              </div>
              <div
                className="panel-content"
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>FECHA DEL CONTRATO</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="fechaContrato"
                    value={formData.fechaContrato}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}
                >
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>MANDANTE / PROPIETARIO</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="nombreMandante"
                      value={formData.nombreMandante}
                      onChange={handleChange}
                      style={cInput}
                    />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>RUT MANDANTE</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="rutMandante"
                      value={formData.rutMandante}
                      onChange={handleChange}
                      style={{ ...cInput, textAlign: 'right', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>DIRECCIÓN COMPLETA MANDANTE</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="direccionMandante"
                    value={formData.direccionMandante}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 02. ARQUITECTO */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="tool-panel">
              <div
                className="module-header"
                style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}
              >
                | 02. DATOS DEL ARQUITECTO
              </div>
              <div
                className="panel-content"
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}
                >
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>NOMBRE ARQUITECTO</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="nombreArquitecto"
                      value={formData.nombreArquitecto}
                      onChange={handleChange}
                      style={cInput}
                    />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>RUT ARQUITECTO</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="rutArquitecto"
                      value={formData.rutArquitecto}
                      onChange={handleChange}
                      style={{ ...cInput, textAlign: 'right', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>OFICINA DE ARQUITECTURA</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="nombreOficina"
                    value={formData.nombreOficina}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>DIRECCIÓN ARQUITECTO</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="direccionArquitecto"
                    value={formData.direccionArquitecto}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 03. PROYECTO Y HONORARIOS */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="tool-panel">
              <div
                className="module-header"
                style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}
              >
                | 03. PROYECTO Y HONORARIOS
              </div>
              <div
                className="panel-content"
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>NOMBRE DEL PROYECTO</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="nombreProyecto"
                    value={formData.nombreProyecto}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
                <div className="tech-input-group" style={{ marginBottom: 0 }}>
                  <label style={cLabel}>DIRECCIÓN DEL PROYECTO</label>
                  <input
                    type="text"
                    className="tech-input"
                    name="direccionProyecto"
                    value={formData.direccionProyecto}
                    onChange={handleChange}
                    style={cInput}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '8px',
                    marginTop: '4px',
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '8px',
                  }}
                >
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>HONORARIOS TOTALES (UF/CLP)</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="precioServicios"
                      value={formData.precioServicios}
                      onChange={handleChange}
                      style={{
                        ...cInput,
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--accent-red)',
                      }}
                    />
                  </div>
                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label style={cLabel}>% RETENCIÓN</label>
                    <input
                      type="text"
                      className="tech-input"
                      name="impuesto"
                      value={formData.impuesto}
                      onChange={handleChange}
                      style={{ ...cInput, textAlign: 'right', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '4px',
                    marginTop: '4px',
                  }}
                >
                  {(['pago1', 'pago2', 'pago3', 'pago4', 'pago5'] as const).map(
                    (pago, idx) => (
                      <div
                        className="tech-input-group"
                        style={{ marginBottom: 0 }}
                        key={pago}
                      >
                        <label style={{ ...cLabel, fontSize: '8px' }}>
                          PAGO {idx + 1}
                        </label>
                        <input
                          type="text"
                          className="tech-input"
                          name={pago}
                          value={formData[pago]}
                          onChange={handleChange}
                          style={{ ...cInput, textAlign: 'right', fontSize: '10px' }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* GUARDAR */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="tool-panel">
              <div
                className="module-header"
                style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}
              >
                | GUARDAR Y REGISTRAR
              </div>
              <div className="panel-content" style={{ padding: '12px' }}>
                <div className="tech-input-group" style={{ marginBottom: '8px' }}>
                  <label style={cLabel}>IDENTIFICADOR DEL CONTRATO</label>
                  <input
                    type="text"
                    className="tech-input"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="Ej: Contrato V1 — Definitivo"
                    style={cInput}
                  />
                </div>
                <button
                  className="technical-btn"
                  onClick={handleSave}
                  disabled={!contractName.trim()}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '10px',
                    backgroundColor: editingId ? '#10B981' : undefined,
                    borderColor: editingId ? '#10B981' : undefined,
                  }}
                >
                  <Save
                    size={14}
                    strokeWidth={1.5}
                    style={{ marginRight: '6px' }}
                  />
                  {editingId
                    ? '[ ACTUALIZAR CONTRATO ]'
                    : '[ GUARDAR EN EXPEDIENTE ]'}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancel}
                    className="technical-btn secondary"
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '6px',
                      fontSize: '10px',
                    }}
                  >
                    [ CANCELAR EDICIÓN ]
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* HISTORIAL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="tool-panel">
              <div
                className="module-header"
                style={{ padding: '6px 12px', fontSize: '11px', minHeight: 'auto' }}
              >
                | HISTORIAL DE CONTRATOS ({saved.length})
              </div>
              <div className="panel-content" style={{ padding: '12px' }}>
                {saved.length === 0 ? (
                  <div
                    style={{
                      opacity: 0.5,
                      textAlign: 'center',
                      margin: '10px 0',
                      fontWeight: 'bold',
                      fontSize: '10px',
                    }}
                  >
                    SIN CONTRATOS GUARDADOS
                  </div>
                ) : (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    {saved.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          border: '1.5px solid var(--border-color)',
                          padding: '10px',
                          backgroundColor:
                            editingId === c.id ? 'var(--bg-grey)' : 'var(--card)',
                        }}
                      >
                        <h4
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <FileText
                            size={10}
                            style={{
                              display: 'inline',
                              marginRight: '4px',
                              verticalAlign: 'text-bottom',
                            }}
                          />{' '}
                          {c.resultTitle}
                        </h4>
                        <p
                          style={{
                            margin: '2px 0',
                            fontFamily: 'monospace',
                            fontSize: '9px',
                          }}
                        >
                          <strong>A:</strong> {c.mandante}
                        </p>
                        <p
                          style={{
                            margin: '2px 0',
                            fontFamily: 'monospace',
                            fontSize: '9px',
                          }}
                        >
                          <strong>POR:</strong> {c.precio}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: '5px',
                            marginTop: '8px',
                            borderTop: '1px dashed var(--border-color)',
                            paddingTop: '6px',
                          }}
                        >
                          <button
                            onClick={() => handleEdit(c)}
                            className="technical-btn secondary"
                            style={{
                              flex: 1,
                              padding: '2px',
                              fontSize: '9px',
                              display: 'flex',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            <Edit2 size={10} strokeWidth={1.5} /> [ EDITAR ]
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="technical-btn secondary"
                            style={{
                              padding: '2px 6px',
                              fontSize: '9px',
                              color: 'var(--accent-red)',
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={10} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── COLUMNA DERECHA: VISTA PREVIA DEL DOCUMENTO ── */}
        <div
          className="tool-panel"
          style={{
            height: '82vh',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 0,
          }}
        >
          <div
            className="module-header"
            style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px' }}
          >
            <span>| VISTA PREVIA DEL DOCUMENTO LEGAL</span>
            <button
              className="technical-btn"
              onClick={handlePrint}
              style={{ padding: '2px 10px', fontSize: '10px' }}
            >
              <Printer size={12} strokeWidth={1.5} style={{ marginRight: '6px' }} />[ IMPRIMIR PDF ]
            </button>
          </div>
          <div
            className="panel-content"
            style={{
              backgroundColor: 'var(--background)',
              padding: '2rem',
              flexGrow: 1,
              overflowY: 'auto',
            }}
          >
            <div className="ab-doc-wrapper">
              <div className="ab-doc-title">
                CONTRATO DE PROYECTO DE ARQUITECTURA
              </div>

              <div className="ab-doc-clause">
                En Santiago a{' '}
                <V>{formData.fechaContrato || DOTS(18)}</V>, entre{' '}
                <V>{formData.nombreMandante || DOTS(22)}</V>, RUT{' '}
                <V>{formData.rutMandante || DOTS(12)}</V>, domiciliado en{' '}
                <V>{formData.direccionMandante || DOTS(40)}</V>, en adelante EL
                MANDANTE y{' '}
                <V>{formData.nombreArquitecto || DOTS(22)}</V> en representación
                de <V>{formData.nombreOficina || DOTS(22)}</V>, domiciliado en{' '}
                <V>{formData.direccionArquitecto || DOTS(40)}</V>, en adelante la
                OFICINA DE ARQUITECTOS se ha convenido el siguiente Contrato de
                Prestación de Servicios Profesionales.
              </div>

              <div className="ab-doc-clause">
                <strong>PRIMERO:</strong>
                <br />
                El mandante es arrendatario/propietario de la propiedad ubicada en{' '}
                <V>{formData.direccionProyecto || DOTS(40)}</V>.
              </div>

              <div className="ab-doc-clause">
                <strong>SEGUNDO:</strong>
                <br />
                El mandante encarga en el presente contrato a{' '}
                <V>{formData.nombreOficina || DOTS(22)}</V>, OFICINA DE
                ARQUITECTOS, el proyecto{' '}
                <V>{formData.nombreProyecto || DOTS(22)}</V>.
              </div>

              <div className="ab-doc-clause">
                <strong>TERCERO:</strong>
                <br />
                Por el presente contrato LA OFICINA DE ARQUITECTOS, se obliga a lo
                siguiente:
                <br />
                1.- Ejecutar el proyecto de arquitectura.
                <br />
                2.- Coordinar las especialidades.
                <br />
                3.- Supervisar las obras de remodelación.
                <br />
                4.- Tramitar el Permiso de Edificación ante la municipalidad
                respectiva.
              </div>

              <div className="ab-doc-clause">
                <strong>CUARTO:</strong>
                <br />
                Por la ejecución del proyecto, se ha convenido un valor total
                estimado de: <V>{formData.precioServicios || DOTS(14)}</V>, más
                impuesto de servicios profesionales del{' '}
                <V>{formData.impuesto || DOTS(4)}</V>%, que debe ser aprobado por
                las partes en el acto de firma del contrato.
                <br />
                <br />
                Este valor comprende los siguientes ítems:
                <br />
                HONORARIOS: Diseño de Arquitectura, Permiso Municipal y supervisión
                de obra.
              </div>

              <div className="ab-doc-clause">
                <strong>QUINTO:</strong>
                <br />
                La forma de pago será la siguiente:
                <br />
                <br />
                20% del total, PRIMER ESTADO DE PAGO (INICIO):{' '}
                <V>{formData.pago1}</V> más impuesto.
                <br />
                20% del total, SEGUNDO ESTADO DE PAGO (INGRESO MUNICIPAL):{' '}
                <V>{formData.pago2}</V> más impuesto.
                <br />
                20% del total, TERCER ESTADO DE PAGO (PERMISO MUNICIPAL):{' '}
                <V>{formData.pago3}</V> más impuesto.
                <br />
                20% del total, CUARTO ESTADO DE PAGO (TÉRMINO DE OBRA):{' '}
                <V>{formData.pago4}</V> más impuesto.
                <br />
                20% del total, QUINTO ESTADO DE PAGO (RECEPCIÓN FINAL):{' '}
                <V>{formData.pago5}</V> más impuesto.
                <br />
                <br />
                Cualquier aumento de encargos significará un acuerdo previo de los
                costos correspondientes de honorarios adicionales.
              </div>

              <div className="ab-doc-clause">
                <strong>SÉPTIMO:</strong>
                <br />
                Cualquier dificultad que se suscite entre las partes en relación a
                este contrato o con motivo de su interpretación, aplicación,
                cumplimiento, terminación o por cualquier otra causa, será resuelta
                en única instancia y sin forma de juicio, en calidad de árbitro
                arbitrador o amigable componedor, por el comité de ética del
                COLEGIO DE ARQUITECTOS de CHILE, quién acepta dicho compromiso.
              </div>

              <div className="ab-doc-sigs">
                <div>
                  <div className="ab-doc-sig-line" />
                  <strong>PROPIETARIO / MANDANTE</strong>
                  <br />
                  <V>{formData.nombreMandante || DOTS(22)}</V>
                  <br />
                  RUT: <V>{formData.rutMandante || DOTS(12)}</V>
                </div>
                <div>
                  <div className="ab-doc-sig-line" />
                  <strong>ARQUITECTO</strong>
                  <br />
                  <V>{formData.nombreArquitecto || DOTS(22)}</V>
                  <br />
                  RUT: <V>{formData.rutArquitecto || DOTS(12)}</V>
                </div>
              </div>

              <div
                className="ab-doc-clause"
                style={{ marginTop: '4rem', textAlign: 'left' }}
              >
                Santiago, <V>{formData.fechaContrato || DOTS(18)}</V>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
