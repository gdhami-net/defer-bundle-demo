import { Component, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 7 — the same query as the view-child variant, written against a
 * template reference variable instead of the class. The locator is a string, so
 * nothing outside the @defer block names HeavyComponent. This is the workaround
 * the post recommends, measured rather than assumed.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent],
  template: `
    <h1>&#64;defer plus a viewChild query on a template reference</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

    @defer (when open()) {
      <app-heavy #heavyRef />
    } @placeholder {
      <p class="ph">Rate table not loaded yet.</p>
    } @loading {
      <p class="ph">Loading the rate table…</p>
    }

    <p class="ph">query resolved: {{ resolved() }}</p>
  `,
  styles: `.ph { color: #64748b; }`,
})
export class ShellComponent {
  readonly open = signal(false);

  /** A string locator. The class is never named here. */
  readonly heavyRef = viewChild<ElementRef<HTMLElement>>('heavyRef');

  resolved(): boolean {
    return this.heavyRef() !== undefined;
  }
}
