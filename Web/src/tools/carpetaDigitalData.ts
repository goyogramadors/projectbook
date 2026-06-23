/* =============================================================================
   carpetaDigitalData.ts — Glosario Normativo Carpeta Digital del Contrato (MOP)
   -----------------------------------------------------------------------------
   // Datos generados desde el prototipo (DESARROLLO) — textos literales de los
   // manuales MOP. Arbol numerado por tipo de contrato (n = numero de carpeta).
   // Fuente: GLOSARIO_Normativo_ObraDigital.md / index.html (CONTRACTS).
   ============================================================================= */

export interface CDFolder { n: string; l: string; f: string[]; c?: CDFolder[]; }
export interface CDContract { key: string; name: string; tree: CDFolder[]; }

export const CARPETA_CONTRATOS: CDContract[] = [
  { key: "obras", name: "Obras y Conservación", tree: [
    { n: "1", l: "Licitación", f: ["Bases administrativas, términos de referencia","Resolución aprueba anexo complementario","Antecedentes técnicos","Presupuesto oficial (planilla editable)","Publicación licitación","Actas y/o certificados visita a terreno","Serie de preguntas-respuestas y aclaraciones","Informe de inspeccionabilidad"], c: [
      { n: "1-1", l: "Otros antecedentes de la licitación", f: [] }
    ] },
    { n: "2", l: "Adjudicación", f: ["Nombramiento comisión apertura y evaluación","Acta apertura ofertas técnicas y económicas","Boletas garantía seriedad oferta","Evaluación de ofertas técnicas y económicas","Informe o acta de adjudicación","Oferta técnica contratista adjudicado","Oferta económica contratista adjudicado","Resolución de adjudicación","Resolución nombramiento IF","Notificación al contratista","Planos"], c: [
      { n: "2-1", l: "Otros antecedentes de la adjudicación", f: [] }
    ] },
    { n: "3", l: "Oficialización del Contrato", f: ["Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización","Constancia suscripción antecedentes","Comunicaciones para la entrega de terreno (Contratista, IF)","Comunicación al Registro de Contratistas"], c: [
      { n: "3-1", l: "Otros antecedentes", f: [] }
    ] },
    { n: "4", l: "Garantías", f: [], c: [
      { n: "4-1", l: "Garantía fiel cumplimiento", f: ["Trámite garantía","Ajuste garantía por modificaciones","Garantía adicional"] },
      { n: "4-2", l: "Poliza responsabilidad civil", f: ["Trámite póliza RC","Ajuste póliza RC por modificaciones"] },
      { n: "4-3", l: "Póliza todo riesgo de construcción", f: ["Trámite póliza TRC","Ajuste póliza TRC por modificaciones"] },
      { n: "4-4", l: "Garantía canje retenciones", f: ["Trámite garantía canje-1","Trámite garantía canje-\"n\""] },
      { n: "4-5", l: "Garantía canje anticipo", f: ["Trámite garantía canje anticipo","Otros antecedentes"] }
    ] },
    { n: "5", l: "Inicio del Contrato", f: ["Acta de entrega de terreno","Letreros obra","Permisos para ejecución obra"], c: [
      { n: "5-1", l: "Instalaciones de faenas", f: ["Documentos instalaciones de faenas","Oficinas para IF"] },
      { n: "5-2", l: "Programas", f: ["Programa de Trabajo","Programa de Inversiones","Programa de Mano de Obra"] },
      { n: "5-3", l: "Otros antecedentes de inicio del contrato", f: [] }
    ] },
    { n: "6", l: "Gestión del Personal", f: ["Organigrama del contrato","Control mano de obra"], c: [
      { n: "6-1", l: "Personal", f: ["Profesional Residente","Personal solicitado \"n\""] },
      { n: "6-2", l: "Carpeta laboral mensual", f: ["Mes \"inicial\"","Mes \"n\""] },
      { n: "6-3", l: "Otros antecedentes del personal", f: [] }
    ] },
    { n: "7", l: "Archivo comunicaciones", f: ["Folios libro de obra","Folios libro de Comunicaciones"], c: [
      { n: "7-1", l: "Otras comunicaciones", f: ["Recibida","Despachada"] }
    ] },
    { n: "8", l: "Estados de Pago", f: ["Resumen EP"], c: [
      { n: "8-1", l: "Estados de pago cursados", f: ["EP 1","EP \"n\""] },
      { n: "8-2", l: "Otros documentos relacionados con EP", f: [] }
    ] },
    { n: "9", l: "Modificaciones", f: ["Modificaciones nombramiento IF","Otras modificaciones de la Dirección","Resumen modificaciones"], c: [
      { n: "9-1", l: "Modificación 1", f: ["Antecedentes presentados","Trámitación","Nuevos programas"] },
      { n: "9-n", l: "Modificación \"n\"", f: ["Antecedentes presentados","Trámitación","Nuevos programas"] }
    ] },
    { n: "10", l: "Subcontratos", f: ["Subcontrato 1","Subcontrato n"] },
    { n: "11", l: "Valores Proforma", f: ["Proforma 1","Proforma n"] },
    { n: "12", l: "Informes Mensuales", f: ["Informe 1, nombre mes","Informe \"n\", nombre mes"] },
    { n: "13", l: "Gestión de la Calidad", f: ["Seguimiento de la calidad","Folios libro comunicaciones calidad"], c: [
      { n: "13-1", l: "Plan de Calidad", f: ["Antecedentes presentados","Modificaciones del Plan","Plan vigente calidad","Cuadro de No Conformidades"] },
      { n: "13-2", l: "Calidad de los materiales", f: ["Presentación insumos","Resumen insumos"] },
      { n: "13-3", l: "Exposición y reuniones", f: ["Actas de exposición de Calidad","Actas de reuniones de Calidad"] },
      { n: "13-4", l: "Auditorías internas", f: ["Programa de auditorías internas","Auditoría interna 1","Auditoría interna \"n\""] },
      { n: "13-5", l: "Otras auditorías", f: ["Auditoría nombre","Auditoría nombre \"n\""] },
      { n: "11-6", l: "Informes de calidad", f: ["Informe Calidad 1","Informe Calidad \"n\""] },
      { n: "13-7", l: "Otros de gestión de la calidad", f: [] }
    ] },
    { n: "14", l: "Topografía", f: ["Folios libro comunicaciones topografía AIF"], c: [
      { n: "14-1", l: "Instrumentos y equipos", f: ["Cuadro inventario topografía","Certificados de calibración instrumentos"] },
      { n: "14-2", l: "Levantamientos topográfico", f: ["Informe Previo Topografía","Línea de Tierra"] },
      { n: "14-3", l: "Cubicaciones", f: ["Cubicación dd/mm/aaaa"] }
    ] },
    { n: "15", l: "Laboratorio Autocontrol", f: ["Presentación y Aprobación","Cuadro registro informes","Folios libro comunicaciones laboratorio"], c: [
      { n: "15-1", l: "Instrumentos y equipos", f: ["Cuadro Inventario Laboratorio","Certificados de calibración","Autorización organismos pertinentes"] },
      { n: "15-2", l: "Certificados laboratorio", f: ["Certificados emitidos","Certificados externos","Certificados del Servicio"] },
      { n: "15-3", l: "Otros de laboratorio de autocontrol", f: [] }
    ] },
    { n: "16", l: "Prevención de Riesgos", f: ["Capacitación","Cuadro registro informes PR","Folios libro comunicaciones PR"], c: [
      { n: "16-1", l: "Plan y Programa PR", f: ["Antecedentes presentados","Modificaciones del programa","Programa vigente PR","Seguimiento programa PR"] },
      { n: "16-2", l: "Actividades Iniciales", f: ["Datos del Experto","Entrega de documentos PR","Actas de reuniones PR"] },
      { n: "16-3", l: "Accidentes", f: ["Informe accidente 1","Informe accidente \"n\""] },
      { n: "16-4", l: "Comité Paritario", f: ["Formación Comité","Actas de reuniones"] },
      { n: "16-5", l: "Informes PR", f: ["Informe PR 1","Informe PR \"n\""] },
      { n: "16-6", l: "Otros de PR", f: [] }
    ] },
    { n: "17", l: "Señalización y Seguridad", f: ["Seguimiento señalización y seguridad"], c: [
      { n: "17-1", l: "Plan de Señalización y Medidas de Seguridad", f: ["Antecedentes presentados","Modificaciones del Plan","Programa vigente Señalización y Seguridad"] }
    ] },
    { n: "18", l: "Medio Ambiente", f: ["Cuadro Planes de Manejo","Folios libro comunicaciones MA"], c: [
      { n: "18-1", l: "Plan de Gestión Ambiental", f: ["Antecedentes presentados","Modificaciones del PdM","Plan vigente gestión ambiental"] },
      { n: "18-2", l: "Plan de Manejo Instalaciones de faenas", f: ["Antecedentes Presentados","Modificaciones del PdM","PdM vigente instalaciones de faenas"] },
      { n: "18-3", l: "Plan de Manejo Empréstito \"n\"", f: ["Antecedentes Presentados","Modificaciones del PdM","PdM vigente empréstito \"n\""] },
      { n: "18-4", l: "Plan de Manejo Botadero \"n\"", f: ["Antecedentes Presentados","Modificaciones del PdM","PdM vigente botadero \"n\""] },
      { n: "18-n", l: "Otros de Medio Ambiente", f: [] }
    ] },
    { n: "19", l: "Participación Ciudadana", f: [], c: [
      { n: "19-1", l: "Plan de Participación Ciudadana", f: ["Antecedentes presentados","Modificaciones del PdM","Plan vigente PC"] },
      { n: "19-2", l: "Actividades Comunitarias", f: ["Reuniones","Material Informativo","Sugerencias y Reclamos"] },
      { n: "19-3", l: "Otros de Participación Ciudadana", f: [] }
    ] },
    { n: "20", l: "Conservaciones Globales", f: ["Cuadro aviso de incumplimiento"], c: [
      { n: "20-1", l: "Desafectaciones y Afectaciones", f: ["Doumentos","Cuadro registro"] },
      { n: "20-2", l: "Programas de trabajo", f: ["Programas semanales","Programas mensuales PU","Programas mensuales NS"] },
      { n: "20-3", l: "Recepciones Rutinarias", f: ["Recepción rutinaria 1","Recepción rutinaria \"n\""] },
      { n: "20-4", l: "Recepciones Nivel de Servicio", f: ["Recepción bimensual NS 1","Recepción bimensual NS \"n\""] },
      { n: "20-5", l: "Recepciones Periódicas", f: ["Recepción Periódica 1","Recepción Periódica n"] },
      { n: "20-6", l: "Inspección y vigilancia vial", f: ["Doumentos","Cuadro registro"] },
      { n: "20-7", l: "Otros de Conservación Global", f: [] }
    ] },
    { n: "21", l: "Término de Obra y Contrato", f: ["Comunicación Término","Planos de la obra (as built)","Material Fotográfico o Audiovisual","Recepción Provisional o Única","Calificación","Recepción Definitiva"], c: [
      { n: "21-1", l: "Estimaciones de Cierre", f: ["Detalle Cálculo de reajuste","Detalle Cálculo de multas"] },
      { n: "21-2", l: "Devolución de Retenciones", f: ["IF informa cumplimiento Art. 169º RCOP","Resolución autoriza devolución retenciones y garantía adicional","Devolución Garantía adicional y especiales"] },
      { n: "21-3", l: "Liquidación del Contrato", f: ["Resolución aprueba liquidación","Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización","Devolución garantía fiel cumplimiento"] }
    ] }
  ] },
  { key: "asesorias", name: "Asesorías", tree: [
    { n: "1", l: "Licitación", f: ["Bases administrativas, términos de referencia","Resolución aprueba anexo complementario","Presupuesto oficial (planilla editable)","Publicación licitación","Serie de preguntas-respuestas y aclaraciones"], c: [
      { n: "1-1", l: "Otros antecedentes de la licitación", f: [] }
    ] },
    { n: "2", l: "Adjudicación", f: ["Nombramiento comisión apertura y evaluación","Acta apertura ofertas técnicas y económicas","Boletas garantía seriedad oferta","Evaluación ofertas técnicas y económicas","Informe o acta de adjudicación","Oferta técnica consultor adjudicado","Oferta económica consultor adjudicado","Resolución de adjudicación","Resolución nombramiento IF","Notificación al consultor"], c: [
      { n: "2-1", l: "Otros antecedentes de la adjudicación", f: [] }
    ] },
    { n: "3", l: "Oficialización del Contrato", f: ["Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización"], c: [
      { n: "3-1", l: "Otros antecedentes", f: [] }
    ] },
    { n: "4", l: "Garantías", f: [], c: [
      { n: "4-1", l: "Garantía fiel cumplimiento", f: ["Trámite garantía","Ajuste garantía por modificaciones"] },
      { n: "4-2", l: "Garantía canje retenciones", f: ["Trámite garantía canje-1","Trámite garantía canje-n"] },
      { n: "4-3", l: "Garantía adicional", f: ["Trámite garantía adicional","Otras Garantías"] }
    ] },
    { n: "5", l: "Inicio de la AIF", f: ["Consultor comunica inicio Asesoría"], c: [
      { n: "5-1", l: "Recursos provistos por consultor", f: ["Inventario","Documentos de vehículos","Licencias de software","Documentos de entrega y recepción IF"] },
      { n: "5-2", l: "Otros antecedentes de inicio AIF", f: [] }
    ] },
    { n: "6", l: "Gestión del Personal", f: ["Organigrama de la AIF","Control mano de obra"], c: [
      { n: "6-1", l: "Personal", f: ["Jefe AIF","Personal Auxiliar n"] },
      { n: "6-2", l: "Carpeta laboral mensual", f: ["Mes \"inicial\"","Mes \"n\""] },
      { n: "6-3", l: "Otros antecedentes del personal", f: [] }
    ] },
    { n: "7", l: "Archivo comunicaciones", f: ["Folios libro de Comunicaciones"], c: [
      { n: "7-1", l: "Otras comunicaciones", f: ["Recibida","Despachada"] }
    ] },
    { n: "8", l: "Estados de Pago", f: ["Resumen EP"], c: [
      { n: "8-1", l: "Estados de Pago cursados", f: ["EP 1","EP \"n\""] },
      { n: "8-2", l: "Otros documentos relacionados con EP", f: [] }
    ] },
    { n: "9", l: "Modificaciones", f: ["Modificaciones nombramiento IF","Otras modificaciones de la Dirección","Resumen modificaciones"], c: [
      { n: "9-1", l: "Modificación 1", f: ["Antecedentes presentados","Trámitación"] },
      { n: "9-n", l: "Modificación n", f: ["Antecedentes presentados","Trámitación"] }
    ] },
    { n: "10", l: "Informes", f: ["Modelos informes","Informe inicial","Informes de comportamiento"], c: [
      { n: "10-1", l: "Informes mensuales", f: ["Informe 1, nombre mes","Informe \"n\", nombre mes"] },
      { n: "10-2", l: "Informes especialistas", f: ["Informe \"nombre - 1\"","Informe \"nombre - n\""] }
    ] },
    { n: "11", l: "Gestión de la Calidad", f: ["Seguimiento de la calidad","Folios libro comunicaciones calidad AIF"], c: [
      { n: "11-1", l: "Plan de la Calidad", f: ["Antecedentes presentados","Modificaciones del Plan","Plan vigente calidad","Cuadro de No Conformidades"] },
      { n: "11-2", l: "Exposición y reuniones", f: ["Actas de exposición de Calidad","Actas de reuniones de Calidad"] },
      { n: "11-3", l: "Auditorías internas", f: ["Programa de auditorías internas","Auditoría interna 1","Auditoría interna \"n\""] },
      { n: "11-4", l: "Otras auditorías", f: ["Auditoría nombre","Auditoría nombre \"n\""] },
      { n: "11-5", l: "Informes de calidad", f: ["Informe Calidad 1","Informe Calidad \"n\""] },
      { n: "11-6", l: "Otros de gestión de la calidad", f: [] }
    ] },
    { n: "12", l: "Topografía", f: ["Certificados de calibración instrumentos","Verificaciones iniciales","Seguimiento topográfico","Folios libro comunicaciones topografía AIF"], c: [
      { n: "12-1", l: "Cubicaciones", f: ["Cubicación dd/mm/aaaa"] }
    ] },
    { n: "13", l: "Laboratorio", f: ["Presentación y Aprobación Laboratorio AIF","Seguimiento del Laboratorio AIF","Folios libro comunicaciones laboratorio AIF"], c: [
      { n: "13-1", l: "Instrumentos y equipos", f: ["Cuadro Inventario Laboratorio","Certificados de calibración","Autorización organismos pertinentes"] },
      { n: "13-2", l: "Informes de Laboratorio", f: ["Informe Laboratorio 1","Informe Laboratorio \"n\""] }
    ] },
    { n: "14", l: "Prevención de Riesgos", f: ["Capacitación","Seguimiento de PR","Folios libro comunicaciones PR AIF"], c: [
      { n: "14-1", l: "Plan y Programa PR", f: ["Antecedentes presentados","Modificaciones del programa","Programa vigente PR","Seguimiento programa PR"] },
      { n: "14-2", l: "Actividades Iniciales", f: ["Datos del Experto del consultor","Entrega de documentos PR","Actas de reuniones PR-AIF"] },
      { n: "14-3", l: "Informes PR-AIF", f: ["Informe PR-AIF 1","Informe PR-AIF \"n\""] },
      { n: "14-4", l: "Comité Paritario", f: ["Formación Comité","Actas de reuniones"] },
      { n: "14-5", l: "Informes PR", f: ["Informe PR 1","Informe PR \"n\""] }
    ] },
    { n: "15", l: "Señalización y Seguridad", f: ["Seguimiento Señalización y Seguridad"], c: [
      { n: "15-1", l: "Informes Señalización y Seguridad", f: ["Informe Señalización y Seguridad 1","Informe Señalización y Seguridad \"n\""] }
    ] },
    { n: "16", l: "Medio Ambiente", f: ["Seguimiento Gestión Ambiental"], c: [
      { n: "16-1", l: "Informes Gestión Ambiental", f: ["Informe Medio Ambiente 1","Informe Medio Ambiente \"n\""] }
    ] },
    { n: "17", l: "Participación Ciudadana", f: ["Seguimiento Consultas, Sugerencias y Reclamos","Seguimiento Participación Ciudadana"], c: [
      { n: "17-1", l: "Informes de Participación Ciudadana", f: ["Informe Participación Ciudadana 1","Informe Participación Ciudadana \"n\""] }
    ] },
    { n: "18", l: "Término del Contrato", f: ["Certificado de término del IF","Informe Final","Material Fotográfico o Audiovisual","Calificación","Devolución Garantía adicional y especiales","Devolución de Retenciones"], c: [
      { n: "18-1", l: "Liquidación del Contrato", f: ["Resolución aprueba liquidación","Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización","Devolución garantía fiel cumplimiento"] }
    ] }
  ] },
  { key: "consultorias", name: "Consultorías", tree: [
    { n: "1", l: "Licitación", f: ["Bases administrativas, términos de referencia","Resolución aprueba anexo complementario","Presupuesto oficial (planilla editable)","Publicación licitación","Serie de preguntas-respuestas y aclaraciones"], c: [
      { n: "1-1", l: "Otros antecedentes de la licitación", f: [] }
    ] },
    { n: "2", l: "Adjudicación", f: ["Nombramiento comisión apertura y evaluación","Acta apertura ofertas técnicas y económicas","Boletas garantía seriedad oferta","Evaluación ofertas técnicas y económicas","Informe o acta de adjudicación","Oferta técnica consultor adjudicado","Oferta económica consultor adjudicado","Resolución de adjudicación","Resolución nombramiento IF","Notificación al consultor"], c: [
      { n: "2-1", l: "Otros antecedentes de la adjudicación", f: [] }
    ] },
    { n: "3", l: "Oficialización del Contrato", f: ["Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización"], c: [
      { n: "3-1", l: "Otros antecedentes", f: [] }
    ] },
    { n: "4", l: "Garantías", f: [], c: [
      { n: "4-1", l: "Garantía fiel cumplimiento", f: ["Trámite garantía","Ajuste garantía por modificaciones"] },
      { n: "4-2", l: "Garantía canje retenciones", f: ["Trámite garantía canje-1","Trámite garantía canje-n"] },
      { n: "4-3", l: "Garantía adicional", f: ["Trámite garantía adicional","Otras Garantías"] }
    ] },
    { n: "5", l: "Inicio de la consultoría", f: ["Consultor comunica inicio estudio, proyecto o diseño"], c: [
      { n: "5-1", l: "Recursos provistos por consultor", f: ["Inventario","Licencias de software"] },
      { n: "5-2", l: "Otros antecedentes de inicio", f: [] }
    ] },
    { n: "6", l: "Gestión del Personal", f: ["Organigrama de la consultoría","Control mano de obra"], c: [
      { n: "6-1", l: "Personal", f: ["Jefe del proyecto","Cargo o función \"n\""] },
      { n: "6-2", l: "Carpeta laboral mensual", f: ["Mes \"inicial\"","Mes \"n\""] },
      { n: "6-3", l: "Otros antecedentes del personal", f: [] }
    ] },
    { n: "7", l: "Archivo comunicaciones", f: ["Folios libro de Comunicaciones"], c: [
      { n: "7-1", l: "Otras comunicaciones", f: ["Recibida","Despachada"] }
    ] },
    { n: "8", l: "Estados de Pago", f: ["Resumen EP"], c: [
      { n: "8-1", l: "Estados de Pago cursados", f: ["EP 1","EP \"n\""] },
      { n: "8-2", l: "Otros documentos relacionados con EP", f: [] }
    ] },
    { n: "9", l: "Modificaciones", f: ["Modificaciones nombramiento IF","Otras modificaciones de la Dirección","Resumen modificaciones"], c: [
      { n: "9-1", l: "Modificación 1", f: ["Antecedentes presentados","Trámitación"] },
      { n: "9-n", l: "Modificación n", f: ["Antecedentes presentados","Trámitación"] }
    ] },
    { n: "10", l: "Informes", f: ["Informes de comportamiento"], c: [
      { n: "10-1", l: "Informes periódico de avance", f: ["Informe 1, nombre mes","Informe \"n\", nombre mes"] },
      { n: "10-2", l: "Informes especialistas", f: ["Informe \"nombre - 1\"","Informe \"nombre - n\""] },
      { n: "10-3", l: "Informes de Fases o Etapas", f: ["Entrega de \"FASE o ETAPA nnnn\""] },
      { n: "10-4", l: "Informe Final o definitivo", f: [] }
    ] },
    { n: "11", l: "Gestión de la Calidad", f: ["Seguimiento de la calidad"], c: [
      { n: "11-1", l: "Plan de la Calidad", f: ["Antecedentes presentados","Modificaciones del Plan","Plan vigente calidad","Cuadro de No Conformidades"] },
      { n: "11-2", l: "Exposición y reuniones", f: ["Actas de exposición de Calidad","Actas de reuniones de Calidad"] },
      { n: "11-3", l: "Auditorías internas", f: ["Programa de auditorías internas","Auditoría interna 1","Auditoría interna \"n\""] },
      { n: "11-4", l: "Otras auditorías", f: ["Auditoría nombre","Auditoría nombre \"n\""] },
      { n: "11-5", l: "Informes de calidad", f: ["Informe Calidad 1","Informe Calidad \"n\""] }
    ] },
    { n: "12", l: "Topografía", f: ["Certificados de calibración instrumentos","Seguimiento topográfico"] },
    { n: "13", l: "Laboratorio", f: ["Presentación y Aprobación Laboratorio","Seguimiento del Laboratorio de autocontrol"], c: [
      { n: "13-1", l: "Instrumentos y equipos", f: ["Cuadro Inventario Laboratorio","Certificados de calibración","Autorización organismos pertinentes"] },
      { n: "13-2", l: "Informes de Laboratorio", f: ["Informe Laboratorio 1","Informe Laboratorio \"n\""] }
    ] },
    { n: "14", l: "Prevención de Riesgos", f: ["Capacitación","Cuadro registro informes PR","Folios libro comunicaciones PR"], c: [
      { n: "14-1", l: "Plan y Programa PR", f: ["Antecedentes presentados","Modificaciones del programa","Programa vigente PR","Seguimiento programa PR"] },
      { n: "14-2", l: "Actividades Iniciales", f: ["Datos del Experto","Entrega de documentos PR","Actas de reuniones PR"] },
      { n: "14-3", l: "Accidentes", f: ["Informe accidente 1","Informe accidente \"n\""] },
      { n: "14-4", l: "Comité Paritario", f: ["Formación Comité","Actas de reuniones"] },
      { n: "14-5", l: "Informes PR", f: ["Informe PR 1","Informe PR \"n\""] },
      { n: "14-6", l: "Otros de PR", f: [] }
    ] },
    { n: "15", l: "Señalización y Seguridad", f: ["Antecedentes Presentados","Modificaciones del plan","Plan vigente señalización y seguridad"] },
    { n: "16", l: "Medio Ambiente", f: ["Seguimiento gestión ambiental"] },
    { n: "17", l: "Participación Ciudadana", f: ["Seguimiento de participación ciudadana"] },
    { n: "18", l: "Término Consultoría y Contrato", f: ["Certificado término","Material Fotográfico o Audiovisual","Entrega definitiva","Calificación","Devolución Garantía adicional y especiales","Devolución de Retenciones"], c: [
      { n: "18-1", l: "Liquidación del Contrato", f: ["Resolución aprueba liquidación","Documento entrega y resolución protocolizada","V°B° de la Fiscalía de protocolización","Devolución garantía fiel cumplimiento"] }
    ] }
  ] },
  { key: "aif", name: "AIF (Asesoría a la IF)", tree: [
    { n: "1", l: "Licitación", f: ["Publicación Aviso","Bases Administrativas","Términos de Referencia","Resolución de aprobación del Anexo Complementario","Presupuesto Oficial","Aclaraciones y serie de preguntas y respuestas"] },
    { n: "2", l: "Propuesta", f: [], c: [
      { n: "2.1", l: "Revisión de Ofertas", f: ["Nombramiento de Comisión de Apertura y Evaluación de propuestas","Acta de apertura de ofertas técnicas y económicas","Evaluación de ofertas técnicas y económicas","Boleta de Garantía de seriedad de la oferta","Informe o Acta de adjudicación"] },
      { n: "2.2", l: "Oferta del Consultor", f: ["Oferta técnica del Consultor adjudicado","Oferta económica del Consultor adjudicado"] }
    ] },
    { n: "3", l: "Documentos iniciales del Contrato", f: [], c: [
      { n: "3.1", l: "Resolución Adjudicación", f: ["Resolución","Notificación al Consultor","Documento de entrega y copia de la Resolución protocolizada","V°B° de la Fiscalía de protocolización","Resoluciones de nombramiento de IF"] },
      { n: "3.2", l: "Garantías del Contrato", f: ["Documento de entrega y copia de la Garantía de fiel cumplimiento del Contrato","Constancia de revisión de Boleta de Garantía o V°B° de la Fiscalía si es Póliza","FdG recibido por la DCyF"] }
    ] },
    { n: "4", l: "Desarrollo del Contrato", f: ["Comunicación del Consultor al IF del inicio de la Asesoría"], c: [
      { n: "4.1", l: "Recursos provistos por Consultor", f: ["Registro de fechas de uso de los recursos","Documentos de los vehículos exigidos en AC","Licencias de software utilizado en equipos","Inventario de los recursos indicados en las Bases y en la Metodología","Documento de entrega y recepción de IF de elementos estipulados en AC"] },
      { n: "4.2", l: "Libros", f: ["Libro de Comunicaciones (IF-AIF)","Libros de Comunicaciones de Prevención de Riesgos de la AIF","Libros de Comunicaciones de Prevención de Riesgos","Libros de Comunicaciones de Topografía","Libros de Comunicaciones de Laboratorio de Autocontrol","Libros de Comunicaciones de Medio Ambiente y Participación Ciudadana","Otro (Agregar)"] }
    ] },
    { n: "5", l: "Modificación de Contrato", f: ["Modificación"] },
    { n: "6", l: "Personal de la Asesoría", f: [], c: [
      { n: "6.1", l: "Antecedentes", f: ["Antecedentes del Personal","Documentos de cambio de personal y su aprobación"] },
      { n: "6.2", l: "Carpeta mensual", f: ["Cumplimiento Laboral Mensual"] }
    ] },
    { n: "7", l: "Estados de Pago", f: [], c: [
      { n: "7.1", l: "Carpeta mensual", f: ["Estado de Pago"] }
    ] },
    { n: "8", l: "Informes", f: [], c: [
      { n: "8.1", l: "Informes Mensuales", f: ["Documento de entrega y aprobación del formato de Informe Mensual","Informe Inicial, con documento de entrega y aprobación del IF","Informe Mensual"] },
      { n: "8.2", l: "Otros informes", f: ["Informe de Especialistas y/o Profesionales"] },
      { n: "8.3", l: "Informes de comportamiento del Consultor (Art. 90 RCTC)", f: ["Informe del IF con documento de entrega al Jefe Departamento.","Documento de envío del Informe al Consultor y respuestas."] }
    ] },
    { n: "9", l: "Especialidades", f: [], c: [
      { n: "9.1", l: "Gestión de la Calidad", f: ["Presentación Plan de Calidad","Acta de exposición y reuniones del Calidad","Entrega, recepción y aprobación de complementos y modificaciones del PAC","Informe de Calidad","Auditorías Internas","No conformidades"] },
      { n: "9.2", l: "Topografía", f: ["Certificados de calibración de instrumentos topográficos","Registro Topográfico"] },
      { n: "9.3", l: "Laboratorio de la AIF", f: ["Acta de reunión de inicio del Laboratorio AIF","Aprobación del Laboratorio de AIF","Certificados de calibración de instrumentos y equipos del Laboratorio","Resoluciones del Servicio de Salud, en caso de uso de Equipos nucleares","Informes de Laboratorio AIF"] },
      { n: "9.4", l: "Prevención de Riesgos", f: ["Presentación Plan y Programa de Prevención de Riesgos","Documentos iniciales de PR","Entrega, recepción y aprobación de modificaciones del Programa","Registro de capacitación en PR al personal AIF","Control y Seguimiento del Programa de PR del Contratista","Informes de PR"] },
      { n: "9.5", l: "Señalización y Seguridad", f: ["Control y Seguimiento del Plan de Señalización"] },
      { n: "9.6", l: "Medio Ambiente", f: ["Control y seguimiento de los Planes de Gestión Ambiental y Planes específicos","Informes de Gestión Ambiental"] },
      { n: "9.7", l: "Participación Ciudadana", f: ["Seguimiento de Consultas, Sugerencias y Reclamos de los usuarios","Presentaciones efectuadas para Participación Ciudadana","Informes de Participación Ciudadana"] }
    ] },
    { n: "10", l: "Término de AIF y Contrato", f: [], c: [
      { n: "10.1", l: "Termino AIF", f: ["Certificación de término por parte del IF","Entrega de informe final"] },
      { n: "10.2", l: "Calificación", f: ["Nombramiento Comisión Calificadora","Acta de Calificación a la Dirección con copia al Registro de Contratistas","Notificación de Calificación a Consultor"] },
      { n: "10.3", l: "Liquidación", f: ["Liquidación final del Contrato","Devolución de garantías"] }
    ] }
  ] },
  { key: "estudios", name: "Estudios, Diseños", tree: [
    { n: "1", l: "Licitación", f: ["Publicación Aviso","Bases Administrativas","Términos de Referencia","Resolución de aprobación de Bases o Anexo Complementario","Anexos","Aclaraciones y serie de preguntas y respuestas"] },
    { n: "2", l: "Propuesta", f: [], c: [
      { n: "2.1", l: "Revisión de Ofertas", f: ["Nombramiento de Comisión de Apertura y Evaluación de propuestas","Acta de apertura de ofertas técnicas y económicas","Evaluación de ofertas técnicas y económicas","Boleta de Garantía de seriedad de la oferta","Informe o Acta de adjudicación"] },
      { n: "2.2", l: "Oferta del Consultor", f: ["Oferta técnica del Consultor adjudicado","Oferta económica del Consultor adjudicado"] }
    ] },
    { n: "3", l: "Documentos iniciales del Contrato", f: [], c: [
      { n: "3.1", l: "Resolución Adjudicación", f: ["Resolución","Notificación al Consultor","Documento de entrega y copia de la Resolución protocolizada","V°B° de la Fiscalía de protocolización","Resoluciones de nombramiento de IF"] },
      { n: "3.2", l: "Garantías del Contrato", f: ["Documento de entrega y copia de la Garantía de fiel cumplimiento del Contrato","Constancia de revisión de Boleta de Garantía o V°B° de la Fiscalía si es Póliza","FdG recibido por la DCyF"] }
    ] },
    { n: "4", l: "Desarrollo del Contrato", f: [], c: [
      { n: "4.1", l: "Documentos de inicio Consultoría", f: ["Comunicación del Consultor al IF del inicio de la Consultoría","Registro de fechas de ingreso y uso de los recursos"] },
      { n: "4.2", l: "Correspondencia", f: ["Documentos del Consultor","Documentos con consultas del Consultor y respuestas del IF"] }
    ] },
    { n: "5", l: "Modificación de Contrato", f: ["Modificación"] },
    { n: "6", l: "Personal del Consultor", f: [], c: [
      { n: "6.1", l: "Antecedentes", f: ["Antecedentes del Personal","Documentos de cambio de personal y su aprobación"] },
      { n: "6.2", l: "Carpeta mensual", f: ["Cumplimiento Laboral Mensual"] }
    ] },
    { n: "7", l: "Estados de Pago", f: [], c: [
      { n: "7.1", l: "Carpeta mensual", f: ["Estado de Pago"] }
    ] },
    { n: "8", l: "Informes", f: ["Informes Mensuales","Informe de Especialistas y/o Profesionales"], c: [
      { n: "8.1", l: "Informes de comportamiento del Consultor (Art. 90 RCTC)", f: ["Informe del IF con documento de entrega al Jefe Departamento.","Documento de envío del Informe al Consultor y respuestas."] }
    ] },
    { n: "9", l: "Prevención de Riesgos", f: ["Presentación Plan y Programa de Prevención de Riesgos","Documentos iniciales de PR","Entrega, recepción y aprobación de modificaciones del Programa","Informes de PR","Comité Paritario"] },
    { n: "10", l: "Fases o Etapas", f: ["Entrega de Etapa o Fase"] },
    { n: "11", l: "Término de Estudio y Contrato", f: [], c: [
      { n: "11.1", l: "Termino Estudio o Diseño", f: ["Certificación de término por parte del IF","Informe IF a Dirección","Aprobación de Dirección","Entrega de informe final de Consultoría"] },
      { n: "11.2", l: "Calificación", f: ["Nombramiento Comisión Calificadora","Acta de Calificación a la Dirección con copia al Registro de Contratistas","Notificación de Calificación a Consultor"] },
      { n: "11.3", l: "Liquidación", f: ["Liquidación final del Contrato","Devolución de garantías"] }
    ] }
  ] },
  { key: "apr", name: "APR (Agua Potable Rural)", tree: [
    { n: "1", l: "Licitación", f: ["Aprobación de Bases y Autorización para Publicar","Publicación Aviso","Bases Administrativas","Términos de Referencia","Especificaciones Técnicas","Resolución de aprobación del Anexo Complementario","Presupuesto Oficial","Aclaraciones y serie de preguntas y respuestas"] },
    { n: "2", l: "Propuesta", f: [], c: [
      { n: "2.1", l: "Revisión de Ofertas", f: ["Nombramiento de Comisión de Apertura y Evaluación de propuestas","Acta de apertura de ofertas técnicas y económicas","Evaluación de ofertas técnicas y económicas","Boleta de seriedad de la oferta","Informe o Acta de Adjudicación y Aprobación"] },
      { n: "2.2", l: "Oferta del Contratista", f: ["Oferta técnica del Contratista adjudicado","Oferta económica del Contratista adjudicado"] }
    ] },
    { n: "3", l: "Documentos iniciales del Contrato", f: [], c: [
      { n: "3.1", l: "Resolución adjudicación", f: ["Autorización de Adjudicación del MOP","Contrato entre Sanitaria y Contratista","Notificación al Contratista","Documento de entrega y copia del contrato protocolizado","Resoluciones de aprobación del contrato y del gasto por gestión de proyecto","Resoluciones de Nombramientos"] },
      { n: "3.2", l: "Garantías del Contrato", f: ["Documento de entrega y copia de la Garantía de fiel cumplimiento del Contrato","Constancia de revisión de Boleta de Garantía o V°B° de la Fiscalía si es Póliza","FdG recibido por la DCyF"] },
      { n: "3.3", l: "Póliza Responsabilidad Civil", f: ["Documento de entrega y copia de la Póliza","V°B° de la Fiscalía de la Póliza","FdG recibido por la DCyF"] },
      { n: "3.4", l: "Póliza de Todo Riesgo de Construcción", f: ["Documento de entrega y copia de la Póliza","V°B° de la Fiscalía de la Póliza","FdG recibido por la DCyF"] },
      { n: "3.5", l: "Otras Garantías", f: ["Constancia de revisión de Boleta de Garantía","FdG recibido por la DCyF"] },
      { n: "3.6", l: "Convenio Sanitaria", f: ["Convenio asistencia técnica DOH-Sanitaria","Instructivo para la gestión de proyectos","Documento entrega y copia de la Garantía de fiel cumplimiento por Convenio","Constancia de revisión de Boleta de Garantía o V°B° de la Fiscalía si es Póliza","FdG recibido por la DCyF"] }
    ] },
    { n: "4", l: "Desarrollo del Contrato", f: [], c: [
      { n: "4.1", l: "Exigencias Contractuales", f: ["Acta de entrega de terreno","Documento de entrega y copia del Programa Oficial, Inversiones y Mano de Obra","Aprobación del ITO del Programa Oficial, Inversiones y Mano de Obra","Proposición y Aprobación de la ubicación de las Instalaciones de Faenas","Documento de entrega y aprobación de las instalaciones","Indicación de la ubicación, recepción y aprobación del letrero de Obra"] },
      { n: "4.2", l: "Subcontratos", f: ["Solicitud y antecedentes de subcontratación","Autorización de la Dirección"] },
      { n: "4.3", l: "Valores Proforma", f: ["Documentos de trámites y Cotizaciones","Aprobación de la Dirección","Instrucción del IF de ejecutar la proforma"] },
      { n: "4.4", l: "Libros", f: ["Libro de Obra","Libros de Comunicaciones","Libros de Comunicaciones de Prevención de Riesgos","Libros de Comunicaciones de Topografía","Libros de Comunicaciones de Laboratorio de Autocontrol","Libros de Comunicaciones de Medio Ambiente y Participación Ciudadana","Otro (Agregar)"] }
    ] },
    { n: "5", l: "Modificación de Contrato", f: ["Modificación"] },
    { n: "6", l: "Personal del Contratista, Subcontratistas y Sanitaria", f: [], c: [
      { n: "6.1", l: "Antecedentes", f: ["Documento de entrega y copia del organigrama y antecedentes del personal exigido, incluyendo las aprobaciones.","Documentos de cambio de personal y su aprobación"] },
      { n: "6.2", l: "Carpeta Mensual", f: ["Cumplimiento Laboral Mensual"] }
    ] },
    { n: "7", l: "Estados de Pago Contratista y Sanitaria", f: ["Estado de Pago"] },
    { n: "8", l: "Informes", f: ["Informe Mensual"] },
    { n: "9", l: "Especialidades", f: [], c: [
      { n: "9.1", l: "Gestión de la Calidad", f: ["Presentación Plan de Calidad","Acta de exposición y reuniones de Calidad","Entrega, recepción y aprobación de complementos y modificaciones del Plan","Informes de Calidad","Presentación Manual de Procedimientos","Calidad de los materiales","Auditorías Internas","No conformidades"] },
      { n: "9.2", l: "Topografía", f: ["Certificados de calibración de instrumentos topográficos","Entrega, recepción y aprobación de las cubicaciones","Registro Topográfico"] },
      { n: "9.3", l: "Laboratorio", f: ["Presentación y Aprobación del Laboratorio de Autocontrol o externo","Certificados de calibración de instrumentos y equipos del Laboratorio","Resoluciones del Servicio de Salud, en caso de uso de Equipos nucleares","Informes de Laboratorio Autocontrol"] },
      { n: "9.4", l: "Prevención de Riesgos", f: ["Presentación Plan y Programa de Prevención de Riesgos","Documentos iniciales de PR","Entrega, recepción y aprobación de modificaciones del Programa","Informes de PR","Comité Paritario"] },
      { n: "9.5", l: "Señalización y Seguridad", f: ["Presentación Plan de Señalización y Medidas de Seguridad","Entrega, recepción y aprobación de complementos y modificaciones del Plan"] },
      { n: "9.6", l: "Medio Ambiente", f: ["Presentación del Plan de Gestión Ambiental","Entrega, recepción y aprobación de modificaciones del Plan de Gestión Ambiental","Presentación del Planes de Manejo","Entrega, recepción y aprobación de modificaciones de los Planes de Manejo","Informes de Gestión Ambiental"] },
      { n: "9.7", l: "Participación Ciudadana", f: ["Presentación del Plan de Participación Ciudadana","Entrega, recepción y aprobación de modificaciones del Plan de Participación Ciudadana","Material Informativo","Actas de las reuniones de participación ciudadana","Libro de Sugerencias y Reclamos","Informes de Participación Ciudadana"] }
    ] },
    { n: "10", l: "Término de Obra y Contrato", f: [], c: [
      { n: "10.1", l: "Recepción Provisional o única", f: ["Aviso del Contratista de término de obras","Verificación de término por parte del ITO","Nombramiento Comisión Recep. Provisional","Acta Recepción Provisional o única con o sin reservas"] },
      { n: "10.2", l: "Calificación", f: ["Acta de Calificación a la Dirección","Notificación de Calificación a Contratista"] },
      { n: "10.3", l: "Devolución de Retenciones o canjes", f: ["IC informa recepción conforme","Resolución Devolución retenciones","Devolución retenciones"] },
      { n: "10.4", l: "Recepción Definitiva", f: ["UT Informa recepción definitiva","Nombramiento Comisión Recep. Definitiva","Acta Recepción Definitiva"] },
      { n: "10.5", l: "Liquidación", f: ["Liquidación del Contrato","Devolución garantía fiel cumplimiento"] }
    ] }
  ] }
];
