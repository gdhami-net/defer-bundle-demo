import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 2 — identical to the clean shell except for one extra <app-heavy>
 * in a branch that never runs. `inline` is never set to true, so at runtime
 * this renders exactly what the clean variant renders.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>&#64;defer plus one template reference outside the block</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

    @if (inline) {
      <app-heavy />
    }

    @defer (when open()) {
      <app-heavy />
    } @placeholder {
      <p class="ph">Rate table not loaded yet.</p>
    } @loading {
      <p class="ph">Loading the rate table…</p>
    }
  `,
  styles: `.ph { color: #64748b; }`,
})
export class ShellComponent {
  readonly open = signal(false);

  /**
   * Never flipped. Typed `boolean` rather than left as the literal `false` so
   * no part of the toolchain can fold the branch away on the type alone.
   */
  readonly inline: boolean = false;
}
