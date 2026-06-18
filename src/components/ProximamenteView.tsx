/* Estado `soon`: tarjeta "MÓDULO EN DESARROLLO" (visible en catálogo, no operativa). */
import { motion } from 'framer-motion';
import Icon from './Icon';
import type { ToolManifest } from '../core/types';
import { FOLDERS } from '../core/catalog';

export default function ProximamenteView({ tool }: { tool: ToolManifest }) {
  const folder = FOLDERS.find((f) => f.id === tool.folder);
  const meta = [
    tool.code,
    `CARPETA ${tool.folder} ${folder?.name.toUpperCase() ?? ''}`.trim(),
    tool.sub ? tool.sub.toUpperCase() : '',
  ].filter(Boolean).join(' · ');
  return (
    <motion.div className="ab-render" style={{ borderStyle: 'dashed' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="ab-render-icon" style={{ opacity: 0.5 }}><Icon name={tool.icon} size={56} /></div>
      <div className="ab-render-title" style={{ opacity: 0.6 }}>[ MÓDULO EN DESARROLLO ]</div>
      <div className="ab-render-sub">{meta}</div>
      <div className="ab-loadtext" style={{ marginTop: 18 }}><Icon name="Clock" size={11} /> PRÓXIMAMENTE — VISIBLE EN CATÁLOGO, AÚN NO OPERATIVO</div>
    </motion.div>
  );
}
