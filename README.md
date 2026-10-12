Luna — Tu ciclo en tu bolsillo
============================

Estaba harta de las apps de ciclo que te dejan ver tres pantallas y luego
te piden 5€ al mes por decirte cuándo te viene. Así que hice esta.

Es una app de móvil, gratis y de código abierto. Anotas cuándo te viene,
cómo estás, y te hace la cuenta para el mes siguiente. Ya está. No hay
nube, no hay cuenta, no hay consejos raros generados por un robot.

Todo lo que escribes se queda en tu teléfono. Si borras la app, se pierde.
Eso es a posta. No se vende ni se comparte nada, no hay rastreo ni IA:
no hay a quién venderlo porque no sale del móvil.

Es para quien tenga ciclo, sea quien sea: mujeres, hombres trans,
personas no binarias. Si tienes regla, es para ti.

Cómo se usa
----------

```bash
cd luna-tracker
npm install
npx expo start
```

Escaneas el QR con Expo Go y la pruebas en tu móvil. Con `w` la ves en el
navegador, pero donde tiene sentido es en el teléfono.

Cómo está hecha
---------------

- `App.tsx` — toda la pantalla: hoy, calendario, leer y tu santuario.
  La quise simple para entrar, apuntar y salir en diez segundos.
- `src/lib/ciclo.ts` — las cuentas (media del ciclo, qué día toca, días
  fértiles). Está separado para poder leerlo sin tragarte el resto.
- `src/lib/articulos.ts` — los textos de leer, escritos a mano.

Si algo no te cuadra — un texto, un color, la cuenta — ábrelo y cámbialo.
Para eso está.

Licencia
--------

MIT. Haz lo que quieras con esto.

Hecho a mano por Gianna ✦
