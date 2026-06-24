import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-fleet-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fleet-performance.component.html',
  styleUrl: './fleet-performance.component.scss'
})
export class FleetPerformanceComponent implements OnInit, AfterViewInit {

  @ViewChild('prodChart') prodChart!: ElementRef;
  @ViewChild('compChart') compChart!: ElementRef;
  @ViewChild('cycleChart') cycleChart!: ElementRef;

  kpis = {
    activeDumpers: 12,
    totalTrips: 345,
    totalQuantity: '38,400',
    avgCycleTime: '11.4',
    utilization: '92%'
  };

  fleetData = [
    { rank: 1, dumper: 'DMP-07', driver: 'Arjun Singh', trips: 42, bcm: '4,250', cycle: '10.8', dist: '8.4', prod: '101' },
    { rank: 2, dumper: 'DMP-12', driver: 'David Richards', trips: 38, bcm: '3,800', cycle: '11.1', dist: '7.6', prod: '100' },
    { rank: 3, dumper: 'DMP-03', driver: 'Vikram Mehta', trips: 35, bcm: '3,500', cycle: '11.2', dist: '7.0', prod: '100' },
    { rank: 4, dumper: 'DMP-15', driver: 'Sanjay Kumar', trips: 34, bcm: '3,380', cycle: '11.5', dist: '6.8', prod: '99' },
    { rank: 5, dumper: 'DMP-09', driver: 'John Doe', trips: 27, bcm: '2,650', cycle: '13.5', dist: '5.4', prod: '98' }
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initCharts();
  }

  initCharts(): void {
    const commonOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } },
        y: { grid: { color: '#f3f4f6' }, border: { dash: [4, 4] }, ticks: { font: { size: 10 }, color: '#9ca3af' }, beginAtZero: true }
      }
    };

    // Chart 1: Productivity Trend
    new Chart(this.prodChart.nativeElement.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM'],
        datasets: [{
          label: 'BCM Moved',
          data: [1200, 2400, 3100, 2800, 3400, 4200],
          backgroundColor: '#468faf',
          borderRadius: 4
        }]
      },
      options: commonOptions
    });

    // Chart 2: Dumper Comparison
    new Chart(this.compChart.nativeElement.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['DMP-07', 'DMP-12', 'DMP-03', 'DMP-15', 'DMP-09'],
        datasets: [{
          label: 'Total Quantity (BCM)',
          data: [4250, 3800, 3500, 3380, 2650],
          backgroundColor: '#6366f1',
          borderRadius: 4
        }]
      },
      options: commonOptions
    });

    // Chart 3: Cycle Time Analysis
    new Chart(this.cycleChart.nativeElement.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['DMP-07', 'DMP-12', 'DMP-03', 'DMP-15', 'DMP-09'],
        datasets: [{
          label: 'Avg Cycle Time (Mins)',
          data: [10.8, 11.1, 11.2, 11.5, 13.5],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          fill: true,
          tension: 0.4
        }]
      },
      options: commonOptions
    });
  }
}
