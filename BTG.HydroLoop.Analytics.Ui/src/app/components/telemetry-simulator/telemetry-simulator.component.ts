import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TelemetrySimulatorService } from '../../services/telemetry-simulator/telemetry-simulator.service';

@Component({
  selector: 'app-telemetry-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card simulator-card">
      <div class="card-header-accent">
        <span class="material-symbols-outlined header-icon">terminal</span>
        <div class="header-titles">
          <h3>Telemetry Command Deck</h3>
          <p>Inject mock sensor levels and toggle auto-pilot algorithms</p>
        </div>
      </div>
      
      <div class="simulator-controls">
        <div class="controls-split">
          <div class="form-group glass-input-group">
            <label>Target Tank Identifier</label>
            <div class="input-wrapper">
              <span class="material-symbols-outlined input-icon">badge</span>
              <input type="text" [(ngModel)]="simulatedTankId" class="glass-input" />
            </div>
          </div>

          <div class="simulation-mode-panel">
            <div class="simulation-mode-label">
              <h5>Simulated Auto-Pilot</h5>
              <p>Triggers continuous telemetry oscillation and threshold tests</p>
            </div>
            <div class="pilot-toggle-wrapper">
              <span class="pilot-status-indicator" [class.indicator-active]="isAutoSimulating">
                {{ isAutoSimulating ? 'AUTOPILOT' : 'STANDBY' }}
              </span>
              <label class="switch-premium">
                <input type="checkbox" [checked]="isAutoSimulating" (change)="toggleAutoSimulation()" />
                <span class="slider-premium"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-group range-control-group">
          <div class="range-labels">
            <label>Mock Ingestion Level</label>
            <span class="range-value-glow" [class.range-danger]="simulatedLevel > safetyThreshold" [class.range-warning]="simulatedLevel >= warningThreshold && simulatedLevel <= safetyThreshold">
              {{ simulatedLevel | number:'1.1-1' }}%
            </span>
          </div>
          <div class="range-input-container-premium">
            <span class="range-limit">0%</span>
            <div class="slider-track-wrapper">
              <input type="range" min="0" max="100" step="0.5" [(ngModel)]="simulatedLevel" class="premium-slider" />
              <div class="slider-zones">
                <span class="zone-normal"></span>
                <span class="zone-warning"></span>
                <span class="zone-danger"></span>
              </div>
            </div>
            <span class="range-limit">100%</span>
          </div>
        </div>

        <div class="simulator-actions">
          <button (click)="pushMockTelemetry()" class="btn-premium" [class.btn-alert]="simulatedLevel > safetyThreshold">
            <span class="material-symbols-outlined btn-icon">publish</span>
            <span>Push Simulated Telemetry Point</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class TelemetrySimulatorComponent implements OnDestroy {
  @Input() safetyThreshold: number = 85.0;
  @Input() warningThreshold: number = 70.0;
  @Input() simulatorUpdateIntervalMs: number = 2000;
  @Input() minBound: number = 55;
  @Input() maxBound: number = 95;

  simulatedTankId = 'Tank-BTG-01';
  simulatedLevel = 78.5;
  isAutoSimulating = false;
  private autoSimInterval?: any;

  constructor(private simulatorService: TelemetrySimulatorService) {}

  pushMockTelemetry(): void {
    const mock = {
      tankId: this.simulatedTankId,
      waterLevelPercentage: Number(this.simulatedLevel),
      timestampUtc: Math.floor(Date.now() / 1000)
    };

    this.simulatorService.pushMockTelemetry(mock).subscribe({
      next: (res: any) => console.log('Simulated telemetry pushed:', res),
      error: (err: any) => console.error('Failed to push simulated telemetry:', err)
    });
  }

  toggleAutoSimulation(): void {
    this.isAutoSimulating = !this.isAutoSimulating;
    if (this.isAutoSimulating) {
      this.startAutoSimulation();
    } else {
      this.stopAutoSimulation();
    }
  }

  private startAutoSimulation(): void {
    let currentLevel = Number(this.simulatedLevel);

    this.autoSimInterval = setInterval(() => {
      const drift = (Math.random() - 0.5) * 2.0; 
      const forceAlertChance = Math.random() < 0.15; 
      
      if (forceAlertChance) {
        currentLevel += 3.5; 
      } else {
        currentLevel += drift;
      }

      if (currentLevel < this.minBound) currentLevel = this.minBound + Math.random() * 5;
      if (currentLevel > this.maxBound) currentLevel = this.maxBound - Math.random() * 5;

      this.simulatedLevel = Math.round(currentLevel * 10) / 10;
      this.pushMockTelemetry();
    }, this.simulatorUpdateIntervalMs);
  }

  private stopAutoSimulation(): void {
    if (this.autoSimInterval) {
      clearInterval(this.autoSimInterval);
      this.autoSimInterval = undefined;
    }
    this.isAutoSimulating = false;
  }

  ngOnDestroy(): void {
    this.stopAutoSimulation();
  }
}
