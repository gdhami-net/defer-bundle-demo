import { Component, signal } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';
import { EagerPanelComponent } from './eager-panel';

/**
 * VARIANT 6 — this file's @defer block is as clean as variant 1's. The extra
 * reference lives in a DIFFERENT file: the eagerly loaded sibling panel also
 * imports HeavyComponent. The question is whether a rule the Angular guide
 * states per-file survives contact with the bundler.
 */
@Component({
  selector: 'app-shell',
  imports: [HeavyComponent, EagerPanelComponent],
  template: `
    <h1>&#64;defer, clean here, referenced by an eager sibling</h1>
    <button type="button" (click)="open.set(true)">Show the rate table</button>

    <app-eager-panel />

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
