import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LogReading {
  tankId: string;
  waterLevelPercentage: number;
  timestampUtc: string;
}

@Component({
  selector: 'app-telemetry-log-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card readings-card">
      <div class="card-header-accent">
        <span class="material-symbols-outlined header-icon">wysiwyg</span>
        <div class="header-titles">
          <h3>Ingestion Operations Log</h3>
          <p>LIFO queue stream displaying last {{ maxHistoryLength }} ingestion events</p>
        </div>
      </div>
      
      <div class="table-responsive-premium">
        <table class="readings-table-premium">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Unit ID</th>
              <th>Water Level</th>
              <th>Safety State</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of readings.slice().reverse(); let first = first" [class.new-row-highlight]="first">
              <td class="td-timestamp-premium">
                <span class="material-symbols-outlined clock-icon">schedule</span>
                {{ r.timestampUtc | date:'HH:mm:ss.SSS' }}
              </td>
              <td class="td-tank-premium">{{ r.tankId }}</td>
              <td class="td-level-premium">{{ r.waterLevelPercentage | number:'1.2-2' }}%</td>
              <td>
                <span class="badge-premium" 
                      [class.status-ok]="r.waterLevelPercentage < warningThreshold"
                      [class.status-warn]="r.waterLevelPercentage >= warningThreshold && r.waterLevelPercentage <= safetyThreshold"
                      [class.status-critical]="r.waterLevelPercentage > safetyThreshold">
                  <span class="badge-dot"></span>
                  {{ r.waterLevelPercentage > safetyThreshold ? 'Critical' : (r.waterLevelPercentage >= warningThreshold ? 'Warning' : 'Optimal') }}
                </span>
              </td>
            </tr>
            <tr *ngIf="readings.length === 0">
              <td colspan="4" class="no-data-cell">
                <div class="no-data-wrapper">
                  <span class="material-symbols-outlined no-data-icon">cloud_sync</span>
                  <p>Awaiting live telemetry packet feed...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TelemetryLogTableComponent {
  @Input() readings: LogReading[] = [];
  @Input() maxHistoryLength: number = 20;
  @Input() safetyThreshold: number = 85.0;
  @Input() warningThreshold: number = 70.0;
}
