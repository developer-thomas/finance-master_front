import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { registrarIcones } from './app/core/icones';

registrarIcones();

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
