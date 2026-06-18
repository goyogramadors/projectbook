/* Wrapper único sobre lucide-react: resuelve el ícono por nombre (string) con
   fallback a Box, tal como el Mockup. Centraliza la dependencia de íconos. */
import * as Icons from 'lucide-react';

export const Icon = ({ name, size = 16, strokeWidth = 1.5, ...rest }: {
  name: string; size?: number; strokeWidth?: number; [k: string]: unknown;
}) => {
  const Cmp = ((Icons as unknown) as Record<string, React.ComponentType<any>>)[name] || Icons.Box;
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />;
};

export default Icon;
