/* PricingView — Paywall / Vista de Suscripciones (3 planes + checkout mock).
   Tarjetas comparativas: Base (Gratis) · Premium ($10.000/mes) · Pase por Proyecto.
   Botón de pago simulado (mock checkout, sin cobro real).
   Usa clases shadcn (bg-card, border-theme, text-muted-foreground…) → temable en los 4 modos. */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

type TierId = 'base' | 'premium' | 'project';
interface Feature { label: string; base: boolean | string; premium: boolean | string; project: boolean | string; }

const FEATURES: Feature[] = [
  { label: 'Proyectos incluidos', base: '1 proyecto', premium: 'Ilimitados*', project: '1 proyecto' },
  { label: 'Dimensionador y honorarios', base: true, premium: true, project: true },
  { label: 'Geolocalizador Normativo (PRC)', base: true, premium: true, project: true },
  { label: 'Exportación a PDF / impresión', base: true, premium: true, project: true },
  { label: 'Asistente de Usos BIM', base: false, premium: true, project: true },
  { label: 'Familias BIM (LOD) · ISO 19650', base: false, premium: true, project: true },
  { label: 'Compartir y colaborar (Editor/Lector)', base: false, premium: true, project: true },
  { label: 'Soporte', base: 'Comunidad', premium: 'Prioritario', project: 'Por proyecto' },
];

const PRICES: Record<TierId, { name: string; amount: string; period: string; sub: string }> = {
  base:    { name: 'Arquitecto Base',  amount: 'Gratis',  period: '/ siempre',   sub: 'Para empezar y proyectos individuales.' },
  premium: { name: 'ArchiBots Premium', amount: '$10.000', period: '/ mes',       sub: 'Para estudios: multi-proyecto, BIM y colaboración.' },
  project: { name: 'Pase por Proyecto', amount: '$4.990',  period: '/ proyecto',  sub: 'Pago único: desbloquea todo para 1 proyecto.' },
};

const Cell = ({ v }: { v: boolean | string }) => {
  if (v === true) return <Icons.Check size={15} className="text-primary" strokeWidth={2.5} />;
  if (v === false) return <Icons.Minus size={15} className="text-muted-foreground" />;
  return <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'right' }}>{v}</span>;
};

export default function PricingView({ lockedTool, plan = 'Free', onUpgrade }: { lockedTool?: string; plan?: 'Free' | 'Premium'; onUpgrade?: () => void }) {
  const [checkout, setCheckout] = useState<null | TierId>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const openCheckout = (t: TierId) => { setCheckout(t); setStatus('idle'); };
  const pay = () => { setStatus('processing'); setTimeout(() => setStatus('done'), 1300); };
  const finish = () => { const wasMonthly = checkout === 'premium'; setCheckout(null); setStatus('idle'); if (onUpgrade) onUpgrade(); void wasMonthly; };

  const renderList = (key: TierId) => (
    <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
      {FEATURES.map((f) => {
        const v = f[key];
        return (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 600 }}>
            <span style={{ opacity: v === false ? 0.45 : 1 }}>{f.label}</span>
            <Cell v={v} />
          </div>
        );
      })}
    </div>
  );

  const Price = ({ k, accent }: { k: TierId; accent?: boolean }) => (
    <div style={{ padding: '20px 22px', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {k === 'base' && <Icons.User size={16} />}
        {k === 'premium' && <Icons.Crown size={16} className="text-primary" />}
        {k === 'project' && <Icons.FolderOpen size={16} />}
        <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>{PRICES[k].name}</span>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className={accent ? 'text-primary' : ''} style={{ fontSize: 30, fontWeight: 800 }}>{PRICES[k].amount}</span>
        <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>{PRICES[k].period}</span>
      </div>
      <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 6 }}>{PRICES[k].sub}</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Aviso de bloqueo */}
      {lockedTool && (
        <div className="border-theme bg-muted" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 20 }}>
          <Icons.Lock size={16} className="text-destructive" />
          <span style={{ fontSize: 12, fontWeight: 700 }}>
            <strong className="text-destructive">{lockedTool}</strong> es una herramienta Premium. Elige un plan para desbloquearla.
          </span>
        </div>
      )}

      <div className="free-text-section" style={{ marginBottom: 24, textAlign: 'center', maxWidth: 'none' }}>
        <h1 className="page-main-title" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.BadgeDollarSign size={26} strokeWidth={1.4} /> Planes ArchiBots
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 6 }}>Elige el plan que se ajusta a tu estudio. Cambia cuando quieras.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, maxWidth: 1040, margin: '0 auto', alignItems: 'stretch' }}>

        {/* PLAN BASE */}
        <div className="bg-card border-theme shadow-hard" style={{ display: 'flex', flexDirection: 'column' }}>
          <Price k="base" />
          {renderList('base')}
          <div style={{ padding: '16px 22px', borderTop: 'var(--border-thickness) solid var(--border)' }}>
            <button className="ab-btn sec" style={{ width: '100%', justifyContent: 'center', padding: 12, cursor: plan === 'Free' ? 'default' : 'pointer' }} disabled={plan === 'Free'}>
              {plan === 'Free' ? <><Icons.Check size={13} /> Tu plan actual</> : 'Plan Base'}
            </button>
          </div>
        </div>

        {/* PLAN PREMIUM (destacado) */}
        <div className="bg-card border-primary shadow-hard" style={{ display: 'flex', flexDirection: 'column', borderWidth: 2, borderStyle: 'solid', position: 'relative' }}>
          <span className="bg-primary text-primary-foreground" style={{ position: 'absolute', top: 0, right: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px' }}>Recomendado</span>
          <Price k="premium" accent />
          {renderList('premium')}
          <div style={{ padding: '16px 22px', borderTop: 'var(--border-thickness) solid var(--border)' }}>
            <button className="ab-btn" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={() => openCheckout('premium')} disabled={plan === 'Premium'}>
              {plan === 'Premium' ? <><Icons.Check size={13} /> Ya eres Premium</> : <><Icons.CreditCard size={13} /> Pagar $10.000 / mes</>}
            </button>
          </div>
        </div>

        {/* PASE POR PROYECTO */}
        <div className="bg-card border-theme shadow-hard" style={{ display: 'flex', flexDirection: 'column' }}>
          <Price k="project" />
          {renderList('project')}
          <div style={{ padding: '16px 22px', borderTop: 'var(--border-thickness) solid var(--border)' }}>
            <button className="ab-btn sec" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={() => openCheckout('project')}>
              <><Icons.CreditCard size={13} /> Pagar $4.990 / proyecto</>
            </button>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground" style={{ fontSize: 9, textAlign: 'center', marginTop: 16 }}>* Tope alto de seguridad para proteger costos de infraestructura · Valores en CLP, referenciales (demo).</p>

      {/* ===== CHECKOUT MOCK ===== */}
      <AnimatePresence>
        {checkout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={() => status !== 'processing' && setCheckout(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-card border-theme shadow-hard" style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}>

              <div className="bg-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: 'var(--border-thickness) solid var(--border)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}><Icons.CreditCard size={16} /> Pago seguro</span>
                {status !== 'processing' && <button className="ab-btn sec sm" onClick={() => setCheckout(null)}><Icons.X size={13} /></button>}
              </div>

              {status === 'done' ? (
                <div style={{ padding: '34px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div className="border-theme" style={{ display: 'inline-flex', padding: 14, borderRadius: 999 }}><Icons.Check size={34} className="text-primary" strokeWidth={2.5} /></div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>¡Pago realizado!</div>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    {checkout === 'premium' ? 'Tu plan Premium quedó activo (demo).' : 'Desbloqueaste este proyecto (demo).'}
                  </p>
                  <button className="ab-btn" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 4 }} onClick={finish}><Icons.ArrowRight size={13} /> Continuar</button>
                </div>
              ) : (
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{PRICES[checkout].name}</span>
                    <span style={{ fontSize: 22, fontWeight: 800 }} className="text-primary">{PRICES[checkout].amount} <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>{PRICES[checkout].period}</span></span>
                  </div>

                  <div className="tech-input-group" style={{ marginBottom: 0 }}>
                    <label>Número de tarjeta</label>
                    <input className="tech-input" value="4242 4242 4242 4242" readOnly disabled style={{ fontFamily: 'monospace' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="tech-input-group" style={{ marginBottom: 0 }}><label>Caducidad</label><input className="tech-input" value="12 / 28" readOnly disabled style={{ fontFamily: 'monospace' }} /></div>
                    <div className="tech-input-group" style={{ marginBottom: 0 }}><label>CVC</label><input className="tech-input" value="•••" readOnly disabled style={{ fontFamily: 'monospace' }} /></div>
                  </div>

                  {status === 'processing' ? (
                    <button className="ab-btn" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled>
                      <span className="tech-pulse">Procesando pago…</span>
                    </button>
                  ) : (
                    <button className="ab-btn" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={pay}>
                      <Icons.Lock size={13} /> Pagar ahora (demo)
                    </button>
                  )}
                  <p className="text-muted-foreground" style={{ fontSize: 9, textAlign: 'center' }}>Pago simulado — no se realiza ningún cobro real.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
