import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { LeaveTypeService } from 'src/app/core/services/leave-type.service';
import { LeaveManagementService } from 'src/app/core/services/leave-management.service';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface LeaveRequest {
  id: string;
  empId: string;
  empName: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: 'Pending Supervisor' | 'Pending PM' | 'Pending HR' | 'Approved' | 'Rejected';
  appliedDate: string;
  comments?: string;
}

interface LeaveBalance {
  empId: string;
  empName: string;
  casual: { total: number, consumed: number };
  sick: { total: number, consumed: number };
  paid: { total: number, consumed: number };
  unpaid: { total: number, consumed: number };
}

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './leave-management.component.html',
  styleUrl: './leave-management.component.scss',
  providers: [DatePipe]
})
export class LeaveManagementComponent implements OnInit, OnDestroy {
  activeTab: 'apply' | 'inbox' | 'balances' | 'history' = 'apply';
  simulatedRole: 'Supervisor' | 'Project Manager' | 'HR' = 'Supervisor';

  employees: any[] = [];
  leaveRequests: LeaveRequest[] = [];
  leaveBalances: LeaveBalance[] = [];
  leaveTypes: any[] = [];
  private destroy$ = new Subject<void>();

  leaveApplyForm: FormGroup;
  pInbox: number = 1;
  pHistory: number = 1;
  pBalances: number = 1;

  showEntries: number = 10;
  searchText: string = '';
  filterMonth: string = '';
  filterYear: string = '';
  filterStage: string = '';
  filterEmployee: string = '';
  dateValue: string = '';

  setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>) {
    this.filterYear = normalizedMonthAndYear.getFullYear().toString();
    this.filterMonth = (normalizedMonthAndYear.getMonth() + 1).toString().padStart(2, '0');
    this.dateValue = `${this.filterMonth}/${this.filterYear}`;
    
    // Yahan hum payload bana rahe hain jo backend ko bheja ja sakta hai
    const payload = {
      month: this.filterMonth,
      year: this.filterYear
    };
    console.log("Calendar Payload ->", payload);
    
    datepicker.close();
    
    // Backend API trigger karein
    this.loadLeaveRequests();
  }

  viewLeaveOpen: boolean = false;
  selectedLeave: LeaveRequest | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private datePipe: DatePipe,
    private leaveTypeService: LeaveTypeService,
    private leaveManagementService: LeaveManagementService,
    private employeeService: EmployeeService
  ) {
    this.leaveApplyForm = this.fb.group({
      empId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      leaveType: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadLeaveTypes();
    this.loadLeaveRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees() {
    this.leaveManagementService.getEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let rawData: any[] = [];
        if (res && (res.status === 'success' || res.data || res.status === 200)) {
          rawData = res.data?.data || res.data || res;
        } else if (Array.isArray(res)) {
          rawData = res;
        }
        
        if (Array.isArray(rawData)) {
          this.employees = rawData.map((emp: any) => {
            const id = emp.id || emp.user_id;
            const name = emp.name || (emp.first_name ? (emp.first_name + ' ' + (emp.last_name || '')) : 'Unknown');
            const code = emp.employee_code || id;
            return {
              ...emp,
              id: id,
              name: name,
              displayName: `${name} (${code})`
            };
          });
        } else {
          this.employees = [];
        }
        
        this.initializeLeaveBalances();
      },
      error: () => {
        this.employees = [];
        this.initializeLeaveBalances();
      }
    });
  }

  loadLeaveTypes() {
    this.leaveTypeService.getLeaveTypes('all', 1, '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.status === 'success') {
          this.leaveTypes = res.data;
        }
      },
      error: (err) => console.error('Failed to load leave types', err)
    });
  }

  loadLeaveRequests() {
    let month_year = '';
    if (this.filterYear && this.filterMonth) {
      month_year = `${this.filterYear}-${this.filterMonth}`;
    }

    const filters = {
      employee_id: this.filterEmployee || '',
      status: this.filterStage === 'Pending' ? 'pending' : (this.filterStage.toLowerCase() || ''),
      month_year: month_year
    };

    this.leaveManagementService.getLeaves('all', 1, this.searchText, filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let rawData: any[] = [];
        if (res && (res.status === 'success' || res.status === 200 || res.data)) {
          rawData = res.data?.data || res.data || [];
        } else if (Array.isArray(res)) {
          rawData = res;
        }

        if (Array.isArray(rawData)) {
          this.leaveRequests = rawData.map((item: any) => ({
            id: item.id || `LR${Math.floor(Math.random() * 1000)}`,
            empId: item.employee_id || item.employee?.employee_code || item.employee?.id || 'Unknown',
            empName: item.employee_name || item.employee?.name || (item.employee?.first_name ? item.employee.first_name + ' ' + (item.employee.last_name || '') : 'Unknown Name'),
            startDate: item.from_date || item.start_date,
            endDate: item.to_date || item.end_date,
            leaveType: item.leave_type_name || item.leave_type?.name || item.leave_type || 'Leave',
            reason: item.reason || '',
            status: this.mapApiStatus(item.status),
            appliedDate: item.created_at || new Date().toISOString(),
            comments: item.remark || item.comments || ''
          }));
        } else {
          this.leaveRequests = [];
        }
      },
      error: (err) => console.error('Failed to load leave requests', err)
    });
  }

  mapApiStatus(status: any): 'Pending Supervisor' | 'Pending PM' | 'Pending HR' | 'Approved' | 'Rejected' {
    if (!status && status !== 0) return 'Pending Supervisor';
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'pending') return 'Pending Supervisor';
    if (s === '1' || s === 'approved') return 'Approved';
    if (s === '2' || s === 'rejected') return 'Rejected';
    return 'Pending Supervisor';
  }

  initializeLeaveBalances() {
    // Create initial default balances or fetch from API if available
    this.leaveBalances = this.employees.map(emp => ({
      empId: emp.id || emp.user_id,
      empName: emp.name || (emp.first_name + ' ' + (emp.last_name || '')),
      casual: { total: 12, consumed: 0 },
      sick: { total: 10, consumed: 0 },
      paid: { total: 15, consumed: 0 },
      unpaid: { total: 99, consumed: 0 } 
    }));
  }

  getOffsetDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return this.datePipe.transform(d, 'yyyy-MM-dd') || '';
  }

  saveToStorage() {
    localStorage.setItem('leave_requests', JSON.stringify(this.leaveRequests));
    localStorage.setItem('leave_balances', JSON.stringify(this.leaveBalances));
  }

  getLeaveDays(start: string | undefined | null, end: string | undefined | null): number {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  submitLeaveRequest() {
    if (this.leaveApplyForm.invalid) {
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const { empId, startDate, endDate, leaveType, reason } = this.leaveApplyForm.value;

    // Validate Dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      this.notificationService.show('End date cannot be earlier than start date.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('employee_id', empId);
    formData.append('leave_type_id', leaveType);
    formData.append('from_date', this.datePipe.transform(startDate, 'yyyy-MM-dd')!);
    formData.append('to_date', this.datePipe.transform(endDate, 'yyyy-MM-dd')!);
    formData.append('reason', reason);

    this.leaveManagementService.applyLeave(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 'success' || res.status === 200 || res.status === 201) {
          this.notificationService.show('Leave request submitted successfully.', 'success', 3000);
          this.leaveApplyForm.reset();
          // Optionally, reload leave history or inbox here
        } else {
          this.notificationService.show(res.message || 'Failed to submit leave request.', 'error', 3000);
        }
      },
      error: (err) => {
        this.notificationService.show('Failed to submit leave request.', 'error', 3000);
      }
    });
  }

  getBalanceKey(type: string): 'casual' | 'sick' | 'paid' | 'unpaid' {
    switch (type) {
      case 'Casual Leave': return 'casual';
      case 'Sick Leave': return 'sick';
      case 'Paid Leave': return 'paid';
      default: return 'unpaid';
    }
  }

  getInboxRequests(): LeaveRequest[] {
    let list = this.leaveRequests.filter(req => {
      if (this.simulatedRole === 'Supervisor') {
        return req.status === 'Pending Supervisor';
      } else if (this.simulatedRole === 'Project Manager') {
        return req.status === 'Pending PM';
      } else if (this.simulatedRole === 'HR') {
        return req.status === 'Pending HR';
      }
      return false;
    });

    if (this.filterMonth) {
      list = list.filter(req => {
        if (!req.startDate) return false;
        const date = new Date(req.startDate);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        return mm === this.filterMonth;
      });
    }

    if (this.filterYear) {
      list = list.filter(req => {
        if (!req.startDate) return false;
        const date = new Date(req.startDate);
        const yyyy = date.getFullYear().toString();
        return yyyy === this.filterYear;
      });
    }

    if (this.filterStage) {
      if (this.filterStage === 'Pending') {
        list = list.filter(req => req.status && req.status.startsWith('Pending'));
      } else {
        list = list.filter(req => req.status === this.filterStage);
      }
    }

    if (this.filterEmployee) {
      list = list.filter(req => req.empId === this.filterEmployee);
    }

    if (this.searchText) {
      const txt = this.searchText.toLowerCase();
      list = list.filter(req =>
        (req.empName || '').toLowerCase().includes(txt) ||
        (req.empId || '').toLowerCase().includes(txt) ||
        (req.leaveType || '').toLowerCase().includes(txt) ||
        (req.reason || '').toLowerCase().includes(txt) ||
        (req.status || '').toLowerCase().includes(txt)
      );
    }
    
    return list;
  }

  getHistoryRequests(): LeaveRequest[] {
    let list = this.leaveRequests.filter(req => req.status === 'Approved' || req.status === 'Rejected');

    if (this.filterMonth) {
      list = list.filter(req => {
        if (!req.startDate) return false;
        const date = new Date(req.startDate);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        return mm === this.filterMonth;
      });
    }

    if (this.filterYear) {
      list = list.filter(req => {
        if (!req.startDate) return false;
        const date = new Date(req.startDate);
        const yyyy = date.getFullYear().toString();
        return yyyy === this.filterYear;
      });
    }

    if (this.filterStage) {
      if (this.filterStage === 'Pending') {
        list = list.filter(req => req.status && req.status.startsWith('Pending'));
      } else {
        list = list.filter(req => req.status === this.filterStage);
      }
    }

    if (this.filterEmployee) {
      list = list.filter(req => req.empId === this.filterEmployee);
    }

    if (this.searchText) {
      const txt = this.searchText.toLowerCase();
      list = list.filter(req =>
        (req.empName || '').toLowerCase().includes(txt) ||
        (req.empId || '').toLowerCase().includes(txt) ||
        (req.leaveType || '').toLowerCase().includes(txt) ||
        (req.reason || '').toLowerCase().includes(txt) ||
        (req.status || '').toLowerCase().includes(txt)
      );
    }

    return list;
  }

  approveRequest(req: any) {
    this.leaveManagementService.updateLeaveStatus(req.id, 'approved').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          this.notificationService.show(res.message || 'Leave approved successfully!', 'success');
          this.loadLeaveRequests(); // Refresh the list from backend
        } else {
          this.notificationService.show('Failed to approve leave', 'error');
        }
      },
      error: (err: any) => {
        this.notificationService.show('Failed to approve leave', 'error');
        console.error(err);
      }
    });
  }

  rejectRequest(req: any) {
    this.leaveManagementService.updateLeaveStatus(req.id, 'rejected').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          this.notificationService.show(res.message || 'Leave rejected successfully!', 'info');
          this.loadLeaveRequests(); // Refresh the list from backend
        } else {
          this.notificationService.show('Failed to reject leave', 'error');
        }
      },
      error: (err: any) => {
        this.notificationService.show('Failed to reject leave', 'error');
        console.error(err);
      }
    });
  }

  openViewModal(req: LeaveRequest): void {
    this.selectedLeave = req;
    this.viewLeaveOpen = true;
  }

  closeViewModal(): void {
    this.selectedLeave = null;
    this.viewLeaveOpen = false;
  }

  syncLeaveToAttendance(req: LeaveRequest) {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);

    // Load attendance records
    let attendanceRecords: any[] = [];
    const stored = localStorage.getItem('attendance_records');
    if (stored) {
      attendanceRecords = JSON.parse(stored);
    }

    const d = new Date(start);
    while (d <= end) {
      const dateStr = this.datePipe.transform(d, 'yyyy-MM-dd') || '';

      const existingIndex = attendanceRecords.findIndex(r => r.empId === req.empId && r.date === dateStr);
      const record = {
        id: existingIndex >= 0 ? attendanceRecords[existingIndex].id : Math.floor(Math.random() * 100000).toString(),
        empId: req.empId,
        empName: req.empName,
        date: dateStr,
        checkIn: '--:--',
        checkOut: '--:--',
        shift: 'A',
        status: 'Leave',
        site: 'Office'
      };

      if (existingIndex >= 0) {
        attendanceRecords[existingIndex] = record;
      } else {
        attendanceRecords.unshift(record);
      }

      d.setDate(d.getDate() + 1);
    }

    localStorage.setItem('attendance_records', JSON.stringify(attendanceRecords));
  }

  triggerYearlyReset() {
    this.leaveBalances.forEach(b => {
      b.casual.consumed = 0;
      b.sick.consumed = 0;
      b.paid.consumed = 0;
      b.unpaid.consumed = 0;
    });
    this.saveToStorage();
    this.notificationService.show('Leave balances reset successfully for the new year.', 'info', 3000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-danger text-white';
      case 'Pending Supervisor': return 'bg-info text-white';
      case 'Pending PM': return 'bg-primary text-white';
      case 'Pending HR': return 'bg-warning text-dark';
      default: return 'bg-light text-dark';
    }
  }
}
