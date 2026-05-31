import { Component } from '@angular/core';
import { MonitorDashboardComponent } from './components/monitor-dashboard/monitor-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MonitorDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Main Application Component
}
