// Con qué vas: cada producto con su consejo y, cuando aplica,
// sus horas máximas para programar el aviso de cambio.
// Las horas son las de los fabricantes y las guías: tampón 8,
// copa y disco 12. Lo demás no caduca por horas.

export interface InfoProducto {
  id: string;
  nombre: string;
  consejo: string;
  maxHoras: number | null;
  articulo: string;
}

export const PRODUCTOS: InfoProducto[] = [
  {
    id: 'compresa',
    nombre: 'Compresa',
    consejo: 'Cámbiala cuando esté llena; de noche, mejor larga.',
    maxHoras: null,
    articulo: 'tampones-compresas',
  },
  {
    id: 'tampon',
    nombre: 'Tampón',
    consejo: 'Cada 4-8 h, nunca más de 8. Absorción mínima que te valga.',
    maxHoras: 8,
    articulo: 'tampones-compresas',
  },
  {
    id: 'copa',
    nombre: 'Copa',
    consejo: 'Vaciar cada 8-12 h. Apunta los ml y sabrás cuánto sangras.',
    maxHoras: 12,
    articulo: 'copa-disco-tela',
  },
  {
    id: 'disco',
    nombre: 'Disco',
    consejo: 'Aguanta hasta 12 h, como la copa.',
    maxHoras: 12,
    articulo: 'copa-disco-tela',
  },
  {
    id: 'tela',
    nombre: 'Tela',
    consejo: 'Agua fría primero y a la lavadora, sin suavizante.',
    maxHoras: null,
    articulo: 'bragas-tela',
  },
  {
    id: 'bragas',
    nombre: 'Bragas',
    consejo: '8-12 h según tu flujo; con mucho sangrado lleva repuesto.',
    maxHoras: null,
    articulo: 'bragas-tela',
  },
];
