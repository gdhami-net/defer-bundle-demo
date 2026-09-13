import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 1 — the baseline. HeavyComponent is standalone, it is listed in
 * `imports`, and the only place the template mentions <app-heavy> is inside
 * the @defer block. Nothing else in this file refers to the class.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>clean &#64;defer</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

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
}
