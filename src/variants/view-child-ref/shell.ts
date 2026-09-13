import { Component, signal, viewChild } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * VARIANT 4 — the same query as the view-child variant, written against a
 * template reference variable instead of the class. The locator is a string, so
 * nothing outside the @defer block uses HeavyComponent as a value; the type
 * argument is erased. A reference variable on a component tag resolves to the
 * component instance, so that is the type. This is the workaround the post
 * recommends, measured rather than assumed.
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

  /** A string locator. The class appears only as an erased type argument. */
  readonly heavyRef = viewChild<HeavyComponent>('heavyRef');

  resolved(): boolean {
    return this.heavyRef() !== undefined;
  }
}
