import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '../src/app.config';
import { OutsideProbeComponent } from './outside-shell';

// This entry point exists so the probe target has something to build. It is
// never expected to produce output: both probe files are compile errors on
// purpose, and scripts/check.mjs asserts the exact diagnostics.
bootstrapApplication(OutsideProbeComponent, appConfig).catch((err) => console.error(err));
