import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tank-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card tank-card">
      <div class="tank-header">
        <span class="tag">PHYSICAL METRICS</span>
        <h3>Fluid Containment</h3>
      </div>
      
      <div class="tank-3d-wrapper">
        <div class="tank-visualizer-container" [class.alert-active]="isAlertActive">
          <div class="tank-reflection"></div>
          
          <div class="tank-ruler">
            <div class="ruler-tick" style="bottom: 100%"><span class="tick-label">100%</span></div>
            <div class="ruler-tick" style="bottom: 80%"><span class="tick-label">80%</span></div>
            <div class="ruler-tick" style="bottom: 60%"><span class="tick-label">60%</span></div>
            <div class="ruler-tick" style="bottom: 40%"><span class="tick-label">40%</span></div>
            <div class="ruler-tick" style="bottom: 20%"><span class="tick-label">20%</span></div>
            <div class="ruler-tick" style="bottom: 0%"><span class="tick-label">0%</span></div>
          </div>
          
          <div class="tank-fill-container" [style.height.%]="currentLevel">
            <div class="tank-wave wave-back"></div>
            <div class="tank-wave wave-front"></div>
            
            <div class="bubble bubble-1"></div>
            <div class="bubble bubble-2"></div>
            <div class="bubble bubble-3"></div>
            <div class="bubble bubble-4"></div>
            <div class="bubble bubble-5"></div>
            
            <span class="tank-label-digital">{{ currentLevel | number:'1.1-1' }}%</span>
          </div>

          <div class="tank-safety-laser" [class.laser-glowing]="currentLevel > safetyThreshold" [style.bottom.%]="safetyThreshold"></div>
        </div>
      </div>

      <div class="tank-info">
        <div class="info-id">
          <span class="material-symbols-outlined icon-unit">settings_input_component</span>
          <h4>{{ tankId }}</h4>
        </div>
        <p class="unit-type">Cellulose Mixing Unit 01-A</p>
      </div>
    </div>
  `
})
export class TankVisualizerComponent {
  @Input() currentLevel: number = 0;
  @Input() isAlertActive: boolean = false;
  @Input() tankId: string = '';
  @Input() safetyThreshold: number = 85.0;
}
