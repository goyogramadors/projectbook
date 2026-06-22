import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Map, Building, FileText, HardHat, Briefcase, 
  Plus, ChevronDown, ChevronRight, Calculator, FileCheck, 
  MapPin, Users, DollarSign, Calendar, Layout, Box, 
  CheckSquare, BookOpen, Trash2, Info, Book, Filter
} from 'lucide-react';

// --- TYPES (Mocked based on types.ts) ---
export interface Project {
  id: string;
  name: string;
  direccion?: string;
  comuna?: string;
  superficieTerreno?: string;
  superficieProyecto?: string;
  presupuestoUF?: string;
  etapa?: string;
  imageUrl?: string;
}

interface ToolPhase {
  name: string;
  active: boolean;
}

interface ToolDefinition {
  id: string;
  label: string;
  icon: any; 
  categoryId: number;
  subcategory?: string; 
  phases: ToolPhase[];
  description?: string;
}

interface AddedToolData {
  toolId: string;
  completed: boolean;
  savedDate: string;
}

// --- MOCK DATA ---
const CATEGORIES = [
  { id: 0, name: 'Ficha del Proyecto', icon: FileText },
  { id: 1, name: 'Información del Proyecto', icon: Folder },
  { id: 2, name: 'Terreno', icon: Map },
  { id: 3, name: 'Proyecto', icon: Building },
  { id: 4, name: 'Expedientes de Permisos', icon: FileCheck },
  { id: 5, name: 'Construcción', icon: HardHat },
  { id: 6, name: 'Administrativos', icon: Briefcase },
  { id: 7, name: 'Biblioteca de Recursos', icon: BookOpen },
];

const ALL_PHASES = ['PERFIL', 'ANTEPROY', 'PROYECTO', 'TRÁMITE', 'CONSTRUCCIÓN', 'ADMIN'];

const MOCK_TOOLS: ToolDefinition[] = [
  { id: 't1', label: 'Gestión de Propietarios', categoryId: 1, icon: Users, description: 'Administra información de contacto, poderes y firmas de los mandantes.', phases: [{name:'PERFIL', active:true}, {name:'ANTEPROY', active:false}] },
  { id: 't2', label: 'Calculador Honorarios', categoryId: 1, icon: Calculator, description: 'Estimación de honorarios basada en m2, complejidad y factores de mercado.', phases: [{name:'PERFIL', active:true}, {name:'ADMIN', active:true}] },
  { id: 't3', label: 'Visor Cartográfico', categoryId: 2, icon: MapPin, description: 'Conexión con bases de datos GIS para planimetría y normativa urbana.', phases: [{name:'PERFIL', active:true}, {name:'ANTEPROY', active:true}] },
  { id: 't4', label: 'Cabida de Terreno', categoryId: 2, icon: Box, description: 'Generador de volúmenes máximos teóricos según rasantes y constructibilidad.', phases: [{name:'PERFIL', active:true}] },
  { id: 't5', label: 'Dimensionador de Proyecto', categoryId: 3, icon: Layout, description: 'Cuadro de superficies paramétrico conectado a BIM.', phases: [{name:'ANTEPROY', active:true}, {name:'PROYECTO', active:true}] },
  { id: 't6', label: 'Generador de Familias BIM', categoryId: 3, icon: Box, description: 'Scripts de automatización para creación de componentes LOD 300.', phases: [{name:'PROYECTO', active:true}] },
  { id: 't7', label: 'Checklist Permiso Edificación', categoryId: 4, icon: CheckSquare, description: 'Validación de antecedentes mínimos según Art. 5.1.6 OGUC.', phases: [{name:'TRÁMITE', active:true}] },
  { id: 't8', label: 'Gestor Formularios MINVU', categoryId: 4, icon: FileText, description: 'Autocompletado de formularios oficiales en PDF.', phases: [{name:'TRÁMITE', active:true}] },
  { id: 't9', label: 'Presupuesto de Obra (UF)', categoryId: 5, icon: DollarSign, description: 'Estructuración de itemizado, APU y conexión con precios actualizados.', phases: [{name:'CONSTRUCCIÓN', active:true}] },
  { id: 't10', label: 'Cronograma Gantt', categoryId: 5, icon: Calendar, description: 'Ruta crítica y asignación de recursos a partidas.', phases: [{name:'CONSTRUCCIÓN', active:true}] },
  { id: 't11', label: 'Generador de Contratos', categoryId: 6, icon: FileText, description: 'Plantillas paramétricas legales para contratistas.', phases: [{name:'ADMIN', active:true}] },
  { id: 't12', label: 'Estados de Pago', categoryId: 6, icon: DollarSign, description: 'Control de avances financieros y retenciones.', phases: [{name:'CONSTRUCCIÓN', active:true}, {name:'ADMIN', active:true}] },
  
  { id: 'b1', label: 'OGUC (Actualizada 2026)', categoryId: 7, subcategory: 'Leyes y Normas', icon: Book, description: 'Texto completo y oficial de la Ordenanza. Búsqueda semántica.', phases: [] },
  { id: 'b2', label: 'Ley General de Urbanismo', categoryId: 7, subcategory: 'Leyes y Normas', icon: Book, description: 'LGUC consolidada con últimas modificaciones.', phases: [] },
  { id: 'b3', label: 'Formulario Único Edificación', categoryId: 7, subcategory: 'Formularios Municipales', icon: FileText, description: 'Formulario oficial en blanco descargable.', phases: [] },
  { id: 'b4', label: 'Solicitud Copropiedad', categoryId: 7, subcategory: 'Formularios Municipales', icon: FileText, description: 'Documentos requeridos para Ley 21.442.', phases: [] },
  { id: 'b5', label: 'Cambio Uso de Suelo (SAG)', categoryId: 7, subcategory: 'Formularios Sectoriales', icon: Map, description: 'Requisitos Art. 55 para áreas rurales.', phases: [] },
  { id: 'b6', label: 'Resolución Sanitaria SEREMI', categoryId: 7, subcategory: 'Formularios Sectoriales', icon: FileText, description: 'Requisitos para proyectos de equipamiento.', phases: [] },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'P-2026-001',
    name: 'Edificio Los Alerces',
    direccion: 'Lientur 7345',
    comuna: 'La Florida',
    superficieTerreno: '1,640.10',
    superficieProyecto: '8,117.40',
    presupuestoUF: '45,000',
    etapa: 'Anteproyecto',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'P-2026-002',
    name: 'Condominio Valles',
    direccion: 'Av. Las Condes 1234',
    comuna: 'Las Condes',
    superficieTerreno: '5,000.00',
    superficieProyecto: '',
    presupuestoUF: '',
    etapa: 'Perfil',
  }
];

export default function WorkspaceModule() {
  // TODO: Reemplazar con useProjects()
  const [projects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(MOCK_PROJECTS[0].id);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  
  const [toolboxFilter, setToolboxFilter] = useState<'Carpeta' | 'Fase'>('Carpeta');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['cat-1', 'cat-7', 'phase-PERFIL']);
  const [exploredToolId, setExploredToolId] = useState<string | null>(null);

  const [addedTools, setAddedTools] = useState<{ [projectId: string]: AddedToolData[] }>({
    'P-2026-001': [
      { toolId: 't3', completed: true, savedDate: '2026-06-10' },
      { toolId: 't5', completed: false, savedDate: '2026-06-12' },
      { toolId: 'b1', completed: false, savedDate: '2026-06-01' }
    ]
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleAddTool = (toolId: string) => {
    if (!selectedProjectId) return;
    setAddedTools(prev => {
      const projectTools = prev[selectedProjectId] || [];
      if (projectTools.some(t => t.toolId === toolId)) return prev;
      
      const newTool: AddedToolData = {
        toolId,
        completed: false,
        savedDate: new Date().toISOString().split('T')[0]
      };
      
      return { ...prev, [selectedProjectId]: [...projectTools, newTool] };
    });
  };

  const handleRemoveTool = (toolId: string) => {
    if (!selectedProjectId) return;
    setAddedTools(prev => {
      const projectTools = prev[selectedProjectId] || [];
      return { 
        ...prev, 
        [selectedProjectId]: projectTools.filter(t => t.toolId !== toolId) 
      };
    });
  };

  const toggleToolCompleted = (toolId: string) => {
    if (!selectedProjectId) return;
    setAddedTools(prev => {
      const projectTools = prev[selectedProjectId] || [];
      return {
        ...prev,
        [selectedProjectId]: projectTools.map(t => 
          t.toolId === toolId ? { ...t, completed: !t.completed, savedDate: new Date().toISOString().split('T')[0] } : t
        )
      };
    });
  };

  // --- NEO-BRUTALISM CSS DICIONARY ---
  const injectedStyles = `
    :root {
      --bg-color: #f0f0f0;
      --panel-bg: #ffffff;
      --border-color: #1a1a1a;
      --border-width: 2px;
      --accent-color: #e6e6e6;
      --tab-bg: #d9d9d9;
      --tab-active: #ffffff;
      --text-main: #1a1a1a;
      --text-muted: #666666;
      --highlight: #fffae6;
      --danger: #ffcccc;
      --success: #e6ffec;
    }

    .archibots-wrapper {
      background-color: var(--bg-color);
      font-family: 'Courier New', Courier, monospace;
      color: var(--text-main);
      min-height: 100vh;
      padding: 24px;
    }

    .technical-container {
      max-width: 1600px;
      margin: 0 auto;
    }

    .free-text-section {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .page-main-title {
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tech-pulse {
      animation: pulse 1s step-end infinite;
      color: #000;
      font-weight: bold;
    }
    @keyframes pulse { 50% { opacity: 0; } }

    .tool-panel {
      background: var(--panel-bg);
      border: var(--border-width) solid var(--border-color);
      box-shadow: 4px 4px 0 var(--border-color);
      position: relative;
      display: flex;
      flex-direction: column;
      height: 750px;
    }

    .module-header {
      background: var(--accent-color);
      padding: 10px 16px;
      font-weight: 700;
      font-size: 14px;
      border-bottom: var(--border-width) solid var(--border-color);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    
    .panel-content {
      padding: 16px;
      flex: 1;
      overflow-y: auto;
    }

    .toolbox-filters {
      padding: 12px;
      border-bottom: var(--border-width) solid var(--border-color);
      background: #fafafa;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .toolbox-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .tech-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tech-input-group label {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .tech-select, .tech-input {
      background: #fff;
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      font-family: inherit;
      font-size: 14px;
      border-radius: 0;
      outline: none;
    }
    .tech-select:focus, .tech-input:focus {
      background: var(--highlight);
      border-width: 2px;
      padding: 7px 11px;
    }

    .technical-btn {
      background: var(--border-color);
      color: #fff;
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      font-family: inherit;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.1s;
    }
    .technical-btn:hover:not(:disabled) {
      background: #000;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
      transform: translate(-1px, -1px);
    }
    .technical-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .technical-btn.secondary {
      background: transparent;
      color: var(--border-color);
    }
    .technical-btn.secondary:hover:not(:disabled) {
      background: var(--accent-color);
    }
    .technical-btn.small {
      padding: 4px 8px;
      font-size: 10px;
    }
    .technical-btn.danger {
      background: transparent;
      border-color: #ff3333;
      color: #ff3333;
    }
    .technical-btn.danger:hover:not(:disabled) {
      background: var(--danger);
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: 1fr 450px;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .workspace-grid { grid-template-columns: 1fr; }
    }

    /* Archivador */
    .binder-container {
      position: relative;
      margin-top: 40px;
    }
    .binder-tabs {
      display: flex;
      position: absolute;
      top: -38px;
      left: 0;
      z-index: 10;
      gap: 4px;
      flex-wrap: wrap;
    }
    .binder-tab {
      background: var(--tab-bg);
      border: var(--border-width) solid var(--border-color);
      border-bottom: none;
      padding: 8px 12px;
      font-family: inherit;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      margin-top: 4px;
      transition: all 0.2s;
    }
    .binder-tab:hover { background: #e0e0e0; }
    .binder-tab.active {
      background: var(--tab-active);
      margin-top: 0;
      height: 44px;
      border-bottom: 2px solid var(--tab-active);
      z-index: 11;
    }
    .binder-tab-0 { background: #ffeaa7; } 
    .binder-tab-0.active { background: var(--tab-active); }

    .binder-body {
      background: var(--tab-active);
      border: var(--border-width) solid var(--border-color);
      box-shadow: 8px 8px 0 var(--border-color);
      min-height: 600px;
      position: relative;
      z-index: 5;
    }

    .binder-content-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 0;
      min-height: 400px;
    }
    @media (max-width: 768px) {
      .binder-content-grid { grid-template-columns: 1fr; }
      .binder-main-view { border-right: none !important; border-bottom: var(--border-width) solid var(--border-color); }
    }

    .binder-main-view {
      padding: 32px;
      border-right: var(--border-width) solid var(--border-color);
    }
    .binder-sidebar-view {
      padding: 32px;
      background: #fdfdfd;
    }

    .project-image-container {
      width: 100%;
      height: 300px;
      border: var(--border-width) solid var(--border-color);
      background: #e9e9e9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 24px;
      position: relative;
    }
    .project-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(80%) contrast(120%);
    }
    .project-image-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-muted);
      font-size: 12px;
    }

    .data-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ccc;
      padding: 8px 0;
      font-size: 14px;
    }
    .data-row:last-child { border-bottom: none; }
    .data-label { font-weight: bold; color: var(--text-muted); }
    .data-value { font-weight: bold; text-align: right; }

    /* Toolbox Arbol */
    .toolbox-category {
      border-bottom: 1px solid var(--border-color);
    }
    .toolbox-category:last-child { border-bottom: none; }
    .category-header {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 12px 16px;
      font-family: inherit;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .category-header:hover { background: var(--highlight); }

    .category-tools {
      background: #fafafa;
      border-top: 1px solid #eee;
      padding: 8px;
    }

    .tool-item-card {
      background: #fff;
      border: 1px solid var(--border-color);
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .tool-item-card:last-child { margin-bottom: 0; }
    .tool-item-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .tool-item-title { font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px; flex: 1; }
    
    .phase-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .phase-badge {
      font-size: 9px; padding: 2px 4px; border: 1px solid #ccc; color: #666;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .phase-badge.active { border-color: var(--border-color); color: #000; font-weight: bold; }

    .explore-subpanel {
      background: #f4f4f4;
      border: 1px inset #ccc;
      padding: 12px;
      margin-top: 8px;
      font-size: 11px;
      border-left: 4px solid var(--border-color);
    }

    /* Vista de herramientas dentro del archivador */
    .active-tools-container {
      padding: 32px;
    }
    .active-tool-big-card {
      background: #fff;
      border: var(--border-width) solid var(--border-color);
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }
    .active-tool-big-card:hover {
      box-shadow: 4px 4px 0 var(--border-color);
      transform: translate(-2px, -2px);
      transition: all 0.1s;
    }
    .active-tool-big-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--highlight);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .active-tool-big-body {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
    }
    .tool-status-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
    }
    .tool-status-checkbox.completed { color: #2e7d32; }

    .library-subcategory {
      font-size: 10px;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
      margin: 12px 4px 4px 4px;
      border-bottom: 1px dashed #ccc;
      padding-bottom: 2px;
    }
  `;

  const activeCategoryName = CATEGORIES.find(c => c.id === activeCategoryId)?.name || '';
  const currentProjectTools = addedTools[selectedProjectId] || [];
  
  const toolsInCurrentTab = currentProjectTools
    .map(addedInfo => {
      const toolDef = MOCK_TOOLS.find(t => t.id === addedInfo.toolId);
      return toolDef ? { ...toolDef, ...addedInfo } : null;
    })
    .filter(t => t !== null && t.categoryId === activeCategoryId);

  const renderToolboxContent = () => {
    if (toolboxFilter === 'Carpeta') {
      return CATEGORIES.filter(c => c.id > 0).map(category => {
        const groupId = `cat-${category.id}`;
        const isExpanded = expandedGroups.includes(groupId);
        const CatIcon = category.icon;
        const toolsInCategory = MOCK_TOOLS.filter(t => t.categoryId === category.id);
        
        return (
          <div key={groupId} className="toolbox-category">
            <button className="category-header" onClick={() => toggleGroup(groupId)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CatIcon size={16} strokeWidth={1.2} />
                {category.id}. {category.name.toUpperCase()}
              </span>
              {isExpanded ? <ChevronDown size={16} strokeWidth={1.2} /> : <ChevronRight size={16} strokeWidth={1.2} />}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="category-tools">
                    {renderToolCards(toolsInCategory)}
                    {toolsInCategory.length === 0 && <div style={{ padding: '12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>VACÍO</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      });
    } else {
      const phasesList = [...ALL_PHASES.map(p => ({ id: `phase-${p}`, name: `FASE: ${p}`, isPhase: true })), { id: 'cat-7', name: '7. BIBLIOTECA DE RECURSOS', isPhase: false }];
      
      return phasesList.map(group => {
        const isExpanded = expandedGroups.includes(group.id);
        
        let toolsInGroup: ToolDefinition[] = [];
        if (group.isPhase) {
          const phaseName = group.name.replace('FASE: ', '');
          toolsInGroup = MOCK_TOOLS.filter(t => t.categoryId !== 7 && t.phases.some(p => p.name === phaseName && p.active));
        } else {
          toolsInGroup = MOCK_TOOLS.filter(t => t.categoryId === 7);
        }

        return (
          <div key={group.id} className="toolbox-category">
            <button className="category-header" onClick={() => toggleGroup(group.id)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: group.isPhase ? '#333' : '#000' }}>
                {group.isPhase ? <Filter size={14} strokeWidth={1.2} /> : <BookOpen size={16} strokeWidth={1.2} />}
                {group.name}
              </span>
              {isExpanded ? <ChevronDown size={16} strokeWidth={1.2} /> : <ChevronRight size={16} strokeWidth={1.2} />}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="category-tools">
                    {renderToolCards(toolsInGroup)}
                    {toolsInGroup.length === 0 && <div style={{ padding: '12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>SIN HERRAMIENTAS ASIGNADAS</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      });
    }
  };

  const renderToolCards = (tools: ToolDefinition[]) => {
    const hasSubcats = tools.some(t => t.subcategory);
    
    if (hasSubcats) {
      const subcats = Array.from(new Set(tools.map(t => t.subcategory || 'Otros')));
      return subcats.map(subcat => (
        <div key={subcat}>
          <div className="library-subcategory">:: {subcat} ::</div>
          {tools.filter(t => (t.subcategory || 'Otros') === subcat).map(renderSingleToolCard)}
        </div>
      ));
    }
    
    return tools.map(renderSingleToolCard);
  };

  const renderSingleToolCard = (tool: ToolDefinition) => {
    const ToolIcon = tool.icon;
    const isAdded = currentProjectTools.some(t => t.toolId === tool.id);
    const isExplored = exploredToolId === tool.id;

    return (
      <div key={tool.id} className="tool-item-card">
        <div className="tool-item-header">
          <div className="tool-item-title">
            <ToolIcon size={16} strokeWidth={1.2} />
            {tool.label}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="technical-btn secondary small"
              onClick={() => setExploredToolId(isExplored ? null : tool.id)}
            >
              <Info size={12} strokeWidth={1.2} /> EXPLORAR
            </button>
            <button 
              className={`technical-btn small ${isAdded ? 'secondary' : ''}`}
              onClick={() => handleAddTool(tool.id)}
              disabled={isAdded}
            >
              {isAdded ? 'CARGADO' : <><Plus size={12} strokeWidth={1.2} /> AÑADIR</>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExplored && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="explore-subpanel">
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>&gt; DESCRIPCIÓN:</div>
                <div style={{ color: '#555', marginBottom: '8px' }}>{tool.description || 'Sin descripción detallada.'}</div>
                {tool.categoryId !== 7 && (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>&gt; FASES COMPATIBLES:</div>
                    <div className="phase-badges">
                      {tool.phases.map((phase, idx) => (
                        <span key={idx} className={`phase-badge ${phase.active ? 'active' : ''}`}>
                          [{phase.active ? 'X' : ' '}] {phase.name}
                        </span>
                      ))}
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

  return (
    <div className="archibots-wrapper">
      <style>{injectedStyles}</style>

      <div className="technical-container">
        <div className="free-text-section">
          <div>
            <h1 className="page-main-title">
              WORKSPACE PROYECTO <span className="tech-pulse">_</span>
            </h1>
            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              // GESTIÓN DOCUMENTAL Y HERRAMIENTAS PARAMÉTRICAS
            </p>
          </div>

          <div className="tech-input-group" style={{ width: '300px' }}>
            <label>SELECCIONAR EXPEDIENTE:</label>
            <select 
              className="tech-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>[{p.id}] {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="workspace-grid">
          
          {/* SECTOR IZQUIERDO: ARCHIVADOR */}
          <div className="binder-container">
            <div className="binder-tabs">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategoryId === cat.id;
                const isFicha = cat.id === 0;
                return (
                  <button 
                    key={cat.id}
                    className={`binder-tab ${isFicha ? 'binder-tab-0' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveCategoryId(cat.id)}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {cat.id === 0 ? '0. FICHA' : `${cat.id}. ${cat.name.split(' ')[0]}`}
                  </button>
                );
              })}
            </div>

            <div className="binder-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategoryId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div style={{ padding: '16px 32px', borderBottom: '2px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      | {activeCategoryName.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      REF: {selectedProject?.id}
                    </div>
                  </div>

                  {activeCategoryId === 0 ? (
                    // VISTA 0: FICHA DEL PROYECTO
                    <div className="binder-content-grid">
                      <div className="binder-main-view">
                        <div className="project-image-container">
                          {selectedProject?.imageUrl ? (
                            <img src={selectedProject.imageUrl} alt="Referencia Proyecto" />
                          ) : (
                            <div className="project-image-placeholder">
                              <Building size={48} strokeWidth={1.2} style={{ marginBottom: '12px', opacity: 0.5 }} />
                              [ SIN IMAGEN DE REFERENCIA ]
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#000', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold' }}>
                            VISTA PREVIA
                          </div>
                        </div>
                        
                        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>{selectedProject?.name || '[ SIN NOMBRE ]'}</h2>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} strokeWidth={1.2} /> {selectedProject?.direccion || '---'}, {selectedProject?.comuna || '---'}
                        </p>
                      </div>

                      <div className="binder-sidebar-view">
                        <div style={{ marginBottom: '24px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '8px' }}>
                          DATOS CLAVE
                        </div>
                        <div className="data-row">
                          <span className="data-label">SUPERFICIE TERRENO</span>
                          <span className="data-value">{selectedProject?.superficieTerreno ? `${selectedProject.superficieTerreno} m²` : '---'}</span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">SUPERFICIE PROYECTO</span>
                          <span className="data-value">{selectedProject?.superficieProyecto ? `${selectedProject.superficieProyecto} m²` : '---'}</span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">PRESUPUESTO (UF)</span>
                          <span className="data-value">{selectedProject?.presupuestoUF ? `${selectedProject.presupuestoUF} UF` : '---'}</span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">FASE ACTUAL</span>
                          <span className="data-value">{selectedProject?.etapa ? `[ ${selectedProject.etapa.toUpperCase()} ]` : '---'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // VISTA 1-7: HERRAMIENTAS VINCULADAS
                    <div className="active-tools-container">
                      <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>
                        &gt; HERRAMIENTAS VINCULADAS A ESTA SECCIÓN
                      </h3>
                      
                      {toolsInCurrentTab.length === 0 ? (
                        <div style={{ border: '1px dashed #ccc', padding: '40px', textAlign: 'center', color: '#999' }}>
                          NO HAY HERRAMIENTAS CARGADAS EN ESTA CATEGORÍA. <br/>
                          UTILICE EL CATÁLOGO LATERAL PARA AÑADIR.
                        </div>
                      ) : (
                        <div>
                          {toolsInCurrentTab.map(tool => {
                            if (!tool) return null;
                            const ToolIcon = tool.icon;
                            return (
                              <div key={`active-${tool.id}`} className="active-tool-big-card">
                                <div className="active-tool-big-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}>
                                    <div style={{ background: '#000', color: '#fff', padding: '6px' }}>
                                      <ToolIcon size={16} strokeWidth={1.5} />
                                    </div>
                                    {tool.label} {tool.subcategory ? `(${tool.subcategory})` : ''}
                                  </div>
                                  <button 
                                    className="technical-btn danger small"
                                    onClick={() => handleRemoveTool(tool.id)}
                                  >
                                    <Trash2 size={12} strokeWidth={1.2} /> QUITAR
                                  </button>
                                </div>
                                <div className="active-tool-big-body">
                                  <div 
                                    className={`tool-status-checkbox ${tool.completed ? 'completed' : ''}`}
                                    onClick={() => toggleToolCompleted(tool.id)}
                                  >
                                    <CheckSquare size={16} strokeWidth={1.2} color={tool.completed ? "currentColor" : "#ccc"} />
                                    {tool.completed ? '[ COMPLETADA ]' : '[ PENDIENTE ]'}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                                    ÚLTIMA MODIFICACIÓN: {tool.savedDate}
                                  </div>
                                  <button className="technical-btn secondary">
                                    ABRIR MÓDULO &gt;
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* SECTOR DERECHO: HERRAMIENTAS */}
          <div className="tool-panel">
            <div className="module-header">
              <span>| CATÁLOGO DE HERRAMIENTAS</span>
              <Box size={16} strokeWidth={1.2} />
            </div>
            
            <div className="toolbox-filters">
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>VER POR:</span>
              <select 
                className="tech-select" 
                style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}
                value={toolboxFilter}
                onChange={(e) => setToolboxFilter(e.target.value as 'Carpeta' | 'Fase')}
              >
                <option value="Carpeta">ESTRUCTURA DE CARPETAS</option>
                <option value="Fase">FASES DEL PROYECTO</option>
              </select>
            </div>

            <div className="toolbox-scroll-area">
              {renderToolboxContent()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}