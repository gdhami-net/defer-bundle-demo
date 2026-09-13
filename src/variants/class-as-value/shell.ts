import { Component, signal, Type } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 5 — the clean shell plus the class kept as a VALUE in a field, the
 * shape a dynamic host keeps when it maps an id onto a component. Not a
 * template element, not a query locator: just the constructor sitting in an
 * array. The template is otherwise identical to the clean variant's.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>&#64;defer plus the class held as a value</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

    @defer (when open()) {
      <app-heavy />
    } @placeholder {
      <p class="ph">Rate table not loaded yet.</p>
    } @loading {
      <p class="ph">Loading the rate table…</p>
    }

    <p class="ph">panels in the registry: {{ panels.length }}</p>
  `,
  styles: `.ph { color: #64748b; }`,
})
export class ShellComponent {
  readonly open = signal(false);

  /** A real value reference to the deferred class, reachable from the template. */
  readonly panels: readonly Type<unknown>[] = [HeavyComponent];
}
