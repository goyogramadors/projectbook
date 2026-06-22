/**
 * LegalView.tsx — Fase 5.7 · Textos Legales Reales (Regla §17)
 *
 * Cubre: Términos y Condiciones + Política de Privacidad
 * Contexto: Plataforma SaaS de arquitectura en Chile (ArchiBots)
 * — Responsabilidad limitada sobre cálculos de cabida/matemática OGUC
 * — Uso referencial; las DOM son la autoridad regulatoria vinculante
 * — Pasarela Stripe (pagos); persistencia en Firebase (Google Cloud)
 *
 * Uso desde App.tsx:
 *   <LegalView defaultTab="terminos" onClose={() => ...} />
 *   <LegalView defaultTab="privacidad" onClose={() => ...} />
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────────────────

type LegalTab = 'terminos' | 'privacidad';

interface LegalViewProps {
  defaultTab?: LegalTab;
  onClose?: () => void;
}

// ── Fecha de última actualización ────────────────────────────────────────────

const ULTIMA_ACTUALIZACION = '10 de junio de 2026';
const EMPRESA = 'ArchiBots SpA';
const CONTACTO = 'legal@archibots.cl';
const SITIO = 'https://www.archibots.cl';

// ── Componente principal ─────────────────────────────────────────────────────

export default function LegalView({ defaultTab = 'terminos', onClose }: LegalViewProps) {
  const [tab, setTab] = useState<LegalTab>(defaultTab);

  return (
    <motion.div
      className="tool-panel"
      style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Cabecera */}
      <div
        className="panel-content"
        style={{
          borderBottom: 'var(--border-thickness) solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 14,
        }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, marginBottom: 2 }}>
            {EMPRESA} · Documentos Legales
          </p>
          <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
            {tab === 'terminos' ? 'Términos y Condiciones de Uso' : 'Política de Privacidad'}
          </h2>
          <p style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>
        </div>
        {onClose && (
          <button
            className="ab-btn sec"
            onClick={onClose}
            title="Cerrar"
          >
            <Icons.X size={12} /> Cerrar
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
        {(['terminos', 'privacidad'] as LegalTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: 'none',
              borderRight: 'var(--border-thickness) solid var(--border)',
              cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            {t === 'terminos' ? 'Términos y Condiciones' : 'Política de Privacidad'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="panel-content" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <AnimatePresence mode="wait">
          {tab === 'terminos' ? (
            <motion.div key="terminos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Terminos />
            </motion.div>
          ) : (
            <motion.div key="privacidad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Privacidad />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Estilos internos ─────────────────────────────────────────────────────────

const S = {
  h3: { fontSize: 12, fontWeight: 800, textTransform: 'uppercase' as const, margin: '22px 0 8px', color: 'var(--foreground)' },
  p:  { fontSize: 12, lineHeight: 1.75, marginBottom: 10, color: 'var(--foreground)' },
  li: { fontSize: 12, lineHeight: 1.75, marginBottom: 4 },
  ul: { paddingLeft: 18, marginBottom: 12 },
  hr: { border: 'none', borderTop: 'var(--border-thickness) solid var(--border)', margin: '20px 0' },
  em: { background: 'var(--muted)', padding: '2px 6px', fontStyle: 'normal' as const, fontSize: 11, fontWeight: 700 },
};

// ── Términos y Condiciones ───────────────────────────────────────────────────

function Terminos() {
  return (
    <div>
      <p style={S.p}>
        Los presentes Términos y Condiciones de Uso (<strong>"Términos"</strong>) regulan el acceso y
        uso de la plataforma web ArchiBots, disponible en <strong>{SITIO}</strong>, operada por{' '}
        <strong>{EMPRESA}</strong>, empresa legalmente constituida en Chile conforme a la Ley N.º 3.918
        sobre Sociedades de Responsabilidad Limitada y sus modificaciones posteriores
        (<strong>"ArchiBots"</strong>, <strong>"nosotros"</strong> o <strong>"la Plataforma"</strong>).
      </p>
      <p style={S.p}>
        Al acceder o usar la Plataforma, usted (<strong>"Usuario"</strong>) acepta quedar vinculado por
        estos Términos. Si no está de acuerdo, debe abstenerse de utilizar la Plataforma.
      </p>

      <hr style={S.hr} />

      <h3 style={S.h3}>1. Objeto y descripción del servicio</h3>
      <p style={S.p}>
        ArchiBots es una herramienta de apoyo a la práctica de la arquitectura que ofrece, entre otras
        funciones: cálculo paramétrico de cabida y superficie edificable, estimación de honorarios
        profesionales, generación automatizada de documentos de encargo y consulta normativa
        georreferenciada basada en Planes Reguladores Comunales (PRC).
      </p>
      <p style={S.p}>
        Todos los resultados generados por la Plataforma tienen carácter{' '}
        <span style={S.em}>EXCLUSIVAMENTE REFERENCIAL E INFORMATIVO</span> y no constituyen, en ningún
        caso, un informe técnico oficial, una certificación, una resolución administrativa ni un
        documento con valor legal ante la Dirección de Obras Municipales (DOM), el Ministerio de
        Vivienda y Urbanismo (MINVU), ni ningún otro organismo regulador.
      </p>

      <h3 style={S.h3}>2. Exención de responsabilidad sobre cálculos y normativa</h3>
      <p style={S.p}>
        Los cálculos de cabida, coeficientes de constructibilidad, rasantes, distanciamientos,
        alturas máximas, porcentajes de ocupación de suelo y demás parámetros urbanísticos que
        entrega la Plataforma se basan en datos públicos de los PRC, en la Ordenanza General de
        Urbanismo y Construcciones (<strong>"OGUC"</strong>) y en algoritmos parametrizados internos.
        Estas fuentes pueden contener errores, estar desactualizadas o no reflejar modificaciones
        aprobadas pero no incorporadas a las bases de datos públicas.
      </p>
      <p style={S.p}>
        En consecuencia, <strong>{EMPRESA} no garantiza la exactitud, completitud, vigencia ni
        aplicabilidad de los resultados</strong> entregados por la Plataforma a un caso concreto.
        El Usuario es el único responsable de contrastar, verificar y validar cualquier dato o
        cálculo con la DOM competente, con los instrumentos de planificación territorial vigentes
        y con un profesional habilitado antes de presentar cualquier expediente, solicitar permisos
        o tomar decisiones de inversión.
      </p>
      <ul style={S.ul}>
        <li style={S.li}>ArchiBots no es responsable por errores, multas, rechazos de permisos, pérdidas económicas ni perjuicios de ninguna especie derivados del uso o de la confianza depositada en los resultados de la Plataforma.</li>
        <li style={S.li}>La Plataforma no reemplaza la consulta a un arquitecto colegiado ni la revisión directa ante la DOM.</li>
        <li style={S.li}>Los datos normativos son capturados de fuentes públicas y pueden diferir de la versión oficialmente vigente en cada municipio.</li>
      </ul>

      <h3 style={S.h3}>3. Planes, suscripciones y pagos</h3>
      <p style={S.p}>
        La Plataforma ofrece planes de acceso gratuitos y de pago. Los planes de pago son procesados
        a través de <strong>Stripe, Inc.</strong>, proveedor externo de servicios de pago con sede en
        Estados Unidos, sujeto a sus propios Términos de Servicio y Política de Privacidad. ArchiBots
        no almacena datos de tarjetas de crédito ni débito.
      </p>
      <ul style={S.ul}>
        <li style={S.li}>Los precios están expresados en pesos chilenos (CLP) e incluyen el IVA aplicable según la ley.</li>
        <li style={S.li}>Las suscripciones mensuales se renuevan automáticamente al inicio de cada período salvo cancelación previa.</li>
        <li style={S.li}>Los pagos únicos por proyecto no son reembolsables una vez activado el acceso Premium al proyecto.</li>
        <li style={S.li}>ArchiBots se reserva el derecho de modificar los precios con un aviso previo de al menos 30 días naturales.</li>
      </ul>

      <h3 style={S.h3}>4. Propiedad intelectual</h3>
      <p style={S.p}>
        Todo el contenido de la Plataforma —código fuente, algoritmos, diseño, textos, logotipos,
        bases de datos propietarias y documentación— es propiedad de <strong>{EMPRESA}</strong> o de
        sus licenciantes, y está protegido por la Ley N.º 17.336 sobre Propiedad Intelectual y sus
        modificaciones. Se prohíbe su reproducción, distribución o uso sin autorización expresa y
        por escrito.
      </p>
      <p style={S.p}>
        Los documentos generados por el Usuario a través de la Plataforma (contratos, memorias,
        planillas) son de propiedad del Usuario. ArchiBots conserva una licencia no exclusiva para
        el almacenamiento y procesamiento de dichos documentos con el único fin de prestar el servicio.
      </p>

      <h3 style={S.h3}>5. Uso aceptable</h3>
      <p style={S.p}>El Usuario se compromete a no:</p>
      <ul style={S.ul}>
        <li style={S.li}>Usar la Plataforma para fines ilícitos, fraudulentos o contrarios a la normativa chilena vigente.</li>
        <li style={S.li}>Intentar acceder a datos de otros usuarios, sistemas internos o bases de datos sin autorización.</li>
        <li style={S.li}>Reproducir, revender o distribuir las funcionalidades o resultados de la Plataforma con fines comerciales sin licencia.</li>
        <li style={S.li}>Introducir malware, scripts maliciosos o interferir con el funcionamiento de la infraestructura.</li>
      </ul>

      <h3 style={S.h3}>6. Disponibilidad del servicio</h3>
      <p style={S.p}>
        ArchiBots procura mantener la Plataforma disponible de forma continua, pero no garantiza una
        disponibilidad del 100%. La Plataforma puede interrumpirse por mantenimiento programado,
        fallas técnicas, eventos de fuerza mayor o causas ajenas al control de ArchiBots. En ningún
        caso ArchiBots será responsable por daños derivados de la indisponibilidad del servicio.
      </p>

      <h3 style={S.h3}>7. Modificación de los Términos</h3>
      <p style={S.p}>
        ArchiBots puede modificar estos Términos en cualquier momento. Los cambios serán comunicados
        con al menos 15 días de anticipación mediante aviso en la Plataforma y/o correo electrónico.
        El uso continuado de la Plataforma tras la fecha de vigencia de los nuevos Términos implica
        su aceptación.
      </p>

      <h3 style={S.h3}>8. Ley aplicable y jurisdicción</h3>
      <p style={S.p}>
        Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia
        derivada de su interpretación o cumplimiento se someterá a los Tribunales Ordinarios de
        Justicia de la ciudad de Santiago de Chile, con renuncia expresa a cualquier otro fuero
        que pudiera corresponder.
      </p>

      <h3 style={S.h3}>9. Contacto</h3>
      <p style={S.p}>
        Para consultas sobre estos Términos, contáctenos en: <strong>{CONTACTO}</strong>
      </p>
    </div>
  );
}

// ── Política de Privacidad ───────────────────────────────────────────────────

function Privacidad() {
  return (
    <div>
      <p style={S.p}>
        La presente Política de Privacidad (<strong>"Política"</strong>) describe cómo{' '}
        <strong>{EMPRESA}</strong> recopila, usa, almacena y protege la información personal de los
        Usuarios de la Plataforma ArchiBots (<strong>{SITIO}</strong>), en cumplimiento de la{' '}
        <strong>Ley N.º 19.628 sobre Protección de la Vida Privada</strong> (Chile) y sus
        modificaciones vigentes.
      </p>

      <hr style={S.hr} />

      <h3 style={S.h3}>1. Responsable del tratamiento</h3>
      <p style={S.p}>
        El responsable del tratamiento de sus datos personales es <strong>{EMPRESA}</strong>, con
        domicilio en Santiago de Chile. Contacto del responsable: <strong>{CONTACTO}</strong>
      </p>

      <h3 style={S.h3}>2. Datos que recopilamos</h3>
      <p style={S.p}>Recopilamos las siguientes categorías de datos:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong>Datos de cuenta:</strong> nombre, correo electrónico, contraseña (almacenada en hash), imagen de perfil opcional.</li>
        <li style={S.li}><strong>Datos de proyecto:</strong> nombre del proyecto, ubicación (dirección y coordenadas geográficas), datos catastrales, superficies y parámetros ingresados.</li>
        <li style={S.li}><strong>Datos de uso:</strong> herramientas utilizadas, frecuencia de acceso, errores reportados, preferencias de configuración.</li>
        <li style={S.li}><strong>Datos de pago:</strong> solo el token de transacción emitido por Stripe. No almacenamos números de tarjeta, CVV ni datos bancarios.</li>
        <li style={S.li}><strong>Datos de comunicación:</strong> mensajes enviados a través del formulario de feedback o al correo de soporte.</li>
        <li style={S.li}><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, cookies de sesión.</li>
      </ul>

      <h3 style={S.h3}>3. Finalidad del tratamiento</h3>
      <ul style={S.ul}>
        <li style={S.li}>Proveer, mantener y mejorar la Plataforma y sus funcionalidades.</li>
        <li style={S.li}>Gestionar la cuenta del Usuario y los proyectos asociados.</li>
        <li style={S.li}>Procesar pagos y gestionar suscripciones.</li>
        <li style={S.li}>Enviar comunicaciones transaccionales (confirmaciones, facturas, alertas de seguridad).</li>
        <li style={S.li}>Enviar comunicaciones de marketing, con previa autorización expresa del Usuario, quien puede revocarla en cualquier momento.</li>
        <li style={S.li}>Cumplir con obligaciones legales y requerimientos de autoridades competentes.</li>
      </ul>

      <h3 style={S.h3}>4. Almacenamiento y transferencia de datos</h3>
      <p style={S.p}>
        Los datos son almacenados en los servidores de <strong>Google Firebase (Firestore)</strong>,
        operado por Google LLC, con infraestructura en Estados Unidos y/o la región de Google Cloud
        seleccionada para el proyecto. Google LLC opera como encargado del tratamiento y cumple con
        los estándares ISO 27001, SOC 2/3 y las cláusulas contractuales tipo de la Unión Europea.
      </p>
      <p style={S.p}>
        Los pagos son procesados por <strong>Stripe, Inc.</strong>, sujeto a su propia Política de
        Privacidad (<a href="https://stripe.com/privacy" style={{ color: 'var(--primary)' }} target="_blank" rel="noreferrer">stripe.com/privacy</a>).
      </p>
      <p style={S.p}>
        No vendemos, arrendamos ni cedemos datos personales a terceros con fines comerciales.
        La transferencia internacional de datos se realiza únicamente a los proveedores descritos
        anteriormente y con las garantías adecuadas.
      </p>

      <h3 style={S.h3}>5. Cookies y tecnologías similares</h3>
      <p style={S.p}>
        Utilizamos cookies estrictamente necesarias para la autenticación y el funcionamiento de la
        sesión. No utilizamos cookies de seguimiento de terceros ni publicidad comportamental sin
        consentimiento previo. El Usuario puede gestionar las cookies desde la configuración de su
        navegador, aunque deshabilitar las cookies esenciales puede afectar el funcionamiento de la
        Plataforma.
      </p>

      <h3 style={S.h3}>6. Derechos del titular</h3>
      <p style={S.p}>
        Conforme a la Ley N.º 19.628 y sus modificaciones, el Usuario tiene derecho a:
      </p>
      <ul style={S.ul}>
        <li style={S.li}><strong>Acceso:</strong> solicitar información sobre los datos personales que conservamos.</li>
        <li style={S.li}><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
        <li style={S.li}><strong>Supresión:</strong> solicitar la eliminación de sus datos cuando no exista obligación legal de conservarlos.</li>
        <li style={S.li}><strong>Oposición:</strong> oponerse al tratamiento de sus datos para fines de marketing.</li>
        <li style={S.li}><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y de uso común.</li>
      </ul>
      <p style={S.p}>
        Para ejercer estos derechos, envíe su solicitud a <strong>{CONTACTO}</strong>, indicando su
        nombre, correo electrónico registrado y el derecho que desea ejercer. Responderemos en un
        plazo máximo de 15 días hábiles.
      </p>

      <h3 style={S.h3}>7. Seguridad</h3>
      <p style={S.p}>
        Implementamos medidas técnicas y organizativas razonables para proteger los datos personales
        contra acceso no autorizado, pérdida, alteración o divulgación: cifrado TLS en tránsito,
        reglas de seguridad de Firebase, autenticación multifactor opcional y revisiones periódicas
        de acceso. No obstante, ningún sistema de transmisión por Internet es 100% seguro; el Usuario
        asume este riesgo residual.
      </p>

      <h3 style={S.h3}>8. Retención de datos</h3>
      <p style={S.p}>
        Los datos de cuenta se conservan mientras la cuenta esté activa. Tras la eliminación de la
        cuenta, los datos se anonimizarán o eliminarán en un plazo de 30 días hábiles, salvo que
        exista obligación legal de conservarlos por un período mayor (e.g., documentos tributarios).
      </p>

      <h3 style={S.h3}>9. Menores de edad</h3>
      <p style={S.p}>
        La Plataforma está dirigida a profesionales mayores de 18 años. No recopilamos
        intencionalmente datos de menores. Si detectamos que un menor ha proporcionado datos sin
        autorización, los eliminaremos a la brevedad.
      </p>

      <h3 style={S.h3}>10. Modificaciones a esta Política</h3>
      <p style={S.p}>
        ArchiBots puede actualizar esta Política periódicamente. Los cambios materiales serán
        notificados con al menos 15 días de anticipación. La versión vigente siempre estará
        disponible en <strong>{SITIO}/legal/privacidad</strong>.
      </p>

      <h3 style={S.h3}>11. Contacto y reclamaciones</h3>
      <p style={S.p}>
        Para consultas, solicitudes o reclamaciones relacionadas con el tratamiento de sus datos
        personales, contáctenos en: <strong>{CONTACTO}</strong>
      </p>
    </div>
  );
}
