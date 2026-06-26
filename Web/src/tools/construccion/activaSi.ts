/* =============================================================================
   activaSi.ts — Evaluador de condiciones de activación (Construcción).
   -----------------------------------------------------------------------------
   Gramática canónica (la generan los .md vía build-catalogos-construccion.mjs):
     expr   := orExpr
     orExpr := andExpr ( "OR" andExpr )*
     andExpr:= atom ( "AND" atom )*
     atom   := "(" expr ")" | predicado
   Predicados soportados:
     siempre · opcional
     naturaleza ∈ {a, b}   ·  naturaleza ≠ X  ·  naturaleza = X
     <bool> = sí           (fundaciones, radier, sobrelosa, demoliciones, techumbre,
                            tabiqueria, pinturas, banos, mobiliario, cumplir_termica,
                            resistencia_fuego)
     <multi> incluye X     ·  <multi> incluye {a, b}  ·  <multi> incluye algo
     <multi> no vacío      ·  <multi> ≠ solo_obra_gruesa
   `opcional` = false por defecto (partida de inclusión manual).
   ============================================================================= */

export interface SeleccionConstruccion {
  naturaleza: string;
  estructura: string[];
  fundaciones: boolean; radier: boolean; sobrelosa: boolean; demoliciones: boolean;
  techumbre: boolean; tabiqueria: boolean; pinturas: boolean; banos: boolean;
  mobiliario: boolean; cumplir_termica: boolean; resistencia_fuego: boolean;
  techumbre_estructura: string[]; cubierta_material: string;
  cielos: string[]; rev_muros: string[]; pisos: string[];
  puertas: string[]; ventanas: string[]; instalaciones: string[]; urbanizacion: string[];
  eett_complementarias: string[];
  mobiliario_items: string[];
}

const MULTI = new Set(['estructura', 'cielos', 'rev_muros', 'pisos', 'puertas', 'ventanas', 'instalaciones', 'urbanizacion', 'techumbre_estructura', 'eett_complementarias', 'mobiliario_items']);

function multiOf(sel: SeleccionConstruccion, k: string): string[] {
  return (sel as unknown as Record<string, unknown>)[k] as string[] ?? [];
}
function boolOf(sel: SeleccionConstruccion, k: string): boolean {
  return Boolean((sel as unknown as Record<string, unknown>)[k]);
}

function evalAtom(raw: string, sel: SeleccionConstruccion): boolean {
  const t = raw.trim();
  if (!t || /^siempre$/i.test(t)) return true;
  if (/^opcional$/i.test(t)) return false;

  let m: RegExpMatchArray | null;
  // naturaleza ∈ {a, b}
  if ((m = t.match(/^naturaleza\s*∈\s*\{([^}]*)\}$/i))) {
    const set = (m[1] ?? '').split(',').map((s) => s.trim());
    return set.includes(sel.naturaleza);
  }
  if ((m = t.match(/^naturaleza\s*≠\s*(\S+)$/i))) return sel.naturaleza !== (m[1] ?? '').trim();
  if ((m = t.match(/^naturaleza\s*=\s*(\S+)$/i))) return sel.naturaleza === (m[1] ?? '').trim();

  // <multi> ≠ solo_obra_gruesa  (tiene alguna terminación distinta de obra gruesa)
  if ((m = t.match(/^(\w+)\s*≠\s*solo_obra_gruesa$/i))) {
    return multiOf(sel, (m[1] ?? '')).some((v) => v !== 'obra_gruesa');
  }
  // <multi> incluye {a, b}
  if ((m = t.match(/^(\w+)\s+incluye\s*\{([^}]*)\}$/i))) {
    const arr = multiOf(sel, (m[1] ?? '')); const set = (m[2] ?? '').split(',').map((s) => s.trim());
    return set.some((v) => arr.includes(v));
  }
  // <multi> incluye algo
  if ((m = t.match(/^(\w+)\s+incluye\s+algo$/i))) return multiOf(sel, (m[1] ?? '')).length > 0;
  // <multi> incluye X
  if ((m = t.match(/^(\w+)\s+incluye\s+(\S+)$/i))) return multiOf(sel, (m[1] ?? '')).includes((m[2] ?? '').trim());
  // <multi> no vacío
  if ((m = t.match(/^(\w+)\s+no\s+vac[ií]o$/i))) return multiOf(sel, (m[1] ?? '')).length > 0;
  // <bool> = sí
  if ((m = t.match(/^(\w+)\s*=\s*s[ií]$/i))) {
    const k = (m[1] ?? ''); return MULTI.has(k) ? multiOf(sel, k).length > 0 : boolOf(sel, k);
  }
  // fallback conservador: incluir
  return true;
}

/** Tokeniza respetando paréntesis y los operadores AND / OR (mayúsculas). */
function splitTop(expr: string, op: 'OR' | 'AND'): string[] {
  const parts: string[] = []; let depth = 0, last = 0;
  const re = new RegExp(`\\b${op}\\b`, 'g');
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i] ?? '';
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0) {
      re.lastIndex = i;
      const mm = re.exec(expr);
      if (mm && mm.index === i) { parts.push(expr.slice(last, i)); i += op.length - 1; last = i + 1; }
    }
  }
  parts.push(expr.slice(last));
  return parts.map((s) => s.trim()).filter(Boolean);
}

function evalExpr(expr: string, sel: SeleccionConstruccion): boolean {
  const e = expr.trim();
  // Quita un par de paréntesis envolvente si cubre toda la expresión.
  if (e.startsWith('(') && e.endsWith(')')) {
    let depth = 0, wraps = true;
    for (let i = 0; i < e.length; i++) {
      if (e[i] === '(') depth++; else if (e[i] === ')') depth--;
      if (depth === 0 && i < e.length - 1) { wraps = false; break; }
    }
    if (wraps) return evalExpr(e.slice(1, -1), sel);
  }
  const ors = splitTop(e, 'OR');
  if (ors.length > 1) return ors.some((p) => evalExpr(p, sel));
  const ands = splitTop(e, 'AND');
  if (ands.length > 1) return ands.every((p) => evalExpr(p, sel));
  return evalAtom(e, sel);
}

export function evalActivaSi(expr: string, sel: SeleccionConstruccion): boolean {
  try { return evalExpr(expr, sel); } catch { return true; }
}

/** Mapea el TipoProyecto (OGUC) del ProjectMaster a la `naturaleza` del selector. */
export function naturalezaDeTipoProyecto(tipo?: string): string {
  switch (tipo) {
    case 'Obra nueva': return 'obra_nueva';
    case 'Ampliación mayor a 100 m²': return 'ampliacion_mayor';
    case 'Alteración': return 'alteracion';
    case 'Reconstrucción': return 'reconstruccion';
    case 'Reparación': return 'reparacion';
    default: return 'obra_nueva';
  }
}
