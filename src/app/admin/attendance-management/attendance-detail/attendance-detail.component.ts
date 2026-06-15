import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { AttendanceManagementService } from 'src/app/core/services/attendance-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface AttendanceRecord {
  id?: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  remarks: string;
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
    MatCardModule
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
  private destroy$ = new Subject<void>();
  employeeId: any;
  employee: any = {
    name: 'Loading...',
    empId: '',
    department: ''
  };

  currentMonth: Date = new Date();
  selectedDate: Date = new Date();

  attendanceRecords: AttendanceRecord[] = [
    { date: '01/05/2026', status: 'Present', checkIn: '09:31', checkOut: '18:07', duration: '08:36', remarks: '' },
    { date: '02/05/2026', status: 'Present', checkIn: '09:28', checkOut: '17:01', duration: '07:33', remarks: '' },
    { date: '03/05/2026', status: 'Weekend', checkIn: '-', checkOut: '-', duration: '-', remarks: '' },
    { date: '04/05/2026', status: 'Present', checkIn: '10:00', checkOut: '-', duration: '-', remarks: '' },
  ];

  isEditModalOpen: boolean = false;
  editForm: FormGroup;
  editingRecord: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private attendanceService: AttendanceManagementService,
    private notificationService: NotificationService
  ) {
    this.editForm = this.fb.group({
      status: ['Present'],
      checkIn: [''],
      checkOut: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    this.employee.empId = this.employeeId;
    this.currentMonth = new Date();
    this.selectedDate = new Date();
    this.loadMonthData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMonthData() {
    this.attendanceService.getEmployeeAttendanceDetails(this.employeeId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.status === 200 || res.success) {
            this.processApiRecords(res.data);
          } else {
             this.notificationService.show(res.message || 'Failed to load attendance', 'error', 3000);
             this.generateMockRecords(); // fallback
          }
        },
        error: (err: any) => {
           console.error('Error fetching details:', err);
           this.notificationService.show(err.message || 'Error loading attendance', 'error', 3000);
           this.generateMockRecords(); // fallback
        }
      });
  }

  processApiRecords(data: any) {
    this.attendanceRecords = [];
    
    if (data && data.employee) {
      this.employee.name = data.employee.name || 'N/A';
      this.employee.department = data.employee.department || 'N/A';
      this.employee.designation = data.employee.designation || 'N/A';
    }

    if (data && data.history && Array.isArray(data.history)) {
      this.attendanceRecords = data.history.map((record: any) => ({
        id: record.attendance_processed_id,
        date: record.formatted_date || record.date,
        backendDate: record.date,
        status: this.mapStatusToFrontend(record.status),
        checkIn: record.check_in || '--:--',
        checkOut: record.check_out || '--:--',
        duration: record.duration_label || record.duration || '-',
        remarks: record.remarks || ''
      }));
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
      case 'exception': return 'Exception';
      default: return 'Present';
    }
  }

  generateMockRecords() {
    // Kept as fallback in case API fails
    this.attendanceRecords = [];
    const totalDays = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${i < 10 ? '0' + i : i}/${(this.currentMonth.getMonth() + 1).toString().padStart(2, '0')}/${this.currentMonth.getFullYear()}`;
      const dayOfWeek = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), i).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      let status = isWeekend ? 'Weekend' : '-';
      let checkIn = '-';
      let checkOut = '-';
      let duration = '-';

      // Add some mock data for past days
      if (i < this.currentMonth.getDate() && !isWeekend) {
          status = 'Present';
          checkIn = '09:' + Math.floor(Math.random() * 30 + 10);
          checkOut = '18:' + Math.floor(Math.random() * 30 + 10);
          duration = '09:00';
      }

      this.attendanceRecords.push({
        date: dateStr,
        status: status,
        checkIn: checkIn,
        checkOut: checkOut,
        duration: duration,
        remarks: ''
      });
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
    this.loadMonthData();
  }

  openEditModal(record: any) {
    this.editingRecord = record;
    this.editForm.patchValue({
      status: record.status === '-' ? 'Present' : record.status,
      checkIn: record.checkIn === '-' ? '' : record.checkIn,
      checkOut: record.checkOut === '-' ? '' : record.checkOut,
      remarks: record.remarks
    });
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingRecord = null;
  }

  updateAttendance() {
    if (this.editingRecord) {
      const formValue = this.editForm.value;
      const newStatus = formValue.status as 'Present' | 'Half Day' | 'Exception' | 'Absent';
      const newCheckIn = formValue.checkIn && formValue.checkIn !== '-' ? formValue.checkIn : null;
      const newCheckOut = formValue.checkOut && formValue.checkOut !== '-' ? formValue.checkOut : null;
      const reason = formValue.remarks;

      const formData = new FormData();
      formData.append('_method', 'PUT');
      if (newCheckIn) formData.append('check_in', newCheckIn);
      if (newCheckOut) formData.append('check_out', newCheckOut);
      formData.append('attendance_status', newStatus.toLowerCase());
      if (reason) formData.append('remarks', reason);
      formData.append('employee_id', this.employeeId.toString());
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
            this.notificationService.show('Attendance updated successfully.', 'success', 3000);
            this.closeEditModal();
            this.loadMonthData(); // reload
          } else {
            this.notificationService.show(response.message || 'Failed to update attendance', 'error', 3000);
          }
        },
        error: (err: any) => {
          this.notificationService.show(err.message || 'Error updating attendance', 'error', 3000);
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