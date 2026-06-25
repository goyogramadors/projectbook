/* src/forms/index.ts - registro de field-maps disponibles. Un import por formulario. */
import type { FormFieldMap } from '../core/types';

// Obra nueva
import f211 from './2-1.1.fieldmap.json';
import f231 from './2-3.1.fieldmap.json';
import f251 from './2-5.1.fieldmap.json';
import f271 from './2-7.1.fieldmap.json';
import djON from './dj-termino-on.fieldmap.json';
// Ampliación > 100 m²
import f212 from './2-1.2.fieldmap.json';
import f232 from './2-3.2.fieldmap.json';
import f252 from './2-5.2.fieldmap.json';
import f272 from './2-7.2.fieldmap.json';
// Alteración
import f213 from './2-1.3.fieldmap.json';
import f233 from './2-3.3.fieldmap.json';
import f273 from './2-7.3.fieldmap.json';
import djALT from './dj-termino-alt.fieldmap.json';
// Reconstrucción
import f214 from './2-1.4.fieldmap.json';
import f234 from './2-3.4.fieldmap.json';
import f254 from './2-5.4.fieldmap.json';
import f274 from './2-7.4.fieldmap.json';
import djREC from './dj-termino-rec.fieldmap.json';
// Reparación
import f235 from './2-3.5.fieldmap.json';
import f255 from './2-5.5.fieldmap.json';
import f275 from './2-7.5.fieldmap.json';
import djREP from './dj-termino-rep.fieldmap.json';

const m = (x: unknown) => x as unknown as FormFieldMap;

export const FORM_MAPS: Record<string, FormFieldMap> = {
  '2-1.1': m(f211), '2-3.1': m(f231), '2-5.1': m(f251), '2-7.1': m(f271), 'dj-termino-on': m(djON),
  '2-1.2': m(f212), '2-3.2': m(f232), '2-5.2': m(f252), '2-7.2': m(f272),
  '2-1.3': m(f213), '2-3.3': m(f233), '2-7.3': m(f273), 'dj-termino-alt': m(djALT),
  '2-1.4': m(f214), '2-3.4': m(f234), '2-5.4': m(f254), '2-7.4': m(f274), 'dj-termino-rec': m(djREC),
  '2-3.5': m(f235), '2-5.5': m(f255), '2-7.5': m(f275), 'dj-termino-rep': m(djREP),
};
