import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card stat-card" [ngClass]="{'hero-stat': isHero, 'critical': isCritical && isHero, 'warning': isWarning && isHero}">
      <ng-container *ngIf="isHero; else standardCard">
        <div class="stat-content">
          <div class="stat-info">
            <span class="stat-label">{{ label }}</span>
            <div class="stat-value">
              {{ value }}<span class="unit">{{ unit }}</span>
            </div>
            <div class="stat-trend-badge" 
                 [class.danger-badge]="isCritical" 
                 [class.warning-badge]="isWarning" 
                 [class.safe-badge]="isSafe">
              <span class="material-symbols-outlined">
                {{ isCritical ? 'error' : (isWarning ? 'warning' : 'check_circle') }}
              </span>
              <span>
                {{ isCritical ? 'High Alarm Level' : (isWarning ? 'Warning Range' : 'Optimal Level') }}
              </span>
            </div>
          </div>
          
          <div class="gauge-container">
            <svg class="radial-gauge" viewBox="0 0 120 120">
              <circle class="gauge-track" cx="60" cy="60" r="50" fill="none" stroke-width="8"></circle>
              <circle class="gauge-indicator" 
                      [attr.stroke]="isCritical ? 'var(--accent-red)' : (isWarning ? 'var(--accent-orange)' : 'var(--accent-cyan)')" 
                      cx="60" cy="60" r="50" fill="none" stroke-width="8"
                      stroke-dasharray="314.16" 
                      [attr.stroke-dashoffset]="314.16 - (value / 100) * 314.16"
                      transform="rotate(-90 60 60)"
                      stroke-linecap="round"></circle>
              <text class="gauge-center-text" x="60" y="66" text-anchor="middle">
                {{ value }}%
              </text>
            </svg>
          </div>
        </div>
      </ng-container>

      <ng-template #standardCard>
        <div class="stat-header">
          <div class="icon-box" [ngClass]="iconClass">
            <span class="material-symbols-outlined">{{ icon }}</span>
          </div>
          <span class="stat-label">{{ label }}</span>
        </div>
        <div class="stat-value" [class.text-danger]="isCritical">
          {{ value }}<span class="unit">{{ unit }}</span>
        </div>
        <div class="stat-footer">
          <span class="caption" [class.text-danger]="isCritical">
            {{ caption }}
          </span>
        </div>
      </ng-template>
      <div class="card-glow"></div>
    </div>
  `
})
export class MetricCardComponent {
  @Input() label!: string;
  @Input() value!: number;
  @Input() unit: string = '%';
  @Input() isHero: boolean = false;
  @Input() icon: string = 'analytics';
  @Input() iconClass: string = '';
  @Input() caption: string = '';
  @Input() isCritical: boolean = false;
  @Input() isWarning: boolean = false;

  get isSafe(): boolean {
    return !this.isCritical && !this.isWarning;
  }
}
