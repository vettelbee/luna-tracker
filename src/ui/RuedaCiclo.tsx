// La rueda: tu ciclo dibujado como lo que es, una vuelta.
// Un anillo que se va rellenando, la ventana fértil en verde
// y tu día en el centro. De un vistazo, sin leer nada.
//
// Coge los colores del tema (día o noche) para no desentonar.

import { Platform, Text, View } from 'react-native';
import Svg, { Circle, Text as TextoSvg } from 'react-native-svg';
import { diasEntre } from '../lib/ciclo';
import { TEMAS, type Tema } from '../lib/tema';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function polar(cx: number, cy: number, r: number, grados: number) {
  const rad = ((grados - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RuedaCiclo({ ultimaRegla, diaDelCiclo, cicloMedio, fertilDesde, fertilHasta, tema }: {
  ultimaRegla: string | null;
  diaDelCiclo: number | null;
  cicloMedio: number;
  fertilDesde: string | null;
  fertilHasta: string | null;
  tema: Tema;
}) {
  const c = TEMAS[tema];
  const TAM = 196;
  const GROSOR = 13;
  const r = TAM / 2 - GROSOR / 2 - 10;
  const cx = TAM / 2;
  const cy = TAM / 2;
  const C = 2 * Math.PI * r;

  // sin datos no hay rueda: se dice y punto.
  if (!ultimaRegla || diaDelCiclo === null || diaDelCiclo < 1) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 18 }}>
        <Svg width={TAM} height={TAM}>
          <Circle cx={cx} cy={cy} r={r} stroke={c.linea} strokeWidth={GROSOR} fill="none" />
          <TextoSvg
            x={cx} y={cy + 6} textAnchor="middle"
            fontSize={17} fill={c.tenue} fontFamily={SERIF} fontStyle="italic">
            Tu vuelta
          </TextoSvg>
        </Svg>
        <Text style={{ color: c.tenue, fontSize: 13, marginTop: 8 }}>
          Anota tu primera regla y la rueda empieza a girar.
        </Text>
      </View>
    );
  }

  const avance = Math.min((diaDelCiclo - 1) / cicloMedio, 1);
  const puntoHoy = polar(cx, cy, r, avance * 360);

  // la ventana fértil, pasada a porción de vuelta (días 1-based).
  let f1 = -1;
  let f2 = -1;
  if (fertilDesde && fertilHasta) {
    const d1 = diasEntre(ultimaRegla, fertilDesde) + 1;
    const d2 = diasEntre(ultimaRegla, fertilHasta) + 1;
    if (d2 > 0 && d1 <= cicloMedio + 2) {
      f1 = Math.max((d1 - 1) / cicloMedio, 0);
      f2 = Math.min(d2 / cicloMedio, 1);
    }
  }
  const hayFertil = f1 >= 0 && f2 > f1;
  const largoFertil = hayFertil ? (f2 - f1) * C : 0;

  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Svg width={TAM} height={TAM}>
        {/* el camino */}
        <Circle cx={cx} cy={cy} r={r} stroke={c.linea} strokeWidth={GROSOR} fill="none" />
        {/* lo fértil, debajo del progreso */}
        {hayFertil && (
          <Circle
            cx={cx} cy={cy} r={r} stroke={c.oliva} strokeWidth={GROSOR} fill="none"
            strokeDasharray={`${largoFertil} ${C - largoFertil}`}
            strokeDashoffset={C * (1 - f1)}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        )}
        {/* lo andado */}
        <Circle
          cx={cx} cy={cy} r={r} stroke={c.rojo} strokeWidth={GROSOR} fill="none"
          strokeDasharray={`${C}`}
          strokeDashoffset={C * (1 - avance)}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        {/* tú estás aquí */}
        <Circle cx={puntoHoy.x} cy={puntoHoy.y} r={8} fill={c.tinta} />
        <Circle cx={puntoHoy.x} cy={puntoHoy.y} r={3} fill={c.papel} />
        {/* centro */}
        <TextoSvg
          x={cx} y={cy - 2} textAnchor="middle"
          fontSize={30} fontWeight="700" fill={c.tinta} fontFamily={SERIF}>
          {`Día ${diaDelCiclo}`}
        </TextoSvg>
        <TextoSvg
          x={cx} y={cy + 20} textAnchor="middle"
          fontSize={12} fill={c.tenue}>
          {`De unos ${cicloMedio}`}
        </TextoSvg>
      </Svg>
      <Text style={{ color: c.tenue, fontSize: 12.5, marginTop: 8 }}>
        Teja: lo andado · verde: fértil · el punto eres tú
      </Text>
    </View>
  );
}
