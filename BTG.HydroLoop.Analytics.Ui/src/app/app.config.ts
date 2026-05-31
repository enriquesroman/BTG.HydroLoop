import { ApplicationConfig, provideBrowserGlobalErrorListeners, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export interface TelemetryConfig {
  baseUrl: string;
  safetyThreshold: number;
  maxHistoryLength: number;
  simulatorUpdateIntervalMs: number;
  simulatorMinBound: number;
  simulatorMaxBound: number;
}

export const TELEMETRY_CONFIG = new InjectionToken<TelemetryConfig>('TELEMETRY_CONFIG');

export const defaultTelemetryConfig: TelemetryConfig = {
  baseUrl: 'http://localhost:5082',
  safetyThreshold: 85.0,
  maxHistoryLength: 20,
  simulatorUpdateIntervalMs: 2000,
  simulatorMinBound: 55,
  simulatorMaxBound: 95
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(), // Registers HTTP client services for Angular DI
    { provide: TELEMETRY_CONFIG, useValue: defaultTelemetryConfig }
  ]
};
