import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../src/heavy/heavy';

/**
 * PROBE — expected NOT to compile. Same mistake as the template-outside
 * variant, but written with the explicit `@Component.deferredImports` field
 * instead of the automatic `imports` path.
 *
 * Angular 22.1.6 answers with two errors, and scripts/check.mjs asserts both:
 *   TS2353 — `deferredImports` is not on the public `Component` type
 *   NG8013 — the element is used outside a @defer block
 */
@Component({
  selector: 'app-probe-outside',
  imports: [],
  deferredImports: [HeavyComponent],
  template: `
    @if (inline) {
      <app-heavy />
    }
    @defer (when open()) {
      <app-heavy />
    }
  `,
})
export class OutsideProbeComponent {
  readonly open = signal(false);
  readonly inline: boolean = false;
}
