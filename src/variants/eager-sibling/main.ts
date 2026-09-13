import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '../../app.config';
import { ShellComponent } from './shell';

bootstrapApplication(ShellComponent, appConfig).catch((err) => console.error(err));
