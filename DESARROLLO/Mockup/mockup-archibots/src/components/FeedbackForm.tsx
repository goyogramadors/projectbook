/**
 * FeedbackForm.tsx — Fase 5.7 · Componente de Feedback del Footer (Regla §16)
 *
 * Reemplaza el inline <div className="ab-feedback"> en App.tsx.
 * Hereda todos los temas via .ab-feedback / .ab-btn / .ab-toast de archibots.css.
 *
 * Props:
 *   emailDefault  — pre-rellena el campo email (pasar MOCK_USER.email desde App.tsx)
 *   origen        — etiqueta de origen para Firestore ('footer', 'modal', etc.)
 *
 * Uso desde App.tsx:
 *   import FeedbackForm from './components/FeedbackForm';
 *   <FeedbackForm emailDefault={MOCK_USER.email} origen="footer" />
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { enviarFeedback, type TipoFeedback } from '../core/feedbackService';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface FeedbackFormProps {
  emailDefault?: string;
  origen?: string;
}

// ── Opciones de satisfacción ─────────────────────────────────────────────────

const SATISFACCION = [
  { valor: 4, emoji: '😍', label: 'Excelente' },
  { valor: 3, emoji: '🙂', label: 'Bien'      },
  { valor: 2, emoji: '😐', label: 'Regular'   },
  { valor: 1, emoji: '😕', label: 'Malo'      },
] as const;

const TIPOS: { valor: TipoFeedback; label: string }[] = [
  { valor: 'sugerencia', label: 'Sugerencia' },
  { valor: 'error',      label: 'Error'      },
  { valor: 'elogio',     label: 'Elogio'     },
  { valor: 'otro',       label: 'Otro'       },
];

// ── Componente ───────────────────────────────────────────────────────────────

export default function FeedbackForm({ emailDefault = '', origen = 'footer' }: FeedbackFormProps) {
  const [email,        setEmail]        = useState(emailDefault);
  const [mensaje,      setMensaje]      = useState('');
  const [tipo,         setTipo]         = useState<TipoFeedback>('sugerencia');
  const [satisfaccion, setSatisfaccion] = useState<number | null>(null);
  const [enviando,     setEnviando]     = useState(false);
  const [toast,        setToast]        = useState<{ texto: string; ok: boolean } | null>(null);

  const mostrarToast = (texto: string, ok: boolean) => {
    setToast({ texto, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (!mensaje.trim()) {
      mostrarToast('Escribe un mensaje antes de enviar.', false);
      return;
    }
    setEnviando(true);
    try {
      await enviarFeedback(
        email.trim() || 'anonimo@archibots.cl',
        mensaje.trim(),
        tipo,
        { satisfaccion: satisfaccion ?? undefined, origen }
      );
      mostrarToast('¡Gracias por tu comentario! Lo revisaremos pronto.', true);
      setMensaje('');
      setSatisfaccion(null);
    } catch {
      mostrarToast('No se pudo enviar. Intenta más tarde.', false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="ab-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            style={toast.ok ? {} : { background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
          >
            <span className="dot">{toast.ok ? '◈' : '⚠'}</span>
            {toast.texto}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formulario ── */}
      <div className="ab-feedback" style={{ flexWrap: 'wrap', gap: 8 }}>

        {/* Etiqueta */}
        <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icons.MessageSquare size={13} /> Feedback
        </label>

        {/* Selector de tipo */}
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoFeedback)}
          style={{
            border: 'var(--bw, 1.5px) solid var(--sumi)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            padding: '6px 8px',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>{t.label}</option>
          ))}
        </select>

        {/* Email (opcional) */}
        <input
          type="email"
          placeholder="tu@email.cl (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: 180, flexShrink: 0 }}
        />

        {/* Campo de mensaje */}
        <input
          type="text"
          placeholder="Cuéntanos qué mejorarías o reporta un problema…"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ flex: 1, minWidth: 200 }}
        />

        {/* Selector de satisfacción */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {SATISFACCION.map((s) => (
            <button
              key={s.valor}
              title={s.label}
              onClick={() => setSatisfaccion(satisfaccion === s.valor ? null : s.valor)}
              style={{
                background: satisfaccion === s.valor ? 'var(--primary)' : 'transparent',
                border: 'var(--bw, 1.5px) solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '3px 6px',
                fontSize: 15,
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'all .1s',
                filter: satisfaccion !== null && satisfaccion !== s.valor ? 'grayscale(1) opacity(0.4)' : 'none',
              }}
            >
              {s.emoji}
            </button>
          ))}
        </div>

        {/* Botón enviar */}
        <button
          className="ab-btn"
          onClick={handleSubmit}
          disabled={enviando}
          style={{ opacity: enviando ? 0.6 : 1 }}
        >
          {enviando
            ? <><Icons.Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Enviando…</>
            : <><Icons.Send size={12} /> Enviar</>
          }
        </button>
      </div>
    </>
  );
}
