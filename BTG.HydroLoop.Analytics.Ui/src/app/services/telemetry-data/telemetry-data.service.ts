import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SignalRTransportService } from '../signalr-transport/signalr-transport.service';

export interface WaterLevelReading {
  tankId: string;
  waterLevelPercentage: number;
  timestampUtc: string; // ISO string representation
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryDataService {
  private telemetrySubject = new BehaviorSubject<WaterLevelReading | null>(null);
  private historySubject = new BehaviorSubject<WaterLevelReading[]>([]);

  telemetry$: Observable<WaterLevelReading | null> = this.telemetrySubject.asObservable();
  history$: Observable<WaterLevelReading[]> = this.historySubject.asObservable();
  connectionStatus$: Observable<'connected' | 'disconnected'>;

  constructor(private transport: SignalRTransportService) {
    this.connectionStatus$ = this.transport.connectionStatus$;

    // Subscribe to SignalR events
    this.transport.on<any[]>('ReceiveHistory').subscribe((history) => {
      const mappedHistory = history.map(item => this.mapReading(item));
      this.historySubject.next(mappedHistory);
    });

    this.transport.on<any>('ReceiveTelemetry').subscribe((reading) => {
      const mappedReading = this.mapReading(reading);
      this.telemetrySubject.next(mappedReading);
    });
  }

  // Safely map C# dynamic object properties (PascalCase) to camelCase
  private mapReading(item: any): WaterLevelReading {
    return {
      tankId: item.tankId || item.TankId,
      waterLevelPercentage: item.waterLevelPercentage !== undefined ? item.waterLevelPercentage : item.WaterLevelPercentage,
      timestampUtc: item.timestampUtc || item.TimestampUtc
    };
  }
}
