import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';

export interface WaterLevelReading {
  tankId: string;
  waterLevelPercentage: number;
  timestampUtc: string; // ISO string representation
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private hubConnection?: signalR.HubConnection;
  
  // Backing fields for state stream
  private telemetrySubject = new BehaviorSubject<WaterLevelReading | null>(null);
  private historySubject = new BehaviorSubject<WaterLevelReading[]>([]);
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');

  // Exposed Observables
  telemetry$: Observable<WaterLevelReading | null> = this.telemetrySubject.asObservable();
  history$: Observable<WaterLevelReading[]> = this.historySubject.asObservable();
  connectionStatus$: Observable<'connected' | 'disconnected'> = this.connectionStatusSubject.asObservable();

  // Ports configuration matches .NET 10 API launched locally
  private readonly baseUrl = 'http://localhost:5082'; 

  constructor(private http: HttpClient) {
    this.initializeSignalR();
  }

  private initializeSignalR(): void {
    // Build SignalR Hub Connection targeting /hubs/waterlevel
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/waterlevel`, {
        // Automatic fallback selection (WebSocket -> Server-Sent Events -> Long Polling)
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // Sleek automatic retry timing
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup Event Subscriptions
    this.hubConnection.on('ReceiveHistory', (history: any[]) => {
      // Map properties from C# (PascalCase) to JS (camelCase)
      const mappedHistory = history.map(item => this.mapReading(item));
      this.historySubject.next(mappedHistory);
    });

    this.hubConnection.on('ReceiveTelemetry', (reading: any) => {
      const mappedReading = this.mapReading(reading);
      this.telemetrySubject.next(mappedReading);
    });

    // Connection Lifecycles
    this.hubConnection.onclose(() => {
      this.connectionStatusSubject.next('disconnected');
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionStatusSubject.next('disconnected');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStatusSubject.next('connected');
    });

    this.startConnection();
  }

  private startConnection(): void {
    if (!this.hubConnection) return;

    this.hubConnection.start()
      .then(() => {
        this.connectionStatusSubject.next('connected');
        console.log('SignalR connection established successfully.');
      })
      .catch((err: any) => {
        this.connectionStatusSubject.next('disconnected');
        console.error('SignalR connection failed. Retrying in 5s...', err);
        setTimeout(() => this.startConnection(), 5000);
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

  // HTTP REST POST event to push simulated telemetry
  pushMockTelemetry(payload: { tankId: string, waterLevelPercentage: number, timestampUtc: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/telemetry`, payload);
  }
}
