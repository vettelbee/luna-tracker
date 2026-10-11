// Anticonceptivos de larga duración: cada uno se cambia cada X tiempo
// y la app te avisa antes. Las duraciones fijas son las habituales;
// el parche y el anillo los pones tú cada cuántos días, porque cada
// persona lleva su pauta. Si tu tarjeta dice otra cosa, manda tu tarjeta.
// Esto es una cuenta, no tu historial médico.

export interface MetodoLargo {
  id: string;
  nombre: string;
  tipo: 'meses' | 'dias';
  meses: number;
  avisoDias: number;
  ritmos: number[];
  articulo: string;
  articuloTitulo: string;
}

export const METODOS_LARGOS: MetodoLargo[] = [
  {
    id: 'inyeccion',
    nombre: 'Inyección',
    tipo: 'meses',
    meses: 3,
    avisoDias: 7,
    ritmos: [],
    articulo: 'inyeccion-trimestral',
    articuloTitulo: 'La inyección trimestral',
  },
  {
    id: 'implante',
    nombre: 'Varilla (implante)',
    tipo: 'meses',
    meses: 36,
    avisoDias: 30,
    ritmos: [],
    articulo: 'varilla-implante',
    articuloTitulo: 'La varilla (implante)',
  },
  {
    id: 'diu-hormonal',
    nombre: 'DIU hormonal',
    tipo: 'meses',
    meses: 60,
    avisoDias: 30,
    ritmos: [],
    articulo: 'diu',
    articuloTitulo: 'El DIU',
  },
  {
    id: 'diu-cobre',
    nombre: 'DIU de cobre',
    tipo: 'meses',
    meses: 120,
    avisoDias: 30,
    ritmos: [],
    articulo: 'diu',
    articuloTitulo: 'El DIU',
  },
  {
    id: 'parche',
    nombre: 'Parche',
    tipo: 'dias',
    meses: 0,
    avisoDias: 0,
    ritmos: [7, 14, 21, 28],
    articulo: 'parche',
    articuloTitulo: 'El parche',
  },
  {
    id: 'anillo',
    nombre: 'Anillo vaginal',
    tipo: 'dias',
    meses: 0,
    avisoDias: 0,
    ritmos: [7, 14, 21, 28],
    articulo: 'anillo',
    articuloTitulo: 'El anillo vaginal',
  },
];

export interface EstadoLargo {
  metodo: string | null;
  anyo: number;
  mes: number; // 0 = enero, como en Date
  dia: number;
  cadaDias: number;
}

// próximo cambio del parche/anillo: sumo su ritmo hasta pasar de hoy.
// Así rueda solo: cada vez que abres la app, recalcula el siguiente.
export function proximoCambio(desde: Date, cadaDias: number, ahora = new Date()): Date {
  const d = new Date(desde);
  d.setHours(9, 0, 0, 0);
  const tope = new Date(ahora);
  while (d.getTime() <= tope.getTime()) {
    d.setDate(d.getDate() + cadaDias);
  }
  return d;
}

// cuántos días tiene un mes (para no ofrecer el 30 de febrero).
export function diasDelMes(anyo: number, mes: number): number {
  return new Date(anyo, mes + 1, 0).getDate();
}
