// Builds every variant and asserts, from the real output files, where the
// deferred component's marker string ended up.
//
//   node scripts/check.mjs            assert against scripts/expected.json
//   node scripts/check.mjs --record   rewrite scripts/expected.json
//
// `--record` is how the committed baseline was produced. `npm run check` never
// records, so a behaviour change shows up as a failure rather than a new
// baseline.
//
// What counts as "initial" is computed here rather than read off the CLI's
// table: main.js is the entry, every file reachable from it through a STATIC
// import is initial, and a file reachable only through `import(...)` is lazy.
// The CLI's own "Initial total" line is parsed too and printed beside it, so
// the two accounts can be compared.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_PATH = join(ROOT, 'scripts', 'expected.json');
const MARKER = 'HEAVY_PAYLOAD_MARKER_5K7QW2';
const PLACEHOLDER = 'Rate table not loaded yet.';

const VARIANTS = [
  ['clean', 'the only <app-heavy> is inside the @defer block'],
  ['template-outside', 'plus one <app-heavy> in a branch that never runs'],
  ['view-child', 'plus viewChild(HeavyComponent)'],
  ['view-child-ref', "plus viewChild('heavyRef'), a string locator"],
  ['type-only', 'plus HeavyComponent in type position only'],
  ['class-as-value', 'plus the class kept as a value in a field'],
  ['eager-sibling', 'clean here; an eager sibling component imports it'],
];

const recording = process.argv.includes('--record');
const failures = [];
const results = {};

const NG_BIN = join(ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

function ng(target) {
  try {
    return {
      ok: true,
      out: execFileSync(process.execPath, [NG_BIN, 'run', `defer-bundle-demo:${target}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NG_CLI_ANALYTICS: 'false', FORCE_COLOR: '0' },
      }),
    };
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function strip(text) {
  // esbuild colours its output even through a pipe on some terminals.
  return text.replace(/\[[0-9;]*m/g, '');
}

function jsFiles(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.js'));
}

/** Static imports: `from"./chunk-X.js"` or a bare `import"./chunk-X.js"`. */
function staticImports(source) {
  const found = new Set();
  for (const m of source.matchAll(/(?:from|import)\s*"(\.\/[^"]+\.js)"/g)) {
    found.add(m[1].slice(2));
  }
  return found;
}

/** Dynamic imports: `import("./chunk-X.js")`. */
function dynamicImports(source) {
  const found = new Set();
  for (const m of source.matchAll(/import\(\s*"(\.\/[^"]+\.js)"\s*\)/g)) {
    found.add(m[1].slice(2));
  }
  return found;
}

function classify(browserDir) {
  const files = jsFiles(browserDir);
  const sources = new Map(files.map((f) => [f, readFileSync(join(browserDir, f), 'utf8')]));

  // Static closure from the entry point.
  const initial = new Set();
  const queue = ['main.js'];
  while (queue.length > 0) {
    const file = queue.pop();
    if (initial.has(file) || !sources.has(file)) continue;
    initial.add(file);
    for (const dep of staticImports(sources.get(file))) queue.push(dep);
  }

  const lazyEntry = new Set();
  for (const [, source] of sources) {
    for (const dep of dynamicImports(source)) {
      if (!initial.has(dep)) lazyEntry.add(dep);
    }
  }

  const bytes = (f) => statSync(join(browserDir, f)).size;
  const markerFiles = files.filter((f) => sources.get(f).includes(MARKER));

  return {
    files: files.sort(),
    initial: [...initial].sort(),
    lazy: [...lazyEntry].sort(),
    initialJsBytes: [...initial].reduce((sum, f) => sum + bytes(f), 0),
    lazyJsBytes: [...lazyEntry].reduce((sum, f) => sum + bytes(f), 0),
    markerFiles,
    markerWhere:
      markerFiles.length !== 1
        ? `unexpected: marker in ${markerFiles.length} files`
        : initial.has(markerFiles[0])
          ? 'initial'
          : lazyEntry.has(markerFiles[0])
            ? 'lazy'
            : 'unreachable',
    markerFileBytes: markerFiles.length === 1 ? bytes(markerFiles[0]) : null,
  };
}

/** The CLI prints "| Initial total | 118.95 kB | 36.42 kB"; keep its own words. */
function cliInitialTotal(out) {
  const line = strip(out)
    .split('\n')
    .find((l) => l.includes('Initial total'));
  if (!line) return null;
  const cells = line
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  return { raw: cells[1] ?? null, transfer: cells[2] ?? null };
}

function check(label, actual, expected, tolerance = 0) {
  if (recording) return;
  const ok =
    tolerance > 0
      ? Math.abs(actual - expected) <= Math.abs(expected) * tolerance
      : actual === expected;
  if (!ok) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const expected = recording
  ? { variants: {}, probes: {} }
  : JSON.parse(readFileSync(EXPECTED_PATH, 'utf8'));

console.log(`@angular/core ${pkg('@angular/core')}  @angular/build ${pkg('@angular/build')}  typescript ${pkg('typescript')}  node ${process.version}`);
console.log('');

function pkg(name) {
  return JSON.parse(readFileSync(join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version;
}

// ---------------------------------------------------------------- the variants

for (const [variant, blurb] of VARIANTS) {
  const build = ng(`build-${variant}`);
  if (!build.ok) {
    console.log(`${variant}: BUILD FAILED\n${strip(build.out)}`);
    failures.push(`${variant}: build failed`);
    continue;
  }

  const browserDir = join(ROOT, 'dist', variant, 'browser');
  if (!existsSync(browserDir)) {
    failures.push(`${variant}: no output at ${browserDir}`);
    continue;
  }

  const info = classify(browserDir);
  const total = cliInitialTotal(build.out);
  const placeholderInInitial = info.initial.some((f) =>
    readFileSync(join(browserDir, f), 'utf8').includes(PLACEHOLDER),
  );

  results[variant] = {
    blurb,
    markerWhere: info.markerWhere,
    markerFileBytes: info.markerFileBytes,
    lazyChunkCount: info.lazy.length,
    lazyJsBytes: info.lazyJsBytes,
    initialJsBytes: info.initialJsBytes,
    cliInitialRaw: total?.raw ?? null,
    cliInitialTransfer: total?.transfer ?? null,
    placeholderInInitial,
  };

  const want = expected.variants?.[variant];
  if (!recording) {
    if (!want) {
      failures.push(`${variant}: no expectation recorded`);
    } else {
      check(`${variant} marker lands in`, info.markerWhere, want.markerWhere);
      check(`${variant} lazy chunk count`, info.lazy.length, want.lazyChunkCount);
      check(`${variant} placeholder in initial bundle`, placeholderInInitial, true);
      // Sizes move with Angular patch releases; the structure above does not.
      check(`${variant} initial JS bytes`, info.initialJsBytes, want.initialJsBytes, 0.05);
      check(`${variant} lazy JS bytes`, info.lazyJsBytes, want.lazyJsBytes, 0.05);
    }
  }

  console.log(`${variant.padEnd(17)} ${blurb}`);
  console.log(
    `${''.padEnd(17)} marker in the ${info.markerWhere} bundle` +
      ` (${info.markerFiles.join(', ')}, ${info.markerFileBytes} bytes)`,
  );
  console.log(
    `${''.padEnd(17)} lazy chunks: ${info.lazy.length === 0 ? 'none' : `${info.lazy.join(', ')} = ${info.lazyJsBytes} bytes`}`,
  );
  console.log(
    `${''.padEnd(17)} initial JS: ${info.initialJsBytes} bytes` +
      `   CLI initial total: ${total?.raw} raw / ${total?.transfer} transfer`,
  );
  console.log(`${''.padEnd(17)} @placeholder text in the initial bundle: ${placeholderInInitial}`);
  console.log('');
}

// ------------------------------------------------------------------ the probes

const probe = ng('build-probes');
const probeOut = strip(probe.out);
const probeCounts = {
  built: probe.ok,
  ts2353: (probeOut.match(/TS2353/g) ?? []).length,
  ng8013: (probeOut.match(/NG8013/g) ?? []).length,
  ng8013Text: probeOut.includes(
    "NG8013: Element 'app-heavy' contains a component or a directive that was imported  via `@Component.deferredImports`, but the element itself is located outside of a `@defer` block in a template.",
  ),
  ts2353Text: probeOut.includes(
    "TS2353: Object literal may only specify known properties, and 'deferredImports' does not exist in type 'Component'.",
  ),
};
results.probes = probeCounts;

if (!recording) {
  check('probes build fails on purpose', probeCounts.built, false);
  check('probes TS2353 count', probeCounts.ts2353, expected.probes.ts2353);
  check('probes NG8013 count', probeCounts.ng8013, expected.probes.ng8013);
  check('probes NG8013 message text', probeCounts.ng8013Text, true);
  check('probes TS2353 message text', probeCounts.ts2353Text, true);
}

console.log('probes            deferredImports written out by hand');
console.log(`${''.padEnd(17)} build succeeded: ${probeCounts.built} (false is the expected result)`);
console.log(`${''.padEnd(17)} TS2353 "'deferredImports' does not exist in type 'Component'": ${probeCounts.ts2353}`);
console.log(`${''.padEnd(17)} NG8013 "located outside of a \`@defer\` block": ${probeCounts.ng8013}`);
console.log('');

// ----------------------------------------------------------------------- verdict

if (recording) {
  const out = { recordedOn: new Date().toISOString().slice(0, 10), variants: {}, probes: probeCounts };
  for (const [variant] of VARIANTS) {
    const r = results[variant];
    out.variants[variant] = {
      markerWhere: r.markerWhere,
      lazyChunkCount: r.lazyChunkCount,
      lazyJsBytes: r.lazyJsBytes,
      initialJsBytes: r.initialJsBytes,
      cliInitialRaw: r.cliInitialRaw,
      cliInitialTransfer: r.cliInitialTransfer,
    };
  }
  writeFileSync(EXPECTED_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`recorded baseline to ${EXPECTED_PATH}`);
  process.exit(0);
}

if (failures.length > 0) {
  console.log(`FAILED — ${failures.length} assertion(s)`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

const clean = results.clean;
const broken = results['template-outside'];
console.log(
  `one extra template reference moved ${clean.lazyJsBytes} bytes of lazy chunk into the initial bundle` +
    ` (${clean.initialJsBytes} -> ${broken.initialJsBytes} bytes of initial JS)`,
);
console.log(`OK — ${VARIANTS.length} variants and 1 probe build, all as recorded`);
