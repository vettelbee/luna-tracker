// artículos cortos, escritos a mano y guardados en el móvil.
// Nada de servidor ni de blog infinito: unos pocos textos de un minuto,
// cada uno atado a su luna. Si quieres añadir uno, copia un bloque y listo.
//
// Tono de la casa: primero creerte, después contarte la verdad.
// Nada de «sé positiva» ni de culpas. Fuentes: Kaiser, Mayo Clinic,
// matronas que escriben claro. No sustituyen a una consulta.

import type { Fase } from './ciclo';

export type Estante = Fase | 'siempre' | 'anticonceptivos';

export interface Articulo {
  id: string;
  estante: Estante;
  titulo: string;
  minutos: number;
  entradilla: string;
  cuerpo: string[];
  aviso?: string;
}

export const ESTANTES: { id: Estante; titulo: string }[] = [
  { id: 'nueva', titulo: 'Luna nueva' },
  { id: 'creciente', titulo: 'Luna creciente' },
  { id: 'llena', titulo: 'Luna llena' },
  { id: 'menguante', titulo: 'Luna menguante' },
  { id: 'siempre', titulo: 'Para siempre' },
  { id: 'anticonceptivos', titulo: 'Anticonceptivos' },
];

export const ARTICULOS: Articulo[] = [
  {
    id: 'hierro-en-el-plato',
    estante: 'nueva',
    titulo: 'Hierro en el plato',
    minutos: 1,
    entradilla: 'Si esos días no tienes fuerzas ni para lo básico, no eres vaga: estás perdiendo hierro de verdad.',
    cuerpo: [
      'Te lo digo en serio: el cansancio de la regla no es flojera. Pierdes sangre y con ella hierro, y el cuerpo funciona a medio gas. Si te cuesta hasta concentrarte, tiene explicación y no es culpa tuya.',
      'Lo que más ayuda en el plato: lentejas, garbanzos y alubias, espinacas y acelgas, carne roja, huevos, frutos secos y chocolate negro. No hace falta hacerlo perfecto ni todo a la vez.',
      'Un truco que sí funciona: acompáñalo con vitamina C (naranja, kiwi, pimiento, tomate), que ayuda a absorber el hierro. Y el té y el café mejor entre horas, porque con la comida lo frenan.',
      'Y te soy sincera: si el cansancio es extremo o empapas compresas cada hora mes tras mes, eso ya no se arregla con lentejas. Cuéntalo en consulta, te mereces que te miren bien.',
    ],
  },
  {
    id: 'compra-previa',
    estante: 'siempre',
    titulo: 'La compra de antes de la regla',
    minutos: 1,
    entradilla: 'Pensar en la compra con cólicos es lo último que apetece. Por eso se hace antes.',
    cuerpo: [
      'Sé cómo va: llega la semana mala, la nevera vacía y acabas pidiendo cualquier cosa o yendo a la tienda sin fuerzas. Esta lista es para evitarte eso.',
      'Una semana antes procura tener: lentejas o garbanzos, espinacas, huevos, frutos secos, chocolate negro, fruta con vitamina C e infusiones que te gusten. Y algo rico para los días de sofá, sin culpa.',
      'La app te avisa sola cuando falta una semana. Si ves el aviso, ya sabes: un hueco para la compra y tu yo del futuro te lo agradece.',
    ],
  },
  {
    id: 'colicos-que-ayuda',
    estante: 'nueva',
    titulo: 'Cólicos: qué ayuda de verdad',
    minutos: 1,
    entradilla: 'Duele de verdad. No tienes que aguantarlo como si nada.',
    cuerpo: [
      'Empiezo por creerte: los cólicos duelen, a veces mucho, y eso de «son cosas de la regla, aguántate» no ayuda a nadie. Si te dejan en el sofá, es normal que estés en el sofá.',
      'Te cuento lo mío: a mí donde más me duele es la lumbar, me baja como una ciática y hay meses que no me deja ni estar recta. Lo que me salva es calor ahí mismo, bolsa de agua en la espalda y quietud. No es ciencia, es lo que a mí me funciona.',
      'Mi kit, el que tengo siempre a mano: antiinflamatorio, ducha o baño caliente, manzanilla o infusión frutal, mantita o bolsa caliente y antifaz para después. Cada persona tiene el suyo: este es el mío.',
      'Lo que más ayuda: calor en el bajo vientre (bolsa, ducha, manta), que relaja el músculo que se está contrayendo. Si no basta, un antiinflamatorio común siguiendo el prospecto: frenan las prostaglandinas que causan las contracciones. Y moverse suave, aunque no apetezca nada, suele aliviar.',
      'Ve a consulta si cada mes te impide hacer tu vida, si empapas compresas en una o dos horas, o si aparece un dolor nuevo e intenso. El dolor que te anula no es «normal», aunque te hayan dicho que sí.',
    ],
    aviso: 'Esto orienta, no receta. Si tomas otra medicación o puedes estar embarazada, pregunta antes en farmacia o consulta.',
  },
  {
    id: 'dormir-con-regla',
    estante: 'nueva',
    titulo: 'Dormir con la regla',
    minutos: 1,
    entradilla: 'Dar vueltas en la cama con dolor es desesperante. No eres la única.',
    cuerpo: [
      'Con la regla se duerme peor: cuesta dormirse, te despiertas, el dolor no deja postura. Yo duermo peor por el dolor directamente: si me duele, no duermo, así de simple. Si te pasa, no es que de repente duermas mal: es la fase.',
      'Mi ritual: ducha o baño caliente, manzanilla o infusión frutal, antifaz y a la cama. El antifaz me cambia la noche entera, no lo subestimes.',
      'Y los dos primeros días de regla tengo CERO energía y la fatiga por las nubes. Esos días me permito dormir todo lo posible, sin justificarme ante nadie. Si puedes, haz lo mismo: no es vagueza, es escucha.',
      'Si el insomnio se repite cada ciclo y de día vas arrastrándote, anótalo aquí. Un patrón de varios meses es lo que más ayuda a quien te atienda.',
    ],
  },
  {
    id: 'semana-de-hacer',
    estante: 'creciente',
    titulo: 'La semana con más energía',
    minutos: 1,
    entradilla: 'Si notas el subidón, disfrútalo. Si no, no te pasa nada.',
    cuerpo: [
      'Después de la regla el estrógeno sube y muchas notan más energía, claridad y ganas de gente. Es buena semana para lo pendiente, el deporte con marcha y esas conversaciones que ibas dejando.',
      'Pero escúchame: no quieras recuperar en tres días todo lo que paraste. Reparte, que el mes es largo y tu cuerpo no es una deuda que saldar.',
      'Y si no notas ningún subidón, que lo sepas: no todo el mundo lo siente igual, y con anticonceptivos hormonales la curva se aplana bastante. Tu ciclo sigue siendo el tuyo.',
    ],
  },
  {
    id: 'flujo-te-habla',
    estante: 'llena',
    titulo: 'El flujo te habla',
    minutos: 1,
    entradilla: 'Mirarlo da corte al principio. Pero es la forma más directa de entenderte.',
    cuerpo: [
      'Hacia la ovulación el flujo se vuelve transparente y elástico, como clara de huevo. Es tu cuerpo facilitando el camino, dura unos días y se va solo. Verlo es buena señal, no algo sucio.',
      'Un manchado leve rosado o marrón de un par de días a mitad de ciclo también es frecuente, suele ser la ovulación. Y los restos marrones tras la regla son sangre vieja saliendo tarde. Todo eso entra dentro de lo normal.',
      'Lo que sí merece mirarse: olor fuerte raro, picor o escozor, sangrado abundante entre reglas o que se repita cada mes, o dolor en las relaciones. Ahí no te quedes con la duda: consulta.',
    ],
  },
  {
    id: 'pinchazo-mitad',
    estante: 'llena',
    titulo: 'Dolor al ovular',
    minutos: 1,
    entradilla: 'Si alguna vez notaste un pinchazo raro a mitad de mes, no te lo inventaste.',
    cuerpo: [
      'Se llama mittelschmerz, dolor de en medio: al romperse el folículo para soltar el óvulo, algunas personas notan un pinchazo o molestia sorda en un lado. Dura de minutos a unas horas. Sé que asusta la primera vez.',
      'Puede cambiar de lado según el mes, depende del ovario que ovule. Y si no lo sientes nunca, también está bien: no sentirlo no significa nada malo.',
      'Calor y un analgésico común suelen bastar. Pero te lo digo claro: si es intenso, viene con náuseas o fiebre, o no se va, no lo achagues al ciclo. Ve a urgencias o consulta.',
    ],
  },
  {
    id: 'antojos-sin-culpa',
    estante: 'menguante',
    titulo: 'Antojos sin culpa',
    minutos: 1,
    entradilla: 'No es falta de voluntad. Es química, y no tienes nada que perdonarte.',
    cuerpo: [
      'Antes de la regla caen las hormonas y con ellas la serotonina, y el cuerpo pide dulce y carbos porque la suben rápido. Luchar contra eso a fuerza de voluntad es pelear contra tu propio cuerpo, y así no se puede.',
      'Te cuento lo mío: a mí me apetece dulce, sobre todo chocolate. Lo tengo en casa sin drama y me lo como sin negociar conmigo misma. Si a ti te tira lo salado, pues lo salado: el cuerpo pide lo que pide.',
      'Come normal y date el capricho sin castigarte después. Esa culpa que viene luego no la pone tu cuerpo: la pone todo lo que nos han dicho sobre cómo comer. Aquí no hay sitio para ella.',
      'Ten algo en casa para no improvisar a las once de la noche, y ya. El chocolate negro, por cierto, tiene su fama con razón: acompaña bien.',
    ],
  },
  {
    id: 'spm-o-no',
    estante: 'menguante',
    titulo: 'Síndrome premenstrual: cuándo no lo es',
    minutos: 2,
    entradilla: 'Lo que sientes es real. Vamos a ponerle nombre y a saber cuándo pedir ayuda.',
    cuerpo: [
      'Primero: no estás exagerando ni estás loca. El SPM existe, es hormonal y le pasa a muchísima gente. La pista no es el síntoma, es el momento: si se repite en los días previos varios ciclos y se va con la regla, tiene nombre.',
      'Anota dos o tres ciclos: qué pasa, cuándo y cuánto te afecta. «Me despertó dos veces» vale más que «dormí mal». Ese registro es tu mejor aliado si un día lo llevas a consulta.',
      'Y escúchame bien: si la tristeza incapacita, la ansiedad es extrema o hay pánico cada mes, eso puede ser TDPM, que es otra liga y tiene tratamiento. Y si el malestar está todo el mes y solo empeora antes de la regla, puede ser otra cosa que el ciclo agrava. En ambos casos mereces ayuda, no aguante.',
    ],
    aviso: 'Si hay pensamientos de hacerte daño, dolor pélvico repentino y grave, o sangrado muy abundante con debilidad, busca ayuda urgente, no esperes al próximo ciclo.',
  },
  {
    id: 'mi-kit',
    estante: 'siempre',
    titulo: 'Mi kit de regla',
    minutos: 1,
    entradilla: 'Lo que tengo siempre a mano. Cópialo entero o haz el tuyo.',
    cuerpo: [
      'Antiinflamatorio: para cuando el calor no llega. Lo tomo siguiendo el prospecto, sin hacerme la valiente.',
      'Ducha o baño caliente: afloja todo, espalda incluida. Hay días que es lo único que me pone decente.',
      'Manzanilla o infusión frutal: caliente entre las manos, mejor. El ritual también cura.',
      'Mantita o bolsa caliente: en la lumbar, que es donde a mí me mata. Donde te duela a ti.',
      'Antifaz: porque dormir con dolor ya es difícil sin luz de por medio.',
      'No es una lista médica, es mi cajón. El tuyo puede ser otro y estará igual de bien.',
    ],
  },
  {
    id: 'generico-distinto',
    estante: 'anticonceptivos',
    titulo: 'Me cambiaron el laboratorio',
    minutos: 1,
    entradilla: 'Mismo principio activo, distinto laboratorio… y la regla rara. No te lo inventas.',
    cuerpo: [
      'Te lo digo primero: no te lo inventas. El principio activo es el mismo, pero los excipientes cambian de un laboratorio a otro, y hay personas que lo notan: manchados, regla irregular o que se adelanta o se atrasa.',
      'El cuerpo suele adaptarse en uno a tres meses. Si te acaba de pasar con el cambio, dale ese margen y anota lo que pase aquí: el patrón vale más que un mes suelto.',
      'Puedes pedir en farmacia que te mantengan el mismo laboratorio. No siempre pueden, pero pedirlo se puede. Y si el sangrado es muy abundante, no para, o aparecen dolores nuevos fuertes, eso ya es para consulta, sea el laboratorio que sea.',
    ],
  },
  {
    id: 'inyeccion-trimestral',
    estante: 'anticonceptivos',
    titulo: 'La inyección trimestral',
    minutos: 1,
    entradilla: 'Cada tres meses y a otra cosa. Qué esperar por el camino.',
    cuerpo: [
      'Los primeros meses lo normal es lo irregular: manchados entre reglas o reglas que vienen cuando quieren. Con el tiempo a muchas se les va espaciando hasta desaparecer. Que no sangre no significa que algo vaya mal.',
      'Puede abrir el apetito y cambiar el peso, y al dejarla la fertilidad tarda en volver: hasta unos diez meses en algunas personas. Si buscas embarazo pronto, conviene saberlo antes.',
      'Con años de uso seguidos conviene hablar de los huesos en revisión, porque puede bajar la densidad. Y la app te avisa una semana antes de cada pinchazo para que pidas cita con calma.',
    ],
  },
  {
    id: 'varilla-implante',
    estante: 'anticonceptivos',
    titulo: 'La varilla (implante)',
    minutos: 1,
    entradilla: 'Tres años puesta y te olvidas. Lo del sangrado, contado sin sustos.',
    cuerpo: [
      'Lo más frecuente con la varilla es el sangrado irregular: manchados, reglas que se juntan o que desaparecen. Suele mejorar con los meses. Es molesto, lo sé, pero entra dentro de lo esperado.',
      'Se puede quitar cuando quieras y la fertilidad vuelve rápido, no como con la inyección. La colocación deja moratón y molestia unos días: normal.',
      'Tienes que poder tocártela bajo la piel del brazo. Si un día no la encuentras, no te asustes pero ve a consulta pronto. Dura tres años y la app te avisa un mes antes.',
    ],
  },
  {
    id: 'diu',
    estante: 'anticonceptivos',
    titulo: 'El DIU',
    minutos: 2,
    entradilla: 'Hormonal o cobre: qué cambia en tu regla con cada uno.',
    cuerpo: [
      'El hormonal suele dejar reglas más cortas y ligeras, y a muchas se les quedan en nada. El de cobre al revés: los primeros meses reglas más abundantes y largas, que luego se estabilizan. Saberlo antes evita sustos.',
      'Los hilos se revisan una vez al mes, después de la regla, con un dedo limpio: notar los hilitos finos es buena señal. Si no los encuentras o notas el plástico duro, consulta sin esperar.',
      'El hormonal dura unos cinco años y el cobre hasta diez, según el modelo: mira tu tarjeta, que manda ella. Ve a consulta si hay dolor fuerte con fiebre, sangrado muy abundante con debilidad, o si sospechas embarazo.',
    ],
    aviso: 'El DIU lo pone y lo quita personal sanitario. Esto te orienta para vivir con él, no para colocarlo ni quitarlo tú.',
  },
  {
    id: 'parche',
    estante: 'anticonceptivos',
    titulo: 'El parche',
    minutos: 1,
    entradilla: 'Se cambia cada semana, el mismo día. Lo demás es rutina.',
    cuerpo: [
      'El parche se pega en nalga, abdomen, torso o brazo, nunca en el pecho, y se cambia cada siete días, siempre el mismo día de la semana. Rota el sitio para que la piel descanse: si escuece, es la señal de cambiar de zona.',
      'Si se despega: menos de un día, pégalo otra vez o pon uno nuevo y sigue igual. Más de un día, pon uno nuevo y usa protección extra una semana. Si no sabes cuánto estuvo suelto, cuenta como más de un día.',
      'La semana de descanso viene el sangrado. Y truco de veterana: apunta el día de cambio en la app y olvídate, que para eso está el aviso.',
    ],
  },
  {
    id: 'anillo',
    estante: 'anticonceptivos',
    titulo: 'El anillo vaginal',
    minutos: 1,
    entradilla: 'Tres semanas dentro, una fuera. Y no, la posición no importa.',
    cuerpo: [
      'Se coloca como un tampón, empujando hacia dentro: la posición exacta da igual, donde quede está bien. Tres semanas puesto y una de descanso, o seguido si así lo pautó tu médica. Cada persona lleva su pauta: la tuya manda.',
      'Si se sale: menos de tres horas, enjuágalo con agua fría o templada y vuelve a ponerlo. Más de tres horas en la primera o segunda semana, ponlo y usa protección extra siete días. En la tercera, mejor consulta cómo seguir.',
      'Comprueba de vez en cuando que sigue ahí, sobre todo después de ir al baño fuerte. Y si te molesta en las relaciones, puedes sacarlo hasta tres horas sin problema.',
    ],
  },
  {
    id: 'dolor-no-normal',
    estante: 'siempre',
    titulo: 'Cuándo el dolor no es normal',
    minutos: 2,
    entradilla: 'Que duela algo no significa que todo valga. Hay líneas que no hay que cruzar sola.',
    cuerpo: [
      'Te creo primero: la regla puede doler, y mucho. Pero hay una diferencia entre un dolor que te deja en el sofá un día y uno que te anula cada mes, va a más con los años o no cede con nada. Esa diferencia importa.',
      'Señales para consultar sin esperar: dolor que te impide hacer tu vida cada mes, dolor que empeora con el tiempo, dolor fuerte en las relaciones, dolor al orinar o al ir al baño que coincide con la regla, sangrados muy abundantes. Pueden ser endometriosis (1 de cada 10) u otra causa que merece mirarse: tardan una media de 7 a 10 años en diagnosticarla, en parte porque nos enseñan a normalizarlo.',
      'Lleva tu registro de dos o tres ciclos: qué duele, cuándo, cuánto y qué te deja sin hacer. «No pude ir a trabajar dos días» abre más puertas que «me duele mucho». Y si ya lo contaste una vez y no te creyeron, cuéntalo otra vez, a otra persona si hace falta.',
    ],
    aviso: 'Dolor pélvico repentino y grave, desmayo, fiebre con dolor o sangrado muy abundante con debilidad: urgencias, no el próximo ciclo.',
  },
  {
    id: 'retraso-sin-embarazo',
    estante: 'siempre',
    titulo: 'Si se retrasa y no hay embarazo',
    minutos: 1,
    entradilla: 'El susto primero, las causas después. Casi siempre hay explicación.',
    cuerpo: [
      'Si hay posibilidad, lo primero es un test en su momento: ni los síntomas ni las apps confirman ni descartan nada. Hecho eso, respira: hay mil razones para un retraso.',
      'Las habituales: estrés fuerte, cambios de peso, mucho ejercicio de golpe, tiroides, SOP, perimenopausia a partir de los 40, dejar o cambiar anticonceptivos (la inyección tarda meses en soltar). Un ciclo raro aislado le pasa a casi todo el mundo.',
      'Consulta si faltan tres meses seguidos, si tus ciclos pasan de 35 días a menudo, o si el retraso viene con otros cambios (vello, acné, sofocos, pérdida de pelo). Y anota aunque venga tarde: la app cuenta igual.',
    ],
  },
  {
    id: 'copa-disco-tela',
    estante: 'nueva',
    titulo: 'Copa, disco y tela',
    minutos: 2,
    entradilla: 'Sin marcas ni sermones: cómo funciona cada cosa y qué mirar.',
    cuerpo: [
      'La copa se dobla, se introduce y se abre dentro: el vacío la sujeta. Se vacía cada 8 o 12 horas según el modelo, se enjuaga y listo; entre ciclos se hierve unos minutos. Las primeras veces cuesta: prueba en la ducha y sin prisa. Trae marcas de ml: apúntalos aquí y sabrás cuánto sangras de verdad.',
      'El disco no hace vacío, se encaja detrás del hueso del pubis. Aguanta parecido y con él se pueden tener relaciones sin manchar. A algunas les resulta más cómodo; a otras, más engorroso de sacar. Cuestión de probar.',
      'Las de tela se lavan con agua fría primero y luego a la lavadora, sin suavizante. Y vayas con lo que vayas: no lleves nada interno más horas de las indicadas. El síndrome del shock tóxico es raro pero grave: fiebre alta repentina con tampón o copa puesta es para urgencias.',
    ],
    aviso: 'Fiebre alta de golpe, sarpullido, mareo o vómitos llevando tampón o copa: quítalo y ve a urgencias. Mejor un susto que un disgusto.',
  },
  {
    id: 'sop',
    estante: 'siempre',
    titulo: 'Ovarios poliquísticos: reglas que desaparecen',
    minutos: 2,
    entradilla: 'Ciclos de más de 35 días, acné, más vello: cuándo sospechar y qué pedir.',
    cuerpo: [
      'El síndrome de ovario poliquístico le pasa a 1 de cada 10 personas con ciclo. Sospecha si tus reglas vienen cada más de 35 días o tienes menos de 8 al año, si el acné adulto no se va, si sale más vello en cara o cuerpo, o si cuesta quedarse embarazada. No hace falta tenerlo todo, ni tener quistes: el nombre confunde.',
      'El diagnóstico lo pone personal sanitario con análisis de hormonas y ecografía, descartando antes tiroides y otras causas. No te lo puede poner una app ni un test casero: esto es para que llegues a consulta con sospecha, no con certeza.',
      'Se convive bien con tratamiento y hábitos, y la fertilidad suele tener solución cuando se busca. Si te lo diagnostican, no es sentencia: es nombre para lo que te pasa, y con nombre se pelea mejor.',
    ],
  },
  {
    id: 'tampones-compresas',
    estante: 'nueva',
    titulo: 'Tampones y compresas',
    minutos: 1,
    entradilla: 'Lo de siempre, bien usado: absorción mínima, 4-8 horas y nada de dormir con el mismo.',
    cuerpo: [
      'El tampón se cambia cada 4 a 8 horas, nunca más de 8, y con la absorción mínima que te valga. Más absorción de la necesaria reseca y aumenta riesgos. Para dormir: póntelo nuevo justo antes y cámbialo al levantarte; si duermes más de 8 horas, mejor compresa o copa esa noche.',
      'Las compresas se cambian cuando están llenas, sin aguantar por pereza: la humedad irrita. De noche existen largas; manchar la cama alguna vez no es un fracaso, es física.',
      'Nunca uses tampón sin regla ni para el flujo diario, y lávate las manos antes y después. Suena a obvio hasta que vas con prisa.',
    ],
    aviso: 'Fiebre alta repentina, sarpullido, mareo o vómitos con tampón puesto: quítalo y ve a urgencias. Mejor un susto que un disgusto.',
  },
  {
    id: 'bragas-tela',
    estante: 'nueva',
    titulo: 'Bragas menstruales y compresas de tela',
    minutos: 1,
    entradilla: 'Se lavan, se reutilizan y no caducan a las 8 horas. Con su truco.',
    cuerpo: [
      'Las bragas aguantan de 8 a 12 horas según tu flujo; con sangrado fuerte lleva repuesto o combina con copa. Se cambian cuando se notan húmedas, no hay que ser heroica.',
      'Las de tela: agua fría primero (la caliente fija la mancha), luego lavadora sin suavizante, y secar del todo antes de guardar. Duran años si las tratas bien.',
      'Para los primeros días fuertes, la combinación copa más bragas o tela es la favorita de muchas: doble seguridad y menos viajes al baño.',
    ],
  },
  {
    id: 'tu-primera-regla',
    estante: 'siempre',
    titulo: 'Tu primera regla',
    minutos: 2,
    entradilla: 'Si acabas de empezar, esto es para ti. Sin prisa y sin vergüenza.',
    cuerpo: [
      'La regla es esto: cada mes tu cuerpo prepara una capa por dentro del útero (se llama endometrio) por si viene un embarazo. Si no viene, el cuerpo la suelta por la vagina. Eso, durante 3 a 7 días, es la regla. Le pasa a casi todo el mundo con útero, normalmente entre los 9 y los 15 años.',
      'Al principio es un caos y es normal: viene cuando quiere, a veces solo mancha el papel, se va y vuelve a los pocos días. Tarda un tiempo en coger ritmo, a veces años. No hay nada malo en ti por eso.',
      'Para empezar, lo más fácil son las compresas o las bragas menstruales: se ponen como unas bragas normales y listo. La copa y los tampones pueden esperar a que te apetezca probar, no hay prisa ninguna.',
      'Cámbiate a menudo, lávate las manos antes y después, y lleva siempre una de repuesto en la mochila junto con una bolsita. Y recuerda: duele un poco a veces; mucho todos los meses, no. Eso cuéntalo.',
      'No tienes que tener vergüenza ni esconderlo, aunque al principio dé corte. Pregunta a quien te dé confianza: tu madre, tu padre, una amiga, la enfermera del cole, tu médica. Todas las personas con regla pasaron por su primera vez.',
    ],
    aviso: 'Si cumples 15-16 y aún no te ha venido, o si el dolor te impide hacer tu vida cada mes, cuéntalo en consulta. Para eso están.',
  },
  {
    id: 'como-funciona',
    estante: 'siempre',
    titulo: 'Cómo funciona el ciclo',
    minutos: 2,
    entradilla: 'Lo que pasa en tu cuerpo cada mes, contado en cristiano.',
    cuerpo: [
      'El ciclo se cuenta desde el primer día de sangrado hasta el día antes de la siguiente regla. Lo normal está entre 21 y 35 días, y casi nadie clava 28 exactos: tu número es el tuyo.',
      'Dos hormonas llevan la batuta. El estrógeno sube en la primera mitad: te prepara un óvulo y suele subir la energía (nuestra Luna creciente). A mitad, el ovario suelta el óvulo: es la ovulación (Luna llena, días fértiles). Después manda la progesterona (Luna menguante) y, si no hay embarazo, todo cae y empieza el sangrado (Luna nueva).',
      'Por eso el cuerpo cambia con las semanas: no es que seas otra persona, es que las hormonas mueven energía, humor, sueño, hambre y hasta la piel. Esta app llama a cada fase por su luna para que lo veas venir.',
      'Y lo más importante: irregular de vez en cuando entra dentro de lo normal, sobre todo los primeros años y cerca de los 40. Lo que se repite igual cada mes, eso es información: anótalo aquí.',
    ],
  },
  {
    id: 'sin-regla-de-verdad',
    estante: 'anticonceptivos',
    titulo: 'Anticonceptivos: por qué no sangras',
    minutos: 2,
    entradilla: 'Con algunos métodos no hay regla real. Te cuento qué sangra entonces.',
    cuerpo: [
      'Con pastilla, parche o anillo, el sangrado de la semana de descanso no es una regla: es un sangrado por retirada. Como no hubo ovulación, el cuerpo apenas preparó nada, así que suelta poquito. Es normal que sea más corto y ligero que tu regla de antes.',
      'Con DIU hormonal, varilla o inyección, lo normal es que el sangrado se vaya espaciando hasta desaparecer. No pasa nada malo: la sangre no se acumula dentro. El recubrimiento simplemente se queda finito y no hay nada que soltar. Es el método funcionando, no un problema.',
      'Que no sangres no significa que no estés protegida, siempre que uses el método bien. Pero escúchame: si hay riesgo de embarazo (olvidos, método puesto tarde, vómito o diarrea fuerte con la pastilla) y el sangrado no llega, hazte un test en su momento y no te quedes con la duda.',
    ],
    aviso: 'Esto orienta, no sustituye prospecto ni consulta. Ante riesgo de embarazo, test y profesional.',
  },
  {
    id: 'suplementos',
    estante: 'nueva',
    titulo: 'Suplementos que ayudan',
    minutos: 2,
    entradilla: 'Comida primero, pastillas después. Y solo las que tienen algo detrás.',
    cuerpo: [
      'Empiezo por lo honesto: ningún suplemento hace milagros y la base es comer de verdad. Dicho eso, hay unos pocos con estudios pequeños pero serios detrás para los días de regla.',
      'Magnesio: el que más se nombra para cólicos, tensión y dormir mejor. Está en frutos secos, cacao, plátano y legumbres; en pastilla, mejor con cena. Vitamina B6 y calcio con vitamina D tienen ensayos a favor para el malestar premenstrual.',
      'Jengibre en infusión o cápsulas: varios ensayos pequeños lo ponen a la altura de un antiinflamatorio suave para los cólicos. Y omega-3 (pescado azul, nueces) apunta maneras con el dolor, sin ser definitivo.',
      'Hierro solo si te falta, y eso se mira con análisis, no a ojo: si sangras mucho o vives cansada, pide que te lo miren antes de suplementar. Y huye de mezclas milagro con veinte cosas y de megadosis: más no es mejor.',
    ],
    aviso: 'Si tomas medicación, puedes estar embarazada o das el pecho, pregunta en farmacia antes. Los suplementos también interactúan.',
  },
  {
    id: 'anotar-bien',
    estante: 'siempre',
    titulo: 'Cómo anotar para que la cuenta funcione',
    minutos: 1,
    entradilla: 'Sin presión: tres hábitos fáciles y la cuenta afina sola.',
    cuerpo: [
      'Marca el primer día de sangrado de verdad, no el manchado previo. Ese día uno es el que manda. Sin dramas si dudas algún mes: se corrige solo.',
      'Si se te olvida anotar, apúntalo cuando te acuerdes desde el calendario. Vale igual, de verdad. La app filtra los saltos raros para que un olvido no rompa tu media.',
      'Con tres ciclos ya se parece a ti. Poco a poco, sin exigirse. Esto es un cuaderno, no un examen.',
    ],
  },
];
