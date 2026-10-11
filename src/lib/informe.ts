// El informe para consulta: lo mismo que el historial en texto,
// pero en PDF limpito para llevar a la médica. Se genera en el móvil,
// no viaja a ningún servidor. Incluye patrones porque eso es lo que
// más ayuda en consulta: no solo qué te pasa, sino cuándo se repite.

export interface DatosInforme {
  inicios: string[];
  duraciones: number[];
  cicloMedio: number;
  patrones: { sintoma: string; luna: string; veces: number; total: number; domina: boolean }[];
  topSintomas: [string, number][];
  topProductos: [string, number][];
  anticonceptivo: string | null;
  generada: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}/${m}/${y}`;
}

export function informeHTML(d: DatosInforme): string {
  const filas = d.inicios
    .map((inicio, i) => ({
      inicio,
      dur: i < d.duraciones.length ? d.duraciones[i] : null,
    }))
    .reverse()
    .slice(0, 12)
    .map(
      (p) =>
        `<tr><td>${fechaCorta(p.inicio)}</td><td>${p.dur === null ? 'En curso' : `${p.dur} días`}</td></tr>`,
    )
    .join('');

  const min = d.duraciones.length ? Math.min(...d.duraciones) : null;
  const max = d.duraciones.length ? Math.max(...d.duraciones) : null;

  const patrones = d.patrones.length
    ? `<ul>${d.patrones
        .map(
          (p) =>
            `<li><strong>${esc(p.sintoma)}</strong> — ${
              p.domina
                ? `suele venir en ${esc(p.luna)} (${p.veces} de ${p.total} veces)`
                : `repartido en varias lunas (${p.total} veces)`
            }</li>`,
        )
        .join('')}</ul>`
    : '<p>Aún sin patrones: hacen falta 3 registros del mismo síntoma.</p>';

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<style>
body { font-family: Georgia, serif; color: #241D16; margin: 48px; line-height: 1.5; }
h1 { font-style: italic; font-size: 30px; margin-bottom: 0; }
.sub { color: #857768; margin-top: 4px; }
h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin-top: 32px; border-bottom: 1px solid #E2D7C0; padding-bottom: 6px; }
table { border-collapse: collapse; width: 100%; margin-top: 8px; }
td, th { border: 1px solid #E2D7C0; padding: 8px 12px; text-align: left; font-size: 14px; }
li { margin-bottom: 6px; }
.aviso { margin-top: 32px; border-top: 1px solid #E2D7C0; padding-top: 12px; font-size: 12px; color: #857768; }
.firma { margin-top: 24px; font-style: italic; color: #857768; }
</style></head><body>
<h1>Mi informe de Luna</h1>
<p class="sub">Generado el ${esc(d.generada)} · desde mi móvil, sin cuentas ni nube.</p>
<h2>Ciclos</h2>
<p>${d.inicios.length} ciclos anotados · media de ${d.cicloMedio} días${
    min !== null && max !== null ? ` (de ${min} a ${max})` : ''
  }.</p>
<table><tr><th>Inicio</th><th>Duración</th></tr>${filas}</table>
<h2>Patrones</h2>
${patrones}
<h2>Lo más anotado</h2>
<p>${d.topSintomas.length ? esc(d.topSintomas.map(([s, n]) => `${s} (${n})`).join(', ')) : '—'}</p>
<h2>Productos</h2>
<p>${d.topProductos.length ? esc(d.topProductos.map(([n, c]) => `${n} (${c})`).join(', ')) : '—'}</p>
${d.anticonceptivo ? `<h2>Anticonceptivo</h2><p>${esc(d.anticonceptivo)}</p>` : ''}
<p class="aviso">Informe orientativo generado por la usuaria con sus propios registros. No sustituye historia clínica, exploración ni diagnóstico.</p>
<p class="firma">Hecho a mano por Gianna ✦</p>
</body></html>`;
}
