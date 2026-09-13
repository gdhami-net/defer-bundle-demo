import { Component } from '@angular/core';
import { HeavyComponent } from '../../heavy/heavy';

/**
 * An ordinary eagerly loaded component that happens to list HeavyComponent in
 * its own `imports` and use it in a branch of its own template. Nothing here
 * is deferred; this is what a sibling feature looks like when two screens
 * share a widget.
 */
@Component({
  selector: 'app-eager-panel',
  imports: [HeavyComponent],
  template: `
    <p class="ph">Eager sibling panel.</p>
    @if (expanded) {
      <app-heavy />
    }
  `,
  styles: `.ph { color: #64748b; }`,
})
export class EagerPanelComponent {
  readonly expanded: boolean = false;
}
