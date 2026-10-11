// Los dos temas: papel de día y cielo de noche.
// La noche es cálida (tinta sobre casi negro), nada de morados neón:
// tiene que oler a cuaderno también a oscuras.

export type Tema = 'dia' | 'noche';

export interface Paleta {
  papel: string;
  hoja: string;
  tinta: string;
  tenue: string;
  linea: string;
  rojo: string;
  oliva: string;
  marcador: string;
  placeholder: string;
}

export const TEMAS: Record<Tema, Paleta> = {
  dia: {
    papel: '#F6F1E7',
    hoja: '#FFFDF8',
    tinta: '#241D16',
    tenue: '#857768',
    linea: '#E2D7C0',
    rojo: '#A63D2A',
    oliva: '#6B7245',
    marcador: '#F4E3B0',
    placeholder: '#A89A86',
  },
  noche: {
    papel: '#0E141F',
    hoja: '#182030',
    tinta: '#EEE5D0',
    tenue: '#8E9BB0',
    linea: '#2B3648',
    rojo: '#D67E5C',
    oliva: '#9AAD7E',
    marcador: '#46411F',
    placeholder: '#67748C',
  },
};
