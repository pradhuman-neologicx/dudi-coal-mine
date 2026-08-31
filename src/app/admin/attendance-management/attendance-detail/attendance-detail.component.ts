import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { AttendanceManagementService } from 'src/app/core/services/attendance-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { LeaveTypeService } from 'src/app/core/services/leave-type.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';

interface AttendanceRecord {
  id?: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  remarks: string;
  isFuture?: boolean;
  backendDate?: string;
}

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    NgSelectModule
  ],
  templateUrl: './attendance-detail.component.html',
  styleUrls: ['./attendance-detail.component.scss'],
  animations: [
    trigger('modalFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AttendanceDetailComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendar: any;
  private destroy$ = new Subject<void>();
  employeeId: any;
  employee: any = {
    name: 'Loading...',
    empId: '',
    department: ''
  };

  currentMonth: Date = new Date();
  selectedDate: Date | null = new Date();

  attendanceRecords: AttendanceRecord[] = [];

  isEditModalOpen: boolean = false;
  editForm: FormGroup;
  editingRecord: any = null;
  activeLeaveTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private attendanceService: AttendanceManagementService,
    private notificationService: NotificationService,
    private leaveTypeService: LeaveTypeService
  ) {
    this.editForm = this.fb.group({
      status: ['Present'],
      checkIn: [''],
      checkOut: [''],
      remarks: ['', Validators.required]
    });

    this.editForm.get('status')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      const checkInCtrl = this.editForm.get('checkIn');
      const checkOutCtrl = this.editForm.get('checkOut');

      if (status === 'Leave' || status === 'Absent' || status === 'Rest Day' || status === 'Weekend') {
        checkInCtrl?.clearValidators();
        checkOutCtrl?.clearValidators();
        checkInCtrl?.disable();
        checkOutCtrl?.disable();
      } else {
        checkInCtrl?.setValidators([Validators.required]);
        checkOutCtrl?.setValidators([Validators.required]);
        checkInCtrl?.enable();
        checkOutCtrl?.enable();
      }
      checkInCtrl?.updateValueAndValidity();
      checkOutCtrl?.updateValueAndValidity();

      if (status === 'Leave') {
        if (!this.editForm.contains('leaveTypeId')) {
          this.editForm.addControl('leaveTypeId', this.fb.control(null, Validators.required));
        }
      } else {
        if (this.editForm.contains('leaveTypeId')) {
          this.editForm.removeControl('leaveTypeId');
        }
      }
    });
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    this.employee.empId = this.employeeId;
    
    const queryParams = this.route.snapshot.queryParamMap;
    const dateParam = queryParams.get('date');
    const monthParam = queryParams.get('month');
    const yearParam = queryParams.get('year');

    if (dateParam) {
      // e.g. "15 Jun 2026" or "2026-06-15"
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        this.currentMonth = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
        this.selectedDate = null; // Set to null for consistency with monthly view
      } else {
        this.currentMonth = new Date();
        this.selectedDate = null;
      }
    } else if (monthParam && yearParam) {
      const m = parseInt(monthParam, 10);
      const y = parseInt(yearParam, 10);
      this.currentMonth = new Date(y, m - 1, 1);
      this.selectedDate = null; // Do not select 1st of the month by default
    } else {
      this.currentMonth = new Date();
      this.selectedDate = null;
    }
    
    this.fetchLeaveTypes();
    this.loadMonthData();
  }

  fetchLeaveTypes() {
    this.leaveTypeService.getLeaveTypes('all', '', '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.activeLeaveTypes = res.data.filter((l: any) => l.status === true || l.is_active === true);
        }
      },
      error: (err: any) => console.error('Error fetching leave types:', err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMonthData() {
    const month = this.currentMonth.getMonth() + 1;
    const year = this.currentMonth.getFullYear();
    
    this.attendanceService.getEmployeeAttendanceDetails(this.employeeId, month, year)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.status === 200 || res.success) {
            this.processApiRecords(res.data);
          } else {
             this.notificationService.show(res.message, 'error', 3000);
          }
        },
        error: (err: any) => {
           console.error('Error fetching details:', err);
           this.notificationService.show(err.message, 'error', 3000);
        }
      });
  }

  processApiRecords(data: any) {
    this.attendanceRecords = [];
    
    if (data && data.employee) {
      this.employee.name = data.employee.name || 'N/A';
      this.employee.department = data.employee.department || 'N/A';
      this.employee.designation = data.employee.designation || 'N/A';
      this.employee.empId = data.employee.employee_code || data.employee.employee_id || this.employeeId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (data && data.history && Array.isArray(data.history)) {
      this.attendanceRecords = data.history.map((record: any) => {
        let isFuture = false;
        if (record.date) {
          let dateToCompare: Date;
          if (record.date.includes('/')) {
            const parts = record.date.split('/');
            dateToCompare = new Date(+parts[2], +parts[1] - 1, +parts[0]);
          } else {
            dateToCompare = new Date(record.date);
          }
          dateToCompare.setHours(0, 0, 0, 0);
          isFuture = dateToCompare > today;
        }

        return {
          id: record.attendance_processed_id,
          date: record.formatted_date || record.date,
          backendDate: record.date,
          status: this.mapStatusToFrontend(record.status),
          checkIn: record.check_in || '--:--',
          checkOut: record.check_out || '--:--',
          duration: record.duration_label || record.duration || '-',
          remarks: record.remarks || '',
          isFuture: isFuture
        };
      });
    }
  }

  mapStatusToFrontend(backendStatus: string): string {
    if (!backendStatus) return '-';
    switch (backendStatus.toLowerCase()) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'half_day':
      case 'half-day':
      case 'half day':
        return 'Half Day';
      case 'leave': return 'Leave';
      case 'rest_day':
      case 'rest-day':
      case 'rest day':
        return 'Rest Day';
      case 'weekend':
        return 'Weekend';
      case 'exception': return 'Exception';
      default: return backendStatus;
    }
  }



  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      // Scroll to the selected date record in the list if needed
    }
  }

  onMonthSelected(date: Date) {
    this.currentMonth = date;
    this.updateRouteParams();
    this.loadMonthData();
  }

  onCalendarClick(event: Event) {
    const target = event.target as HTMLElement;
    const isNext = target.closest('.mat-calendar-next-button');
    const isPrev = target.closest('.mat-calendar-previous-button');
    
    if (isNext || isPrev) {
      setTimeout(() => {
        if (this.calendar && this.calendar.activeDate) {
          const activeDate = this.calendar.activeDate;
          if (activeDate.getMonth() !== this.currentMonth.getMonth() || activeDate.getFullYear() !== this.currentMonth.getFullYear()) {
            this.currentMonth = activeDate;
            this.updateRouteParams();
            this.loadMonthData();
          }
        }
      });
    }
  }

  private updateRouteParams() {
    const month = this.currentMonth.getMonth() + 1;
    const year = this.currentMonth.getFullYear();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: month.toString(), year: year.toString() },
      queryParamsHandling: 'merge'
    });
  }

  openEditModal(record: any) {
    if (!record.id) {
      this.fallbackOpenEditModal(record);
      return;
    }

    this.attendanceService.getAttendanceById(record.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          const data = res.data;
          
          let formattedDate = data.date || record.date;
          if (data.date) {
            const dateObj = new Date(data.date);
            if (!isNaN(dateObj.getTime())) {
               const d = dateObj.getDate().toString().padStart(2, '0');
               const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
               const y = dateObj.getFullYear();
               formattedDate = `${d}/${m}/${y}`;
            }
          }

          this.editingRecord = { 
            ...data,
            date: formattedDate 
          };
          
          let checkIn = data.check_in || '';
          let checkOut = data.check_out || '';
          if (checkIn === '--:--' || checkIn === '-') checkIn = '';
          if (checkOut === '--:--' || checkOut === '-') checkOut = '';

          let status = 'Present';
          if (data.attendance_status) {
            status = this.mapStatusToFrontend(data.attendance_status);
          }

          this.editForm.patchValue({
            status: status === '-' ? 'Present' : status,
            checkIn: checkIn,
            checkOut: checkOut,
            remarks: data.remarks || ''
          });

          if (status === 'Leave' && data.leave_type_id) {
            this.editForm.patchValue({ leaveTypeId: Number(data.leave_type_id) });
          }
          this.isEditModalOpen = true;
        } else {
          this.notificationService.show('Failed to fetch attendance details', 'error', 3000);
          this.fallbackOpenEditModal(record);
        }
      },
      error: (err: any) => {
        console.error('Error fetching attendance details', err);
        // Error toast is already handled by ApiService interceptor
        this.fallbackOpenEditModal(record);
      }
    });
  }

  fallbackOpenEditModal(record: any) {
    this.editingRecord = record;
    this.editForm.patchValue({
      status: record.status === '-' ? 'Present' : record.status,
      checkIn: record.checkIn === '--:--' ? '' : record.checkIn,
      checkOut: record.checkOut === '--:--' ? '' : record.checkOut,
      remarks: record.remarks || ''
    });

    if (record.status === 'Leave' && record.leave_type_id) {
      this.editForm.patchValue({ leaveTypeId: Number(record.leave_type_id) });
    }
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingRecord = null;
  }

  updateAttendance() {
    if (this.editingRecord) {
      const formValue = this.editForm.value;
      const newStatus = formValue.status as 'Present' | 'Absent' | 'Half Day' | 'Rest Day' | 'Leave';
      const newCheckIn = formValue.checkIn && formValue.checkIn !== '-' ? formValue.checkIn : null;
      const newCheckOut = formValue.checkOut && formValue.checkOut !== '-' ? formValue.checkOut : null;
      const reason = formValue.remarks;

      const formData = new FormData();
      // formData.append('_method', 'PUT'); // Removed as API is POST
      
      formData.append('employee_id', this.employeeId.toString());
      
      const statusVal = newStatus.toLowerCase().replace(' ', '_');
      formData.append('attendance_status', statusVal);
      
      if (reason) formData.append('remarks', reason);

      if (newStatus === 'Leave') {
        if (formValue.leaveTypeId) {
          formData.append('leave_type_id', formValue.leaveTypeId);
        }
      } else {
        if (newCheckIn) formData.append('check_in', newCheckIn);
        if (newCheckOut) formData.append('check_out', newCheckOut);
        // Note: site_id is not in this specific component's form
      }
      let formattedDate = this.editingRecord.backendDate;
      if (!formattedDate && this.editingRecord.date) {
        // Parse DD/MM/YYYY to YYYY-MM-DD
        const parts = this.editingRecord.date.split('/');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formattedDate = this.editingRecord.date;
        }
      }
      formData.append('date', formattedDate);

      this.attendanceService.updateAttendance(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.success) {
            this.notificationService.show(response.message, 'success', 3000);
            this.closeEditModal();
            this.loadMonthData(); // reload
          } else {
            this.notificationService.show(response.message, 'error', 3000);
          }
        },
        error: (err: any) => {
          this.notificationService.show(err.message, 'error', 3000);
        }
      });
    }
  }

  onClose() {
    this.location.back();
  }

  goBack() {
    this.router.navigate(['/admin/attendance-management']);
  }
}