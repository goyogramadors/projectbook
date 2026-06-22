export interface RegionComunas {
  region: string;
  comunas: string[];
}

export const regionesYComunas: RegionComunas[] = [
  {
    "region": "Arica y Parinacota",
    "comunas": ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    "region": "Tarapacá",
    "comunas": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
  },
  {
    "region": "Antofagasta",
    "comunas": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
  },
  {
    "region": "Atacama",
    "comunas": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  {
    "region": "Coquimbo",
    "comunas": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  {
    "region": "Valparaíso",
    "comunas": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"]
  },
  {
    "region": "Región del Libertador Gral. Bernardo O’Higgins",
    "comunas": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]
  },
  {
    "region": "Región del Maule",
    "comunas": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]
  },
  {
    "region": "Región de Ñuble",
    "comunas": ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"]
  },
  {
    "region": "Región del Biobío",
    "comunas": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]
  },
  {
    "region": "Región de la Araucanía",
    "comunas": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]
  },
  {
    "region": "Región de Los Ríos",
    "comunas": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
  },
  {
    "region": "Región de Los Lagos",
    "comunas": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]
  },
  {
    "region": "Región Aisén del Gral. Carlos Ibáñez del Campo",
    "comunas": ["Coihaique", "Lago Verde", "Aisén", "Cisnes", "Guaitecas", "Cochrane", "O’Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
  },
  {
    "region": "Región de Magallanes y de la Antártica Chilena",
    "comunas": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  },
  {
    "region": "Región Metropolitana de Santiago",
    "comunas": ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
  }
];

// Helper functions for easy UI consumption
export function getRegionesSorted(): string[] {
  return regionesYComunas.map(r => r.region).sort((a, b) => a.localeCompare(b));
}

// Deprecated because city field is eliminated, left as compatibility stub returning empty list
export function getCiudadesPorRegionSorted(_regionName: string): string[] {
  return [];
}

export function getComunasPorRegionSorted(regionName: string): string[] {
  const norm = regionName.trim().toLowerCase();
  
  // Try to find matching region using normalize region logic
  const reg = regionesYComunas.find(r => {
    const name = r.region.toLowerCase();
    if (name === norm) return true;
    if (norm.includes("metropolitana") && name.includes("metropolitana")) return true;
    if (norm.includes("higgins") && name.includes("higgins")) return true;
    if (norm.includes("maule") && name.includes("maule")) return true;
    if (norm.includes("ñuble") && name.includes("ñuble")) return true;
    if (norm.includes("biob") && name.includes("biobío")) return true;
    if (norm.includes("araucan") && name.includes("araucanía")) return true;
    if (norm.includes("ríos") && name.includes("ríos")) return true;
    if (norm.includes("lagos") && name.includes("lagos")) return true;
    if ((norm.includes("ais") || norm.includes("ays")) && name.includes("aisén")) return true;
    if (norm.includes("magallan") && name.includes("magallanes")) return true;
    if (norm.includes("arica") && name.includes("arica")) return true;
    if (norm.includes("tarapac") && name.includes("tarapacá")) return true;
    if (norm.includes("antofagasta") && name.includes("antofagasta")) return true;
    if (norm.includes("atacama") && name.includes("atacama")) return true;
    if (norm.includes("coquimbo") && name.includes("coquimbo")) return true;
    if (norm.includes("valpara") && name.includes("valparaíso")) return true;
    return false;
  });

  if (!reg) return [];
  return [...reg.comunas].sort((a, b) => a.localeCompare(b));
}

// Map standard Chilean comunas to provinces for visual location logic
const COMUNA_PROVINCIA_DATABASE: { [key: string]: string } = {
  // Region Metropolitana de Santiago
  "cerrillos": "Santiago", "cerro navia": "Santiago", "conchalí": "Santiago", "el bosque": "Santiago",
  "estación central": "Santiago", "huechuraba": "Santiago", "independencia": "Santiago", "la cisterna": "Santiago",
  "la florida": "Santiago", "la granja": "Santiago", "la pintana": "Santiago", "la reina": "Santiago",
  "las condes": "Santiago", "lo barnechea": "Santiago", "lo espejo": "Santiago", "lo prado": "Santiago",
  "macul": "Santiago", "maipú": "Santiago", "ñuñoa": "Santiago", "pedro aguirre cerda": "Santiago",
  "peñalolén": "Santiago", "providencia": "Santiago", "pudahuel": "Santiago", "quilicura": "Santiago",
  "quinta normal": "Santiago", "recoleta": "Santiago", "renca": "Santiago", "santiago": "Santiago",
  "san joaquín": "Santiago", "san miguel": "Santiago", "san ramón": "Santiago", "vitacura": "Santiago",
  "puente alto": "Cordillera", "pirque": "Cordillera", "san josé de maipo": "Cordillera",
  "colina": "Chacabuco", "lampa": "Chacabuco", "tiltil": "Chacabuco",
  "san bernardo": "Maipo", "buin": "Maipo", "calera de tango": "Maipo", "paine": "Maipo",
  "melipilla": "Melipilla", "alhué": "Melipilla", "curacaví": "Melipilla", "maría pinto": "Melipilla", "san pedro": "Melipilla",
  "talagante": "Talagante", "el monte": "Talagante", "isla de maipo": "Talagante", "padre hurtado": "Talagante", "peñaflor": "Talagante",

  // Valparaíso
  "valparaíso": "Valparaíso", "casablanca": "Valparaíso", "concón": "Valparaíso", "juan fernández": "Valparaíso",
  "puchuncaví": "Valparaíso", "quintero": "Valparaíso", "viña del mar": "Valparaíso",
  "isla de pascua": "Isla de Pascua",
  "los andes": "Los Andes", "alle larga": "Los Andes", "rinconada": "Los Andes", "san esteban": "Los Andes",
  "la ligua": "Petorca", "cabildo": "Petorca", "papudo": "Petorca", "petorca": "Petorca", "zapallar": "Petorca",
  "quillota": "Quillota", "calera": "Quillota", "hijuelas": "Quillota", "la cruz": "Quillota", "nogales": "Quillota",
  "san antonio": "San Antonio", "algarrobo": "San Antonio", "cartagena": "San Antonio", "el quisco": "San Antonio", "el tabo": "San Antonio", "santo domingo": "San Antonio",
  "san felipe": "San Felipe de Aconcagua", "catemu": "San Felipe de Aconcagua", "llaillay": "San Felipe de Aconcagua", "panquehue": "San Felipe de Aconcagua", "putaendo": "San Felipe de Aconcagua", "santa maría": "San Felipe de Aconcagua",
  "quilpué": "Marga Marga", "limache": "Marga Marga", "olmué": "Marga Marga", "villa alemana": "Marga Marga",

  // O'Higgins
  "rancagua": "Cachapoal", "codegua": "Cachapoal", "coinco": "Cachapoal", "coltauco": "Cachapoal", "doñihue": "Cachapoal", "graneros": "Cachapoal", "las cabras": "Cachapoal", "machalí": "Cachapoal", "malloa": "Cachapoal", "mostazal": "Cachapoal", "olivar": "Cachapoal", "peumo": "Cachapoal", "pichidegua": "Cachapoal", "quinta de tilcoco": "Cachapoal", "rengo": "Cachapoal", "requínoa": "Cachapoal", "san vicente": "Cachapoal",
  "pichilemu": "Cardenal Caro", "la estrella": "Cardenal Caro", "litueche": "Cardenal Caro", "marchihue": "Cardenal Caro", "navidad": "Cardenal Caro", "paredones": "Cardenal Caro",
  "san fernando": "Colchagua", "chépica": "Colchagua", "chimbarongo": "Colchagua", "lolol": "Colchagua", "nancagua": "Colchagua", "palmilla": "Colchagua", "peralillo": "Colchagua", "placilla": "Colchagua", "pumanque": "Colchagua", "santa cruz": "Colchagua",

  // Maule
  "talca": "Talca", "constitución": "Talca", "curepto": "Talca", "empedrado": "Talca", "maule": "Talca", "pelarco": "Talca", "pencahue": "Talca", "río claro": "Talca", "san clemente": "Talca", "san rafael": "Talca",
  "cauquenes": "Cauquenes", "chanco": "Cauquenes", "pelluhue": "Cauquenes",
  "curicó": "Curicó", "hualañé": "Curicó", "licantén": "Curicó", "molina": "Curicó", "rauco": "Curicó", "romeral": "Curicó", "sagrada familia": "Curicó", "teno": "Curicó", "vichuquén": "Curicó",
  "linares": "Linares", "colbún": "Linares", "longaví": "Linares", "parral": "Linares", "retiro": "Linares", "san javier": "Linares", "villa alegre": "Linares", "yerbas buenas": "Linares",

  // Biobío
  "concepción": "Concepción", "coronel": "Concepción", "chiguayante": "Concepción", "florida": "Concepción", "hualqui": "Concepción", "lota": "Concepción", "penco": "Concepción", "san pedro de la paz": "Concepción", "santa juana": "Concepción", "talcahuano": "Concepción", "tomé": "Concepción", "hualpén": "Concepción",
  "lebu": "Arauco", "arauco": "Arauco", "cañete": "Arauco", "contulmo": "Arauco", "curanilahue": "Arauco", "los álamos": "Arauco", "tirúa": "Arauco",
  "los ángeles": "Biobío", "antuco": "Biobío", "cabrero": "Biobío", "laja": "Biobío", "mulchén": "Biobío", "nacimiento": "Biobío", "negrete": "Biobío", "quilaco": "Biobío", "quilleco": "Biobío", "san rosendo": "Biobío", "santa bárbara": "Biobío", "tucapel": "Biobío", "yumbel": "Biobío", "alto biobío": "Biobío",

  // Ñuble
  "cobquecura": "Itata", "coelemu": "Itata", "ninhue": "Itata", "portezuelo": "Itata", "quirihue": "Itata", "ránquil": "Itata", "treguaco": "Itata",
  "bulnes": "Diguillín", "chillán viejo": "Diguillín", "chillán": "Diguillín", "el carmen": "Diguillín", "pemuco": "Diguillín", "pinto": "Diguillín", "quillón": "Diguillín", "san ignacio": "Diguillín", "yungay": "Diguillín",
  "coihueco": "Punilla", "ñiquén": "Punilla", "san carlos": "Punilla", "san fabián": "Punilla", "san nicolás": "Punilla",

  // Araucanía
  "temuco": "Cautín", "carahue": "Cautín", "cunco": "Cautín", "curarrehue": "Cautín", "freire": "Cautín", "galvarino": "Cautín", "gorbea": "Cautín", "lautaro": "Cautín", "loncoche": "Cautín", "melipeuco": "Cautín", "nueva imperial": "Cautín", "padre las casas": "Cautín", "perquenco": "Cautín", "pitrufquén": "Cautín", "pucón": "Cautín", "saavedra": "Cautín", "teodoro schmidt": "Cautín", "toltén": "Cautín", "vilcún": "Cautín", "villarrica": "Cautín", "cholchol": "Cautín",
  "angol": "Malleco", "collipulli": "Malleco", "curacautín": "Malleco", "ercilla": "Malleco", "lonquimay": "Malleco", "los sauces": "Malleco", "lumaco": "Malleco", "purén": "Malleco", "renaico": "Malleco", "traiguén": "Malleco", "victoria": "Malleco",

  // Los Ríos
  "valdivia": "Valdivia", "corral": "Valdivia", "lanco": "Valdivia", "los lagos": "Valdivia", "máfil": "Valdivia", "mariquina": "Valdivia", "paillaco": "Valdivia", "panguipulli": "Valdivia",
  "la unión": "Ranco", "futrono": "Ranco", "lago ranco": "Ranco", "rio bueno": "Ranco", "río bueno": "Ranco",

  // Los Lagos
  "puerto montt": "Llanquihue", "calbuco": "Llanquihue", "cochamó": "Llanquihue", "fresia": "Llanquihue", "frutillar": "Llanquihue", "los muermos": "Llanquihue", "llanquihue": "Llanquihue", "maullín": "Llanquihue", "puerto varas": "Llanquihue",
  "castro": "Chiloé", "ancud": "Chiloé", "chonchi": "Chiloé", "curaco de vélez": "Chiloé", "dalcahue": "Chiloé", "puqueldón": "Chiloé", "queilén": "Chiloé", "quellón": "Chiloé", "quemchi": "Chiloé", "quinchao": "Chiloé",
  "osorno": "Osorno", "puerto octay": "Osorno", "purranque": "Osorno", "puyehue": "Osorno", "río negro": "Osorno", "san juan de la costa": "Osorno", "san pablo": "Osorno",
  "chaitén": "Palena", "futaleufú": "Palena", "hualaihué": "Palena", "palena": "Palena",

  // Aysén
  "coihaique": "Coyhaique", "coyhaique": "Coyhaique", "lago verde": "Coyhaique",
  "aisén": "Aysén", "aysén": "Aysén", "cisnes": "Aysén", "guaitecas": "Aysén",
  "cochrane": "Capitán Prat", "o’higgins": "Capitán Prat", "o'higgins": "Capitán Prat", "tortel": "Capitán Prat",
  "chile chico": "General Carrera", "río ibáñez": "General Carrera",

  // Magallanes
  "punta arenas": "Magallanes", "laguna blanca": "Magallanes", "río verde": "Magallanes", "san gregorio": "Magallanes",
  "cabo de hornos (ex navarino)": "Antártica Chilena", "antártica": "Antártica Chilena",
  "porvenir": "Tierra del Fuego", "primavera": "Tierra del Fuego", "timaukel": "Tierra del Fuego",
  "natales": "Última Esperanza", "torres del paine": "Última Esperanza",

  // Arica y Parinacota
  "arica": "Arica", "camarones": "Arica",
  "putre": "Parinacota", "general lagos": "Parinacota",

  // Tarapacá
  "iquique": "Iquique", "alto hospicio": "Iquique",
  "pozo almonte": "Tamarugal", "camiña": "Tamarugal", "colchane": "Tamarugal", "huara": "Tamarugal", "pica": "Tamarugal",

  // Antofagasta
  "antofagasta": "Antofagasta", "mejillones": "Antofagasta", "sierra gorda": "Antofagasta", "taltal": "Antofagasta",
  "calama": "El Loa", "ollagüe": "El Loa", "san pedro de atacama": "El Loa",
  "tocopilla": "Tocopilla", "maría elena": "Tocopilla",

  // Atacama
  "copiapó": "Copiapó", "caldera": "Copiapó", "tierra amarilla": "Copiapó",
  "chañaral": "Chañaral", "diego de almagro": "Chañaral",
  "vallenar": "Huasco", "alto del carmen": "Huasco", "freirina": "Huasco", "huasco": "Huasco",

  // Coquimbo
  "la serena": "Elqui", "coquimbo": "Elqui", "andacollo": "Elqui", "la higuera": "Elqui", "paiguano": "Elqui", "vicuña": "Elqui",
  "illapel": "Choapa", "canela": "Choapa", "los vilos": "Choapa", "salamanca": "Choapa",
  "ovalle": "Limarí", "combarbalá": "Limarí", "monte patria": "Limarí", "punitaqui": "Limarí", "río hurtado": "Limarí"
};

export function findProvinciaPorComuna(comunaName: string): string {
  if (!comunaName) return '';
  const key = comunaName.trim().toLowerCase();
  return COMUNA_PROVINCIA_DATABASE[key] || '';
}
