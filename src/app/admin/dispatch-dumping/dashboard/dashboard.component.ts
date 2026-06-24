import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('productivityChart') productivityChart!: ElementRef;
  chartInstance: any;

  kpis = {
    totalTrips: 142,
    totalQuantity: '12,400',
    avgCycleTime: '11.4',
    activeDumpers: 12
  };

  topDumpers = [
    { id: 'DMP-07', trips: 42, quantity: '4,250', avgCycle: '10.8' },
    { id: 'DMP-12', trips: 38, quantity: '3,800', avgCycle: '11.1' },
    { id: 'DMP-03', trips: 35, quantity: '3,500', avgCycle: '11.2' },
    { id: 'DMP-09', trips: 27, quantity: '850', avgCycle: '13.5' }
  ];

  recentTrips = [
    { ref: 'TRP-2026-001245', dumper: 'DMP-07', driver: 'Arjun Singh', excavator: 'EXC-101', quantity: '120', status: 'COMPLETED', time: '10 mins ago' },
    { ref: 'TRP-2026-001246', dumper: 'DMP-12', driver: 'David Richards', excavator: 'EXC-101', quantity: '115', status: 'COMPLETED', time: '15 mins ago' },
    { ref: 'TRP-2026-001247', dumper: 'DMP-03', driver: 'Vikram Mehta', excavator: 'EXC-102', quantity: '110', status: 'COMPLETED', time: '22 mins ago' },
    { ref: 'TRP-2026-001248', dumper: 'DMP-09', driver: 'John Doe', excavator: 'EXC-102', quantity: '105', status: 'LOGGED', time: '28 mins ago' }
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initChart();
  }

  initChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.productivityChart.nativeElement.getContext('2d');
    
    // Gradient for the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(70, 143, 175, 0.5)'); // #468faf with opacity
    gradient.addColorStop(1, 'rgba(70, 143, 175, 0.0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM'],
        datasets: [{
          label: 'Material Moved (BCM)',
          data: [0, 850, 1400, 1650, 2100, 2800, 2400, 1200],
          borderColor: '#468faf',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#468faf',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleFont: { size: 12 },
            bodyFont: { size: 13, weight: 'bold' },
            padding: 10,
            cornerRadius: 4,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 10, family: "'Inter', sans-serif" },
              color: '#9ca3af'
            }
          },
          y: {
            grid: {
              color: '#f3f4f6',
            },
            border: {
              dash: [4, 4]
            },
            ticks: {
              font: { size: 10, family: "'Inter', sans-serif" },
              color: '#9ca3af',
              stepSize: 1000
            },
            beginAtZero: true
          }
        }
      }
    });
  }
}
