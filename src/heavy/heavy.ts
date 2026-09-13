import { Component, computed, signal } from '@angular/core';
import { RATE_BANDS, type RateBand } from './rate-table';

/**
 * The string the bundle probe greps for. It is rendered, so nothing in the
 * optimizer pipeline has a reason to drop it, and it appears exactly once in
 * the source tree.
 */
export const HEAVY_MARKER = 'HEAVY_PAYLOAD_MARKER_5K7QW2';

/**
 * The component every variant defers. Identical in all six builds: the only
 * thing that changes between variants is how the shell around it refers to
 * this class.
 */
@Component({
  selector: 'app-heavy',
  template: `
    <section class="heavy">
      <h2>Rate bands</h2>
      <p class="marker">{{ marker }}</p>
      <p>{{ bands.length }} bands in the table, {{ matches().length }} shown</p>
      <input
        type="text"
        placeholder="filter by region"
        [value]="filter()"
        (input)="onFilter($event)"
      />
      <ul>
        @for (band of matches(); track band.code) {
          <li>
            <code>{{ band.code }}</code>
            {{ band.region }} — {{ band.band }} @ {{ band.rate }}
            <small>{{ band.note }}</small>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .heavy { border: 1px solid #cbd5e1; padding: 16px; }
    .marker { font-family: monospace; color: #64748b; }
    ul { max-height: 320px; overflow: auto; }
  `,
})
export class HeavyComponent {
  readonly marker = HEAVY_MARKER;
  readonly bands: readonly RateBand[] = RATE_BANDS;
  readonly filter = signal('');

  readonly matches = computed<readonly RateBand[]>(() => {
    const query = this.filter().trim().toLowerCase();
    if (query === '') {
      return this.bands.slice(0, 25);
    }
    return this.bands.filter(
      (band) =>
        band.region.toLowerCase().includes(query) ||
        band.band.toLowerCase().includes(query),
    );
  });

  onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }
}
