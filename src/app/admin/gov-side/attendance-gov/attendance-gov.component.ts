import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AttendanceManagementService } from 'src/app/core/services/attendance-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { saveAs } from 'file-saver';

interface ReportRecord {
  empId: string;
  empName: string;
  relay: string;
  shift: string;
  placeOfWork: string;
  days: {
    [key: number]: {
      in: string | null;
      out: string | null;
      status: string;
    }
  };
  summary: {
    totalDays: number;
    otHours: string;
    remarks: string;
  }
}

@Component({
  selector: 'app-attendance-gov',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './attendance-gov.component.html',
  styleUrl: './attendance-gov.component.scss'
})
export class AttendanceGovComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  reportAttendanceRecords: ReportRecord[] = [];
  daysInMonth: number[] = [];
  filterMonth: string = '';
  isDownloadingFormD = false;
  
  p: number = 1;
  showEntries: any = 10;
  tableSizes: any[] = [10, 20, 50, 100, 'all'];
  totalRecords: number = 0;

  constructor(
    private attendanceService: AttendanceManagementService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    this.filterMonth = `${today.getFullYear()}-${mm}`;
    this.loadAttendanceRegister();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    this.p = 1;
    this.loadAttendanceRegister();
  }
  
  onPageChange(page: number) {
    this.p = page;
    this.loadAttendanceRegister();
  }
  
  onShowEntriesChange() {
    this.p = 1;
    this.loadAttendanceRegister();
  }

  loadAttendanceRegister() {
    let limit = this.showEntries;
    const page = this.p;
    
    let y = new Date().getFullYear().toString();
    let m = (new Date().getMonth() + 1).toString();
    if (this.filterMonth) {
      const [yy, mm] = this.filterMonth.split('-');
      y = yy;
      m = parseInt(mm, 10).toString();
    }

    this.attendanceService.getAttendanceRegister(limit, page, m, y)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const data = response.data || {};
            this.totalRecords = data.pagination?.total || data.total || data.rows?.length || 0;
            const numDays = data.days_in_month || new Date(parseInt(y), parseInt(m), 0).getDate();
            this.daysInMonth = Array.from({ length: numDays }, (_, i) => (i + 1));

            this.reportAttendanceRecords = (data.rows || []).map((record: any) => ({
              empId: record.employee_code,
              empName: record.name,
              relay: record.relay || '--',
              shift: '--',
              placeOfWork: record.place_of_work || record.place_of_work_label || '--',
              days: record.days || {},
              summary: { totalDays: record.total_days, otHours: record.total_ot_hours, remarks: record.remarks || '' }
            }));
          } else {
            this.notificationService.show(response.message, 'error', 3000);
          }
        },
        error: (err: any) => {
          console.error('Error fetching attendance register:', err);
        }
      });
  }

  downloadFormD(): void {
    let month = '';
    let year = '';

    if (this.filterMonth) {
      const [y, m] = this.filterMonth.split('-');
      year = y;
      month = parseInt(m, 10).toString();
    } else {
      const today = new Date();
      year = today.getFullYear().toString();
      month = (today.getMonth() + 1).toString();
    }

    this.isDownloadingFormD = true;

    this.employeeService.exportAttendanceRegister(parseInt(month), parseInt(year))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isDownloadingFormD = false;
          const blob = response.body || response;
          const fileName = `Form_D_Register_${month}_${year}.xlsx`;
          saveAs(blob, fileName);
          this.notificationService.show('Form D Register downloaded successfully.', 'success', 3000);
        },
        error: (err: any) => {
          this.isDownloadingFormD = false;
          console.error('Error downloading Form D Register:', err);
          const errorMsg = err.error?.message || err.message || 'Form D Download failed.';
          this.notificationService.show(errorMsg, 'error', 4000);
        }
      });
  }
}
