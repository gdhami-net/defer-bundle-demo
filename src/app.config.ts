import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/** Shared by all six variant entry points, so nothing but the shell differs. */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
