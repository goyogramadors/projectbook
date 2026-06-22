/* ExpedienteMunicipalView — recuperado de archibots---expediente-municipal (App.tsx).
   3 documentos DOM: Declaración Jurada Art.1.2.2 · Formulario 2-3.1 (Solicitud de
   Permiso de Edificación) · Formulario INE. Standalone + datos MOCK + impresión. */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

type DocTipo = 'declaracion' | 'f231' | 'ine';

export default function ExpedienteMunicipalView() {
  const [selectedDoc, setSelectedDoc] = useState<DocTipo>('declaracion');
  const [propietario, setPropietario] = useState('Inmobiliaria Lientur SpA');
  const [arquitecto, setArquitecto] = useState('Goyo Gramador');
  const [rutArquitecto, setRutArquitecto] = useState('12.345.678-9');
  const [direccion, setDireccion] = useState('Lientur 7345');
  const [comuna, setComuna] = useState('La Florida');
  const [superficie, setSuperficie] = useState('8.117,40');
  const [presupuesto, setPresupuesto] = useState('45.000');
  const proyectoNombre = 'EDIFICIO LOS ALERCES';

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; background:#FFF !important; }
          #printable-document-area, #printable-document-area * { visibility: visible; }
          #printable-document-area { position:absolute; left:0; top:0; width:21.59cm; min-height:27.94cm; padding:0 !important; border:none !important; }
        }
      `}</style>

      <p className="tech-quote" style={{ marginBottom: '18px' }}>
        Gestor de Expedientes Municipales. Complete las variables maestras y exporte las carpetas de tramitación: Declaración Jurada (Art. 1.2.2), Solicitud de Permiso (F 2-3.1) y Formulario INE, bajo el estándar OGUC chileno.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Columna izquierda: selector de documento + variables */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tool-panel">
            <div className="module-header">| CARPETA DE DOCUMENTOS (DOM)</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => setSelectedDoc('declaracion')} className="technical-btn secondary" style={{ justifyContent: 'flex-start', border: 'none', borderBottom: '1.5px solid var(--border-color)', backgroundColor: selectedDoc === 'declaracion' ? 'var(--bg-grey)' : 'transparent', fontSize: '11px', padding: '15px' }}>
                {selectedDoc === 'declaracion' ? '◈' : '◇'} 1. DECLARACIÓN JURADA SIMPLE (ART 1.2.2)
              </button>
              <button onClick={() => setSelectedDoc('f231')} className="technical-btn secondary" style={{ justifyContent: 'flex-start', border: 'none', borderBottom: '1.5px solid var(--border-color)', backgroundColor: selectedDoc === 'f231' ? 'var(--bg-grey)' : 'transparent', fontSize: '11px', padding: '15px' }}>
                {selectedDoc === 'f231' ? '◈' : '◇'} 2. SOLICITUD PERMISO EDIFICACIÓN (F 2-3.1)
              </button>
              <button onClick={() => setSelectedDoc('ine')} className="technical-btn secondary" style={{ justifyContent: 'flex-start', border: 'none', backgroundColor: selectedDoc === 'ine' ? 'var(--bg-grey)' : 'transparent', fontSize: '11px', padding: '15px' }}>
                {selectedDoc === 'ine' ? '◈' : '◇'} 3. FORMULARIO EDIFICACIÓN INE (ESTADÍSTICAS)
              </button>
            </div>
          </div>

          <div className="tool-panel">
            <div className="module-header">| VERIFICACIÓN DE VARIABLES MAESTRAS</div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="tech-input-group"><label>PROPIETARIO / CLIENTE</label><input type="text" className="tech-input" value={propietario} onChange={e => setPropietario(e.target.value)} /></div>
              <div className="tech-input-group"><label>ARQUITECTO PATROCINANTE</label><input type="text" className="tech-input" value={arquitecto} onChange={e => setArquitecto(e.target.value)} /></div>
              <div className="tech-input-group"><label>RUT ARQUITECTO</label><input type="text" className="tech-input" value={rutArquitecto} onChange={e => setRutArquitecto(e.target.value)} style={{ fontFamily: 'monospace' }} /></div>
              <div className="tech-input-group"><label>DIRECCIÓN PREDIO</label><input type="text" className="tech-input" value={direccion} onChange={e => setDireccion(e.target.value)} /></div>
              <div className="tech-input-group"><label>COMUNA</label><input type="text" className="tech-input" value={comuna} onChange={e => setComuna(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="tech-input-group"><label>SUP. m²</label><input type="text" className="tech-input" value={superficie} onChange={e => setSuperficie(e.target.value)} /></div>
                <div className="tech-input-group"><label>PRESUPUESTO UF</label><input type="text" className="tech-input" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: hoja imprimible */}
        <div style={{ flex: '2 1 520px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tool-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="module-header" style={{ justifyContent: 'space-between' }}>
              <span>| VISTA PREVIA DEL REGISTRO IMPRIMIBLE</span>
              <button onClick={() => window.print()} className="technical-btn" style={{ padding: '4px 12px', fontSize: '10px' }}><Icons.Printer size={12} strokeWidth={1.5} style={{ marginRight: '6px' }} /> [ IMPRIMIR / PDF ]</button>
            </div>
            <div style={{ padding: '30px', backgroundColor: 'var(--bg-grey)', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              <motion.div key={selectedDoc} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} id="printable-document-area" style={{ width: '21.59cm', minHeight: '27.94cm', backgroundColor: 'var(--card)', border: '1.5px solid var(--border-color)', padding: '2cm', fontFamily: 'serif', color: '#000', boxSizing: 'border-box' }}>

                {selectedDoc === 'declaracion' && (
                  <div style={{ fontSize: '12pt', lineHeight: 1.6, textAlign: 'justify' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3cm', fontSize: '14pt' }}>DECLARACIÓN JURADA SIMPLE DE CALIDAD Y DOMINIO<br />(ART. 1.2.2 OGUC)</div>
                    <p style={{ marginBottom: '1.5cm' }}>Yo, <strong>{propietario || '__________'}</strong>, en mi calidad de propietario de la faena constructiva correspondiente al proyecto denominado <strong>{proyectoNombre}</strong>, ubicado en <strong>{direccion || '__________'}</strong>, comuna de <strong>{comuna || '______'}</strong>, declaro bajo mi total responsabilidad ante la Dirección de Obras Municipales ser titular civil del dominio predial.</p>
                    <p style={{ marginBottom: '3cm' }}>Asimismo, se ratifica que el Arquitecto Patrocinante del expediente técnico es Don/Doña <strong>{arquitecto || '__________'}</strong>, cédula de identidad número <strong>{rutArquitecto || '______'}</strong>, encargado de visar la planimetría de superficies calculadas, las cuales computan un metraje estimado de <strong>{superficie || '____'} m²</strong> con un presupuesto proyectado de <strong>{presupuesto || '____'} Unidades de Fomento</strong>.</p>
                    <div style={{ marginTop: '5cm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', textAlign: 'center' }}>
                      <div><div style={{ borderTop: '1px solid #000', width: '80%', margin: '2cm auto 0' }}></div><div style={{ fontSize: '10pt', marginTop: '10px', fontWeight: 'bold' }}>FIRMA PROPIETARIO</div></div>
                      <div><div style={{ borderTop: '1px solid #000', width: '80%', margin: '2cm auto 0' }}></div><div style={{ fontSize: '10pt', marginTop: '10px', fontWeight: 'bold' }}>FIRMA ARQUITECTO</div></div>
                    </div>
                  </div>
                )}

                {selectedDoc === 'f231' && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                    <div style={{ border: '2px dashed #D32F2F', padding: '15px', color: '#D32F2F', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', marginBottom: '20px' }}>[ SOLICITUD DE PERMISO DE EDIFICACIÓN · CAPA F 2-3.1 DOM ]</div>
                    <p style={{ opacity: 0.6 }}>Los datos se posicionarán milimétricamente sobre las casillas del PDF oficial:</p>
                    <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>◈ CAMPO DOM DIRECCIÓN: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{direccion || '---'}</span></div>
                      <div>◈ CAMPO DOM PROPIETARIO: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{propietario || '---'}</span></div>
                      <div>◈ CAMPO DOM ARQUITECTO: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{arquitecto || '---'} (RUT: {rutArquitecto || '---'})</span></div>
                      <div>◈ CAMPO DOM SUPERFICIE: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{superficie || '---'} M²</span></div>
                      <div>◈ CAMPO DOM PRESUPUESTO: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{presupuesto || '---'} UF</span></div>
                    </div>
                  </div>
                )}

                {selectedDoc === 'ine' && (
                  <div style={{ fontSize: '11pt', lineHeight: 1.5 }}>
                    <div style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>INSTITUTO NACIONAL DE ESTADÍSTICAS (INE) - HOJA RESUMEN INTERNA</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                      <tbody>
                        <tr><td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '40%' }}>COMUNA:</td><td style={{ border: '1px solid #000', padding: '8px' }}>{comuna || '---'}</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>DIRECCIÓN DE LA OBRA:</td><td style={{ border: '1px solid #000', padding: '8px' }}>{direccion || '---'}</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>SUPERFICIE TOTAL (M²):</td><td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: 'red' }}>{superficie || '0'} m²</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>COSTO ESTIMADO REAL (UF):</td><td style={{ border: '1px solid #000', padding: '8px' }}>{presupuesto || '0'} UF</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
