// ciclo.ts
// aquí van las cuentas. nada más.
//
// lo separé de la pantalla a posta: esto se puede leer y probar
// sin tener que abrir el móvil. si la estimación falla, el fallo
// está aquí, no en los botones.

export function pasarAISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function leerISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso: string, dias: number): string {
  const d = leerISO(iso);
  d.setDate(d.getDate() + dias);
  return pasarAISO(d);
}

// días que hay de a a b. si sale negativo es que b ya pasó.
export function diasEntre(a: string, b: string): number {
  const ms = leerISO(b).getTime() - leerISO(a).getTime();
  return Math.round(ms / 86400000);
}

export type Estimacion = {
  cicloMedio: number;
  ultimaRegla: string | null;
  proxima: string | null;
  faltan: number | null;
  ovulacion: string | null;
  fertilDesde: string | null;
  fertilHasta: string | null;
};

// Cada día marcado es una marca: o vino la regla o solo manchó.
// La diferencia importa: el manchado NO abre ciclo nuevo.
// Antes guardaba fechas sueltas y todo contaba igual; eso rompía
// la cuenta cuando había manchados a mitad de ciclo.
export interface Marca {
  fecha: string;
  tipo: 'regla' | 'manchado';
}

// Los inicios de verdad: días de regla cuyo día anterior no fue regla.
// Cinco días seguidos sangrando = un inicio, no cinco.
export function iniciosDeRegla(marcas: Marca[]): string[] {
  const reglas = [...new Set(marcas.filter((m) => m.tipo === 'regla').map((m) => m.fecha))].sort();
  return reglas.filter((f, i) => i === 0 || diasEntre(reglas[i - 1], f) > 1);
}

// Duraciones entre inicios, sin filtrar: para el historial y para ser
// honesta cuando los ciclos varían mucho.
export function resumenCiclos(inicios: string[]): { inicios: string[]; duraciones: number[] } {
  const duraciones: number[] = [];
  for (let i = 1; i < inicios.length; i++) {
    duraciones.push(diasEntre(inicios[i - 1], inicios[i]));
  }
  return { inicios, duraciones };
}

// Cojo los inicios de verdad y hago la media. Ignoro saltos raros
// (menos de 15 o más de 60 días) porque suelen ser olvidos al anotar,
// no ciclos reales. Con un solo inicio tiro de 28, que es lo normal,
// pero ya sabes: cada cuerpo va a lo suyo.
export function estimar(marcas: Marca[]): Estimacion {
  const ordenadas = iniciosDeRegla(marcas);
  if (ordenadas.length === 0) {
    return {
      cicloMedio: 28,
      ultimaRegla: null,
      proxima: null,
      faltan: null,
      ovulacion: null,
      fertilDesde: null,
      fertilHasta: null,
    };
  }

  const ultimaRegla = ordenadas[ordenadas.length - 1];
  let cicloMedio = 28;

  if (ordenadas.length >= 2) {
    const saltos: number[] = [];
    for (let i = 1; i < ordenadas.length; i++) {
      const s = diasEntre(ordenadas[i - 1], ordenadas[i]);
      if (s >= 15 && s <= 60) saltos.push(s);
    }
    if (saltos.length > 0) {
      cicloMedio = Math.round(saltos.reduce((a, b) => a + b, 0) / saltos.length);
    }
  }

  const proxima = sumarDias(ultimaRegla, cicloMedio);
  const hoy = pasarAISO(new Date());
  const faltan = diasEntre(hoy, proxima);

  // lo de restar 14 es la cuenta de servilleta de toda la vida.
  // no es ciencia exacta, es orientación.
  const ovulacion = sumarDias(proxima, -14);

  return {
    cicloMedio,
    ultimaRegla,
    proxima,
    faltan,
    ovulacion,
    fertilDesde: sumarDias(ovulacion, -5),
    fertilHasta: sumarDias(ovulacion, 1),
  };
}

// Las fases, con nombres propios: las lunas. Cada fase del ciclo
// se parece a una luna y la app se llama así, así que cuadra solo.
// Debajo dejo el nombre médico en pequeño, para que nadie se pierda.
//
// Lo que cuenta cada fase (energía, síntomas, raros y cuidados) lo saqué
// de leer a Kaiser Permanente, Mayo Clinic y matronas que escriben claro.
// No es un diagnóstico: es para que nadie piense que lo suyo es raro.
export type Fase = 'nueva' | 'creciente' | 'llena' | 'menguante';

export interface InfoFase {
  nombre: string;
  elemento: string;
  consejo: string;
  energia: string;
  comunes: string[];
  raros: string[];
  cuidados: string[];
}

export const FASES: Record<Fase, InfoFase> = {
  nueva: {
    nombre: 'Luna nueva',
    elemento: 'menstruación',
    consejo: 'Días de recogerse. Calor, calma y no exigirte nada.',
    energia: 'Por los suelos. El cuerpo está trabajando.',
    comunes: [
      'Cólicos',
      'Sangrado fuerte los primeros días',
      'Dolor lumbar',
      'Dolor de cabeza',
      'Cansancio',
      'Hinchazón',
      'Pecho sensible',
      'Dormir regulero',
    ],
    raros: [
      'Migraña justo antes o durante',
      'Tripa revuelta o diarrea',
      'Náuseas o mareos',
      // del forms de octubre: diarrea dos veces, dolor de huesos una,
      // calambres una y febrícula (la mía de siempre). van con su nombre.
      'Dolor muscular o de huesos',
      'Calambres en piernas o cuerpo',
      'Febrícula con la regla',
      'Notar más el dolor en general',
    ],
    cuidados: [
      'Calor donde duela: a mí, en la lumbar, que me baja como ciática',
      'Los dos primeros días duermo todo lo que puedo: me lo permito',
      'Comer alimentos con hierro y beber agua',
      'Movimiento suave solo si apetece',
    ],
  },
  creciente: {
    nombre: 'Luna creciente',
    elemento: 'folicular',
    consejo: 'Suele subir la energía. Buen momento para lo que tengas pendiente.',
    energia: 'Subiendo. Cada día un poco más.',
    comunes: [
      'Más energía y motivación',
      'Mejor humor',
      'Mejor sueño',
      'Menos hinchazón',
      'Piel más luminosa',
      'Más ganas',
      'Cabeza más clara',
    ],
    raros: [
      'Flujo que cambia: más claro y elástico',
      'Restos marrones al principio (sangre vieja, normal)',
      'Es la fase que menos guerra da: si no notas nada, también vale',
    ],
    cuidados: [
      'Aprovecha para lo pendiente',
      'Mueve el cuerpo: pide marcha',
      'Planifica lo que viene',
    ],
  },
  llena: {
    nombre: 'Luna llena',
    elemento: 'ovulación',
    consejo: 'Días fértiles. Si no buscas embarazo, ya sabes.',
    energia: 'A tope. Es el pico del mes.',
    comunes: [
      'Flujo tipo clara de huevo',
      'Subida de libido',
      'Confianza y ganas de socializar',
      'Más energía',
    ],
    raros: [
      'Pinchazo en un lado del bajo vientre',
      'Manchado leve rosado o marrón, 1-2 días',
      'Olfato y gusto más finos',
      'Temperatura un poco más alta',
      'Pecho sensible',
    ],
    cuidados: [
      'Si no buscas embarazo, ya sabes',
      'Agua y comida de verdad',
      'Si el dolor es fuerte o hay fiebre o náuseas, ve a consulta',
    ],
  },
  menguante: {
    nombre: 'Luna menguante',
    elemento: 'lútea',
    consejo: 'Puede bajar la paciencia. Dormir bien ayuda más que pelearte contigo.',
    energia: 'Estable al principio, cayendo al final.',
    comunes: [
      'Pecho sensible o hinchado',
      'Hinchazón y retención',
      'Antojos de dulce o salado',
      'Irritabilidad',
      'Tristeza o ansiedad',
      'Fatiga',
      'Dormir regulero',
      'Dolor de cabeza',
      'Acné en la mandíbula',
      'Estreñimiento o ir más al baño',
    ],
    raros: [
      'Niebla mental: cuesta concentrarse',
      'Llanto fácil: hasta con un te quiero, y no es tristeza',
      'Sueños muy vívidos',
      'Autocrítica a tope',
      'Menos paciencia con todo',
      'La libido puede subir o bajar, ambas valen',
    ],
    cuidados: [
      'Baja el ritmo cuando puedas',
      'Dormir bien ayuda más que pelearte contigo',
      'Muévete aunque no apetezca: ayuda',
      'No te creas todo lo que pienses de ti estos días',
    ],
  },
};

// En qué luna anda una fecha cualquiera (hoy o un día anotado).
// Necesito el inicio de SU ciclo y la media: con eso sitúo la ovulación
// (inicio + media − 14) y la ventana fértil alrededor.
// Si marcaste regla ese día, es nueva sin discutir.
export function faseEnFecha(
  fecha: string,
  marcas: Marca[],
  inicio: string | null,
  cicloMedio: number,
): Fase | null {
  if (!inicio) return null;
  if (marcas.some((m) => m.fecha === fecha && m.tipo === 'regla')) return 'nueva';
  const dia = diasEntre(inicio, fecha) + 1;
  if (dia < 1) return null;
  const ovulacion = sumarDias(inicio, cicloMedio - 14);
  const fertilDesde = sumarDias(ovulacion, -5);
  const fertilHasta = sumarDias(ovulacion, 1);
  if (fecha >= fertilDesde && fecha <= fertilHasta) return 'llena';
  if (fecha > ovulacion) return 'menguante';
  // primeros días sin anotar: casi seguro que también es nueva,
  // a veces se nos olvida apuntarlo el primer día.
  if (dia <= 5) return 'nueva';
  return 'creciente';
}

// Dónde andas hoy: atajo con lo que ya trae la cuenta.
export function faseDeHoy(
  hoy: string,
  marcas: Marca[],
  ultimaRegla: string | null,
  cicloMedio: number,
): Fase | null {
  return faseEnFecha(hoy, marcas, ultimaRegla, cicloMedio);
}
// meses para los anticonceptivos duraderos: sumo meses a un año+mes
// y lo digo bonito («marzo de 2027»). Mes 0 = enero, como en Date.
export function sumarMeses(anyo: number, mes: number, mas: number): { anyo: number; mes: number } {
  const total = anyo * 12 + mes + mas;
  return { anyo: Math.floor(total / 12), mes: total % 12 };
}

export function nombreMesLargo(anyo: number, mes: number): string {
  return new Date(anyo, mes, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
}

// pinto el mes en una cuadrícula de 6x7. los null son huecos vacíos
// de antes del día 1 y de después del 30/31. empiezo en lunes,
// que es como miramos el calendario aquí.
export function celdasDelMes(year: number, month: number): (string | null)[] {
  const primero = new Date(year, month, 1);
  const huecoInicial = (primero.getDay() + 6) % 7;
  const diasDelMes = new Date(year, month + 1, 0).getDate();

  const celdas: (string | null)[] = [];
  for (let i = 0; i < huecoInicial; i++) celdas.push(null);
  for (let d = 1; d <= diasDelMes; d++) {
    celdas.push(pasarAISO(new Date(year, month, d)));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  while (celdas.length < 42) celdas.push(null);
  return celdas.slice(0, 42);
}
