import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-new',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-new.component.html',
  styleUrl: './dashboard-new.component.scss',
  animations: [
    trigger('succesfullyMesaage', [
      state(
        'void',
        style({
          transform: 'translateX(-30%)',
          opacity: 0,
        }),
      ),
      transition(':enter, :leave', [
        animate('0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'),
      ]),
    ]),
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            transform: 'translateX(0)',
            opacity: 1,
          }),
        ),
      ]),
    ]),
  ],
})
export class DashboardNewComponent implements OnInit {
  openSecondsuccess = false;
  name: string | null = '';
  firstlogin: boolean | undefined;

  constructor(
    private route: ActivatedRoute,
    private jwtService: JwtService,
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.firstlogin = this.jwtService.getfirstLoggedIn();
      if (this.firstlogin === false || this.firstlogin === undefined) {
        if (params['success'] === 'true') {
          this.openSecondsuccess = true;
          this.jwtService.firstLoggedIn(true);
          setTimeout(() => {
            this.openSecondsuccess = false;
          }, 1800);
        }
      }
    });
  }

  userRole: any;
  ngOnInit(): void {
    this.name = this.jwtService.getName();
    this.userRole = this.jwtService.getadmiRole();
    setTimeout(() => {
      this.initProductionChart();
      this.initObProgressChart();
      this.initShiftDelayChart();
    }, 100);
  }

  initProductionChart() {
    const ctx = document.getElementById('productionChart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        datasets: [
          {
            label: 'Actual',
            data: [35000, 32000, 38000, 28000, 40000, 18000, 34000],
            backgroundColor: '#0f2a4a',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Target',
            data: [37000, 34000, 36000, 33000, 38000, 30000, 36000],
            backgroundColor: '#e5e7eb',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }

  initObProgressChart() {
    const ctx = document.getElementById('obProgressChart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Reached', 'Remaining'],
        datasets: [{
          data: [78, 22],
          backgroundColor: ['#0f2a4a', '#f3f4f6'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true }
      }
    });
  }

  initShiftDelayChart() {
    const ctx = document.getElementById('shiftDelayChart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Meal/Rest', 'Refueling', 'Unplanned'],
        datasets: [{
          data: [58, 42, 24],
          backgroundColor: ['#1e3a8a', '#6b7280', '#dc2626'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}
