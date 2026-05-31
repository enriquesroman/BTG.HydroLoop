import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartReading {
  waterLevelPercentage: number;
  timestampUtc: string;
}

interface ChartPoint {
  x: number;
  y: number;
  reading: ChartReading;
  isCritical: boolean;
}

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telemetry-chart.component.html'
})
export class TelemetryChartComponent implements OnChanges {
  @Input() readings: ChartReading[] = [];
  @Input() isAlertActive: boolean = false;
  @Input() safetyThreshold: number = 85.0;

  readonly svgWidth = 800;
  readonly svgHeight = 300;
  readonly padding = { top: 30, right: 40, bottom: 45, left: 60 };
  
  yGridLevels = [0, 20, 40, 60, 80, 100];
  xGridLines: number[] = [];

  chartPoints: ChartPoint[] = [];
  linePath = '';
  areaPath = '';
  thresholdY = 0;

  tooltip = {
    show: false,
    x: 0,
    y: 0,
    value: 0,
    time: '',
    isCritical: false
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readings'] || changes['safetyThreshold']) {
      this.calculateThresholdY();
      this.generateChartPaths();
    }
  }

  private calculateThresholdY(): void {
    const chartHeight = this.svgHeight - this.padding.top - this.padding.bottom;
    this.thresholdY = this.padding.top + chartHeight - (this.safetyThreshold / 100.0) * chartHeight;
  }

  private generateChartPaths(): void {
    if (!this.readings || this.readings.length === 0) {
      this.linePath = '';
      this.areaPath = '';
      this.chartPoints = [];
      return;
    }

    const n = this.readings.length;
    const chartWidth = this.svgWidth - this.padding.left - this.padding.right;
    const chartHeight = this.svgHeight - this.padding.top - this.padding.bottom;

    this.chartPoints = this.readings.map((reading, i) => {
      const x = this.padding.left + (n > 1 ? (i / (n - 1)) : 0.5) * chartWidth;
      const y = this.padding.top + chartHeight - (reading.waterLevelPercentage / 100.0) * chartHeight;
      
      return {
        x,
        y,
        reading,
        isCritical: reading.waterLevelPercentage > this.safetyThreshold
      };
    });

    this.xGridLines = this.chartPoints.map(p => p.x);

    if (this.chartPoints.length > 0) {
      let path = `M ${this.chartPoints[0].x} ${this.chartPoints[0].y}`;
      for (let i = 0; i < this.chartPoints.length - 1; i++) {
        const p0 = this.chartPoints[i];
        const p1 = this.chartPoints[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
      this.linePath = path;

      const baselineY = this.padding.top + chartHeight;
      const firstX = this.chartPoints[0].x;
      const lastX = this.chartPoints[this.chartPoints.length - 1].x;
      this.areaPath = `M ${firstX} ${baselineY} ${this.linePath.substring(1)} L ${lastX} ${baselineY} Z`;
    } else {
      this.linePath = '';
      this.areaPath = '';
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getGridY(level: number): number {
    const chartHeight = this.svgHeight - this.padding.top - this.padding.bottom;
    return this.padding.top + chartHeight - (level / 100.0) * chartHeight;
  }

  showPointTooltip(event: MouseEvent, point: ChartPoint): void {
    this.tooltip = {
      show: true,
      x: point.x,
      y: point.y,
      value: point.reading.waterLevelPercentage,
      time: this.formatTime(point.reading.timestampUtc),
      isCritical: point.isCritical
    };
  }

  hidePointTooltip(): void {
    this.tooltip.show = false;
  }
}
