This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## La voz de Luna — normas de Gianna (mandan sobre todo lo demás)

Estas las puso Gianna y no se discuten. Si alguna instrucción genérica choca con estas, ganan estas.

**Tono: humano, no IA.**
- Nada de textos que suenen a robot: ni "¡Increíble!", ni listas frías, ni emojis en la pantalla. Valen glifos de texto (← → ✓ ✦).
- Primero validar, después contar la verdad. Cero positividad tóxica, cero culpas.
- Cercana y empática como Gianna, a la vez sincera y directa. Si algo duele o falla, se dice.
- La experiencia propia va en primera persona ("a mí me funciona", "mi kit"). Lo general, en neutro cálido.

**Idioma.**
- Español, textos empezando en mayúscula. Meses en minúscula donde toca ("11 de octubre").
- Lenguaje neutro e inclusivo: es para quien tenga ciclo (mujeres, hombres trans, personas no binarias). Nada de asumir género. Revisar con grep cuando se toque texto.

**Estética cuaderno, día y noche.**
- Papel y tinta de día; cielo noche de noche. Colores planos de `src/lib/tema.ts`.
- Nada de degradados, rosa chicle, morados neón ni brillos. Bordes finos, esquinas poco redondeadas, serif en titulares.
- La firma es "Hecho a mano por Gianna ✦" y la luna cambia con la fase. No tocar sin preguntar.

**Privacidad: local primero, siempre.**
- Sin cuentas, sin servidores, sin rastreo. Todo en AsyncStorage con claves `@luna:*`.
- Si una función necesita nube o cuenta, no se hace. Los avisos son locales del móvil.
- Al cambiar formatos guardados, migrar lo viejo para no perder datos de nadie.

**Código.**
- Comentarios como persona, en español: por qué se hizo así, qué se dudó. Nada de JSDoc de manual.
- Lógica pura en `src/lib/` (se prueba con node), pantallas en `App.tsx`, dibujo en `src/ui/`.
- Artículos en `src/lib/articulos.ts`: cortos (1-2 min), atados a su luna, con fuentes serias y avisos donde toquen. Nada de diagnósticos.
- Verificar siempre: `npx tsc --noEmit` y prueba de lógica con node antes de dar algo por hecho.
- Versiones: 0.x probando, 1.0.0 solo al publicar. No subir versión sin decirlo.
