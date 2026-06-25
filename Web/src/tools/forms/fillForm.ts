/* =============================================================================
   fillForm.ts — Motor de llenado HÍBRIDO con pdf-lib (DOM-Formularios).
     1) rellena campos AcroForm nativos por field.acro (texto/casilla/radio/choice);
     2) si no hay AcroForm o el campo no existe, dibuja el texto en rectPt (fallback).
   pdf-lib se importa DINÁMICAMENTE (queda en el chunk de la tool, no en el bundle base).
   ============================================================================= */
import type { FormFieldMap, FormField, FormValues } from '../../core/types';

function applyTransform(value: string, transform: string | null): string {
  if (!value || !transform) return value;
  if (transform === 'uppercase') return value.toUpperCase();
  if (transform === 'number') return value.replace(/[^\d.,-]/g, '');
  if (transform === 'uf') {
    const n = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? `${n.toLocaleString('es-CL')} UF` : value;
  }
  if (transform.startsWith('date:')) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getFullYear()}`;
    }
  }
  if (transform === 'split:calle') return value.replace(/\s+\d.*$/, '').trim();
  if (transform === 'split:numero') return (value.match(/\d+\s*[a-zA-Z]?$/)?.[0] ?? '').trim();
  return value;
}

/** Rellena el PDF y devuelve los bytes resultantes. */
export async function fillForm(
  map: FormFieldMap,
  values: FormValues,
  flatten = false,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const bytes = await fetch(map.pdf).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar el PDF: ${map.pdf}`);
    return r.arrayBuffer();
  });
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = map.hasAcroForm ? pdf.getForm() : null;
  const pages = pdf.getPages();

  const drawFallback = (f: FormField, text: string): void => {
    if (!text) return;
    const page = pages[f.page - 1];
    if (!page) return;
    const [x0, y0, , y1] = f.rectPt;
    const size = Math.max(7, Math.min(11, (y1 - y0) * 0.7));
    page.drawText(text, { x: x0 + 1, y: y0 + 2, size, font, color: rgb(0.1, 0.1, 0.1) });
  };

  for (const f of map.fields) {
    const raw = values[f.id] ?? f.default ?? '';
    const val = applyTransform(raw, f.transform);

    if (f.type === 'radioGroup' && f.options) {
      const opt = f.options.find((o) => o.value === raw || o.label === raw);
      if (opt && form) {
        try { form.getCheckBox(opt.acro).check(); } catch { /* sin widget */ }
      }
      continue;
    }

    if (f.acro && form) {
      try {
        if (f.type === 'check') {
          const cb = form.getCheckBox(f.acro);
          const on = Boolean(raw) && raw !== 'false' && raw !== 'no';
          if (on) cb.check(); else cb.uncheck();
        } else if (f.type === 'choice') {
          form.getDropdown(f.acro).select(val);
        } else {
          form.getTextField(f.acro).setText(val);
        }
        continue;
      } catch {
        /* el nombre no existe como ese tipo → cae a drawText */
      }
    }
    if (f.type !== 'check') drawFallback(f, val);
  }

  if (form && flatten) form.flatten();
  return pdf.save();
}

/** Dispara la descarga del PDF llenado en el navegador. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
