import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  avisosDisponibles,
  olvidarAviso,
  olvidarTodos,
  permisoAvisos,
  prepararAvisos,
  programarDiaria,
  programarFecha,
} from './src/lib/avisos';
import {
  celdasDelMes,
  diasEntre,
  estimar,
  faseDeHoy,
  faseEnFecha,
  FASES,
  iniciosDeRegla,
  leerISO,
  nombreMesLargo,
  pasarAISO,
  resumenCiclos,
  sumarDias,
  sumarMeses,
  type Estimacion,
  type Fase,
  type Marca,
} from './src/lib/ciclo';
import { ARTICULOS, ESTANTES, type Articulo } from './src/lib/articulos';
import { METODOS_LARGOS, diasDelMes, proximoCambio, type EstadoLargo, type MetodoLargo } from './src/lib/anticonceptivos';
import { PRODUCTOS, type InfoProducto } from './src/lib/productos';
import { informeHTML, type DatosInforme } from './src/lib/informe';
import { TEMAS, type Paleta, type Tema } from './src/lib/tema';
import RuedaCiclo from './src/ui/RuedaCiclo';
import LunaIcon from './src/ui/LunaIcon';

// Los estilos viven de la paleta: día o noche. El contexto los reparte
// a cada pantalla para no ir pasando props de colores a mano.
const EstilosCtx = createContext<{ styles: ReturnType<typeof crearEstilos>; paleta: Paleta; tema: Tema } | null>(null);

function useEstilos() {
  const ctx = useContext(EstilosCtx);
  if (!ctx) throw new Error('fuera del cuaderno');
  return ctx;
}

// las claves las dejo como estaban para no romper a quien ya anotó.
const CLAVE_REGLAS = '@luna:periods';
const CLAVE_NOTAS = '@luna:logs';
const CLAVE_AVISO = '@luna:reminder';
const CLAVE_EMPEZADO = '@luna:empezado';
const CLAVE_PASTILLA = '@luna:pastilla';
const CLAVE_LARGO = '@luna:largo';
const CLAVE_CAMBIOS = '@luna:cambios';
const CLAVE_TEMA = '@luna:tema';

// Palabras tal cual las diría yo. Están también los síntomas
// raros a posta: si lo notas y está en la lista, ya sabes que no eres la única.
// Febrícula, Diarrea, Calambres y Dolor muscular salieron del forms de octubre:
// la diarrea la mencionaron dos veces y el dolor de huesos una, así que van tal cual.
const FLUJOS = ['Manchado', 'Poco', 'Normal', 'Mucho'];
const SINTOMAS = [
  'Cólico', 'Calambres', 'Dolor de cabeza', 'Migraña', 'Acné', 'Hinchazón',
  'Pecho sensible', 'Lumbago', 'Dolor muscular', 'Cansancio', 'Antojos',
  'Tripa revuelta', 'Diarrea', 'Náuseas', 'Mareos', 'Febrícula',
  'Manchado', 'Pinchazo al ovular', 'Sin dormir', 'Sueños raros',
  'Niebla mental', 'Más ganas', 'Sin ganas',
];
const ANIMOS = ['Bien', 'En calma', 'Con energía', 'Irritable', 'De bajón', 'Nervios', 'Sensible', 'Ganas de llorar'];

// para la hora de la pastilla: todas las horas y los cuartos de hora.
// sin florituras: elegir número y listo.
const HORAS = Array.from({ length: 24 }, (_, h) => String(h));
const MINUTOS = ['00', '15', '30', '45'];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type NotaDelDia = { sintomas: string[]; animo: string | null; flujo: string | null; ml: number | null; productos: string[]; nota: string };
type Notas = Record<string, NotaDelDia>;
type Pantalla = 'hoy' | 'calendario' | 'leer' | 'tuyo';

const notaVacia: NotaDelDia = { sintomas: [], animo: null, flujo: null, ml: null, productos: [], nota: '' };

export default function App() {
  const hoy = useMemo(() => pasarAISO(new Date()), []);
  // cada día marcado dice si fue regla o solo manchado.
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [notas, setNotas] = useState<Notas>({});
  const [pantalla, setPantalla] = useState<Pantalla>('hoy');
  const [cargado, setCargado] = useState(false);
  const [avisoPuesto, setAvisoPuesto] = useState(true);
  // null = aún no sé si es su primera vez (estoy leyendo el móvil).
  const [empezado, setEmpezado] = useState<boolean | null>(null);
  // qué artículo está abierto en la pantalla de leer (null = la lista).
  const [articuloAbierto, setArticuloAbierto] = useState<string | null>(null);
  // la pastilla: si suena, y a qué hora.
  const [pastilla, setPastilla] = useState({ on: false, hora: 21, minuto: 0 });
  // el duradero (inyección, varilla, DIU): cuál y cuándo lo pusieron.
  const ahoraMismo = new Date();
  const [largo, setLargo] = useState<EstadoLargo>({
    metodo: null,
    anyo: ahoraMismo.getFullYear(),
    mes: ahoraMismo.getMonth(),
    dia: ahoraMismo.getDate(),
    cadaDias: 7,
  });

  const ahora = new Date();
  const [anyoVisto, setAnyoVisto] = useState(ahora.getFullYear());
  const [mesVisto, setMesVisto] = useState(ahora.getMonth());

  const notaDeHoy: NotaDelDia = notas[hoy] ?? notaVacia;
  const marcaHoy = marcas.find((m) => m.fecha === hoy)?.tipo ?? null;

  useEffect(() => {
    (async () => {
      try {
        const [r, n, a, e, p, l, c, t] = await Promise.all([
          AsyncStorage.getItem(CLAVE_REGLAS),
          AsyncStorage.getItem(CLAVE_NOTAS),
          AsyncStorage.getItem(CLAVE_AVISO),
          AsyncStorage.getItem(CLAVE_EMPEZADO),
          AsyncStorage.getItem(CLAVE_PASTILLA),
          AsyncStorage.getItem(CLAVE_LARGO),
          AsyncStorage.getItem(CLAVE_CAMBIOS),
          AsyncStorage.getItem(CLAVE_TEMA),
        ]);
        // Antes se guardaban fechas sueltas: si las hay, eran reglas.
        // Las convierto al formato nuevo para no perder nada.
        if (r) {
          const lee = JSON.parse(r);
          if (Array.isArray(lee) && lee.length > 0 && typeof lee[0] === 'string') {
            setMarcas((lee as string[]).map((fecha) => ({ fecha, tipo: 'regla' as const })));
          } else {
            setMarcas(lee as Marca[]);
          }
        }
        if (n) {
          const lee = JSON.parse(n) as Notas;
          // Migro etiquetas viejas a las nuevas (mayúsculas y algún renombre
          // como «digestión revuelta» → «Tripa revuelta») para no perder
          // lo ya anotado.
          const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
          const renombres: Record<string, string> = {
            'digestión revuelta': 'Tripa revuelta',
            'hinchada': 'Hinchazón',
            'cansada': 'Cansancio',
            'tranquila': 'En calma',
            'nerviosa': 'Nervios',
          };
          const arregla = (s: string) => renombres[s] ?? mayus(s);
          for (const k of Object.keys(lee)) {
            if (typeof lee[k].ml !== 'number') lee[k].ml = null;
            if (!Array.isArray(lee[k].productos)) lee[k].productos = [];
            if (Array.isArray(lee[k].sintomas)) lee[k].sintomas = lee[k].sintomas.map(arregla);
            if (typeof lee[k].animo === 'string') lee[k].animo = arregla(lee[k].animo);
            if (typeof lee[k].flujo === 'string') lee[k].flujo = arregla(lee[k].flujo);
          }
          setNotas(lee);
        }
        if (a !== null) setAvisoPuesto(a === '1');
        setEmpezado(e === '1');
        if (p) {
          try {
            const lee = JSON.parse(p);
            if (typeof lee.hora === 'number' && typeof lee.minuto === 'number') {
              setPastilla({ on: lee.on === true, hora: lee.hora, minuto: lee.minuto });
            }
          } catch {
            // si está corrupto, se queda apagada. ya la pondrá ella.
          }
        }
        if (l) {
          try {
            const lee = JSON.parse(l);
            if (typeof lee.anyo === 'number' && typeof lee.mes === 'number') {
              setLargo({
                metodo: lee.metodo ?? null,
                anyo: lee.anyo,
                mes: lee.mes,
                dia: typeof lee.dia === 'number' ? lee.dia : 1,
                cadaDias: typeof lee.cadaDias === 'number' ? lee.cadaDias : 7,
              });
            }
          } catch {
            // igual: si está roto, se empieza de cero.
          }
        }
        if (c) {
          try {
            const lee = JSON.parse(c) as Record<string, { id: string; fecha: number }>;
            // los que ya pasaron, fuera: ya sonaron (o ya no importan).
            const vivos: typeof lee = {};
            for (const k of Object.keys(lee)) {
              if (lee[k] && lee[k].fecha > Date.now()) vivos[k] = lee[k];
            }
            setCambios(vivos);
          } catch {
            // nada que recuperar.
          }
        }
        if (t === 'noche' || t === 'dia') setTema(t);
      } catch {
        // si falla al leer, arrancamos de cero. no pasa nada grave.
      } finally {
        setCargado(true);
      }
    })();
  }, []);

  const guardarMarcas = useCallback(async (siguiente: Marca[]) => {
    setMarcas(siguiente);
    await AsyncStorage.setItem(CLAVE_REGLAS, JSON.stringify(siguiente));
  }, []);

  const guardarNotas = useCallback(async (siguiente: Notas) => {
    setNotas(siguiente);
    await AsyncStorage.setItem(CLAVE_NOTAS, JSON.stringify(siguiente));
  }, []);

  const inicios = useMemo(() => iniciosDeRegla(marcas), [marcas]);
  const resumen = useMemo(() => resumenCiclos(inicios), [inicios]);
  const cuenta = useMemo(() => estimar(marcas), [marcas]);

  // día del ciclo en el que estás, contando desde la última regla.
  const diaDelCiclo = cuenta.ultimaRegla ? diasEntre(cuenta.ultimaRegla, hoy) + 1 : null;

  // honestidad para ciclos irregulares o con pocos datos.
  // La cuenta orienta, pero si varía mucho hay que decirlo.
  const notaCuenta: string | null = (() => {
    if (inicios.length <= 1) {
      return inicios.length === 1
        ? 'Primer ciclo anotado: tiro de 28 días hasta conocerte mejor.'
        : null;
    }
    if (resumen.duraciones.length >= 2) {
      const min = Math.min(...resumen.duraciones);
      const max = Math.max(...resumen.duraciones);
      if (max - min >= 7) {
        return `Tus ciclos van de ${min} a ${max} días: la cuenta orienta, no promete.`;
      }
    }
    return null;
  })();

  // lo último anotado, para tenerlo a mano sin abrir el calendario.
  const ultimas = useMemo(
    () => [...inicios].reverse().slice(0, 3).map(formatoCorto),
    [inicios],
  );

  // en qué fase andas hoy, para la tirita de debajo de la frase.
  const fase: Fase | null = useMemo(
    () => faseDeHoy(hoy, marcas, cuenta.ultimaRegla, cuenta.cicloMedio),
    [hoy, marcas, cuenta.ultimaRegla, cuenta.cicloMedio],
  );

  // Patrones: cada síntoma con la luna donde más sale.
  // Miro en qué luna cayó cada día anotado (con su propio ciclo)
  // y cuento. Con 3 registros ya se puede decir algo.
  const patrones = useMemo(() => {
    const porSintoma: Record<string, Record<Fase, number>> = {};
    const fechas = Object.keys(notas);
    if (inicios.length === 0 || fechas.length === 0) return [];
    for (const f of fechas) {
      const log = notas[f];
      if (!log.sintomas || log.sintomas.length === 0) continue;
      const pasados = inicios.filter((i) => i <= f);
      if (pasados.length === 0) continue;
      const faseFecha = faseEnFecha(f, marcas, pasados[pasados.length - 1], cuenta.cicloMedio);
      if (!faseFecha) continue;
      for (const s of log.sintomas) {
        if (!porSintoma[s]) porSintoma[s] = { nueva: 0, creciente: 0, llena: 0, menguante: 0 };
        porSintoma[s][faseFecha]++;
      }
    }
    return Object.entries(porSintoma)
      .map(([sintoma, conteo]) => {
        const total = (Object.values(conteo) as number[]).reduce((a, b) => a + b, 0);
        const [topFase, topN] = (Object.entries(conteo) as [Fase, number][]).sort((a, b) => b[1] - a[1])[0];
        return { sintoma, fase: topFase, veces: topN, total };
      })
      .filter((p) => p.total >= 3)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [notas, marcas, inicios, cuenta.cicloMedio]);

  // si falta una semana o menos, toca compra previa de hierro.
  const tocaCompra =
    cuenta.proxima !== null &&
    cuenta.faltan !== null &&
    cuenta.faltan >= 0 &&
    cuenta.faltan <= 7;

  const abrirArticulo = (id: string) => {
    setArticuloAbierto(id);
    setPantalla('leer');
  };

  // si el cambio del parche/anillo cae en una semana, o la renovación
  // del duradero en un mes, se dice en Hoy. Si no, no se molesta.
  const avisoLargo: string | null = useMemo(() => {
    if (!largo.metodo) return null;
    const m = METODOS_LARGOS.find((x) => x.id === largo.metodo);
    if (!m) return null;
    if (m.tipo === 'dias') {
      const desde = new Date(
        largo.anyo, largo.mes,
        Math.min(largo.dia, diasDelMes(largo.anyo, largo.mes)),
      );
      const prox = proximoCambio(desde, largo.cadaDias);
      const faltan = diasEntre(hoy, pasarAISO(prox));
      if (faltan > 7) return null;
      return faltan <= 0 ? `${m.nombre}: cambio hoy` : `${m.nombre}: cambio en ${faltan} días`;
    }
    const ren = sumarMeses(largo.anyo, largo.mes, m.meses);
    const ahora = new Date();
    const mesesFaltan = (ren.anyo - ahora.getFullYear()) * 12 + (ren.mes - ahora.getMonth());
    if (mesesFaltan > 1) return null;
    return mesesFaltan < 0 || (mesesFaltan === 0 && ahora.getDate() > 1)
      ? `${m.nombre}: Ya te toca renovar`
      : `${m.nombre}: Renovar en ${nombreMesLargo(ren.anyo, ren.mes)}`;
  }, [largo, hoy]);

  // Todos los avisos pasan por aquí: primero borro todo lo programado
  // y luego pongo lo que toque. Así la cuenta y la pastilla no se pisan.
  // En web no suenan: se dice en su pantalla y listo.
  // Los avisos que programa la app, por id: así reprogramo los míos
  // sin cargarme los temporizadores de cambio, que van aparte.
  const avisosIds = useRef<{ cuenta?: string; pastilla?: string; largo?: string }>({});
  const avisosIniciados = useRef(false);
  // Temporizadores de cambio (tampón/copa/disco): producto → aviso y hora.
  // Se guardan para sobrevivir a cerrar la app; al abrir, tiro los pasados.
  const [cambios, setCambios] = useState<Record<string, { id: string; fecha: number }>>({});
  // Al marcar un producto con horas pregunto cuándo se puso: la cuenta
  // sale de ahí, no de ahora. null = no hay pregunta abierta.
  const [puesta, setPuesta] = useState<{ id: string; hora: number; minuto: number } | null>(null);
  // día o noche: la pinta de la app. Se guarda como todo lo demás.
  const [tema, setTema] = useState<Tema>('dia');
  const paleta = TEMAS[tema];
  const styles = useMemo(() => crearEstilos(paleta), [paleta]);
  const ctx = useMemo(() => ({ styles, paleta, tema }), [styles, paleta, tema]);

  const cambiarTema = async (t: Tema) => {
    setTema(t);
    await AsyncStorage.setItem(CLAVE_TEMA, t);
  };

  // Al arrancar preparo el manejador (si hay módulo de avisos).
  useEffect(() => {
    prepararAvisos();
  }, []);

  // El botón físico de Android: si hay un artículo abierto, lo cierra
  // en vez de sacarte de la app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pantalla === 'leer' && articuloAbierto) {
        setArticuloAbierto(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pantalla, articuloAbierto]);

  const olvidarAvisos = async () => {
    for (const id of Object.values(avisosIds.current)) {
      if (id) await olvidarAviso(id);
    }
    avisosIds.current = {};
  };

  useEffect(() => {
    if (!cargado || Platform.OS === 'web') return;
    (async () => {
      try {
        // la primera vez limpio restos viejos; luego solo toco lo mío.
        if (!avisosIniciados.current) {
          await olvidarTodos();
          avisosIniciados.current = true;
        } else {
          await olvidarAvisos();
        }
        if (!avisoPuesto && !pastilla.on && !largo.metodo) return;
        if (!(await permisoAvisos())) return;
        // la cuenta: un aviso, dos días antes, a las 9.
        if (avisoPuesto && cuenta.proxima) {
          const fecha = leerISO(sumarDias(cuenta.proxima, -2));
          fecha.setHours(9, 0, 0, 0);
          if (fecha.getTime() > Date.now()) {
            const id = await programarFecha(
              'Luna',
              `Según tu cuenta, te vendrá sobre el ${formatoCorto(cuenta.proxima)}.`,
              fecha,
            );
            if (id) avisosIds.current.cuenta = id;
          }
        }
        // la pastilla: todos los días a su hora, sin sermones.
        if (pastilla.on) {
          const id = await programarDiaria(
            'Luna',
            'Tu pastilla de hoy. Agua y para dentro.',
            pastilla.hora,
            pastilla.minuto,
          );
          if (id) avisosIds.current.pastilla = id;
        }
        // el duradero: un aviso antes de que toque renovar (o el día del cambio).
        if (largo.metodo) {
          const m = METODOS_LARGOS.find((x) => x.id === largo.metodo);
          if (m && m.tipo === 'meses') {
            const ren = sumarMeses(largo.anyo, largo.mes, m.meses);
            const fecha = new Date(ren.anyo, ren.mes, 1);
            fecha.setDate(fecha.getDate() - m.avisoDias);
            fecha.setHours(9, 0, 0, 0);
            if (fecha.getTime() > Date.now()) {
              const id = await programarFecha(
                'Luna',
                `${m.nombre}: toca renovar en ${nombreMesLargo(ren.anyo, ren.mes)}. Pide cita con tiempo.`,
                fecha,
              );
              if (id) avisosIds.current.largo = id;
            }
          } else if (m) {
            // parche y anillo: el próximo cambio que caiga por delante.
            const desde = new Date(
              largo.anyo, largo.mes,
              Math.min(largo.dia, diasDelMes(largo.anyo, largo.mes)),
            );
            const prox = proximoCambio(desde, largo.cadaDias);
            const id = await programarFecha('Luna', `${m.nombre}: hoy toca cambio.`, prox);
            if (id) avisosIds.current.largo = id;
          }
        }
      } catch {
        // si no se puede programar, pues nada. la app sigue valiendo.
      }
    })();
  }, [cargado, avisoPuesto, cuenta.proxima, pastilla, largo]);

  // El temporizador de cambio: cuenta desde que se puso, no desde ahora.
  // Si ya pasó de lo bueno, el aviso suena ya: mejor un toque ahora
  // que una cuenta que miente.
  const guardarCambios = async (siguiente: Record<string, { id: string; fecha: number }>) => {
    setCambios(siguiente);
    await AsyncStorage.setItem(CLAVE_CAMBIOS, JSON.stringify(siguiente));
  };

  const programarCambioDesde = async (producto: InfoProducto, base: Date) => {
    if (Platform.OS === 'web' || !producto.maxHoras) return;
    try {
      if (!(await permisoAvisos())) return;
      const anterior = cambios[producto.id];
      if (anterior) {
        await olvidarAviso(anterior.id);
      }
      const fuego = new Date(Math.max(base.getTime() + producto.maxHoras * 3600000, Date.now() + 60000));
      const id = await programarFecha(
        'Luna',
        `${producto.nombre}: toca cambiar. Gracias por cuidarte.`,
        fuego,
      );
      if (!id) return;
      guardarCambios({ ...cambios, [producto.id]: { id, fecha: fuego.getTime() } });
    } catch {
      // si falla, el consejo de arriba sigue valiendo.
    }
  };

  // Abre la pregunta de la hora con el ahora ya puesto: lo normal
  // es acabar de ponérselo, y así es un toque y listo.
  const abrirPuesta = (producto: InfoProducto, base?: Date) => {
    const ahora = base ?? new Date();
    const cuartos = [0, 15, 30, 45];
    const minuto = [...cuartos].reverse().find((c) => c <= ahora.getMinutes()) ?? 0;
    setPuesta({ id: producto.id, hora: ahora.getHours(), minuto });
  };

  // Cierra la pregunta programando con la hora elegida. Si marca una hora
  // de después, entiendo que es ahora: nadie se lo pone en el futuro.
  const confirmarPuesta = () => {
    if (!puesta) return;
    const info = PRODUCTOS.find((p) => p.id === puesta.id);
    if (!info) {
      setPuesta(null);
      return;
    }
    const base = new Date();
    base.setHours(puesta.hora, puesta.minuto, 0, 0);
    if (base.getTime() > Date.now()) base.setTime(Date.now());
    setPuesta(null);
    programarCambioDesde(info, base);
  };

  const quitarCambio = async (productoId: string) => {
    const anterior = cambios[productoId];
    if (anterior && Platform.OS !== 'web') {
      await olvidarAviso(anterior.id);
    }
    if (anterior) {
      const siguiente = { ...cambios };
      delete siguiente[productoId];
      guardarCambios(siguiente);
    }
  };

  // El botón grande solo entiende de regla: la pone o la quita.
  const marcarReglaHoy = () => {
    const actual = marcas.find((m) => m.fecha === hoy)?.tipo ?? null;
    if (actual === 'regla') {
      guardarMarcas(marcas.filter((m) => m.fecha !== hoy));
    } else {
      guardarMarcas([...marcas.filter((m) => m.fecha !== hoy), { fecha: hoy, tipo: 'regla' }]);
    }
  };

  // El «solo mancho» solo entiende de manchado: lo pone o lo quita.
  const marcarManchadoHoy = () => {
    const actual = marcas.find((m) => m.fecha === hoy)?.tipo ?? null;
    if (actual === 'manchado') {
      guardarMarcas(marcas.filter((m) => m.fecha !== hoy));
    } else if (actual === null) {
      guardarMarcas([...marcas, { fecha: hoy, tipo: 'manchado' }]);
    }
  };
  // El calendario rota: nada → regla → manchado → nada.
  // El manchado se ve distinto y no abre ciclo nuevo.
  const marcarDia = (iso: string) => {
    const actual = marcas.find((m) => m.fecha === iso)?.tipo ?? null;
    const siguiente =
      actual === null
        ? [...marcas, { fecha: iso, tipo: 'regla' as const }]
        : actual === 'regla'
          ? marcas.map((m) => (m.fecha === iso ? { ...m, tipo: 'manchado' as const } : m))
          : marcas.filter((m) => m.fecha !== iso);
    guardarMarcas(siguiente);
  };

  const retocarHoy = (cambio: Partial<NotaDelDia>) => {
    guardarNotas({ ...notas, [hoy]: { ...notaDeHoy, ...cambio } });
  };

  const tocarSintoma = (s: string) => {
    const loTiene = notaDeHoy.sintomas.includes(s);
    retocarHoy({
      sintomas: loTiene ? notaDeHoy.sintomas.filter((x) => x !== s) : [...notaDeHoy.sintomas, s],
    });
  };

  const tocarProducto = (id: string) => {
    const lleva = notaDeHoy.productos ?? [];
    if (lleva.includes(id)) {
      retocarHoy({ productos: lleva.filter((x) => x !== id) });
      quitarCambio(id);
      if (puesta?.id === id) setPuesta(null);
    } else {
      retocarHoy({ productos: [...lleva, id] });
      const info = PRODUCTOS.find((p) => p.id === id);
      // con horas pregunto cuándo se puso (en el móvil); sin horas
      // o en web, basta con marcarlo.
      if (info && info.maxHoras !== null && Platform.OS !== 'web') abrirPuesta(info);
    }
  };

  // «Lo acabo de cambiar»: cuenta nueva desde ahora mismo.
  const renovarCambio = (producto: InfoProducto) => programarCambioDesde(producto, new Date());

  // «Cambiar hora»: reabre la pregunta con la puesta que hay guardada.
  const corregirPuesta = (producto: InfoProducto) => {
    const t = cambios[producto.id];
    const base = t && producto.maxHoras ? new Date(t.fecha - producto.maxHoras * 3600000) : new Date();
    abrirPuesta(producto, base);
  };

  const borrarTodo = () => {
    const hacerlo = async () => {
      await AsyncStorage.multiRemove([CLAVE_REGLAS, CLAVE_NOTAS]);
      setMarcas([]);
      setNotas({});
    };
    if (Platform.OS === 'web') {
      if (confirm('¿Lo borro todo? No hay vuelta atrás.')) hacerlo();
    } else {
      Alert.alert('Borrarlo todo', 'Se borra lo anotado en este móvil. No hay copia.', [
        { text: 'Mejor no', style: 'cancel' },
        { text: 'Sí, bórralo', style: 'destructive', onPress: hacerlo },
      ]);
    }
  };

  const cambiarAviso = async (v: boolean) => {
    setAvisoPuesto(v);
    await AsyncStorage.setItem(CLAVE_AVISO, v ? '1' : '0');
    // el efecto de avisos ya reprograma (o borra) solo.
  };

  const cambiarPastilla = async (cambio: Partial<{ on: boolean; hora: number; minuto: number }>) => {
    const siguiente = { ...pastilla, ...cambio };
    setPastilla(siguiente);
    await AsyncStorage.setItem(CLAVE_PASTILLA, JSON.stringify(siguiente));
  };

  const cambiarLargo = async (cambio: Partial<EstadoLargo>) => {
    const siguiente = { ...largo, ...cambio };
    setLargo(siguiente);
    await AsyncStorage.setItem(CLAVE_LARGO, JSON.stringify(siguiente));
  };

  // cerrar la primera vez: guardo la fecha si eligió una y no vuelvo a preguntar.
  const terminarEmpezar = async (fecha: string | null) => {
    if (fecha) guardarMarcas([{ fecha, tipo: 'regla' }]);
    setEmpezado(true);
    await AsyncStorage.setItem(CLAVE_EMPEZADO, '1');
  };

  // Lo más anotado, calculado una vez para el texto y el PDF.
  const topSintomas = useMemo<[string, number][]>(() => {
    const conteo: Record<string, number> = {};
    for (const k of Object.keys(notas)) {
      for (const s of notas[k].sintomas ?? []) conteo[s] = (conteo[s] ?? 0) + 1;
    }
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [notas]);

  const topProductos = useMemo<[string, number][]>(() => {
    const conteo: Record<string, number> = {};
    for (const k of Object.keys(notas)) {
      for (const id of notas[k].productos ?? []) conteo[id] = (conteo[id] ?? 0) + 1;
    }
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, n]): [string, number] => [PRODUCTOS.find((x) => x.id === id)?.nombre ?? id, n]);
  }, [notas]);

  // El historial en texto llano: ciclos, media y lo más anotado.
  // Para llevar a consulta o para no perderlo al cambiar de móvil.
  const compartirHistorial = () => {
    const lineas = ['Mi historial de Luna', ''];
    if (resumen.inicios.length === 0) {
      lineas.push('Aún no hay ciclos anotados.');
    } else {
      const { duraciones } = resumen;
      lineas.push(`Ciclos anotados: ${resumen.inicios.length}`);
      if (duraciones.length > 0) {
        lineas.push(
          `Duración media: ${cuenta.cicloMedio} días (de ${Math.min(...duraciones)} a ${Math.max(...duraciones)})`,
        );
      }
      lineas.push('');
      resumen.inicios
        .map((inicio, i) => ({
          inicio,
          dur: i < duraciones.length ? duraciones[i] : null,
        }))
        .reverse()
        .slice(0, 12)
        .forEach((p) => {
          lineas.push(`· ${formatoCorto(p.inicio)}${p.dur === null ? ' (En curso)' : ` — ${p.dur} días`}`);
        });
      lineas.push('');
      lineas.push('Duraciones (días): ' + (duraciones.length ? duraciones.join(', ') : 'Aún solo uno'));
    }
    // lo más anotado: cuenta síntomas en todas las notas.
    // (lo calculo aquí y lo reutilizo en el texto y en el PDF)
    const top = topSintomas;
    if (top.length > 0) {
      lineas.push('Lo más anotado: ' + top.map(([s, n]) => `${s} (${n})`).join(', '));
    }
    // lo mismo con productos: qué usa más.
    if (topProductos.length > 0) {
      lineas.push('Productos que más uso: ' + topProductos.map(([n, c]) => `${n} (${c})`).join(', '));
    }
    lineas.push('', 'Anotado con Luna, en mi móvil.');
    const texto = lineas.join('\n');
    // En el móvil se comparte; en web se copia al portapapeles.
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard) {
        (navigator as any).clipboard.writeText(texto);
        Alert.alert('Copiado', 'Tu historial está en el portapapeles: pégalo donde quieras.');
      } else {
        Share.share({ message: texto }).catch(() => {});
      }
    } catch {
      // si no se puede, no se puede. Los datos siguen en la app.
    }
  };

  // El informe para consulta: lo mismo pero en PDF limpito, con patrones.
  // En web no hay PDF: cae al texto de siempre.
  const compartirInforme = async () => {
    const metodo = METODOS_LARGOS.find((x) => x.id === largo.metodo);
    let anticonceptivo: string | null = null;
    if (metodo) {
      anticonceptivo =
        metodo.tipo === 'meses'
          ? `${metodo.nombre} desde ${nombreMesLargo(largo.anyo, largo.mes)}`
          : `${metodo.nombre}, cada ${largo.cadaDias} días`;
    } else if (pastilla.on) {
      anticonceptivo = `Pastilla diaria a las ${pastilla.hora}:${String(pastilla.minuto).padStart(2, '0')}`;
    }
    const datos: DatosInforme = {
      inicios: resumen.inicios,
      duraciones: resumen.duraciones,
      cicloMedio: cuenta.cicloMedio,
      patrones: patrones.map((p) => ({
        sintoma: p.sintoma,
        luna: FASES[p.fase].nombre.toLowerCase(),
        veces: p.veces,
        total: p.total,
        domina: p.veces / p.total >= 0.6,
      })),
      topSintomas,
      topProductos,
      anticonceptivo,
      generada: new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    if (Platform.OS === 'web') {
      compartirHistorial();
      return;
    }
    try {
      const { printToFileAsync } = await import('expo-print');
      const { uri } = await printToFileAsync({ html: informeHTML(datos) });
      await Share.share({ url: uri, message: 'Mi informe de Luna' });
    } catch {
      compartirHistorial();
    }
  };

  if (!cargado) {
    return (
      <EstilosCtx.Provider value={ctx}>
        <SafeAreaView style={styles.centro}>
          <Text style={styles.marca}>Luna</Text>
          <Text style={styles.tenue}>Abriendo tu cuaderno…</Text>
        </SafeAreaView>
      </EstilosCtx.Provider>
    );
  }

  // primera vez: sin nada anotado te pregunto cuándo te vino,
  // como hace Flo, pero sin crearte cuenta.
  if (empezado === false && marcas.length === 0) {
    return (
      <EstilosCtx.Provider value={ctx}>
        <SafeAreaView style={styles.base}>
          <StatusBar style={tema === 'noche' ? 'light' : 'dark'} />
          <PantallaEmpezar hoy={hoy} onElegir={terminarEmpezar} />
        </SafeAreaView>
      </EstilosCtx.Provider>
    );
  }

  return (
    <EstilosCtx.Provider value={ctx}>
    <SafeAreaView style={styles.base}>
      <StatusBar style={tema === 'noche' ? 'light' : 'dark'} />

      <View style={styles.cabecera}>
        {tema === 'noche' && (
          <View style={styles.estrellas} pointerEvents="none">
            <View style={[styles.estrella, { top: 10, left: '8%', opacity: 0.9 }]} />
            <View style={[styles.estrellaChica, { top: 26, left: '22%', opacity: 0.5 }]} />
            <View style={[styles.estrellaChica, { top: 12, left: '48%', opacity: 0.7 }]} />
            <View style={[styles.estrella, { top: 30, left: '63%', opacity: 0.5 }]} />
            <View style={[styles.estrellaChica, { top: 8, left: '82%', opacity: 0.9 }]} />
          </View>
        )}
        <View style={styles.cabeceraLuna}>
          <LunaIcon fase={fase} color={paleta.tinta} fondo={paleta.papel} size={30} />
          <View style={styles.marcaColumna}>
            <Text style={styles.marca}>Luna</Text>
            <Text style={styles.submarca}>Tu ciclo en tu bolsillo</Text>
          </View>
        </View>
        <View style={styles.contador}>
          <Text style={styles.contadorNum}>{inicios.length === 0 ? '—' : inicios.length}</Text>
          <Text style={styles.contadorTxt}>{inicios.length === 1 ? 'Ciclo' : 'Ciclos'}</Text>
        </View>
      </View>

      <View style={styles.cuerpo}>
        {pantalla === 'hoy' && (
          <PantallaHoy
            hoy={hoy}
            cuenta={cuenta}
            diaDelCiclo={diaDelCiclo}
            ultimas={ultimas}
            fase={fase}
            tocaCompra={tocaCompra}
            pastillaHora={pastilla.on ? `${pastilla.hora}:${String(pastilla.minuto).padStart(2, '0')}` : null}
            avisoLargo={avisoLargo}
            marcaHoy={marcaHoy}
            notaCuenta={notaCuenta}
            nota={notaDeHoy}
            productosHoy={PRODUCTOS.filter((p) => (notaDeHoy.productos ?? []).includes(p.id))}
            onMarcarHoy={marcarReglaHoy}
            onMarcarManchado={marcarManchadoHoy}
            cambios={cambios}
            onQuitarCambio={quitarCambio}
            onReintentarCambio={abrirPuesta}
            puesta={puesta}
            onPuestaElegir={(hora, minuto) => setPuesta((p) => (p ? { ...p, hora, minuto } : p))}
            onPuestaOk={confirmarPuesta}
            onPuestaNo={() => setPuesta(null)}
            onRenovarCambio={renovarCambio}
            onCorregirPuesta={corregirPuesta}
            onAbrirArticulo={abrirArticulo}
            onSintoma={tocarSintoma}
            onTocarProducto={tocarProducto}
            onRetocar={retocarHoy}
          />
        )}
        {pantalla === 'calendario' && (
          <PantallaCalendario
            anyo={anyoVisto}
            mes={mesVisto}
            marcas={marcas}
            cuenta={cuenta}
            diaDelCiclo={diaDelCiclo}
            patrones={patrones}
            hayNotas={Object.keys(notas).length > 0}
            hoy={hoy}
            onAtras={() => {
              const d = new Date(anyoVisto, mesVisto - 1, 1);
              setAnyoVisto(d.getFullYear());
              setMesVisto(d.getMonth());
            }}
            onAlante={() => {
              const d = new Date(anyoVisto, mesVisto + 1, 1);
              setAnyoVisto(d.getFullYear());
              setMesVisto(d.getMonth());
            }}
            onTocar={marcarDia}
          />
        )}
        {pantalla === 'leer' && (
          <PantallaLeer
            faseActual={fase}
            abierto={articuloAbierto}
            onAbrir={setArticuloAbierto}
            onCerrar={() => setArticuloAbierto(null)}
          />
        )}
        {pantalla === 'tuyo' && (
          <PantallaTuyo
            avisoPuesto={avisoPuesto}
            onAviso={cambiarAviso}
            pastilla={pastilla}
            onPastilla={cambiarPastilla}
            largo={largo}
            onLargo={cambiarLargo}
            onAbrirArticulo={abrirArticulo}
            cuantos={inicios.length}
            onBorrar={borrarTodo}
            onCompartir={compartirHistorial}
            onInforme={compartirInforme}
            tema={tema}
            onTema={cambiarTema}
          />
        )}
      </View>

      <View style={styles.pies}>
        {(['hoy', 'calendario', 'leer', 'tuyo'] as Pantalla[]).map((p) => (
          <Pressable key={p} onPress={() => setPantalla(p)} style={styles.pieBoton}>
            <Text style={[styles.pieTexto, pantalla === p && styles.pieActivo]}>
              {p === 'hoy' ? 'Hoy' : p === 'calendario' ? 'Calendario' : p === 'leer' ? 'Leer' : 'Tu santuario'}
            </Text>
            {pantalla === p && <View style={styles.piePunto} />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
    </EstilosCtx.Provider>
  );
}

/* ---------- hoy: entrar, apuntar y salir. menos de 10 segundos. ---------- */

function PantallaHoy({ hoy, cuenta, diaDelCiclo, ultimas, fase, tocaCompra, pastillaHora, avisoLargo, marcaHoy, notaCuenta, nota, productosHoy, cambios, onMarcarHoy, onMarcarManchado, onQuitarCambio, onReintentarCambio, puesta, onPuestaElegir, onPuestaOk, onPuestaNo, onRenovarCambio, onCorregirPuesta, onAbrirArticulo, onSintoma, onTocarProducto, onRetocar }: {
  hoy: string;
  cuenta: Estimacion;
  diaDelCiclo: number | null;
  ultimas: string[];
  fase: Fase | null;
  tocaCompra: boolean;
  pastillaHora: string | null;
  avisoLargo: string | null;
  marcaHoy: 'regla' | 'manchado' | null;
  notaCuenta: string | null;
  nota: NotaDelDia;
  productosHoy: InfoProducto[];
  cambios: Record<string, { id: string; fecha: number }>;
  onMarcarHoy: () => void;
  onMarcarManchado: () => void;
  onQuitarCambio: (id: string) => void;
  onReintentarCambio: (p: InfoProducto) => void;
  puesta: { id: string; hora: number; minuto: number } | null;
  onPuestaElegir: (hora: number, minuto: number) => void;
  onPuestaOk: () => void;
  onPuestaNo: () => void;
  onRenovarCambio: (p: InfoProducto) => void;
  onCorregirPuesta: (p: InfoProducto) => void;
  onAbrirArticulo: (id: string) => void;
  onSintoma: (s: string) => void;
  onTocarProducto: (id: string) => void;
  onRetocar: (c: Partial<NotaDelDia>) => void;
}) {
  const { styles, paleta } = useEstilos();
  // la pregunta abierta y su vista previa: con la hora elegida, ¿a qué
  // hora sonaría? Si ya pasó de lo bueno, lo digo claro.
  const puestaInfo = puesta ? (PRODUCTOS.find((p) => p.id === puesta.id) ?? null) : null;
  const horaCorta = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const textoFuegoPuesta = (() => {
    if (!puesta || !puestaInfo || puestaInfo.maxHoras === null) return '';
    const base = new Date();
    base.setHours(puesta.hora, puesta.minuto, 0, 0);
    const real = base.getTime() > Date.now() ? new Date() : base;
    const fuego = new Date(real.getTime() + puestaInfo.maxHoras * 3600000);
    return fuego.getTime() - Date.now() <= 5 * 60000
      ? 'Ya pasa de lo bueno: sonará ahora mismo para que lo cambies cuanto puedas.'
      : `Te aviso a las ${horaCorta(fuego)} (${puestaInfo.maxHoras} h desde las ${horaCorta(real)}).`;
  })();
  return (
    <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Hoy · {formatoDiaSemana(hoy)}</Text>
      <Text style={styles.fechaGrande}>{formatoDiaMes(hoy)}</Text>

      <FraseCuenta cuenta={cuenta} />

      {notaCuenta && (
        <Text style={styles.aclaracion}>{notaCuenta}</Text>
      )}

      {fase && <FaseCard fase={fase} />}

      {(diaDelCiclo !== null && diaDelCiclo > 0) && (
        <View style={styles.diaCicloFila}>
          <Text style={styles.diaCiclo}>Día {diaDelCiclo} del ciclo</Text>
          <Text style={styles.diaCicloSep}>·</Text>
          <Text style={styles.diaCicloTenue}>Media de {cuenta.cicloMedio} días</Text>
        </View>
      )}

      <Pressable
        onPress={onMarcarHoy}
        style={({ pressed }) => [styles.botonGrande, marcaHoy === 'regla' && styles.botonQuitar, pressed && styles.apretado]}>
        <Text style={[styles.botonTexto, marcaHoy === 'regla' && styles.botonTextoQuitar]}>
          {marcaHoy === 'regla' ? 'Anotado — toca para quitar' : 'Me vino hoy'}
        </Text>
      </Pressable>

      {marcaHoy !== 'regla' && (
        <Pressable onPress={onMarcarManchado} hitSlop={8}>
          <Text style={styles.manchadoHoy}>
            {marcaHoy === 'manchado' ? '· Manchado anotado (toca para quitar)' : '· Hoy solo mancho'}
          </Text>
        </Pressable>
      )}

      {ultimas.length > 0 && (
        <Text style={styles.ultimas}>Lo anotado: {ultimas.join('  ·  ')}</Text>
      )}
      {pastillaHora && (
        <Text style={styles.ultimas}>Pastilla a las {pastillaHora} · cada día</Text>
      )}
      {avisoLargo && (
        <Text style={styles.ultimas}>{avisoLargo}</Text>
      )}

      {tocaCompra && (
        <Pressable
          onPress={() => onAbrirArticulo('compra-previa')}
          style={({ pressed }) => [styles.compra, pressed && styles.apretado]}>
          <Text style={styles.compraTitulo}>Esta semana: mete hierro en la cesta</Text>
          <Text style={styles.compraTexto}>Falta poco para la cuenta. Ver la lista →</Text>
        </Pressable>
      )}

      <Text style={styles.etiqueta}><Text style={styles.etiquetaNum}>01 / </Text>Cómo te baja</Text>
      <Palabras
        opciones={FLUJOS}
        elegidas={nota.flujo ? [nota.flujo] : []}
        onTocar={(f) => onRetocar({ flujo: nota.flujo === f ? null : f })}
      />
      <View style={styles.mlFila}>
        <Text style={styles.mlEtiqueta}>Ml, si usas copa (opcional)</Text>
        <TextInput
          style={styles.mlInput}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={paleta.placeholder}
          value={nota.ml === null || nota.ml === undefined ? '' : String(nota.ml)}
          onChangeText={(t) => {
            const n = parseInt(t.replace(/\D/g, ''), 10);
            onRetocar({ ml: Number.isFinite(n) ? n : null });
          }}
        />
      </View>

      <Text style={styles.etiqueta}><Text style={styles.etiquetaNum}>02 / </Text>Qué notas</Text>
      <Palabras opciones={SINTOMAS} elegidas={nota.sintomas} onTocar={onSintoma} />

      <Text style={styles.etiqueta}><Text style={styles.etiquetaNum}>03 / </Text>Cómo andas</Text>
      <Palabras
        opciones={ANIMOS}
        elegidas={nota.animo ? [nota.animo] : []}
        onTocar={(m) => onRetocar({ animo: nota.animo === m ? null : m })}
      />

      <Text style={styles.etiqueta}><Text style={styles.etiquetaNum}>04 / </Text>Con qué vas</Text>
      <Palabras
        opciones={PRODUCTOS.map((p) => p.nombre)}
        elegidas={PRODUCTOS.filter((p) => (nota.productos ?? []).includes(p.id)).map((p) => p.nombre)}
        onTocar={(n) => {
          const hallado = PRODUCTOS.find((p) => p.nombre === n);
          if (hallado) onTocarProducto(hallado.id);
        }}
      />

      {puesta && puestaInfo && puestaInfo.maxHoras !== null && (
        <View style={styles.compra}>
          <Text style={styles.compraTitulo}>{puestaInfo.nombre}: ¿a qué hora?</Text>
          <Text style={styles.compraTexto}>Cuenta desde que te lo pusiste, no desde ahora.</Text>
          <Text style={styles.faseSub}>Hora</Text>
          <Palabras
            opciones={HORAS}
            elegidas={[String(puesta.hora)]}
            onTocar={(h) => onPuestaElegir(Number(h), puesta.minuto)}
          />
          <Text style={styles.faseSub}>Minutos</Text>
          <Palabras
            opciones={MINUTOS}
            elegidas={[String(puesta.minuto).padStart(2, '0')]}
            onTocar={(m) => onPuestaElegir(puesta.hora, Number(m))}
          />
          <Text style={styles.aclaracion}>{textoFuegoPuesta}</Text>
          <View style={styles.productoFila}>
            <Pressable onPress={onPuestaOk} style={({ pressed }) => [styles.botonGrande, pressed && styles.apretado]}>
              <Text style={styles.botonTexto}>Vale, avísame →</Text>
            </Pressable>
            <Pressable onPress={onPuestaNo}>
              <Text style={styles.enlace}>Ahora no</Text>
            </Pressable>
          </View>
        </View>
      )}

      {productosHoy.filter((p) => p.maxHoras !== null && Platform.OS !== 'web').map((p) => {
        const t = cambios[p.id];
        if (!t) {
          return (
            <View key={p.id} style={styles.compra}>
              <Text style={styles.compraTitulo}>{p.nombre}: {p.consejo}</Text>
              <View style={styles.productoFila}>
                <Pressable onPress={() => onReintentarCambio(p)}>
                  <Text style={styles.enlace}>Avísame en {p.maxHoras} h →</Text>
                </Pressable>
                <Pressable onPress={() => onAbrirArticulo(p.articulo)}>
                  <Text style={styles.enlace}>Leer más →</Text>
                </Pressable>
              </View>
            </View>
          );
        }
        const fuego = new Date(t.fecha);
        const desde = new Date(t.fecha - (p.maxHoras ?? 0) * 3600000);
        const vencido = t.fecha - Date.now() <= 5 * 60000;
        return (
          <View key={p.id} style={styles.compra}>
            <Text style={styles.compraTitulo}>{p.nombre} · desde las {horaCorta(desde)}</Text>
            <Text style={styles.compraTexto}>
              {vencido ? 'Ya pasa de lo bueno: cámbialo cuando puedas.' : `Te aviso a las ${horaCorta(fuego)}.`}
            </Text>
            <View style={styles.productoFila}>
              <Pressable onPress={() => onRenovarCambio(p)}>
                <Text style={styles.enlace}>Lo acabo de cambiar</Text>
              </Pressable>
              <Pressable onPress={() => onCorregirPuesta(p)}>
                <Text style={styles.enlace}>Cambiar hora</Text>
              </Pressable>
              <Pressable onPress={() => onQuitarCambio(p.id)}>
                <Text style={styles.enlace}>Quitar</Text>
              </Pressable>
              <Pressable onPress={() => onAbrirArticulo(p.articulo)}>
                <Text style={styles.enlace}>Leer más →</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      {Platform.OS === 'web' && (
        <Text style={styles.aclaracion}>En el móvil esto avisa solo del cambio.</Text>
      )}

      <Text style={styles.etiqueta}><Text style={styles.etiquetaNum}>05 / </Text>Algo que contar</Text>
      <TextInput
        style={styles.cuaderno}
        placeholder="Lo que sea, sin filtro…"
        placeholderTextColor={paleta.placeholder}
        value={nota.nota}
        onChangeText={(t) => onRetocar({ nota: t })}
        multiline
      />

      <Text style={styles.piePagina}>Se guarda en tu teléfono. No hay nube ni cuenta.</Text>
    </ScrollView>
  );
}

// la frase honesta, separada para que se lea de un vistazo qué dice cada caso.
function FraseCuenta({ cuenta }: { cuenta: Estimacion }) {
  const { styles } = useEstilos();
  if (!cuenta.proxima) {
    return (
      <Text style={styles.frase}>
        Aún no hay cuentas que hacer. Cuando te venga, pulsa el botón y empezamos desde ahí.
      </Text>
    );
  }
  if (cuenta.faltan !== null && cuenta.faltan < -3) {
    return (
      <Text style={styles.frase}>
        Llevas <Text style={styles.marcador}>{Math.abs(cuenta.faltan)} días sobre la cuenta</Text>.
        Hazte caso a ti antes que a esta pantalla.
      </Text>
    );
  }
  if (cuenta.faltan !== null && cuenta.faltan < 0) {
    return (
      <Text style={styles.frase}>
        Te tenía que haber venido hace poco. La cuenta falla a veces, pasa mucho.
      </Text>
    );
  }
  if (cuenta.faltan === 0) {
    return (
      <Text style={styles.frase}>
        <Text style={styles.marcador}>Hoy cuadra en la cuenta</Text>. Lleva algo por si acaso y listo.
      </Text>
    );
  }
  return (
    <Text style={styles.frase}>
      Según lo anotado, te vendrá <Text style={styles.marcador}>sobre el {formatoCorto(cuenta.proxima!)}</Text>.
      {'\n'}<Text style={styles.fraseAclaracion}>Es una estimación, no una promesa. Tu cuerpo manda.</Text>
    </Text>
  );
}

/* ---------- la fase: qué te puede pasar y cómo cuidarte ---------- */

function FaseCard({ fase }: { fase: Fase }) {
  const { styles, paleta } = useEstilos();
  const [abierta, setAbierta] = useState(false);
  const info = FASES[fase];

  return (
    <View style={styles.fase}>
      <View style={styles.faseTituloFila}>
        <LunaIcon fase={fase} color={paleta.tinta} fondo={paleta.hoja} size={22} />
        <Text style={[styles.faseTitulo, styles.faseTituloMargen]}>
          {info.nombre} <Text style={styles.faseElemento}>· {info.elemento}</Text>
        </Text>
      </View>
      <Text style={styles.faseEnergia}>Energía: {info.energia}</Text>
      <Text style={styles.faseConsejo}>{info.consejo}</Text>

      <Pressable onPress={() => setAbierta(!abierta)} hitSlop={8}>
        <Text style={styles.faseVerMas}>
          {abierta ? 'Ver menos ↑' : 'Qué más pasa en esta fase ↓'}
        </Text>
      </Pressable>

      {abierta && (
        <View>
          <Text style={styles.faseSub}>Lo típico</Text>
          <Text style={styles.faseTexto}>{info.comunes.join('  ·  ')}</Text>

          <Text style={styles.faseSub}>También pasa, y es normal</Text>
          <Text style={styles.faseTexto}>{info.raros.join('  ·  ')}</Text>

          <Text style={styles.faseSub}>Cuídate así</Text>
          {info.cuidados.map((c) => (
            <Text key={c} style={styles.faseCuidado}>— {c}</Text>
          ))}

          {fase === 'menguante' && (
            <Text style={styles.faseAviso}>
              Si esto se repite cada mes y te impide hacer tu vida, no es «aguantar»:
              llévalo a consulta. No tienes por qué pasarlo a solas.
            </Text>
          )}

          {fase === 'llena' && (
            <Text style={styles.faseAviso}>
              La cuenta no es anticonceptivo: si evitas el embarazo, estos días no te protegen.
            </Text>
          )}

          <Text style={styles.faseNota}>
            Cada cuerpo es un mundo: puede que no notes nada de esto, y también vale.
          </Text>
        </View>
      )}
    </View>
  );
}

/* ---------- calendario: un mes de un vistazo, como una agenda ---------- */

function PantallaCalendario({ anyo, mes, marcas, cuenta, diaDelCiclo, patrones, hayNotas, hoy, onAtras, onAlante, onTocar }: {
  anyo: number; mes: number; marcas: Marca[];
  cuenta: Estimacion; diaDelCiclo: number | null;
  patrones: { sintoma: string; fase: Fase; veces: number; total: number }[];
  hayNotas: boolean;
  hoy: string;
  onAtras: () => void; onAlante: () => void; onTocar: (iso: string) => void;
}) {
  const { styles, tema } = useEstilos();
  const celdas = celdasDelMes(anyo, mes);
  const deRegla = new Set(marcas.filter((m) => m.tipo === 'regla').map((m) => m.fecha));
  const deManchado = new Set(marcas.filter((m) => m.tipo === 'manchado').map((m) => m.fecha));

  const fertiles = new Set<string>();
  if (cuenta.fertilDesde && cuenta.fertilHasta) {
    let cur = cuenta.fertilDesde;
    for (let i = 0; i < 10; i++) {
      fertiles.add(cur);
      if (cur === cuenta.fertilHasta) break;
      cur = sumarDias(cur, 1);
    }
  }

  const nombreMes = new Date(anyo, mes, 1).toLocaleDateString('es', { month: 'long' });
  const nombreAnyo = new Date(anyo, mes, 1).toLocaleDateString('es', { year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Tu vuelta</Text>
      <RuedaCiclo
        ultimaRegla={cuenta.ultimaRegla}
        diaDelCiclo={diaDelCiclo}
        cicloMedio={cuenta.cicloMedio}
        fertilDesde={cuenta.fertilDesde}
        fertilHasta={cuenta.fertilHasta}
        tema={tema}
      />
      <View style={styles.mesFila}>
        <Pressable onPress={onAtras} hitSlop={14} style={({ pressed }) => pressed && styles.apretado}>
          <Text style={styles.flecha}>←</Text>
        </Pressable>
        <View style={styles.mesCentro}>
          <Text style={styles.mes}>{nombreMes}</Text>
          <Text style={styles.anyo}>{nombreAnyo}</Text>
        </View>
        <Pressable onPress={onAlante} hitSlop={14} style={({ pressed }) => pressed && styles.apretado}>
          <Text style={styles.flecha}>→</Text>
        </Pressable>
      </View>
      <Text style={styles.aclaracion}>Toca un día: regla, manchado o nada. Sin más.</Text>

      <View style={styles.semana}>
        {['l', 'm', 'x', 'j', 'v', 's', 'd'].map((d) => (
          <Text key={d} style={styles.diaSemana}>{d}</Text>
        ))}
      </View>

      <View style={styles.rejilla}>
        {celdas.map((iso, i) => {
          if (!iso) return <View key={i} style={styles.celda} />;
          const esRegla = deRegla.has(iso);
          const esManchado = deManchado.has(iso);
          const esCuenta = cuenta.proxima === iso;
          const esFertil = fertiles.has(iso) && !esRegla && !esManchado;
          const esHoy = iso === hoy;
          const num = leerISO(iso).getDate();
          return (
            <Pressable
              key={i}
              onPress={() => onTocar(iso)}
              style={({ pressed }) => [
                styles.celda,
                esRegla && styles.celdaRegla,
                esManchado && styles.celdaManchado,
                esFertil && styles.celdaFertil,
                esCuenta && styles.celdaCuenta,
                esHoy && styles.celdaHoy,
                pressed && styles.apretado,
              ]}>
              <Text style={[styles.numero, esRegla && styles.numeroRegla, esCuenta && styles.numeroCuenta]}>
                {num}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.leyenda}>Relleno es regla · hueco teja es manchado · círculo es la cuenta · fondo verde, días fértiles</Text>
      <Historial marcas={marcas} />
      <Patrones patrones={patrones} hayNotas={hayNotas} />
    </ScrollView>
  );
}

/* ---------- historial: tus ciclos, uno debajo de otro ---------- */

function Historial({ marcas }: { marcas: Marca[] }) {
  const { styles } = useEstilos();
  const { inicios, duraciones } = useMemo(
    () => resumenCiclos(iniciosDeRegla(marcas)),
    [marcas],
  );
  if (inicios.length === 0) {
    return (
      <Text style={styles.aclaracion}>
        Cuando anotes un par de ciclos, aquí se verá tu media.
      </Text>
    );
  }

  // cada inicio con lo que tardó en llegar el siguiente.
  // el último queda "en curso" porque aún no llegó el siguiente.
  const filas = inicios.map((inicio, i) => ({
    inicio,
    duracion: i < duraciones.length ? duraciones[i] : null,
  })).reverse().slice(0, 6);

  const completos = filas.map((f) => f.duracion).filter((d): d is number => d !== null);
  const corto = completos.length ? Math.min(...completos) : null;
  const largo = completos.length ? Math.max(...completos) : null;

  return (
    <View style={styles.historial}>
      <Text style={styles.etiqueta}>Tus ciclos</Text>
      {filas.map((f) => (
        <View key={f.inicio} style={styles.filaCiclo}>
          <Text style={styles.filaFecha}>{formatoCorto(f.inicio)}</Text>
          <Text style={styles.filaDuracion}>
            {f.duracion === null ? 'En curso' : `${f.duracion} días`}
          </Text>
        </View>
      ))}
      {corto !== null && largo !== null && completos.length >= 2 && (
        <Text style={styles.aclaracion}>
          El más corto: {corto} días · el más largo: {largo} días.
        </Text>
      )}
    </View>
  );
}

/* ---------- patrones: cada síntoma con su luna ---------- */

function Patrones({ patrones, hayNotas }: {
  patrones: { sintoma: string; fase: Fase; veces: number; total: number }[];
  hayNotas: boolean;
}) {
  const { styles } = useEstilos();
  if (patrones.length === 0) {
    if (!hayNotas) return null;
    return (
      <View style={styles.historial}>
        <Text style={styles.etiqueta}>Tus patrones</Text>
        <Text style={styles.aclaracion}>
          Cuando anotes el mismo síntoma 3 veces, te diré en qué luna suele venir.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.historial}>
      <Text style={styles.etiqueta}>Tus patrones</Text>
      {patrones.map((p) => {
        const domina = p.veces / p.total >= 0.6;
        return (
          <View key={p.sintoma} style={styles.filaCiclo}>
            <Text style={styles.filaFecha}>{p.sintoma}</Text>
            <Text style={styles.filaDuracion}>
              {domina
                ? `suele venir en ${FASES[p.fase].nombre.toLowerCase()} (${p.veces} de ${p.total})`
                : `repartido en varias lunas (${p.total} veces)`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- el parche y el anillo: fecha exacta y ritmo tuyo ---------- */

function ResumenDias({ largo, onLargo, metodo }: {
  largo: EstadoLargo;
  onLargo: (c: Partial<EstadoLargo>) => void;
  metodo: MetodoLargo;
}) {
  const { styles } = useEstilos();
  const esteAnyo = new Date().getFullYear();
  const anyosCerca = [String(esteAnyo - 1), String(esteAnyo), String(esteAnyo + 1)];
  const tope = diasDelMes(largo.anyo, largo.mes);
  const dias = Array.from({ length: tope }, (_, i) => String(i + 1));
  const diaValido = Math.min(largo.dia, tope);

  const desde = new Date(largo.anyo, largo.mes, diaValido);
  const prox = proximoCambio(desde, largo.cadaDias);
  const faltan = diasEntre(pasarAISO(new Date()), pasarAISO(prox));

  return (
    <View>
      <Text style={styles.faseSub}>¿Qué día empezaste este?</Text>
      <Palabras
        opciones={dias}
        elegidas={[String(diaValido)]}
        onTocar={(d) => onLargo({ dia: Number(d) })}
      />
      <Palabras
        opciones={MESES_CORTO}
        elegidas={[MESES_CORTO[largo.mes]]}
        onTocar={(m) => onLargo({ mes: MESES_CORTO.indexOf(m) })}
      />
      <Palabras
        opciones={anyosCerca}
        elegidas={[String(largo.anyo)]}
        onTocar={(a) => onLargo({ anyo: Number(a) })}
      />
      <Text style={styles.faseSub}>¿Cada cuánto lo cambias?</Text>
      <Palabras
        opciones={metodo.ritmos.map((r) => `Cada ${r} días`)}
        elegidas={[`Cada ${largo.cadaDias} días`]}
        onTocar={(t) => onLargo({ cadaDias: Number(t.replace(/\D/g, '')) })}
      />
      <Text style={styles.aclaracion}>
        {metodo.nombre} · desde el {diaValido} de {nombreMesLargo(largo.anyo, largo.mes)} ·{' '}
        {faltan <= 0
          ? 'Próximo cambio: hoy. Te aviso esta mañana.'
          : `Próximo cambio: ${formatoCorto(pasarAISO(prox))} (en ${faltan} días, te aviso esa mañana).`}
      </Text>
      <Text style={styles.aclaracion}>Si tu pauta es otra, pon tus días: la cuenta se adapta.</Text>
    </View>
  );
}

/* ---------- lo tuyo: avisos, datos y poco más ---------- */

function PantallaTuyo({ avisoPuesto, onAviso, pastilla, onPastilla, largo, onLargo, onAbrirArticulo, cuantos, onBorrar, onCompartir, onInforme, tema, onTema }: {
  avisoPuesto: boolean; onAviso: (v: boolean) => void;
  pastilla: { on: boolean; hora: number; minuto: number };
  onPastilla: (c: Partial<{ on: boolean; hora: number; minuto: number }>) => void;
  largo: EstadoLargo;
  onLargo: (c: Partial<EstadoLargo>) => void;
  onAbrirArticulo: (id: string) => void;
  cuantos: number; onBorrar: () => void; onCompartir: () => void; onInforme: () => void;
  tema: Tema; onTema: (t: Tema) => void;
}) {
  const { styles } = useEstilos();
  const metodo = METODOS_LARGOS.find((m) => m.id === largo.metodo) ?? null;
  const ren = metodo ? sumarMeses(largo.anyo, largo.mes, metodo.meses) : null;
  const yaToca = ren ? new Date(ren.anyo, ren.mes, 1).getTime() <= Date.now() : false;
  const anyos = useMemo(() => {
    const este = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => String(este - i));
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
      <Text style={styles.etiqueta}>Avisos</Text>
      <Text style={styles.aclaracion}>Un solo aviso, dos días antes, a las 9 de la mañana. Nada de spam.</Text>
      {Platform.OS !== 'web' && !avisosDisponibles() && (
        <Text style={styles.aclaracion}>
          Estás probando en Expo Go y aquí los avisos no suenan (lo quitó Expo).
          Sonarán en la versión de desarrollo. Lo demás funciona igual.
        </Text>
      )}
      <Pressable
        onPress={() => onAviso(!avisoPuesto)}
        style={({ pressed }) => [styles.interruptor, pressed && styles.apretado]}>
        <Text style={styles.interruptorTexto}>{avisoPuesto ? 'Avísame' : 'No me avises'}</Text>
        <View style={[styles.pildora, avisoPuesto && styles.pildoraOn]}>
          <View style={[styles.bola, avisoPuesto && styles.bolaOn]} />
        </View>
      </Pressable>

      <Text style={styles.etiqueta}>La pastilla</Text>
      <Text style={styles.aclaracion}>Un aviso cada día a tu hora. Sin sermones.</Text>
      <Pressable
        onPress={() => onPastilla({ on: !pastilla.on })}
        style={({ pressed }) => [styles.interruptor, pressed && styles.apretado]}>
        <Text style={styles.interruptorTexto}>{pastilla.on ? 'La tomo' : 'No tomo'}</Text>
        <View style={[styles.pildora, pastilla.on && styles.pildoraOn]}>
          <View style={[styles.bola, pastilla.on && styles.bolaOn]} />
        </View>
      </Pressable>

      {pastilla.on && (
        <View>
          <Text style={styles.faseSub}>Hora</Text>
          <Palabras
            opciones={HORAS}
            elegidas={[String(pastilla.hora)]}
            onTocar={(h) => onPastilla({ hora: Number(h) })}
          />
          <Text style={styles.faseSub}>Minutos</Text>
          <Palabras
            opciones={MINUTOS}
            elegidas={[String(pastilla.minuto).padStart(2, '0')]}
            onTocar={(m) => onPastilla({ minuto: Number(m) })}
          />
          <Text style={styles.aclaracion}>
            Sonará todos los días a las {pastilla.hora}:{String(pastilla.minuto).padStart(2, '0')}.
            {Platform.OS === 'web' ? ' En el móvil, que en web no suenan los avisos.' : ''}
          </Text>
        </View>
      )}

      <Text style={styles.etiqueta}>Si usas varilla, DIU o inyección</Text>
      <Text style={styles.aclaracion}>
        Dime cuál y cuándo te lo pusieron: te aviso antes de que toque cambiarlo.
      </Text>
      <Palabras
        opciones={['Ninguno', ...METODOS_LARGOS.map((m) => m.nombre)]}
        elegidas={[metodo ? metodo.nombre : 'Ninguno']}
        onTocar={(n) => {
          const hallado = METODOS_LARGOS.find((m) => m.nombre === n);
          onLargo({ metodo: hallado ? hallado.id : null });
        }}
      />

      {metodo && (
        <View>
          {metodo.tipo === 'meses' && ren && (
        <View>
          <Text style={styles.faseSub}>¿Cuándo te lo pusieron?</Text>
              <Palabras
                opciones={anyos}
                elegidas={[String(largo.anyo)]}
                onTocar={(a) => onLargo({ anyo: Number(a) })}
              />
              <Palabras
                opciones={MESES_CORTO}
                elegidas={[MESES_CORTO[largo.mes]]}
                onTocar={(m) => onLargo({ mes: MESES_CORTO.indexOf(m) })}
              />
              <Text style={styles.aclaracion}>
                {metodo.nombre} · desde {nombreMesLargo(largo.anyo, largo.mes)} ·{' '}
                {yaToca
                  ? 'Ya te toca renovar: pide cita cuanto antes.'
                  : `Renovar en ${nombreMesLargo(ren.anyo, ren.mes)} (te aviso ${metodo.avisoDias} días antes).`}
              </Text>
              <Text style={styles.aclaracion}>Si tu tarjeta dice otra fecha, manda tu tarjeta.</Text>
            </View>
          )}

          {metodo.tipo === 'dias' && (
            <ResumenDias largo={largo} onLargo={onLargo} metodo={metodo} />
          )}

          <Pressable onPress={() => onAbrirArticulo(metodo.articulo)}>
            <Text style={styles.enlace}>Leer: {metodo.articuloTitulo} →</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.etiqueta}>La pinta</Text>
      <Text style={styles.aclaracion}>Papel de día o cielo de noche. Lo que te pida el cuerpo.</Text>
      <Palabras
        opciones={['Día', 'Noche']}
        elegidas={[tema === 'noche' ? 'Noche' : 'Día']}
        onTocar={(t) => onTema(t === 'Noche' ? 'noche' : 'dia')}
      />

      <Text style={styles.etiqueta}>Tus datos</Text>
      <Text style={styles.aclaracion}>
        Tienes {cuantos} {cuantos === 1 ? 'ciclo anotado' : 'ciclos anotados'}, guardados solo en este móvil.
        No salen a ningún servidor, no se venden ni se comparten, y aquí no hay IA: lo ves tú y quien tú decidas.
        Si borras la app se pierde todo. Eso es lo bueno y lo malo de no usar nube.
      </Text>

      <Pressable onPress={onCompartir} style={({ pressed }) => [styles.interruptor, pressed && styles.apretado]}>
        <Text style={styles.interruptorTexto}>Pasarme mi historial</Text>
        <Text style={styles.filaArticuloMin}>→</Text>
      </Pressable>
      <Text style={styles.aclaracion}>En texto llano: para llevar a consulta o para no perderlo al cambiar de móvil.</Text>

      <Pressable onPress={onInforme} style={({ pressed }) => [styles.interruptor, pressed && styles.apretado]}>
        <Text style={styles.interruptorTexto}>Informe para consulta (PDF)</Text>
        <Text style={styles.filaArticuloMin}>→</Text>
      </Pressable>
      <Text style={styles.aclaracion}>Con tus patrones: no solo qué te pasa, sino cuándo se repite.</Text>

      <Pressable onPress={onBorrar}>
        <Text style={styles.borrar}>Borrarlo todo</Text>
      </Pressable>

      <View style={styles.colofon}>
        <Text style={styles.colofonTitulo}>Luna, en dos líneas</Text>
        <Text style={styles.aclaracion}>
          Código abierto (MIT). La hice porque estaba harta de apps que te cobran por ver tu propio ciclo.
          Es para quien tenga ciclo, sea quien sea. Si algo falla o no te cuadra,
          es porque la hizo una persona. Dime y lo miramos.
        </Text>
        <Text style={styles.firma}>Hecho a mano por Gianna ✦</Text>
      </View>
    </ScrollView>
  );
}

/* ---------- primera vez: una pregunta y a empezar ---------- */

function PantallaEmpezar({ hoy, onElegir }: { hoy: string; onElegir: (fecha: string | null) => void }) {
  const { styles } = useEstilos();
  // primero pregunto si es su primera regla: si es que sí, la guía
  // va antes que la fecha. Puede ser alguien muy joven y con dudas.
  const [paso, setPaso] = useState<'pregunta' | 'primera' | 'fecha'>('pregunta');

  // Atrás en la primera vez: vuelve al paso anterior, no sale de la app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (paso !== 'pregunta') {
        setPaso('pregunta');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [paso]);
  // los últimos 14 días para elegir sin tener que abrir calendarios raros.
  const dias = useMemo(() => {
    const lista: { iso: string; etiqueta: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const iso = sumarDias(hoy, -i);
      lista.push({
        iso,
        etiqueta: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : formatoCorto(iso),
      });
    }
    return lista;
  }, [hoy]);

  if (paso === 'pregunta') {
    return (
      <ScrollView contentContainerStyle={styles.empezar}>
        <Text style={styles.marcaGrande}>Luna</Text>
        <Text style={styles.frase}>
          Tu ciclo en tu bolsillo. Gratis, sin cuenta, sin nube.
        </Text>
        <Text style={styles.etiqueta}>¿Es tu primera regla?</Text>
        <Text style={styles.aclaracion}>
          Si es la primera, te lo explico todo con calma. Sin prisa y sin vergüenza.
        </Text>
        <Pressable
          onPress={() => setPaso('primera')}
          style={({ pressed }) => [styles.botonGrande, pressed && styles.apretado]}>
          <Text style={styles.botonTexto}>Es mi primera vez</Text>
        </Pressable>
        <Pressable
          onPress={() => setPaso('fecha')}
          style={({ pressed }) => [styles.interruptor, pressed && styles.apretado]}>
          <Text style={styles.interruptorTexto}>Ya llevo tiempo</Text>
        </Pressable>
        <Pressable onPress={() => onElegir(null)}>
          <Text style={styles.borrar}>Mejor lo anoto luego</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (paso === 'primera') {
    return (
      <ScrollView contentContainerStyle={styles.empezar}>
        <Text style={styles.kicker}>Tu primera regla</Text>
        <Text style={styles.fechaGrande}>Te cuento qué pasa</Text>
        <Text style={styles.articuloParrafo}>
          Cada mes tu cuerpo prepara una capa por dentro del útero por si viene un embarazo.
          Si no viene, el cuerpo la suelta por la vagina: eso es la regla. Suele durar de 3 a 7 días.
        </Text>
        <Text style={styles.articuloParrafo}>
          Al principio es un caos y es normal: viene cuando quiere, mancha, se va y vuelve.
          Tarda un tiempo en coger ritmo, a veces años.
        </Text>
        <Text style={styles.articuloParrafo}>
          Para empezar, lo más fácil: compresas o bragas. La copa y los tampones pueden
          esperar a que te apetezca probar. Y duele un poco a veces; mucho todos los meses,
          no: eso cuéntalo.
        </Text>
        <Text style={styles.articuloParrafo}>
          No tienes que tener vergüenza ni esconderlo. Pregunta a quien te dé confianza:
          tu madre, tu padre, una amiga, la enfermera del cole, tu médica.
        </Text>
        <Pressable
          onPress={() => onElegir(hoy)}
          style={({ pressed }) => [styles.botonGrande, pressed && styles.apretado]}>
          <Text style={styles.botonTexto}>Anotar hoy y entrar</Text>
        </Pressable>
        <Pressable onPress={() => onElegir(null)}>
          <Text style={styles.borrar}>Entrar sin anotar</Text>
        </Pressable>
        <Text style={styles.piePagina}>Dentro, en Leer, tienes la guía completa.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.empezar}>
      <Text style={styles.marcaGrande}>Luna</Text>
      <Text style={styles.frase}>
        Tu cuaderno del ciclo. Gratis, sin cuenta, sin nube.
      </Text>
      <Text style={styles.etiqueta}>¿Cuándo te vino la última vez?</Text>
      <View style={styles.palabras}>
        {dias.map((d) => (
          <Pressable
            key={d.iso}
            onPress={() => onElegir(d.iso)}
            style={({ pressed }) => [styles.palabra, pressed && styles.apretado]}>
            <Text style={styles.palabraTexto}>{d.etiqueta}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => onElegir(null)}>
        <Text style={styles.borrar}>Mejor lo anoto luego</Text>
      </Pressable>
      <Text style={styles.piePagina}>Con una sola fecha ya puedo hacerte la cuenta.</Text>
    </ScrollView>
  );
}

/* ---------- leer: poco y bueno, atado a tu luna ---------- */

function PantallaLeer({ faseActual, abierto, onAbrir, onCerrar }: {
  faseActual: Fase | null;
  abierto: string | null;
  onAbrir: (id: string) => void;
  onCerrar: () => void;
}) {
  const { styles } = useEstilos();
  const articulo: Articulo | undefined = ARTICULOS.find((a) => a.id === abierto);

  // el estante de tu luna sale primero, que es lo que te sirve hoy.
  const orden = useMemo(() => {
    const base = ESTANTES.map((e) => e.id);
    if (!faseActual) return base;
    return [faseActual, ...base.filter((e) => e !== faseActual)];
  }, [faseActual]);

  if (articulo) {
    const nombreEstante = ESTANTES.find((e) => e.id === articulo.estante)?.titulo ?? '';
    return (
      <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
        <Pressable onPress={onCerrar} hitSlop={10}>
          <Text style={styles.volver}>← Leer</Text>
        </Pressable>
        <Text style={styles.kicker}>{nombreEstante} · {articulo.minutos} min</Text>
        <Text style={styles.articuloTitulo}>{articulo.titulo}</Text>
        <Text style={styles.articuloEntradilla}>{articulo.entradilla}</Text>
        {articulo.cuerpo.map((p, i) => (
          <Text key={i} style={styles.articuloParrafo}>{p}</Text>
        ))}
        {articulo.aviso && (
          <Text style={styles.articuloAviso}>{articulo.aviso}</Text>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Para leer con calma</Text>
      <Text style={styles.fechaGrande}>Lo que nadie te contó</Text>
      <Text style={styles.aclaracion}>
        Textos cortos, escritos a mano y guardados en tu móvil. Sin gurús.
      </Text>
      {orden.map((estante) => {
        const delEstante = ARTICULOS.filter((a) => a.estante === estante);
        if (delEstante.length === 0) return null;
        const titulo = ESTANTES.find((e) => e.id === estante)?.titulo ?? estante;
        const esTuyo = estante === faseActual;
        return (
          <View key={estante}>
            <Text style={styles.etiqueta}>
              {titulo}{esTuyo ? ' · Tu luna' : ''}
            </Text>
            {delEstante.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => onAbrir(a.id)}
                style={({ pressed }) => [styles.filaArticulo, pressed && styles.apretado]}>
                <Text style={styles.filaArticuloTitulo}>{a.titulo}</Text>
                <Text style={styles.filaArticuloMin}>{a.minutos} min →</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ---------- piezas pequeñas ---------- */

function Palabras({ opciones, elegidas, onTocar }: {
  opciones: string[]; elegidas: string[]; onTocar: (o: string) => void;
}) {
  const { styles } = useEstilos();
  return (
    <View style={styles.palabras}>
      {opciones.map((o) => {
        const activa = elegidas.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => onTocar(o)}
            style={({ pressed }) => [styles.palabra, activa && styles.palabraOn, pressed && styles.apretado]}>
            <Text style={[styles.palabraTexto, activa && styles.palabraTextoOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function formatoDiaSemana(iso: string): string {
  return leerISO(iso).toLocaleDateString('es', { weekday: 'long' });
}

function formatoDiaMes(iso: string): string {
  return leerISO(iso).toLocaleDateString('es', { day: 'numeric', month: 'long' });
}

function formatoCorto(iso: string): string {
  return leerISO(iso).toLocaleDateString('es', { day: 'numeric', month: 'long' });
}

// tinta sobre papel (o crema sobre noche). nada de degradados ni rosa chicle:
// quería que pareciera un cuaderno, no una startup.
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function crearEstilos(c: Paleta) {
  return StyleSheet.create({
  base: { flex: 1, backgroundColor: c.papel },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.papel },
  cabecera: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 54, paddingHorizontal: 24, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: c.linea,
  },
  marca: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, fontWeight: '700', color: c.tinta, letterSpacing: -1 },
  submarca: { fontSize: 12.5, color: c.tenue, marginTop: -4, letterSpacing: 0.4 },
  contador: { alignItems: 'center', borderLeftWidth: 1, borderLeftColor: c.linea, paddingLeft: 16 },
  contadorNum: { fontFamily: SERIF, fontSize: 26, color: c.tinta },
  contadorTxt: { fontSize: 11, color: c.tenue, textTransform: 'uppercase', letterSpacing: 1.5 },
  cuerpo: { flex: 1 },
  pagina: { padding: 24, paddingBottom: 44 },
  kicker: { fontSize: 12, fontWeight: '700', color: c.tenue, textTransform: 'uppercase', letterSpacing: 1.6 },
  fechaGrande: { fontFamily: SERIF, fontSize: 34, color: c.tinta, marginTop: 4, letterSpacing: -0.5 },
  frase: { fontFamily: SERIF, fontSize: 18, lineHeight: 27, color: c.tinta, marginTop: 12 },
  fraseAclaracion: { fontFamily: undefined, fontSize: 13.5, color: c.tenue },
  marcador: { backgroundColor: c.marcador, paddingHorizontal: 2 },
  aclaracion: { fontSize: 13.5, lineHeight: 20, color: c.tenue, marginTop: 8 },
  diaCicloFila: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  diaCiclo: { fontSize: 12.5, fontWeight: '700', color: c.tinta, textTransform: 'uppercase', letterSpacing: 1.2 },
  diaCicloSep: { color: c.tenue, marginHorizontal: 8 },
  diaCicloTenue: { fontSize: 12.5, color: c.tenue },
  botonGrande: {
    backgroundColor: c.tinta, borderRadius: 12, paddingVertical: 19,
    alignItems: 'center', marginTop: 20,
  },
  botonQuitar: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.tinta },
  botonTexto: { color: c.papel, fontSize: 16.5, fontWeight: '700', letterSpacing: 0.2 },
  botonTextoQuitar: { color: c.tinta },
  apretado: { opacity: 0.55 },
  ultimas: { fontSize: 12.5, color: c.tenue, marginTop: 12, textAlign: 'center' },
  manchadoHoy: { textAlign: 'center', color: c.tenue, fontSize: 13.5, marginTop: 10, textDecorationLine: 'underline' },
  mlFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  mlEtiqueta: { fontSize: 13, color: c.tenue },
  mlInput: {
    backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, minWidth: 72, textAlign: 'center',
    fontSize: 15, color: c.tinta,
  },
  etiqueta: { fontSize: 12, fontWeight: '700', color: c.tinta, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 28, marginBottom: 10 },
  etiquetaNum: { color: c.rojo },
  palabras: { flexDirection: 'row', flexWrap: 'wrap' },
  palabra: {
    borderWidth: 1, borderColor: c.linea, backgroundColor: c.hoja,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, marginBottom: 8,
  },
  palabraOn: { backgroundColor: c.tinta, borderColor: c.tinta },
  palabraTexto: { fontSize: 14.5, color: c.tinta },
  palabraTextoOn: { color: c.papel, fontWeight: '600' },
  cuaderno: {
    backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderRadius: 8,
    padding: 14, minHeight: 88, fontSize: 15, color: c.tinta, textAlignVertical: 'top', lineHeight: 22,
  },
  piePagina: { textAlign: 'center', color: c.tenue, fontSize: 12, marginTop: 30 },
  mesFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  mesCentro: { alignItems: 'center' },
  mes: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: c.tinta, textTransform: 'capitalize', letterSpacing: -0.5 },
  anyo: { fontSize: 12, color: c.tenue, letterSpacing: 3, textTransform: 'uppercase', marginTop: -2 },
  flecha: { fontSize: 26, color: c.tinta, padding: 8 },
  semana: { flexDirection: 'row', marginTop: 16, borderBottomWidth: 1, borderBottomColor: c.tinta, paddingBottom: 7 },
  diaSemana: { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '700', color: c.tenue, textTransform: 'uppercase', letterSpacing: 1 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  celda: { width: '14.28%', aspectRatio: 0.95, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  celdaRegla: { backgroundColor: c.rojo },
  celdaManchado: { borderWidth: 1.5, borderColor: c.rojo },
  celdaFertil: { backgroundColor: `${c.oliva}2E` },
  celdaCuenta: { borderWidth: 1.5, borderColor: c.rojo, borderStyle: 'dashed' },
  celdaHoy: { borderWidth: 1, borderColor: c.tinta },
  numero: { fontSize: 16, color: c.tinta, fontVariant: ['tabular-nums'] },
  numeroRegla: { color: '#fff', fontWeight: '700' },
  numeroCuenta: { color: c.rojo, fontWeight: '700' },
  puntoFertil: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.oliva, marginTop: 2 },
  leyenda: { fontSize: 12.5, color: c.tenue, marginTop: 14 },
  interruptor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderRadius: 10, padding: 15, marginTop: 10 },
  interruptorTexto: { fontSize: 15, fontWeight: '600', color: c.tinta },
  pildora: { width: 48, height: 27, borderRadius: 14, backgroundColor: c.linea, justifyContent: 'center', paddingHorizontal: 3 },
  pildoraOn: { backgroundColor: c.tinta },
  bola: { width: 21, height: 21, borderRadius: 11, backgroundColor: c.hoja },
  bolaOn: { alignSelf: 'flex-end' },
  borrar: { color: c.rojo, fontSize: 14, textDecorationLine: 'underline', marginTop: 16 },
  enlace: { color: c.tinta, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline', marginTop: 10 },
  colofon: { borderTopWidth: 1, borderTopColor: c.linea, marginTop: 32, paddingTop: 20 },
  colofonTitulo: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: c.tinta, marginBottom: 4 },
  firma: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: c.tenue, marginTop: 12, textAlign: 'center' },
  pies: {
    flexDirection: 'row', backgroundColor: c.hoja,
    borderTopWidth: 1, borderTopColor: c.linea, paddingBottom: 30, paddingTop: 12,
  },
  pieBoton: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  pieTexto: { fontSize: 14, color: c.tenue },
  pieActivo: { color: c.tinta, fontWeight: '700' },
  piePunto: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.rojo, marginTop: 5 },
  tenue: { color: c.tenue },
  fase: {
    borderLeftWidth: 2, borderLeftColor: c.rojo, backgroundColor: c.hoja,
    borderTopWidth: 1, borderTopColor: c.linea, borderRightWidth: 1, borderRightColor: c.linea,
    borderBottomWidth: 1, borderBottomColor: c.linea, borderRadius: 8,
    padding: 14, marginTop: 16,
  },
  faseTitulo: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: c.tinta },
  faseElemento: { fontFamily: undefined, fontStyle: 'normal', fontSize: 12.5, color: c.tenue },
  faseConsejo: { fontSize: 13.5, lineHeight: 20, color: c.tenue, marginTop: 4 },
  faseEnergia: { fontSize: 12.5, fontWeight: '700', color: c.tinta, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  faseVerMas: { fontSize: 13.5, fontWeight: '700', color: c.rojo, marginTop: 10 },
  faseSub: { fontSize: 11.5, fontWeight: '700', color: c.tenue, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 14, marginBottom: 5 },
  faseTexto: { fontSize: 13.5, lineHeight: 21, color: c.tinta },
  faseCuidado: { fontSize: 13.5, lineHeight: 21, color: c.tinta },
  faseAviso: {
    fontSize: 13, lineHeight: 20, color: c.rojo, marginTop: 12,
    borderTopWidth: 1, borderTopColor: c.linea, paddingTop: 10,
  },
  faseNota: { fontSize: 12.5, fontStyle: 'italic', color: c.tenue, marginTop: 10, lineHeight: 19 },
  historial: { borderTopWidth: 1, borderTopColor: c.linea, marginTop: 20 },
  filaCiclo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8,
  },
  filaFecha: { fontSize: 14.5, color: c.tinta, textTransform: 'capitalize' },
  filaDuracion: { fontSize: 13, color: c.tenue },
  empezar: { padding: 28, paddingTop: 72, paddingBottom: 44 },
  marcaGrande: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, fontWeight: '700', color: c.tinta, letterSpacing: -1.5 },
  compra: {
    backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderLeftWidth: 3, borderLeftColor: c.oliva,
    borderRadius: 8, padding: 14, marginTop: 16,
  },
  compraTitulo: { fontSize: 14.5, fontWeight: '700', color: c.tinta },
  compraTexto: { fontSize: 13, color: c.tenue, marginTop: 3 },
  productoFila: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  volver: { fontSize: 14, fontWeight: '700', color: c.rojo, marginBottom: 12 },
  articuloTitulo: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: c.tinta, letterSpacing: -0.5, marginTop: 4 },
  articuloEntradilla: { fontFamily: SERIF, fontSize: 16.5, lineHeight: 24, color: c.tinta, marginTop: 10 },
  articuloParrafo: { fontSize: 14.5, lineHeight: 23, color: c.tinta, marginTop: 12 },
  articuloAviso: {
    fontSize: 13, lineHeight: 20, color: c.rojo, marginTop: 16,
    borderTopWidth: 1, borderTopColor: c.linea, paddingTop: 12,
  },
  filaArticulo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.hoja, borderWidth: 1, borderColor: c.linea, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
  },
  filaArticuloTitulo: { fontSize: 14.5, color: c.tinta },
  filaArticuloMin: { fontSize: 12.5, color: c.tenue },
  cabeceraLuna: { flexDirection: 'row', alignItems: 'center' },
  marcaColumna: { marginLeft: 10 },
  estrellas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  estrella: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: c.tinta },
  estrellaChica: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: c.tinta },
  faseTituloFila: { flexDirection: 'row', alignItems: 'center' },
  faseTituloMargen: { marginLeft: 9, flexShrink: 1 },
  });
}
