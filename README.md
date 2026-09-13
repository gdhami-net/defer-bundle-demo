# defer-bundle-demo

`@defer` puts a component into its own lazy chunk only when the deferred
dependency is standalone **and** nothing else in the same file refers to it. When
something does, Angular silently falls back to loading it eagerly: the
`@placeholder` still shows, the content still appears on its trigger, and the
code ships in the initial bundle.

This demo builds the same `@defer` block six ways, each differing only in how the
shell around it refers to `HeavyComponent`, and then looks in the real build
output to see where the component's code actually landed.

Angular 22.1.6, TypeScript 6.0.3, `@angular/build` 22.1.8, Node 26.1.0, the
`@angular/build:application` builder.

## What it proves

`HeavyComponent` (`src/heavy/heavy.ts`) renders a unique marker string,
`HEAVY_PAYLOAD_MARKER_5K7QW2`, which appears exactly once in the source tree. It
carries a 480-row generated table so it is heavy enough for the difference to be
visible in the CLI's own numbers.

Recorded on 2026-09-13 with the versions above:

| variant | extra reference in the shell | lazy chunk | marker landed in | initial JS |
| --- | --- | --- | --- | --- |
| `clean` | none | 66,244 B | the lazy chunk | 118,869 B |
| `template-outside` | `<app-heavy>` in an `@if` that never runs | none | the initial bundle | 185,161 B |
| `view-child` | `viewChild(HeavyComponent)` | none | the initial bundle | 194,630 B |
| `type-only` | the class in type position only | 66,244 B | the lazy chunk | 118,990 B |
| `class-as-value` | the class in a `Type<unknown>[]` field | none | the initial bundle | 184,543 B |
| `eager-sibling` | none here; an eager sibling component imports it | 94 B | the initial bundle | 186,028 B |

Two things worth reading twice. `type-only` still defers, which is what makes the
others meaningful: it is the kind of reference that does *not* matter.
`eager-sibling` still emits a chunk named `heavy`, and that chunk is 94 bytes of
`export { … } from "./chunk-…"` pointing back into the initial bundle — so the
presence of a lazy chunk in the build log proves nothing on its own.

No build printed a warning in any of the eager cases. The compiler does have
diagnostics for this mistake (`NG8012` for pipes, `NG8013` for directives and
components, `NG8014` for the import declaration), but all three are wired to the
`@Component.deferredImports` field, which is not on the public `Component` type.
`probes/` holds two components that try to use it; both fail to compile, and
`scripts/check.mjs` asserts the exact diagnostics.

## Running it

```
npm ci
npm run check
```

`npm run check` does two things.

`scripts/check.mjs` builds all six variants plus the probes and asserts, per
variant, where the marker landed, how many lazy chunks exist, and that the
`@placeholder` text is in the initial bundle. "Initial" is computed from the
output files rather than read off the CLI's table: `main.js` is the entry, every
file reachable from it through a *static* import is initial, and a file reachable
only through `import(...)` is lazy. The expected results live in
`scripts/expected.json`; structural facts are asserted exactly and byte counts
within 5%, because those move with Angular patch releases. `node
scripts/check.mjs --record` rewrites that baseline, which is how it was produced;
`npm run check` never records.

`ng test` runs `src/runtime.spec.ts`, six tests that mount each shell with
`DeferBlockBehavior.Playthrough` and assert that the placeholder renders first
and the deferred content renders on its trigger. That is the other half of the
point: all six behave identically, so the browser gives you no hint that three of
them shipped the code eagerly.

`npm start` serves the `clean` variant if you want to click through it.

## Layout

```
src/heavy/heavy.ts          the deferred component and its marker string
src/heavy/rate-table.ts     generated filler (scripts/gen-rate-table.mjs)
src/variants/<name>/        one shell + entry point per variant
src/runtime.spec.ts         the runtime assertions
probes/                     deliberately-failing deferredImports components
scripts/check.mjs           builds every variant, asserts where the marker went
scripts/expected.json       the recorded baseline
```

Every build target lives in `angular.json`, one per variant, all with the same
options apart from the entry point and the output path.

## Caveats

Measured on Windows 11 with Node 26.1.0; I have not repeated it on Linux or macOS.
The `rate-table.ts` filler is extremely repetitive, so it gzips far better than
real code would: the raw initial bundle grows by about 66 kB when deferral
breaks, while the CLI's estimated transfer size grows by about 3 kB. In an app
where the deferred component is real code, the transfer difference tracks the raw
difference much more closely.

MIT licensed.
