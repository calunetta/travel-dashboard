import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'yarn nx run travel-admin:serve',
        production: 'yarn nx run travel-admin:serve-static',
      },
      ciWebServerCommand: 'yarn nx run travel-admin:serve-static',
      ciBaseUrl: 'http://localhost:4200',
    }),
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
    baseUrl: 'http://localhost:4200',
  },
});
