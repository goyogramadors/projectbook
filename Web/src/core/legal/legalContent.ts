/* legalContent.ts — Contenido legal VERSIONADO de Archibots.
 *
 * Fuente única de los textos de /legal/privacidad y /legal/terminos.
 * Conforme a Ley 19.628 (vigente) y Ley 21.719 (rige 01-12-2026), Chile.
 *
 * ⚠️ DATOS A COMPLETAR POR EL TITULAR antes de publicar (marcados como [PENDIENTE]):
 *   - Razón social / persona natural responsable y RUT
 *   - Domicilio legal
 *   - Correo del Delegado / canal de ejercicio de derechos (hoy: contacto@archibots.cl)
 * Estos textos son un borrador base sólido; deben ser validados por un abogado
 * antes de su publicación definitiva (no constituyen asesoría legal).
 *
 * Al modificar cualquier texto: subir `version` y `fechaVigencia` del documento
 * afectado (trazabilidad del consentimiento — Ley 21.719, deber de transparencia).
 */

export interface LegalSection {
  /** Encabezado de la sección. */
  h: string;
  /** Párrafos en texto plano (se renderizan escapados; sin HTML). */
  p: string[];
}

export interface LegalDoc {
  slug: 'privacidad' | 'terminos';
  titulo: string;
  version: string;
  /** ISO YYYY-MM-DD. */
  fechaVigencia: string;
  intro: string[];
  secciones: LegalSection[];
}

const RESPONSABLE =
  'Archibots ([PENDIENTE: razón social / persona natural], RUT [PENDIENTE]), ' +
  'en adelante "Archibots", "la Plataforma" o "nosotros", con domicilio en ' +
  '[PENDIENTE: domicilio legal], Chile.';

const CANAL_DERECHOS = 'contacto@archibots.cl';

// ─────────────────────────────────────────────────────────────────────────────
//  POLÍTICA DE PRIVACIDAD
// ─────────────────────────────────────────────────────────────────────────────

const PRIVACIDAD: LegalDoc = {
  slug: 'privacidad',
  titulo: 'Política de Privacidad',
  version: '1.0',
  fechaVigencia: '2026-06-26',
  intro: [
    `Esta Política de Privacidad describe cómo ${RESPONSABLE} trata los datos personales de las personas usuarias de la plataforma Archibots, disponible en archibots.cl (la "Plataforma").`,
    'El tratamiento de datos se realiza conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y, a partir de su entrada en vigencia el 1 de diciembre de 2026, a la Ley N° 21.719 que regula la protección y el tratamiento de los datos personales y crea la Agencia de Protección de Datos Personales (APDP).',
    'Al registrarte y utilizar la Plataforma aceptas las prácticas descritas en este documento.',
  ],
  secciones: [
    {
      h: '1. Responsable del tratamiento',
      p: [
        `El responsable del tratamiento de tus datos personales es ${RESPONSABLE}`,
        `Para cualquier consulta sobre esta Política o el ejercicio de tus derechos, puedes escribir a ${CANAL_DERECHOS}.`,
      ],
    },
    {
      h: '2. Qué datos recopilamos',
      p: [
        'Datos de identificación y cuenta: nombre y correo electrónico que entregas al registrarte o que obtenemos de tu proveedor de inicio de sesión (Google), e identificador de usuario.',
        'Datos de proyectos: la información que tú ingresas en la Plataforma sobre tus proyectos de arquitectura y construcción (nombre del proyecto, comuna, dirección, propietario, datos técnicos de las herramientas, archivos adjuntos que cargues).',
        'Datos de pago: cuando contratas un plan de pago, el procesamiento lo realiza un proveedor externo (Stripe). Archibots NO almacena los datos completos de tu tarjeta; solo conservamos el estado de tu suscripción y los identificadores de la transacción.',
        'Datos técnicos y de uso: dirección IP, tipo de dispositivo y navegador, fechas y horas de acceso, y registros de actividad necesarios para la seguridad y el funcionamiento del servicio.',
        'Regla de minimización: no recopilamos datos que no necesitemos para prestar el servicio. No tratamos datos sensibles ni datos de niños, niñas y adolescentes de forma intencional.',
      ],
    },
    {
      h: '3. Para qué usamos tus datos y base de licitud',
      p: [
        'Ejecución del contrato: crear y administrar tu cuenta, prestar las herramientas, guardar tus proyectos y gestionar tu plan. Base de licitud: ejecución del contrato que celebras con nosotros al aceptar los Términos y Condiciones.',
        'Gestión de pagos: procesar suscripciones y emitir comprobantes. Base de licitud: ejecución del contrato y cumplimiento de obligaciones legales.',
        'Comunicaciones operativas: enviarte invitaciones de colaboración, avisos del servicio y notificaciones de seguridad. Base de licitud: ejecución del contrato y consentimiento.',
        'Seguridad y prevención de abusos: mantener la integridad de la Plataforma, prevenir fraudes y aplicar límites de uso. Base de licitud: interés legítimo y cumplimiento de obligaciones de seguridad.',
        'Mejora del servicio: análisis agregado y estadístico del uso. Base de licitud: interés legítimo, tratando los datos de forma agregada o disociada cuando es posible.',
      ],
    },
    {
      h: '4. Con quién compartimos tus datos (encargados)',
      p: [
        'Para operar la Plataforma utilizamos proveedores que actúan como encargados del tratamiento, obligados contractualmente a tratar los datos solo según nuestras instrucciones:',
        'Google Firebase (Google LLC / Google Cloud): autenticación, base de datos, almacenamiento de archivos y funciones de servidor.',
        'Stripe: procesamiento de pagos y suscripciones.',
        'SendGrid (Twilio): envío de correos transaccionales (invitaciones y avisos).',
        'Google Maps Platform: visualización cartográfica dentro del geolocalizador normativo.',
        'Google Gemini API: asistencia generativa en herramientas que lo requieran, exclusivamente para procesar el texto que envías a esa función.',
        'No vendemos ni arrendamos tus datos personales a terceros con fines publicitarios.',
      ],
    },
    {
      h: '5. Transferencia internacional de datos',
      p: [
        'Algunos de nuestros proveedores procesan y almacenan información en servidores ubicados fuera de Chile. En esos casos exigimos garantías contractuales adecuadas de seguridad y confidencialidad, conforme a la normativa chilena de protección de datos.',
      ],
    },
    {
      h: '6. Plazo de conservación',
      p: [
        'Conservamos tus datos mientras tu cuenta permanezca activa y por el tiempo necesario para cumplir las finalidades descritas y nuestras obligaciones legales.',
        'Si eliminas tu cuenta o tus proyectos, eliminamos o disociamos los datos asociados dentro de un plazo razonable, salvo aquellos que debamos conservar por obligaciones legales, contables o de seguridad.',
      ],
    },
    {
      h: '7. Tus derechos',
      p: [
        'Como titular de los datos puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación (supresión) y oposición. Conforme a la Ley N° 21.719, también podrás ejercer los derechos de portabilidad y de bloqueo del tratamiento.',
        `Para ejercerlos, escribe a ${CANAL_DERECHOS} identificándote como titular. Responderemos dentro de los plazos legales. Si consideras que tus derechos no han sido respetados, podrás reclamar ante la Agencia de Protección de Datos Personales una vez que esta entre en funcionamiento.`,
      ],
    },
    {
      h: '8. Seguridad de la información',
      p: [
        'Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS), control de acceso por reglas de seguridad a nivel de fila (cada usuario solo accede a sus propios proyectos), autenticación gestionada por un proveedor especializado, límites de tasa contra abusos y verificación de integridad de las solicitudes (App Check).',
        'Ningún sistema es completamente infalible. En caso de una vulneración de seguridad que afecte tus datos personales, te notificaremos y comunicaremos a la autoridad competente conforme exige la normativa vigente.',
      ],
    },
    {
      h: '9. Cookies y almacenamiento local',
      p: [
        'La Plataforma utiliza almacenamiento local del navegador (localStorage / IndexedDB) y cookies estrictamente necesarias para mantener tu sesión, recordar tus preferencias (por ejemplo, el tema visual) y, en el plan gratuito, guardar localmente los datos de tus herramientas. No utilizamos cookies de publicidad de terceros.',
      ],
    },
    {
      h: '10. Cambios a esta Política',
      p: [
        'Podemos actualizar esta Política para reflejar cambios legales o del servicio. Publicaremos la versión vigente en esta misma página, indicando su número de versión y fecha. Si los cambios son sustanciales, te lo informaremos por los medios de contacto disponibles.',
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  TÉRMINOS Y CONDICIONES
// ─────────────────────────────────────────────────────────────────────────────

const TERMINOS: LegalDoc = {
  slug: 'terminos',
  titulo: 'Términos y Condiciones',
  version: '1.0',
  fechaVigencia: '2026-06-26',
  intro: [
    `Estos Términos y Condiciones (los "Términos") regulan el acceso y uso de la plataforma Archibots (la "Plataforma"), operada por ${RESPONSABLE}`,
    'Al crear una cuenta o utilizar la Plataforma, declaras haber leído, comprendido y aceptado estos Términos y nuestra Política de Privacidad. Si no estás de acuerdo, no debes usar la Plataforma.',
  ],
  secciones: [
    {
      h: '1. Objeto del servicio',
      p: [
        'Archibots es una aplicación web para organizar la información de proyectos de arquitectura y construcción, que ofrece herramientas de cálculo, generación de documentos y consulta normativa geolocalizada.',
        'Las herramientas entregan resultados de carácter referencial y de apoyo a la gestión. No reemplazan la revisión, el criterio ni la responsabilidad de un profesional competente, ni la tramitación o aprobación ante los organismos públicos correspondientes.',
      ],
    },
    {
      h: '2. Cuenta de usuario y elegibilidad',
      p: [
        'Para usar la Plataforma debes registrarte con datos veraces y mantener la confidencialidad de tus credenciales. Eres responsable de toda actividad realizada bajo tu cuenta.',
        'Debes ser mayor de edad y tener capacidad legal para contratar. Notifícanos de inmediato ante cualquier uso no autorizado de tu cuenta.',
      ],
    },
    {
      h: '3. Planes, pagos y reembolsos',
      p: [
        'La Plataforma ofrece un plan gratuito (Free) y planes de pago (Premium) con funcionalidades adicionales. Los pagos se procesan a través de Stripe; al contratar un plan aceptas también las condiciones del procesador de pagos.',
        'Las suscripciones se renuevan según la periodicidad contratada, salvo que canceles antes del siguiente ciclo. La cancelación detiene futuras renovaciones; mantienes el acceso Premium hasta el fin del período ya pagado.',
        'Conforme a la normativa de protección al consumidor aplicable, podrás solicitar reembolso en los casos que la ley contempla. Salvo dichos casos, los períodos ya iniciados no son reembolsables. Para gestionar un reembolso, escribe a ' + CANAL_DERECHOS + '.',
      ],
    },
    {
      h: '4. Uso aceptable',
      p: [
        'Te comprometes a usar la Plataforma conforme a la ley y a estos Términos. Queda prohibido, entre otros: (a) intentar vulnerar la seguridad o el control de acceso; (b) acceder a datos de otros usuarios; (c) introducir código malicioso; (d) realizar ingeniería inversa o uso automatizado abusivo; (e) sobrecargar la infraestructura o eludir los límites de uso; (f) utilizar la Plataforma para fines ilícitos o que infrinjan derechos de terceros.',
      ],
    },
    {
      h: '5. Contenido del usuario',
      p: [
        'Conservas la titularidad de la información y los archivos que cargas ("Contenido del Usuario"). Nos otorgas una licencia limitada para alojar y procesar dicho contenido con el único fin de prestarte el servicio.',
        'Declaras que cuentas con los derechos necesarios sobre el Contenido del Usuario y eres responsable de su legalidad y exactitud.',
      ],
    },
    {
      h: '6. Propiedad intelectual',
      p: [
        'La Plataforma, su software, diseño, marca, logotipos y herramientas son de propiedad de Archibots o sus licenciantes y están protegidos por la legislación de propiedad intelectual e industrial. No se concede ningún derecho sobre ellos más allá del uso permitido por estos Términos.',
      ],
    },
    {
      h: '7. Disponibilidad del servicio',
      p: [
        'La Plataforma se ofrece "tal cual" y "según disponibilidad". Procuramos una operación continua, pero no garantizamos que el servicio sea ininterrumpido o libre de errores. Podemos realizar mantenimientos, actualizaciones o suspensiones temporales.',
      ],
    },
    {
      h: '8. Limitación de responsabilidad',
      p: [
        'En la máxima medida permitida por la ley, Archibots no será responsable de daños indirectos, lucro cesante, pérdida de datos o perjuicios derivados del uso o la imposibilidad de uso de la Plataforma, ni de decisiones tomadas a partir de los resultados referenciales entregados por las herramientas.',
        'La responsabilidad total de Archibots, en cualquier caso, se limitará al monto efectivamente pagado por el usuario en los doce meses anteriores al hecho que origine la reclamación.',
        'Nada en estos Términos excluye responsabilidades que no puedan limitarse conforme a la legislación chilena, incluidos los derechos del consumidor.',
      ],
    },
    {
      h: '9. Suspensión y término',
      p: [
        'Podemos suspender o cancelar tu cuenta ante incumplimientos de estos Términos o usos que pongan en riesgo la seguridad o a otros usuarios. Puedes terminar tu relación con la Plataforma cerrando tu cuenta en cualquier momento.',
      ],
    },
    {
      h: '10. Modificaciones',
      p: [
        'Podemos modificar estos Términos. Publicaremos la versión vigente en esta página con su número de versión y fecha. Los cambios sustanciales se comunicarán por medios razonables. El uso continuado tras la entrada en vigencia implica su aceptación.',
      ],
    },
    {
      h: '11. Ley aplicable y jurisdicción',
      p: [
        'Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales ordinarios de justicia competentes, sin perjuicio de los derechos irrenunciables del consumidor.',
        `Contacto: ${CANAL_DERECHOS}.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<'privacidad' | 'terminos', LegalDoc> = {
  privacidad: PRIVACIDAD,
  terminos: TERMINOS,
};
