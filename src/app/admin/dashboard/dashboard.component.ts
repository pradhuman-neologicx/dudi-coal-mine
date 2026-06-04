import { Component, OnInit, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
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
export class DashboardComponent implements OnInit, OnDestroy {
  openSecondsuccess = false;
  name: string | null = '';
  firstlogin: boolean | undefined;
  userRole: any;

  // Live Clock & Shift State
  loading = false;
  currentTime: Date = new Date();
  currentShift = 'Morning Shift';
  private clockInterval: any;

  // STRICTLY ALIGNED METRICS (Exclusively matches actual sidebar components)
  metrics = {
    workforce: { // employee-management
      total: 180,
      active: 142,
      attendanceRate: 79 // attendance-management
    },
    leaves: { // leave-management
      pending: 4,
      approvedThisMonth: 28,
      rejectedThisMonth: 2
    },
    shifts: { // shift-management
      currentName: 'Shift A (Morning)',
      allocatedEmployees: 72,
      progress: 65,
      nextShift: 'Shift B (Afternoon) at 02:00 PM'
    },
    fleet: { // vehicle-management
      vehiclesActive: 22,
      vehiclesTotal: 26
    },
    fuel: { // fuel module
      fuelAlerts: 2,
      avgConsumption: '480L/day',
      refuelingsToday: 8,
      activeStations: 2
    },
    payroll: { // payroll-management
      currentMonth: 'May 2026',
      totalDisbursed: '₹18.4L',
      status: '92% Disbursed',
      pendingProcessing: 8
    },
    inventory: { // inventory-management
      totalItems: '681.3K Units',
      totalProducts: 10,
      totalCategories: 5,
      lowStockAlerts: 3,
      criticalItems: [
        { name: 'WATER PURIFIER', stock: 1, category: 'CIVIL WORK' },
        { name: 'WELDING ELECTRODES', stock: 1, category: 'IRP' },
        { name: 'WIRE BRUSH', stock: 2, category: 'MISC' }
      ],
      assignments: [
        { id: 1, productName: 'SAND', quantity: 500, employeeName: 'Ramesh Kumar', site: 'East Mine', dept: 'Excavation', date: 'May 27' },
        { id: 2, productName: 'WIRE BRUSH', quantity: 1, employeeName: 'Sanjay Sharma', site: 'East Mine', dept: 'Safety', date: 'May 26' },
        { id: 3, productName: 'WIRE 1.50 MM', quantity: 130, employeeName: 'Vijay Yadav', site: 'West Mine', dept: 'Maintenance', date: 'May 25' }
      ]
    },
    training: { // training-management
      activePrograms: 3,
      enrolledEmployees: 45,
      completionRate: 88,
      upcomingSession: 'Safety & Compliance Training on June 2nd'
    },
    alerts: [
      { id: 1, type: 'warning', message: 'Inventory Alert: Safety Helmets below threshold limit', time: '10 mins ago', icon: 'fa-box-open' },
      { id: 2, type: 'danger', message: 'Fuel Alert: Loader L-204 fuel level below 15%', time: '25 mins ago', icon: 'fa-gas-pump' },
      { id: 3, type: 'info', message: 'Leave Request: 4 new applications pending approval', time: '1 hour ago', icon: 'fa-envelope-open-text' },
      { id: 4, type: 'success', message: 'Shift A complete: Operational logs submitted', time: '2 hours ago', icon: 'fa-file-signature' }
    ]
  };

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

  ngOnInit(): void {
    this.name = this.jwtService.getName();
    this.userRole = this.jwtService.getadmiRole();

    // Start Live Clock
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);

    // Fetch actual API data
    // this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateClock() {
    this.currentTime = new Date();
    const hours = this.currentTime.getHours();

    // Shift boundaries
    if (hours >= 6 && hours < 14) {
      this.currentShift = 'Shift A (Morning)';
      this.metrics.shifts.currentName = 'Shift A (Morning)';
      this.metrics.shifts.progress = Math.round(((hours - 6) / 8) * 100);
      this.metrics.shifts.nextShift = 'Shift B (Afternoon) at 02:00 PM';
    } else if (hours >= 14 && hours < 22) {
      this.currentShift = 'Shift B (Afternoon)';
      this.metrics.shifts.currentName = 'Shift B (Afternoon)';
      this.metrics.shifts.progress = Math.round(((hours - 14) / 8) * 100);
      this.metrics.shifts.nextShift = 'Shift C (Night) at 10:00 PM';
    } else {
      this.currentShift = 'Shift C (Night)';
      this.metrics.shifts.currentName = 'Shift C (Night)';
      const nightHours = hours >= 22 ? hours - 22 : hours + 2;
      this.metrics.shifts.progress = Math.round((nightHours / 8) * 100);
      this.metrics.shifts.nextShift = 'Shift A (Morning) at 06:00 AM';
    }
  }

  loadDashboardData() {
    this.loading = true;
    this.employeeService.GetDashboardData().subscribe({
      next: (response: any) => {
        console.log('Dashboard summary data loaded:', response);
        if (response) {
          // Map workforce metrics
          if (response.total_employees) {
            this.metrics.workforce.total = response.total_employees;
          }
          if (response.active_employees || response.present_today) {
            this.metrics.workforce.active = response.active_employees || response.present_today;
          }
          if (response.total_employees > 0) {
            this.metrics.workforce.attendanceRate = Math.round((this.metrics.workforce.active / this.metrics.workforce.total) * 100);
          }

          // Map pending leaves
          if (response.pending_leaves !== undefined) {
            this.metrics.leaves.pending = response.pending_leaves;
          }

          // Map shift allocations
          if (response.shift_allocated_employees) {
            this.metrics.shifts.allocatedEmployees = response.shift_allocated_employees;
          }

          // Map vehicle/equipment status
          if (response.active_vehicles) {
            this.metrics.fleet.vehiclesActive = response.active_vehicles;
          }
          if (response.total_vehicles) {
            this.metrics.fleet.vehiclesTotal = response.total_vehicles;
          }

          // Map payroll details
          if (response.payroll_disbursed_percent) {
            this.metrics.payroll.status = `${response.payroll_disbursed_percent}% Disbursed`;
          }
          if (response.total_payroll_disbursed) {
            this.metrics.payroll.totalDisbursed = response.total_payroll_disbursed;
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.warn('Dashboard summary API failed or offline. Operating in pure client-module alignment.', error);
        this.loading = false;
      }
    });
  }

  refreshDashboard() {
    this.loadDashboardData();
  }
}
