import { Component, OnInit, OnDestroy, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryDataService, WaterLevelReading } from '../../services/telemetry-data/telemetry-data.service';
import { TELEMETRY_CONFIG, TelemetryConfig } from '../../app.config';
import { Subscription } from 'rxjs';

import { MetricCardComponent } from '../metric-card/metric-card.component';
import { TelemetryChartComponent } from '../telemetry-chart/telemetry-chart.component';
import { TankVisualizerComponent } from '../tank-visualizer/tank-visualizer.component';
import { TelemetrySimulatorComponent } from '../telemetry-simulator/telemetry-simulator.component';
import { TelemetryLogTableComponent } from '../telemetry-log-table/telemetry-log-table.component';

@Component({
  selector: 'app-monitor-dashboard',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MetricCardComponent,
    TelemetryChartComponent,
    TankVisualizerComponent,
    TelemetrySimulatorComponent,
    TelemetryLogTableComponent
  ],
  templateUrl: './monitor-dashboard.component.html',
  styleUrls: ['./monitor-dashboard.component.css']
})
export class MonitorDashboardComponent implements OnInit, OnDestroy {
  readings: WaterLevelReading[] = [];
  stats = { current: 0, min: 0, max: 0, avg: 0 };
  isAlertActive = false;
  connectionStatus: 'connected' | 'disconnected' = 'disconnected';

  private telemetrySub?: Subscription;
  private historySub?: Subscription;
  private statusSub?: Subscription;

  constructor(
    private telemetryData: TelemetryDataService,
    @Inject(TELEMETRY_CONFIG) public config: TelemetryConfig
  ) {}

  ngOnInit(): void {
    this.statusSub = this.telemetryData.connectionStatus$.subscribe(
      (status: 'connected' | 'disconnected') => {
        this.connectionStatus = status;
        if (status === 'disconnected') {
          this.isAlertActive = false;
        }
      }
    );

    this.historySub = this.telemetryData.history$.subscribe(
      (history: WaterLevelReading[]) => {
        this.readings = [...history];
        this.updateDashboard();
      }
    );

    this.telemetrySub = this.telemetryData.telemetry$.subscribe(
      (reading: WaterLevelReading | null) => {
        if (reading) {
          this.readings.push(reading);
          if (this.readings.length > this.config.maxHistoryLength) {
            this.readings.shift();
          }
          this.updateDashboard();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.telemetrySub?.unsubscribe();
    this.historySub?.unsubscribe();
    this.statusSub?.unsubscribe();
  }

  private updateDashboard(): void {
    if (this.readings.length === 0) {
      this.stats = { current: 0, min: 0, max: 0, avg: 0 };
      this.isAlertActive = false;
      return;
    }

    const currentReading = this.readings[this.readings.length - 1];
    const levels = this.readings.map(r => r.waterLevelPercentage);
    
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const avg = levels.reduce((sum, val) => sum + val, 0) / levels.length;

    this.stats = {
      current: currentReading.waterLevelPercentage,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100
    };

    this.isAlertActive = currentReading.waterLevelPercentage > this.config.safetyThreshold;
  }
}
