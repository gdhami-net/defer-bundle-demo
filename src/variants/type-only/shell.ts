import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 5 — the clean shell plus references to HeavyComponent that live only
 * in type position. `lastShown` and the `instance` parameter both name the
 * class; TypeScript erases both, and neither is a template use or a query
 * locator. This one is here for the contrast: it is expected NOT to break
 * deferral, which is what makes the other variants' results meaningful.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>&#64;defer plus a type-only reference</h1>
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

  private lastShown: HeavyComponent | null = null;

  remember(instance: HeavyComponent): void {
    this.lastShown = instance;
  }

  markerOfLastShown(): string | null {
    return this.lastShown?.marker ?? null;
  }
}
