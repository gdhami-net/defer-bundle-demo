import { Component, signal, viewChild } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 3 — the clean shell plus a signal viewChild query whose locator is
 * the deferred class itself. The template is byte-identical to the clean
 * variant's.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>&#64;defer plus a viewChild query on the deferred class</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

    @defer (when open()) {
      <app-heavy />
    } @placeholder {
      <p class="ph">Rate table not loaded yet.</p>
    } @loading {
      <p class="ph">Loading the rate table…</p>
    }

    <p class="ph">rows currently rendered: {{ rendered() }}</p>
  `,
  styles: `.ph { color: #64748b; }`,
})
export class ShellComponent {
  readonly open = signal(false);

  /** The class is the locator, which is what the Angular guide calls out. */
  readonly heavy = viewChild(HeavyComponent);

  rendered(): number {
    return this.heavy()?.matches().length ?? 0;
  }
}
