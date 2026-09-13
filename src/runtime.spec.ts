import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import type { Type, WritableSignal } from '@angular/core';

import { HEAVY_MARKER } from './heavy/heavy';
import { ShellComponent as CleanShell } from './variants/clean/shell';
import { ShellComponent as TemplateOutsideShell } from './variants/template-outside/shell';
import { ShellComponent as ViewChildShell } from './variants/view-child/shell';
import { ShellComponent as TypeOnlyShell } from './variants/type-only/shell';
import { ShellComponent as ClassAsValueShell } from './variants/class-as-value/shell';
import { ShellComponent as EagerSiblingShell } from './variants/eager-sibling/shell';

/**
 * The bundle half of this demo lives in scripts/check.mjs, which proves WHERE
 * the deferred component's code shipped. This file proves the other half: that
 * all six shells behave the same way at runtime, so the browser gives you no
 * hint that three of them shipped the code eagerly.
 *
 * DeferBlockBehavior.Playthrough makes @defer blocks resolve the way they do in
 * a real app rather than jumping straight to their content.
 */
const PLACEHOLDER = 'Rate table not loaded yet.';

const SHELLS: ReadonlyArray<readonly [string, Type<{ open: WritableSignal<boolean> }>]> = [
  ['clean', CleanShell],
  ['template-outside', TemplateOutsideShell],
  ['view-child', ViewChildShell],
  ['type-only', TypeOnlyShell],
  ['class-as-value', ClassAsValueShell],
  ['eager-sibling', EagerSiblingShell],
];

describe('every variant looks identical in the DOM', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Playthrough });
  });

  for (const [name, shell] of SHELLS) {
    it(`${name}: shows the placeholder, then the deferred content on its trigger`, async () => {
      const fixture = TestBed.createComponent(shell);
      await fixture.whenStable();

      const before = fixture.nativeElement.textContent as string;
      expect(before).toContain(PLACEHOLDER);
      expect(before).not.toContain(HEAVY_MARKER);

      fixture.componentInstance.open.set(true);
      await fixture.whenStable();

      const after = fixture.nativeElement.textContent as string;
      expect(after).toContain(HEAVY_MARKER);
      expect(after).not.toContain(PLACEHOLDER);
    });
  }
});
