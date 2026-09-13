import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../src/heavy/heavy';

/**
 * PROBE — expected NOT to compile either, and that is the finding. The
 * template here is correct: the only <app-heavy> is inside the @defer block.
 * The single error is TS2353, because `deferredImports` is not declared on the
 * public `Component` type in Angular 22.1.6.
 */
@Component({
  selector: 'app-probe-clean',
  imports: [],
  deferredImports: [HeavyComponent],
  template: `
    @defer (when open()) {
      <app-heavy />
    }
  `,
})
export class CleanProbeComponent {
  readonly open = signal(false);
}
