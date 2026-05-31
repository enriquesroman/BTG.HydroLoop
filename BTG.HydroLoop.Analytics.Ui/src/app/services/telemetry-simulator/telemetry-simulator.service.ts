import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TELEMETRY_CONFIG, TelemetryConfig } from '../../app.config';

@Injectable({
  providedIn: 'root'
})
export class TelemetrySimulatorService {
  constructor(
    private http: HttpClient,
    @Inject(TELEMETRY_CONFIG) private config: TelemetryConfig
  ) {}

  pushMockTelemetry(payload: { tankId: string, waterLevelPercentage: number, timestampUtc: number }): Observable<any> {
    return this.http.post<any>(`${this.config.baseUrl}/api/telemetry`, payload);
  }
}
