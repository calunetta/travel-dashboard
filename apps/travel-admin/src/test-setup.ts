import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

if (typeof global !== 'undefined') {
  (global as any).fetch = jest.fn();
  (global as any).Response = jest.fn();
  (global as any).Request = jest.fn();
  (global as any).Headers = jest.fn();
}
