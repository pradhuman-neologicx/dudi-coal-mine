import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

interface LeaveRequest {
  id: string;
  empId: string;
  empName: string;
  startDate: string;
  endDate: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave';
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
  templateUrl: './leave-management.component.html',
  styleUrl: './leave-management.component.scss',
  providers: [DatePipe]
})
export class LeaveManagementComponent implements OnInit {
  activeTab: 'apply' | 'inbox' | 'balances' | 'history' = 'apply';
  simulatedRole: 'Supervisor' | 'Project Manager' | 'HR' = 'Supervisor';

  employees: any[] = [];
  leaveRequests: LeaveRequest[] = [];
  leaveBalances: LeaveBalance[] = [];
  leaveTypes: ('Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave')[] = [
    'Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'
  ];

  leaveApplyForm: FormGroup;
  pInbox: number = 1;
  pHistory: number = 1;
  pBalances: number = 1;
  
  showEntries: number = 10;
  searchText: string = '';
  
  viewLeaveOpen: boolean = false;
  selectedLeave: LeaveRequest | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private datePipe: DatePipe
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
  }

  loadEmployees() {
    this.employeeService.GetStaff('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 'success' || res.data) {
          this.employees = res.data || res;
        } else {
          this.employees = [
            { id: 'EMP001', name: 'John Doe', shift: 'A' },
            { id: 'EMP002', name: 'Jane Smith', shift: 'B' },
            { id: 'EMP003', name: 'Robert Johnson', shift: 'C' }
          ];
        }
        this.initializeLeaveData();
      },
      error: () => {
        this.employees = [
          { id: 'EMP001', name: 'John Doe', shift: 'A' },
          { id: 'EMP002', name: 'Jane Smith', shift: 'B' },
          { id: 'EMP003', name: 'Robert Johnson', shift: 'C' }
        ];
        this.initializeLeaveData();
      }
    });
  }

  initializeLeaveData() {
    // Load from local storage
    const storedRequests = localStorage.getItem('leave_requests');
    const storedBalances = localStorage.getItem('leave_balances');

    if (storedRequests && storedBalances) {
      this.leaveRequests = JSON.parse(storedRequests);
      this.leaveBalances = JSON.parse(storedBalances);
    } else {
      // Create initial default balances
      this.leaveBalances = this.employees.map(emp => ({
        empId: emp.id || emp.user_id,
        empName: emp.name || (emp.first_name + ' ' + (emp.last_name || '')),
        casual: { total: 12, consumed: 2 },
        sick: { total: 10, consumed: 1 },
        paid: { total: 15, consumed: 3 },
        unpaid: { total: 99, consumed: 0 } // unlimited/large
      }));

      // Generate some mock history requests
      const today = new Date();
      this.leaveRequests = [
        {
          id: 'LR001',
          empId: this.employees[0]?.id || 'EMP001',
          empName: this.employees[0]?.name || 'John Doe',
          startDate: this.getOffsetDate(-10),
          endDate: this.getOffsetDate(-9),
          leaveType: 'Casual Leave',
          reason: 'Personal urgent work',
          status: 'Approved',
          appliedDate: this.getOffsetDate(-15),
          comments: 'Approved by HR finally'
        },
        {
          id: 'LR002',
          empId: this.employees[1]?.id || 'EMP002',
          empName: this.employees[1]?.name || 'Jane Smith',
          startDate: this.getOffsetDate(-5),
          endDate: this.getOffsetDate(-5),
          leaveType: 'Sick Leave',
          reason: 'Fever and cold',
          status: 'Approved',
          appliedDate: this.getOffsetDate(-6),
          comments: 'Get well soon'
        },
        {
          id: 'LR003',
          empId: this.employees[2]?.id || 'EMP003',
          empName: this.employees[2]?.name || 'Robert Johnson',
          startDate: this.getOffsetDate(2),
          endDate: this.getOffsetDate(4),
          leaveType: 'Paid Leave',
          reason: 'Family function in hometown',
          status: 'Pending Supervisor',
          appliedDate: this.getOffsetDate(0)
        }
      ];

      this.saveToStorage();
    }
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

    const days = this.getLeaveDays(startDate, endDate);
    const employee = this.employees.find(e => (e.id || e.user_id) === empId);
    const empName = employee ? (employee.name || employee.first_name + ' ' + (employee.last_name || '')) : 'Unknown';

    // Verify Balance
    const balance = this.leaveBalances.find(b => b.empId === empId);
    if (balance && leaveType !== 'Unpaid Leave') {
      const typeKey = this.getBalanceKey(leaveType);
      const limit = balance[typeKey];
      if (limit.consumed + days > limit.total) {
        this.notificationService.show(`Insufficient leave balance. Remaining: ${limit.total - limit.consumed} days. Requested: ${days} days.`, 'error', 4000);
        return;
      }
    }

    const newRequest: LeaveRequest = {
      id: 'LR' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      empId,
      empName,
      startDate,
      endDate,
      leaveType,
      reason,
      status: 'Pending Supervisor',
      appliedDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || ''
    };

    this.leaveRequests.unshift(newRequest);
    this.saveToStorage();
    this.notificationService.show('Leave request submitted successfully for Supervisor approval.', 'success', 3000);
    this.leaveApplyForm.reset();
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
    const list = this.leaveRequests.filter(req => {
      if (this.simulatedRole === 'Supervisor') {
        return req.status === 'Pending Supervisor';
      } else if (this.simulatedRole === 'Project Manager') {
        return req.status === 'Pending PM';
      } else if (this.simulatedRole === 'HR') {
        return req.status === 'Pending HR';
      }
      return false;
    });
    if (!this.searchText) return list;
    const txt = this.searchText.toLowerCase();
    return list.filter(req => 
      req.empName.toLowerCase().includes(txt) ||
      req.empId.toLowerCase().includes(txt) ||
      req.leaveType.toLowerCase().includes(txt) ||
      req.reason.toLowerCase().includes(txt)
    );
  }

  getHistoryRequests(): LeaveRequest[] {
    const list = this.leaveRequests.filter(req => req.status === 'Approved' || req.status === 'Rejected');
    if (!this.searchText) return list;
    const txt = this.searchText.toLowerCase();
    return list.filter(req => 
      req.empName.toLowerCase().includes(txt) ||
      req.empId.toLowerCase().includes(txt) ||
      req.leaveType.toLowerCase().includes(txt) ||
      req.reason.toLowerCase().includes(txt)
    );
  }

  approveRequest(req: LeaveRequest) {
    let nextStatus: LeaveRequest['status'] = req.status;
    let notifyMsg = '';

    if (this.simulatedRole === 'Supervisor' && req.status === 'Pending Supervisor') {
      nextStatus = 'Pending PM';
      notifyMsg = 'Approved by Supervisor. Request forwarded to Project Manager.';
    } else if (this.simulatedRole === 'Project Manager' && req.status === 'Pending PM') {
      nextStatus = 'Pending HR';
      notifyMsg = 'Approved by Project Manager. Request forwarded to HR.';
    } else if (this.simulatedRole === 'HR' && req.status === 'Pending HR') {
      nextStatus = 'Approved';
      notifyMsg = 'Request fully approved. Attendance synced and balances updated.';
      
      // Update balances
      const days = this.getLeaveDays(req.startDate, req.endDate);
      const balance = this.leaveBalances.find(b => b.empId === req.empId);
      if (balance) {
        const typeKey = this.getBalanceKey(req.leaveType);
        balance[typeKey].consumed += days;
      }

      // Sync to attendance
      this.syncLeaveToAttendance(req);
    }

    req.status = nextStatus;
    req.comments = `Approved by ${this.simulatedRole}`;
    
    this.saveToStorage();
    this.notificationService.show(notifyMsg, 'success', 3000);
  }

  rejectRequest(req: LeaveRequest) {
    req.status = 'Rejected';
    req.comments = `Rejected by ${this.simulatedRole}`;
    
    this.saveToStorage();
    this.notificationService.show(`Request rejected by ${this.simulatedRole}.`, 'info', 3000);
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
