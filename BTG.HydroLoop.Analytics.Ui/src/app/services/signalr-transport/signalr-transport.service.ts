import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { TELEMETRY_CONFIG, TelemetryConfig } from '../../app.config';

@Injectable({
  providedIn: 'root'
})
export class SignalRTransportService {
  private hubConnection?: signalR.HubConnection;
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');
  
  // Dynamic subjects for events
  private events: { [eventName: string]: Subject<any> } = {};

  connectionStatus$: Observable<'connected' | 'disconnected'> = this.connectionStatusSubject.asObservable();

  constructor(@Inject(TELEMETRY_CONFIG) private config: TelemetryConfig) {
    this.initializeSignalR();
  }

  private initializeSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.config.baseUrl}/hubs/waterlevel`, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onclose(() => this.connectionStatusSubject.next('disconnected'));
    this.hubConnection.onreconnecting(() => this.connectionStatusSubject.next('disconnected'));
    this.hubConnection.onreconnected(() => this.connectionStatusSubject.next('connected'));

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

  public on<T>(eventName: string): Observable<T> {
    if (!this.events[eventName]) {
      this.events[eventName] = new Subject<T>();
      
      // Register handler with SignalR
      if (this.hubConnection) {
        this.hubConnection.on(eventName, (data: T) => {
          this.events[eventName].next(data);
        });
      }
    }
    return this.events[eventName].asObservable();
  }
}
