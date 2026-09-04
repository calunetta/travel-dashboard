import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error(err);
  document.body.innerHTML = `<div style="color:red; font-family:monospace; padding:20px;">
    <h1>Bootstrap Error</h1>
    <pre>${err.message || err}</pre>
    <pre>${err.stack || ''}</pre>
  </div>`;
});
