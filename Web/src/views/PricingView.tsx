/* =============================================================================
   VISTA /pricing (T-59) — PAYWALL de 3 productos (Base / Premium / Pase).
   Se monta como ruta y, inline, en el <ToolHost> al chocar con un candado
   premium (CONST §2/§3). Checkout real (Stripe, 2 modos) → Sprint H5/F5.
   Placeholder estructurado: precios y beneficios reales, sin lógica de cobro.
   ============================================================================= */
import Icon from '../components/Icon';
import { useToast } from '../core/ui/ToastProvider';

const PLANS = [
  { id: 'base', name: 'Arquitecto Base', price: 'Gratis', cadence: 'siempre', cta: 'Plan actual', feats: ['1 proyecto', 'Todas las herramientas free', 'Persistencia local'] },
  { id: 'premium', name: 'ArchiBots Premium', price: '$10.000', cadence: '/ mes', cta: 'Suscribirme', highlight: true, feats: ['Hasta 50 proyectos en la nube', 'Asistente de Usos BIM', 'Familias BIM (LOD) · ISO 19650', 'Colaboración Editor/Lector'] },
  { id: 'pase', name: 'Pase por Proyecto', price: '$4.990', cadence: 'pago único', cta: 'Comprar pase', feats: ['Desbloquea premium para 1 proyecto', 'Permanente (CONST §11)', 'Colaboradores Free en solo lectura'] },
];

export default function PricingView({ lockedTool }: { lockedTool?: string }) {
  const { triggerToast } = useToast();
  return (
    <div className="ab-render" style={{ display: 'block', textAlign: 'left', width: '100%' }}>
      <div className="ab-render-title" style={{ marginBottom: 4 }}>
        <Icon name="Crown" size={18} /> {lockedTool ? `"${lockedTool}" requiere un plan superior` : 'Planes y suscripción'}
      </div>
      <div className="ab-render-sub" style={{ marginBottom: 18 }}>Elige cómo desbloquear las herramientas premium de ArchiBots.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {PLANS.map((p) => (
          <div key={p.id} className="bg-card border-theme rounded-theme" style={{ padding: 16, border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)', boxShadow: p.highlight ? 'var(--shadow-hard)' : undefined }}>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13 }}>{p.name}</div>
            <div style={{ margin: '8px 0', fontSize: 22, fontWeight: 800 }}>{p.price} <span style={{ fontSize: 11, opacity: 0.6 }}>{p.cadence}</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'grid', gap: 6 }}>
              {p.feats.map((f) => <li key={f} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="Check" size={13} color="var(--success)" /> {f}</li>)}
            </ul>
            <button className="ab-btn" style={{ width: '100%' }} onClick={() => triggerToast('Checkout Stripe se conecta en el Sprint F5 (demo)')}>{p.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
