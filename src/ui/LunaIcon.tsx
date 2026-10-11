// La luna que mira tu fase: nueva, creciente, llena o menguante.
// Dibujada con un recorte (máscara): un círculo lleno al que le muerdo
// un lado para las crecientes. Sin fase = luna nueva, a oscuras.

import { useId } from 'react';
import Svg, { Circle, Mask } from 'react-native-svg';
import type { Fase } from '../lib/ciclo';

export default function LunaIcon({ fase, color, fondo, size = 24 }: {
  fase: Fase | null;
  color: string;
  fondo: string;
  size?: number;
}) {
  const r = size / 2 - 1;
  const c = size / 2;
  // useId mete dos puntos y eso rompe el url(#id): los quito.
  const maskId = `luna${useId().replace(/:/g, '')}`;
  const mordisco = r * 0.85;

  if (fase === 'llena') {
    return (
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill={color} />
        <Circle cx={c - r * 0.25} cy={c - r * 0.25} r={r * 0.18} fill={fondo} opacity={0.35} />
      </Svg>
    );
  }

  if (fase === 'creciente' || fase === 'menguante') {
    const lado = fase === 'creciente' ? 1 : -1;
    return (
      <Svg width={size} height={size}>
        <Mask id={maskId}>
          <Circle cx={c} cy={c} r={r} fill="white" />
          <Circle cx={c + lado * mordisco} cy={c} r={r * 0.95} fill="black" />
        </Mask>
        <Circle cx={c} cy={c} r={r} fill={color} mask={`url(#${maskId})`} />
      </Svg>
    );
  }

  // nueva (o sin datos): solo el contorno, a oscuras como toca.
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={1.5} opacity={0.7} />
    </Svg>
  );
}
