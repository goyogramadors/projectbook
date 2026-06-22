/* =============================================================================
   _ARCHIBOTS · SPA UNIFICADA — CARCASA PRINCIPAL (MOCKUP FUNCIONAL) v7
   -----------------------------------------------------------------------------
   v7 — Página de Inicio (carpetas de proyectos / invitación + Top Tools gris +
   catálogo colapsado), "otros proyectos" en la Ficha, selector de tema también
   arriba, barra inferior reordenada (selector angosto → Inicio → Tema), checklist
   de avance en B&N (token --progress-accent). 3 temas (brutalist|washi|matrix-VSCode).
   Estilos/tokens en ./archibots.css. Dependencias: react, framer-motion, lucide-react.
   ============================================================================= */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import './archibots.css';

import DimensionadorView from './tools/DimensionadorView';
import CalculadoraHonorariosView from './tools/CalculadoraHonorariosView';
import GeneradorContratosView from './tools/GeneradorContratosView';
import GeolocalizadorView from './tools/GeolocalizadorView';
import BimWizardView from './tools/BimWizardView';
import { ParticipantesView, DatosProyectoView, UbicacionView, SeguimientoObrasView } from './tools/GestorViews';
import PropuestaView from './tools/PropuestaView';
import ExpedienteMunicipalView from './tools/ExpedienteMunicipalView';
import PricingView from './views/PricingView';
import ShareProjectModal, { type Collaborator } from './views/ShareProjectModal';
import AdminDashboard from './views/AdminDashboard';
import FeedbackForm from './components/FeedbackForm';
import LegalView from './views/LegalView';
import BibliotecaView from './views/BibliotecaView';
import MapaTerrenoView from './tools/MapaTerrenoView';
import { useDimensionadorSync, useTerrenoSync } from './hooks/useDimensionadorSync';

const Icon = ({ name, size = 16, strokeWidth = 1.5, ...rest }: any) => {
  const Cmp = (Icons as any)[name] || Icons.Box;
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />;
};

const THEMES = ['brutalist', 'washi', 'matrix', 'white'] as const;
type Theme = typeof THEMES[number];

const TOOL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  dimensionador: DimensionadorView,
  hsa: CalculadoraHonorariosView,
  contratos: GeneradorContratosView,
  geolocalizador: GeolocalizadorView,
  participantes: ParticipantesView,
  'datos-proyecto': DatosProyectoView,
  ubicacion: UbicacionView,
  seguimiento: SeguimientoObrasView,
  propuesta: PropuestaView,
  'expediente-dom': ExpedienteMunicipalView,
  'bim-wizard': BimWizardView,
  'form-municipales': BibliotecaView,
  'mapa-terreno': MapaTerrenoView,
};

/* =============================================================================
   1 · MOCK DATA
   ============================================================================= */
const MOCK_USER = { email: 'arquitecto@estudio.cl', nombre: 'arquitecto', plan: 'Premium' as 'Premium' | 'Free' };

const MOCK_PROJECTS = [
  { id: 'AB-2026-001', name: 'Edificio Los Alerces', anio: '2026', propietario: 'Inmobiliaria Lientur SpA', rol: 'Arquitecto Patrocinante', direccion: 'Lientur 7345', comuna: 'La Florida', superficieTerrenoLegal: '1.640,10', superficieProyecto: '8.117,40', superficieOrigen: 'DIMENSIONADOR', presupuestoUF: '45.000', etapa: 'Anteproyecto', destino: 'Vivienda Colectiva', fotoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop' },
  { id: 'AB-2026-002', name: 'Condominio Valles', anio: '2025', propietario: 'Constructora Aysén Ltda.', rol: 'Arquitecto Coordinador', direccion: 'Av. Las Condes 1234', comuna: 'Las Condes', superficieTerrenoLegal: '5.000,00', superficieProyecto: '', superficieOrigen: 'MANUAL', presupuestoUF: '', etapa: 'Perfil', destino: 'Vivienda', fotoUrl: '' },
  { id: 'AB-2026-003', name: 'Clínica Andes Salud', anio: '2026', propietario: 'Red Salud Andes', rol: 'Arquitecto Patrocinante', direccion: 'Av. Vitacura 8200', comuna: 'Vitacura', superficieTerrenoLegal: '3.200,00', superficieProyecto: '12.450,00', superficieOrigen: 'DIMENSIONADOR', presupuestoUF: '120.000', etapa: 'Proyecto', destino: 'Salud', fotoUrl: '' },
  { id: 'AB-2026-004', name: 'Centro Cívico Maipú', anio: '2026', propietario: 'I. Municipalidad de Maipú', rol: 'Arquitecto Coordinador', direccion: 'Av. Pajaritos 1234', comuna: 'Maipú', superficieTerrenoLegal: '6.800,00', superficieProyecto: '9.300,00', superficieOrigen: 'MANUAL', presupuestoUF: '85.000', etapa: 'Licitación', destino: 'Equipamiento', fotoUrl: '' },
  { id: 'AB-2025-018', name: 'Oficinas Nueva Costanera', anio: '2025', propietario: 'Inversiones NC SpA', rol: 'Arquitecto Patrocinante', direccion: 'Nueva Costanera 3900', comuna: 'Vitacura', superficieTerrenoLegal: '2.100,00', superficieProyecto: '7.600,00', superficieOrigen: 'DIMENSIONADOR', presupuestoUF: '68.000', etapa: 'Obra', destino: 'Oficinas', fotoUrl: '' },
];

const FOLDERS = [
  { id: 0, name: 'Ficha del Proyecto', short: 'FICHA', icon: 'FileText' },
  { id: 1, name: 'Información del Proyecto', short: 'INFO', icon: 'Folder' },
  { id: 2, name: 'Terreno', short: 'TERRENO', icon: 'Map' },
  { id: 3, name: 'Proyecto', short: 'PROYECTO', icon: 'Building2' },
  { id: 4, name: 'Expedientes de Permisos', short: 'EXPEDIENTES', icon: 'FileCheck' },
  { id: 5, name: 'Construcción', short: 'CONSTRUCCIÓN', icon: 'HardHat' },
  { id: 6, name: 'Administrativos', short: 'ADMIN', icon: 'Briefcase' },
  { id: 7, name: 'Biblioteca de Recursos', short: 'BIBLIOTECA', icon: 'BookOpen' },
];

const ALL_PHASES = ['PERFIL', 'ANTEPROY', 'PROYECTO', 'TRÁMITE', 'CONSTRUCCIÓN', 'ADMIN'];

type Estado = 'active' | 'soon';
type Tier = 'free' | 'premium';
interface Tool { id: string; code: string; label: string; folder: number; sub: string; icon: string; estado: Estado; tier: Tier; fases: string[]; desc: string; }

const MOCK_CATALOG: Tool[] = [
  { id: 'participantes', code: 'T-03', label: 'Participantes del Proyecto', folder: 1, sub: 'Datos generales', icon: 'Users', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Arquitecto y Propietario por defecto; [+] agrega DOM, calculista, constructor y roles libres (nombre + RUT).' },
  { id: 'datos-proyecto', code: 'T-04', label: 'Datos del Proyecto', folder: 1, sub: 'Datos generales', icon: 'ClipboardList', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Etapa, destino, tipo y superficies según el modelo de Datos Clave (sección 1.2).' },
  { id: 'ubicacion', code: 'T-04b', label: 'Ubicación del Proyecto', folder: 2, sub: 'Análisis predial', icon: 'Navigation', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Ubicación administrativa básica (región, comuna, dirección, rol SII). Se complementa con el Geolocalizador.' },
  { id: 'geolocalizador', code: 'T-07', label: 'Geolocalizador Normativo', folder: 2, sub: 'Análisis predial', icon: 'MapPin', estado: 'active', tier: 'free', fases: ['PERFIL', 'ANTEPROY'], desc: 'Dirección → polígono → zona PRC → ficha normativa. Modos [ASUMIR FICHA] / [INGRESO MANUAL CIP].' },
  { id: 'mapa-terreno', code: 'T-08', label: 'Mapa de Terreno', folder: 2, sub: 'Análisis predial', icon: 'Map', estado: 'active', tier: 'free', fases: ['PERFIL'], desc: 'Polígono guardado + superficie turf.js (dato interno, no va a la Ficha).' },
  { id: 'cabida', code: 'T-09', label: 'Cabida de Terreno', folder: 2, sub: 'Cabida', icon: 'Box', estado: 'soon', tier: 'free', fases: ['PERFIL'], desc: 'Volumen máximo teórico según rasantes y constructibilidad.' },
  { id: 'volumen', code: 'T-10', label: 'Volumen Teórico (Envolvente)', folder: 2, sub: 'Cabida', icon: 'Boxes', estado: 'soon', tier: 'free', fases: ['PERFIL', 'ANTEPROY'], desc: 'Envolvente máxima edificable.' },
  { id: 'dimensionador', code: 'T-14', label: 'Dimensionador de Proyecto', folder: 3, sub: 'Dimensionadores', icon: 'Maximize', estado: 'active', tier: 'free', fases: ['ANTEPROY', 'PROYECTO'], desc: 'Programa de recintos, % circulación y sincronía con el master del proyecto.' },
  { id: 'dim-publicos', code: 'T-15', label: 'Dimensionador Edificios Públicos', folder: 3, sub: 'Dimensionadores', icon: 'Building2', estado: 'soon', tier: 'free', fases: ['ANTEPROY'], desc: 'Estándares de edificación pública.' },
  { id: 'bim-wizard', code: 'T-17', label: 'Asistente de Usos BIM', folder: 3, sub: 'BIM', icon: 'Cpu', estado: 'active', tier: 'premium', fases: ['PROYECTO'], desc: 'Wizard de 7 pasos (Planbim/CORFO) con ficha asistida por IA.' },
  { id: 'bim-familias', code: 'T-18', label: 'Creador de Familias BIM (LOD)', folder: 3, sub: 'BIM', icon: 'Boxes', estado: 'soon', tier: 'premium', fases: ['PROYECTO'], desc: 'Componentes paramétricos por nivel de desarrollo LOD.' },
  { id: 'iso19650', code: 'T-20', label: 'Implementación ISO 19650', folder: 3, sub: 'BIM', icon: 'Layers', estado: 'soon', tier: 'premium', fases: ['PROYECTO'], desc: 'Gestión de información BIM según ISO 19650.' },
  { id: 'accesibilidad', code: 'T-16', label: 'Accesibilidad (DS 50)', folder: 3, sub: 'Accesibilidad y Normativa', icon: 'Accessibility', estado: 'soon', tier: 'free', fases: ['PROYECTO'], desc: 'Verificación de accesibilidad universal según DS 50.' },
  { id: 'expediente-dom', code: 'T-24', label: 'Expediente Municipal', folder: 4, sub: 'Formularios DOM', icon: 'FileCheck', estado: 'active', tier: 'free', fases: ['TRÁMITE'], desc: 'Declaración Jurada Art. 1.2.2 · Solicitud de Permiso (F 2-3.1) · Formulario INE, con impresión/PDF.' },
  { id: 'listado-dom', code: 'T-30', label: 'Listado de Documentos DOM', folder: 4, sub: 'Formularios DOM', icon: 'ClipboardList', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Documentos y planos solicitados por la Dirección de Obras.' },
  { id: 'minvu', code: 'T-31', label: 'Gestor Formularios MINVU', folder: 4, sub: 'Formularios DOM', icon: 'FileSpreadsheet', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Autocompletado de formularios oficiales en PDF.' },
  { id: 'permiso-edif', code: 'T-25', label: 'Permiso de Edificación', folder: 4, sub: 'Trámites especiales', icon: 'FileText', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Cálculo de derechos municipales (1,5%).' },
  { id: 'anteproyecto-mun', code: 'T-26', label: 'Anteproyecto Municipal', folder: 4, sub: 'Trámites especiales', icon: 'FileText', estado: 'soon', tier: 'free', fases: ['TRÁMITE'], desc: 'Ingreso de anteproyecto ante la DOM.' },
  { id: 'eett-generales', code: 'T-32', label: 'EETT Generales', folder: 5, sub: 'EETT', icon: 'ClipboardList', estado: 'soon', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Especificaciones técnicas generales (espera BD de EETT desde Excel).' },
  { id: 'eett-estructuras', code: 'T-33', label: 'EETT Estructuras', folder: 5, sub: 'EETT', icon: 'ClipboardList', estado: 'soon', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Especificaciones técnicas de estructuras.' },
  { id: 'presupuesto', code: 'T-39', label: 'Presupuesto de Proyectos', folder: 5, sub: 'Presupuesto', icon: 'DollarSign', estado: 'soon', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Itemizado de obra (referencia 28 UF/m²).' },
  { id: 'gantt', code: 'T-40', label: 'Carta Gantt', folder: 5, sub: 'Presupuesto', icon: 'Calendar', estado: 'soon', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Ruta crítica y asignación de recursos a partidas.' },
  { id: 'seguimiento', code: 'T-43', label: 'Seguimiento de Obras', folder: 5, sub: 'Seguimiento', icon: 'HardHat', estado: 'active', tier: 'free', fases: ['CONSTRUCCIÓN'], desc: 'Avance, etapa y bitácora Normal / Retraso / Crítico.' },
  { id: 'propuesta', code: 'T-05', label: 'Propuesta de Servicios / Honorarios', folder: 6, sub: 'Honorarios', icon: 'FileText', estado: 'active', tier: 'free', fases: ['PERFIL', 'ADMIN'], desc: 'Propuesta de honorarios por etapas.' },
  { id: 'hsa', code: 'T-06', label: 'Calculadora de Honorarios', folder: 6, sub: 'Honorarios', icon: 'Calculator', estado: 'active', tier: 'free', fases: ['ADMIN', 'PERFIL'], desc: 'Cálculo de boleta: bruto/líquido con retención 15,25% editable.' },
  { id: 'contratos', code: 'T-45', label: 'Generador de Contratos', folder: 6, sub: 'Contratos', icon: 'Handshake', estado: 'active', tier: 'free', fases: ['ADMIN'], desc: 'Plantillas paramétricas legales para contratistas.' },
  { id: 'cobros', code: 'T-47', label: 'Generador de Cobros', folder: 6, sub: 'Pagos', icon: 'DollarSign', estado: 'soon', tier: 'free', fases: ['ADMIN'], desc: 'Gestión de cobranza y estados de cuenta.' },
  { id: 'form-municipales', code: 'T-48', label: 'Formularios Municipales', folder: 7, sub: 'Formularios oficiales', icon: 'FileText', estado: 'active', tier: 'free', fases: [], desc: 'F-1.1-PE, F-1.2-AM, F-1.4-RD, Acreditación Térmica, CIP.' },
  { id: 'form-seremi', code: 'T-49', label: 'Formularios SEREMI', folder: 7, sub: 'Formularios oficiales', icon: 'FileText', estado: 'soon', tier: 'free', fases: [], desc: '5 formularios SEREMI de Salud.' },
  { id: 'oguc', code: 'T-51', label: 'OGUC / LGUC', folder: 7, sub: 'Normativa técnica', icon: 'BookOpen', estado: 'soon', tier: 'free', fases: [], desc: 'Búsqueda semántica de normativa.' },
];

const TOP_TOOLS = [
  { id: 'dimensionador', icon: 'Maximize', label: 'Dimensionador' },
  { id: 'geolocalizador', icon: 'MapPin', label: 'Geolocalizador' },
  { id: 'expediente-dom', icon: 'FileCheck', label: 'Expediente DOM' },
  { id: 'hsa', icon: 'Calculator', label: 'Calculadora de Honorarios' },
];

const TODAY = new Date().toISOString().slice(0, 10);

/* =============================================================================
   2 · COMPONENTE PRINCIPAL
   ============================================================================= */
export default function App() {
  const [theme, setTheme] = useState<Theme>('brutalist');
  const [view, setView] = useState<'home' | 'workspace' | 'admin' | 'legal-terminos' | 'legal-privacidad'>('workspace');
  const [plan, setPlan] = useState<'Premium' | 'Free'>(MOCK_USER.plan);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);
  const [binderTab, setBinderTab] = useState<number>(0);
  const [catalogFilter, setCatalogFilter] = useState<'Carpeta' | 'Fase' | 'Top'>('Carpeta');
  const [openFolders, setOpenFolders] = useState<number[]>([3]);
  const [openSubs, setOpenSubs] = useState<string[]>(['3::Dimensionadores']);
  const [openPhases, setOpenPhases] = useState<string[]>(['PROYECTO']);
  const [exploredTool, setExploredTool] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>('dimensionador');
  const [completed, setCompleted] = useState<string[]>(['geolocalizador']);
  const [addedTools, setAddedTools] = useState<Record<string, string[]>>({
    'AB-2026-001': ['geolocalizador', 'dimensionador', 'expediente-dom', 'hsa'],
  });
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([{ id: 'c1', email: 'm.tagle@oficina.cl', rol: 'Editor' }, { id: 'c2', email: 'propietario@lientur.cl', rol: 'Lector' }]);
  const [topToolIds, setTopToolIds] = useState<string[]>(TOP_TOOLS.map((t) => t.id));

  // F4.6 — Sync dimensionador y terreno con ProjectMaster
  const { onUpdateMaster } = useDimensionadorSync(activeProjectId, plan);
  const { onSaveTerreno } = useTerrenoSync(activeProjectId, plan);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const cycleTheme = () => { const n = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; setTheme(n); triggerToast('Tema: ' + n.toUpperCase()); };

  const activeProject = MOCK_PROJECTS.find((p) => p.id === activeProjectId) || null;
  const topToolsList = topToolIds.map((id) => MOCK_CATALOG.find((t) => t.id === id)).filter((t): t is Tool => !!t);
  const activeToolObj = MOCK_CATALOG.find((t) => t.id === activeTool) || null;
  const isLockedActive = !!activeToolObj && activeToolObj.tier === 'premium' && plan === 'Free';
  const activeComp = activeToolObj && activeToolObj.estado === 'active' && !isLockedActive ? TOOL_COMPONENTS[activeToolObj.id] : null;

  const pathStr = 'C:\\archibots\\' + (view === 'home' ? 'inicio' : (FOLDERS.find(f => f.id === (activeToolObj ? activeToolObj.folder : binderTab))?.short || 'ws').toLowerCase()) + '\\' + (activeToolObj ? activeToolObj.id + '.exe' : 'app.exe');
  const triggerToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((triggerToast as any)._t);
    (triggerToast as any)._t = window.setTimeout(() => setToast(null), 3200);
  };
  const toggle = (arr: any[], v: any, setter: (x: any[]) => void) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const goHome = () => { setOpenFolders([]); setView('home'); };
  const openProject = (id: string) => { setActiveProjectId(id); setBinderTab(0); setView('workspace'); triggerToast('Proyecto abierto: ' + (MOCK_PROJECTS.find((p) => p.id === id)?.name || '')); };

  const selectTool = (toolId: string) => {
    const tool = MOCK_CATALOG.find((t) => t.id === toolId);
    if (!tool) { triggerToast('Acceso rápido (demo): ' + toolId.replace('__', '')); return; }
    setActiveTool(tool.id);
    setView('workspace');
    if (tool.estado === 'soon') triggerToast('PRÓXIMAMENTE · ' + tool.label);
    else if (tool.tier === 'premium' && plan === 'Free') triggerToast('🔒 Requiere plan Premium · ' + tool.label);
    else triggerToast('Montando módulo: ' + tool.label);
  };

  const isAdded = (toolId: string) => !!activeProjectId && (addedTools[activeProjectId] || []).includes(toolId);
  const addTool = (toolId: string) => {
    const tool = MOCK_CATALOG.find((t) => t.id === toolId);
    if (!tool) return;
    if (!activeProjectId) { triggerToast('Selecciona un proyecto activo primero'); return; }
    setAddedTools((prev) => {
      const cur = prev[activeProjectId] || [];
      if (cur.includes(toolId)) return prev;
      return { ...prev, [activeProjectId]: [...cur, toolId] };
    });
    const folder = FOLDERS.find((f) => f.id === tool.folder);
    setBinderTab(tool.folder); setView('workspace');
    triggerToast(`Añadida a ${folder?.id}. ${folder?.short} → ${tool.label}`);
  };
  const removeTool = (toolId: string) => {
    if (!activeProjectId) return;
    setAddedTools((prev) => ({ ...prev, [activeProjectId]: (prev[activeProjectId] || []).filter((id) => id !== toolId) }));
    triggerToast('Quitada de la carpeta del proyecto');
  };

  const subsOf = (folderId: number) => {
    const seen: string[] = [];
    MOCK_CATALOG.forEach((t) => { if (t.folder === folderId && !seen.includes(t.sub)) seen.push(t.sub); });
    return seen;
  };

  /* --- Tarjeta de herramienta (catálogo) --- */
  const ToolCard = ({ tool }: { tool: Tool }) => {
    const isExplored = exploredTool === tool.id;
    const isActive = activeTool === tool.id;
    const locked = tool.tier === 'premium' && plan === 'Free';
    const added = isAdded(tool.id);
    return (
      <div className={`ab-tool ${tool.estado === 'soon' ? 'soon' : ''} ${isActive ? 'active' : ''}`}>
        <div className="ab-tool-row">
          <div className="ab-tool-title"><Icon name={tool.icon} size={15} /><span>{tool.label}</span></div>
          <div className="ab-tool-actions">
            {tool.estado === 'soon' && <span className="ab-pill soon">Próximamente</span>}
            {tool.tier === 'premium' && <span className="ab-pill prem"><Icon name="Lock" size={9} /> Premium</span>}
          </div>
        </div>
        <div className="ab-tool-row" style={{ marginTop: 8, alignItems: 'center' }}>
          <span className="ab-tool-code">{tool.code}</span>
          <div className="ab-tool-actions">
            <button className="ab-btn sec sm" onClick={() => setExploredTool(isExplored ? null : tool.id)}><Icon name="Info" size={11} /> Explorar</button>
            <button className="ab-btn sm" onClick={() => selectTool(tool.id)} title={locked ? 'Requiere Premium' : 'Abrir en el área dinámica'}>
              {locked ? <><Icon name="Lock" size={11} /> Premium</> : <><Icon name="Play" size={11} /> Abrir</>}
            </button>
            {added ? (
              <button className="ab-btn add added sm" onClick={() => removeTool(tool.id)} title="Quitar de la carpeta del proyecto"><Icon name="Check" size={12} /> En proyecto</button>
            ) : (
              <button className="ab-btn add sm" onClick={() => addTool(tool.id)} title="Agregar a la carpeta del proyecto"><Icon name="ChevronLeft" size={13} /> Agregar</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isExplored && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="ab-explore">
                <div className="lab">&gt; DESCRIPCIÓN:</div>
                <div style={{ opacity: 0.75, margin: '3px 0 6px' }}>{tool.desc}</div>
                {tool.fases.length > 0 && (
                  <>
                    <div className="lab">&gt; FASES:</div>
                    <div className="ab-phase-badges">
                      {tool.fases.map((ph) => <span key={ph} className="ab-phase on">[X] {ph}</span>)}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderByFolder = () =>
    FOLDERS.filter((f) => f.id > 0).map((folder) => {
      const isOpen = openFolders.includes(folder.id);
      const tools = MOCK_CATALOG.filter((t) => t.folder === folder.id);
      return (
        <div key={folder.id} className="ab-folder">
          <button className="ab-folder-head" onClick={() => setOpenFolders(openFolders.includes(folder.id) ? [] : [folder.id])}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={folder.icon} size={15} />{folder.id}. {folder.name.toUpperCase()}</span>
            <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} />
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                <div className="ab-folder-body">
                  {subsOf(folder.id).map((sub) => {
                    const subKey = `${folder.id}::${sub}`;
                    const subOpen = openSubs.includes(subKey);
                    const subTools = tools.filter((t) => t.sub === sub);
                    return (
                      <div key={subKey} className="ab-sub">
                        <button className="ab-sub-head" onClick={() => toggle(openSubs, subKey, setOpenSubs)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={subOpen ? 'FolderOpen' : 'Folder'} size={12} />:: {sub.toUpperCase()} :: <span style={{ opacity: 0.5 }}>({subTools.length})</span></span>
                          <Icon name={subOpen ? 'ChevronDown' : 'ChevronRight'} size={13} />
                        </button>
                        <AnimatePresence initial={false}>
                          {subOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                              <div className="ab-sub-body">{subTools.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });

  const renderByPhase = () =>
    ALL_PHASES.map((phase) => {
      const isOpen = openPhases.includes(phase);
      const tools = MOCK_CATALOG.filter((t) => t.folder !== 7 && t.fases.includes(phase));
      return (
        <div key={phase} className="ab-folder">
          <button className="ab-folder-head" onClick={() => setOpenPhases(openPhases.includes(phase) ? [] : [phase])}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="Filter" size={14} /> FASE: {phase}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ opacity: 0.5 }}>({tools.length})</span><Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={15} /></span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                <div className="ab-folder-body" style={{ padding: '8px 12px' }}>
                  {tools.length ? tools.map((t) => <ToolCard key={t.id} tool={t} />) : <div className="ab-empty" style={{ padding: 20 }}>Sin herramientas en esta fase</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });

  const renderTop = () => (
    <div className="ab-folder-body" style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', margin: '2px 4px 8px' }}>Accesos rápidos · herramientas muy usadas</div>
      {topToolsList.map((t) => <ToolCard key={t.id} tool={t} />)}
    </div>
  );

  const renderCatalog = (collapsedNote?: boolean) => (
    <div className="ab-catalog" style={collapsedNote ? { maxHeight: 'none' } : undefined}>
      <div className="ab-catalog-head"><span>| Catálogo de Herramientas</span><Icon name="Boxes" size={16} /></div>
      <div className="ab-catalog-filter">
        <span className="ab-mini-label">Ver por:</span>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          <select className="ab-select" style={{ flex: 1 }} value={catalogFilter} onChange={(e) => setCatalogFilter(e.target.value as any)}>
            <option value="Carpeta">ESTRUCTURA DE CARPETAS</option>
            <option value="Fase">FASES DEL PROYECTO</option>
            <option value="Top">HERRAMIENTAS TOP</option>
          </select>
          <Icon name="ChevronDown" size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
        </div>
      </div>
      <div className="ab-catalog-scroll">{catalogFilter === 'Carpeta' ? renderByFolder() : catalogFilter === 'Fase' ? renderByPhase() : renderTop()}</div>
    </div>
  );

  /* --- BLOQUE 4 — ToolHost --- */
  const renderHost = () => {
    if (!activeToolObj) return <div className="ab-host-empty">// Seleccione una herramienta del catálogo para comenzar</div>;
    const t = activeToolObj;
    const folder = FOLDERS.find((f) => f.id === t.folder);
    const meta = `${t.code} · CARPETA ${t.folder} ${folder?.name.toUpperCase()} · ${t.sub.toUpperCase()}`;
    if (t.estado === 'soon') {
      return (
        <motion.div key={t.id} className="ab-render" style={{ borderStyle: 'dashed' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="ab-render-icon" style={{ opacity: 0.5 }}><Icon name={t.icon} size={56} /></div>
          <div className="ab-render-title" style={{ opacity: 0.6 }}>[ MÓDULO EN DESARROLLO ]</div>
          <div className="ab-render-sub">{meta}</div>
          <div className="ab-loadtext" style={{ marginTop: 18 }}><Icon name="Clock" size={11} /> PRÓXIMAMENTE — VISIBLE EN CATÁLOGO, AÚN NO OPERATIVO</div>
        </motion.div>
      );
    }
    if (isLockedActive) {
      return <PricingView key={t.id} lockedTool={t.label} plan={plan} onUpgrade={() => { setPlan('Premium'); triggerToast('¡Bienvenido a Premium! (demo)'); }} />;
    }
    if (activeComp) {
      const Comp = activeComp;
      // Inyectar props contextuales por herramienta (F4.6)
      const toolProps: Record<string, any> = {
        triggerToast,
        currentProject: activeProject,
        ...(t.id === 'dimensionador' && { onUpdateMaster }),
        ...(t.id === 'mapa-terreno' && { onSaveTerreno }),
      };
      return (
        <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%' }}>
          <Comp {...toolProps} />
        </motion.div>
      );
    }
    return (
      <motion.div key={t.id} className="ab-render" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="ab-render-icon"><Icon name={t.icon} size={56} /></div>
        <div className="ab-render-title">[ RENDERIZANDO MÓDULO: {t.label} ]</div>
        <div className="ab-render-sub">{meta}</div>
        <div className="ab-loadbar"><motion.div className="ab-loadbar-fill" initial={{ width: '4%' }} animate={{ width: ['4%', '100%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }} /></div>
        <div className="ab-loadtext"><Icon name="Loader" size={11} /> CARGANDO UI DEL MÓDULO… (React.lazy / Suspense)</div>
      </motion.div>
    );
  };

  const linkedTools = activeProject
    ? (addedTools[activeProjectId] || []).map((id) => MOCK_CATALOG.find((t) => t.id === id)).filter((t): t is Tool => !!t && t.folder === binderTab)
    : [];

  const projTools = activeProjectId ? (addedTools[activeProjectId] || []) : [];
  const fichaItems = activeProject ? [
    { k: 'Nombre', done: !!activeProject.name }, { k: 'Año', done: !!activeProject.anio },
    { k: 'Propietario', done: !!activeProject.propietario }, { k: 'Rol', done: !!activeProject.rol },
    { k: 'Dirección', done: !!activeProject.direccion }, { k: 'Comuna', done: !!activeProject.comuna },
    { k: 'Sup. Terreno', done: !!activeProject.superficieTerrenoLegal }, { k: 'Sup. Proyecto', done: !!activeProject.superficieProyecto },
    { k: 'Presupuesto', done: !!activeProject.presupuestoUF }, { k: 'Fase', done: !!activeProject.etapa },
    { k: 'Participantes', done: projTools.includes('participantes') }, { k: 'Ubicación', done: projTools.includes('ubicacion') },
    { k: 'Geoloc.', done: projTools.includes('geolocalizador') }, { k: 'Dimensionado', done: projTools.includes('dimensionador') },
    { k: 'Exp. DOM', done: projTools.includes('expediente-dom') },
  ] : [];
  const fichaDone = fichaItems.filter((i) => i.done).length;
  const fichaPct = fichaItems.length ? Math.round((fichaDone / fichaItems.length) * 100) : 0;

  const FolderCard = ({ p, small }: { p: any; small?: boolean }) => (
    <button className="ab-folder-card" onClick={() => openProject(p.id)}>
      <div className="fc-top"><Icon name="Folder" size={small ? 22 : 26} /><Icon name="ChevronRight" size={13} style={{ opacity: 0.4 }} /></div>
      <div className="fc-name">{p.name}</div>
      <div className="fc-meta"><span className="fc-badge">{p.etapa}</span><span className="fc-badge">{p.destino}</span></div>
      {!small && <div className="fc-ref">REF: {p.id}</div>}
    </button>
  );

  /* ========================================================================= */
  return (
    <div className="ab-root">
      <AnimatePresence>
        {toast && (
          <motion.div className="ab-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <span className="dot">◈</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ab-container">

        {/* BLOQUE 1 · CABECERA */}
        <header className="ab-masthead">
          <div className="ab-masthead-logo" aria-hidden>
            <svg viewBox="0 0 300 200" width="100%" height="100%">
              <pattern id="dg" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="currentColor" opacity="0.16" /></pattern>
              <rect width="300" height="200" fill="url(#dg)" />
              <path d="M70,150 L150,110 L230,150 L150,190 Z" fill="currentColor" />
              <path d="M95,115 L150,142 L150,95 L95,68 Z" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" />
              <path d="M150,142 L205,115 L205,68 L150,95 Z" fill="var(--muted)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="150" cy="60" r="3" fill="var(--destructive)" />
              <circle cx="92" cy="62" r="3" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="212" cy="60" r="3" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" />
              <path d="M150,60 L92,62 M150,60 L212,60" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" />
            </svg>
          </div>
          <div className="ab-masthead-text">
            <a href="/" className="ab-logo-link" title="Ir al inicio" onClick={(e) => { e.preventDefault(); goHome(); }}>
              <span className="ab-pulse">_</span>Archibots
            </a>
            <div className="ab-masthead-sub">MÓDULO · <strong style={{ color: 'var(--destructive)' }}>WORKSPACE UNIFICADO</strong> · LABORATORIO DE ARQUITECTURA &amp; INGENIERÍA · OPERANDO BAJO NORMATIVA CHILENA VIGENTE</div>
          </div>
        </header>

        {/* BLOQUE 2 · BARRA DE ESTADO (path + usuario/estatus + tema) */}
        <div className="ab-statusbar">
          <div className="ab-status-group">
            <span className="ab-path"><span className="ab-caret">&gt;</span>{pathStr}</span>
          </div>
          <div className="ab-user">
            <Icon name="UserCircle2" size={16} />
            <span className="ab-username">{MOCK_USER.nombre}</span>
            <button className={`ab-badge ${plan === 'Premium' ? 'premium' : 'free'}`} onClick={() => { const next = plan === 'Premium' ? 'Free' : 'Premium'; setPlan(next); triggerToast('Plan: ' + next + ' (demo)'); }} title="Cambiar plan (demo)">
              <Icon name={plan === 'Premium' ? 'Crown' : 'User'} size={10} /> {plan}
            </button>
            <span className="ab-divider" />
            <span className="ab-sysok"><span className="ab-blink">●</span> SYSTEM_OK</span>
            <button className="ab-theme-mini" onClick={() => setShareOpen(true)} title="Compartir proyecto"><Icon name="UserPlus" size={11} /> Compartir</button>
            <button className="ab-theme-mini" onClick={() => setView('admin')} title="Panel de administración"><Icon name="ShieldCheck" size={11} /> Admin</button>
            <button className="ab-theme-mini" onClick={cycleTheme} title="Ciclar tema visual"><Icon name="Palette" size={11} /> {theme.toUpperCase()}</button>
          </div>
        </div>

        <div className="ab-hr" />

        {view === 'home' ? (
          /* ===================== PÁGINA DE INICIO ===================== */
          <div className="ab-home">
            {/* Barra Top Tools (gris) */}
            <div className="ab-home-toptools">
              <span className="ab-home-tt-label"><Icon name="Star" size={12} /> Herramientas Top</span>
              {topToolsList.map((t) => (
                <button key={t.id} className="ab-home-tt" onClick={() => selectTool(t.id)}><Icon name={t.icon} size={15} /> {t.label}</button>
              ))}
            </div>

            {/* Mis proyectos (carpetas cerradas) o invitación */}
            <div className="ab-home-section">
              <div className="ab-home-section-head"><span>| Mis Proyectos</span><span style={{ fontSize: 11, opacity: 0.6 }}>{MOCK_PROJECTS.length} EXPEDIENTES</span></div>
              {MOCK_PROJECTS.length ? (
                <div className="ab-home-grid">
                  {MOCK_PROJECTS.map((p) => <FolderCard key={p.id} p={p} />)}
                  <button className="ab-folder-card new" onClick={() => triggerToast('Nuevo proyecto (demo)')}><Icon name="FolderPlus" size={26} /> + Nuevo Proyecto</button>
                </div>
              ) : (
                <div className="ab-home-empty">
                  <Icon name="FolderOpen" size={40} strokeWidth={1.2} />
                  <h3>Aún no tienes proyectos</h3>
                  <p>Crea tu primer expediente o explora el catálogo de herramientas.</p>
                  <div className="ab-home-empty-actions">
                    <button className="ab-btn" onClick={() => triggerToast('Nuevo proyecto (demo)')}><Icon name="FolderPlus" size={13} /> Crear proyecto</button>
                    <button className="ab-btn sec" onClick={() => setView('workspace')}><Icon name="Boxes" size={13} /> Explorar herramientas</button>
                  </div>
                </div>
              )}
            </div>

            {/* Catálogo (colapsado) */}
            {renderCatalog(true)}
          </div>
        ) : view === 'legal-terminos' ? (
          <LegalView defaultTab="terminos" onClose={() => setView('workspace')} />
        ) : view === 'legal-privacidad' ? (
          <LegalView defaultTab="privacidad" onClose={() => setView('workspace')} />
        ) : view === 'admin' ? (
          <AdminDashboard topToolIds={topToolIds} setTopToolIds={setTopToolIds} catalog={MOCK_CATALOG} onClose={() => setView('workspace')} />
        ) : (
          /* ===================== WORKSPACE ===================== */
          <>
            <div className="ab-workspace">
              {/* 3a — ARCHIVADOR */}
              <div>
                <div className="ab-binder-tabs">
                  {FOLDERS.map((f) => (
                    <button key={f.id} className={`ab-tab ${binderTab === f.id ? 'active' : ''}`} onClick={() => setBinderTab(f.id)}><Icon name={f.icon} size={13} />{f.id}. {f.short}</button>
                  ))}
                </div>
                <div className="ab-binder-body">
                  <div className="ab-binder-head">
                    <span>| {FOLDERS.find((f) => f.id === binderTab)?.name}</span>
                    <span className="ref">REF: {activeProject?.id || '—'}</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={binderTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      {binderTab === 0 ? (
                        activeProject ? (
                          <>
                            <div className="ab-ficha">
                              <div className="ab-ficha-main">
                                <div className="ab-photo">
                                  {activeProject.fotoUrl ? <img src={activeProject.fotoUrl} alt="Referencia" /> : <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}><Icon name="ImageOff" size={36} /><br />[ SIN IMAGEN ]</div>}
                                  <span className="ab-photo-tag">VISTA PREVIA</span>
                                </div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{activeProject.name}</h2>
                                <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="MapPin" size={14} /> {activeProject.direccion}, {activeProject.comuna}</p>
                                <div className="ab-progress">
                                  <div className="ab-progress-head">
                                    <span><Icon name="ListChecks" size={13} /> Avance del expediente</span>
                                    <span className="ab-progress-pct">{fichaDone}/{fichaItems.length} · {fichaPct}%</span>
                                  </div>
                                  <div className="ab-progress-bar"><div className="ab-progress-fill" style={{ width: `${fichaPct}%` }} /></div>
                                  <div className="ab-progress-grid">
                                    {fichaItems.map((it) => (
                                      <div key={it.k} className={`ab-chk ${it.done ? 'on' : ''}`} title={it.k}>
                                        <Icon name={it.done ? 'CheckSquare' : 'Square'} size={14} />
                                        <span>{it.k}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="ab-ficha-side">
                                <div className="ab-data-title">Datos Clave</div>
                                <div className="ab-data-row"><span className="ab-data-label">Año</span><span className="ab-data-value">{activeProject.anio}</span></div>
                                <div className="ab-data-row"><span className="ab-data-label">Propietario</span><span className="ab-data-value">{activeProject.propietario}</span></div>
                                <div className="ab-data-row"><span className="ab-data-label">Rol</span><span className="ab-data-value">{activeProject.rol}</span></div>
                                <div className="ab-data-row"><span className="ab-data-label">Destino</span><span className="ab-data-value">{activeProject.destino}</span></div>
                                <div className="ab-data-row"><span className="ab-data-label">Sup. Terreno</span><span className="ab-data-value">{activeProject.superficieTerrenoLegal} m²</span></div>
                                <div className="ab-data-row">
                                  <span className="ab-data-label">Sup. Proyecto</span>
                                  <span className="ab-data-value">{activeProject.superficieProyecto ? `${activeProject.superficieProyecto} m²` : '—'}{activeProject.superficieProyecto && <span className="ab-origin">{activeProject.superficieOrigen}</span>}</span>
                                </div>
                                <div className="ab-data-row"><span className="ab-data-label">Fase actual</span><span className="ab-data-value">[ {activeProject.etapa.toUpperCase()} ]</span></div>
                              </div>
                            </div>
                            {/* OTROS PROYECTOS DEL USUARIO */}
                            <div className="ab-otros">
                              <div className="ab-otros-title"><Icon name="FolderOpen" size={13} /> Otros proyectos del usuario</div>
                              <div className="ab-otros-grid">
                                {MOCK_PROJECTS.filter((p) => p.id !== activeProjectId).map((p) => <FolderCard key={p.id} p={p} small />)}
                              </div>
                            </div>
                          </>
                        ) : <div style={{ padding: 20 }}><div className="ab-empty">Modo libre · sin expediente activo</div></div>
                      ) : (
                        <div className="ab-linked">
                          <h3>&gt; Herramientas vinculadas a esta sección</h3>
                          {linkedTools.length === 0 ? (
                            <div className="ab-empty">No hay herramientas en esta carpeta.<br />Usa el botón [ ‹ Agregar ] del catálogo lateral para añadirlas.</div>
                          ) : linkedTools.map((t) => {
                            const done = completed.includes(t.id);
                            return (
                              <div key={t.id} className="ab-linked-card">
                                <div className="ab-linked-card-head">
                                  <div className="ab-linked-card-title"><span className="ab-chip"><Icon name={t.icon} size={14} color="var(--primary-foreground)" /></span>{t.label} <span style={{ opacity: 0.4, fontSize: 9 }}>({t.sub})</span></div>
                                  <button className="ab-btn sec sm" onClick={() => removeTool(t.id)} title="Quitar de la carpeta"><Icon name="Trash2" size={11} /> Quitar</button>
                                </div>
                                <div className="ab-linked-card-body">
                                  <span className={`ab-check ${done ? 'done' : ''}`} style={{ cursor: 'pointer' }} onClick={() => toggle(completed, t.id, setCompleted)}><Icon name={done ? 'CheckSquare' : 'Square'} size={15} /> {done ? '[ COMPLETADA ]' : '[ PENDIENTE ]'}</span>
                                  <span style={{ fontSize: 10, opacity: 0.55 }}>MOD: {TODAY}</span>
                                  <button className="ab-btn sm" onClick={() => selectTool(t.id)}>Abrir módulo <Icon name="ArrowRight" size={11} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* 3b — CATÁLOGO */}
              {renderCatalog()}
            </div>

            {/* BLOQUE 4 · ÁREA DINÁMICA */}
            <div className="ab-toolhost">
              <div className="ab-module-header">
                <span>| Área Dinámica de Trabajo</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>{activeToolObj ? <><Icon name="Activity" size={12} /> RUNTIME · {activeToolObj.code}</> : <><Icon name="Power" size={12} /> IDLE</>}</span>
              </div>
              <div className={`ab-toolhost-body ${activeComp ? 'mounted' : ''}`}>
                <AnimatePresence mode="wait">{renderHost()}</AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* BLOQUE 5 · FOOTER CORPORATIVO */}
        <div className="ab-cfooter">
          <div className="ab-metagrid">
            <div className="ab-meta"><span className="ab-meta-label">Vista</span><span className="ab-meta-value">{view === 'home' ? 'INICIO' : 'WORKSPACE'}</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Versión</span><span className="ab-meta-value">V 1.0.0 · MOCKUP</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Tema activo</span><span className="ab-meta-value">{theme.toUpperCase()}</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Doc ID</span><span className="ab-meta-value">#AB-2026-SPA</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Estatus</span><span className="ab-meta-value ab-sysok"><span className="ab-blink">●</span> SYSTEM_OK</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Usuario · Plan</span><span className="ab-meta-value">{MOCK_USER.nombre.toUpperCase()} · {plan.toUpperCase()}</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Proyecto</span><span className="ab-meta-value" style={{ color: 'var(--destructive)' }}>{activeProject ? activeProject.name.toUpperCase() : 'MODO LIBRE'}</span></div>
            <div className="ab-meta"><span className="ab-meta-label">Herramienta · Fecha</span><span className="ab-meta-value">{activeToolObj ? activeToolObj.code : '—'} · {TODAY}</span></div>
          </div>
          <FeedbackForm emailDefault={MOCK_USER.email} origen="footer" />
          <div className="ab-legal">
            <span>© {new Date().getFullYear()} ARCHIBOTS · LABORATORIO DE ARQUITECTURA PARAMÉTRICA</span>
            <span style={{ display: 'flex', gap: 14 }}>
              <a href="/legal/terminos" onClick={(e) => { e.preventDefault(); setView('legal-terminos'); }}>Términos y Condiciones</a>
              <a href="/legal/privacidad" onClick={(e) => { e.preventDefault(); setView('legal-privacidad'); }}>Política de Privacidad</a>
            </span>
          </div>
        </div>
      </div>

      {/* BLOQUE 6 · BARRA INFERIOR PERSISTENTE (Selector → Inicio → Tema) */}
      <div className="ab-toptools-bar">
        <div className="ab-tt-active">
          <span className="ab-tt-active-label"><Icon name="Wrench" size={13} /> Herramienta en trabajo</span>
          <span className="ab-tt-active-name">{activeToolObj ? <><Icon name={activeToolObj.icon} size={17} color="var(--destructive)" /> {activeToolObj.label.toUpperCase()} · {activeToolObj.code}</> : '— SIN MÓDULO ACTIVO —'}</span>
        </div>
        <div className="ab-tt-row">
          <div className="ab-tt-select">
            <Icon name="FolderOpen" size={14} color="var(--destructive)" />
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--bar-muted)', textTransform: 'uppercase' }}>Proy:</span>
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <select className="ab-select ab-select-dark" value={activeProjectId} onChange={(e) => { setActiveProjectId(e.target.value); triggerToast('Proyecto activo: ' + (MOCK_PROJECTS.find(p => p.id === e.target.value)?.name || 'Modo libre')); }}>
                <option value="">-- MODO LIBRE --</option>
                {MOCK_PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
              <Icon name="ChevronDown" size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
            </div>
          </div>
          <button className="ab-tt" style={{ flex: '0 0 auto', minWidth: 140 }} onClick={goHome}><Icon name="Home" size={15} /> INICIO</button>
          <button className="ab-tt" style={{ flex: '0 0 auto', minWidth: 175, marginLeft: 'auto' }} onClick={cycleTheme} title="Ciclar tema visual (brutalist → washi → matrix → white)"><Icon name="Palette" size={15} /> TEMA: {theme.toUpperCase()}</button>
        </div>
      </div>
      {shareOpen && <ShareProjectModal project={activeProject} collaborators={collaborators} setCollaborators={setCollaborators} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
