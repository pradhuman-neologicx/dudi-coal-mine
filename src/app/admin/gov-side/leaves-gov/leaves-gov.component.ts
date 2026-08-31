import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LeaveManagementService } from 'src/app/core/services/leave-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface LeaveRegisterMetadata {
  generated_at: string;
  generated_by: any;
  employee_count: number;
  year: string;
}

@Component({
  selector: 'app-leaves-gov',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './leaves-gov.component.html',
  styleUrl: './leaves-gov.component.scss',
  providers: [DatePipe]
})
export class LeavesGovComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showEntries: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  searchText: string = '';

  registerYearsList: string[] = ['2024', '2025', '2026', '2027'];
  registerMonthsList: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  registerFilterYear: string = new Date().getFullYear().toString();
  registerFilterMonth: string = this.registerMonthsList[new Date().getMonth()];
  registerDateValue: string = `${this.registerMonthsList[new Date().getMonth()]} ${new Date().getFullYear()}`;

  pRegister: number = 1;

  leaveRegisterRows: any[] = [];
  leaveTypeSnapshots: any[] = [];
  registerMetadata: LeaveRegisterMetadata | null = null;
  isGeneratingRegister: boolean = false;
  totalRegisterItems: number = 0;
  registerErrorMessage: string = '';

  constructor(
    private leaveManagementService: LeaveManagementService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadLeaveRegister();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onShowEntriesChange(entries: number) {
    this.showEntries = entries;
    this.pRegister = 1;
    this.loadLeaveRegister();
  }

  setRegisterYear(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    this.registerFilterYear = normalizedYear.getFullYear().toString();
    datepicker.close();
    this.pRegister = 1;
    this.loadLeaveRegister();
  }

  loadLeaveRegister() {
    this.leaveManagementService.getLeaveRegisterReports(this.registerFilterYear, this.pRegister, this.showEntries)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.registerErrorMessage = '';
            this.leaveRegisterRows = res.data.rows || [];
            this.leaveTypeSnapshots = (res.data.leave_type_snapshot || []).map((snapshot: any) => ({
              ...snapshot,
              prefix: snapshot.register_group === 'compensatory_rest' ? 'comp_rest' : snapshot.register_group
            }));
            this.registerMetadata = {
              generated_at: res.data.generated_at,
              generated_by: res.data.generated_by,
              employee_count: res.data.employee_count,
              year: res.data.year
            };
            if (res.pagination) {
              this.totalRegisterItems = res.pagination.total;
            } else {
              this.totalRegisterItems = this.leaveRegisterRows.length;
            }
          } else {
            this.leaveRegisterRows = [];
            this.leaveTypeSnapshots = [];
            this.registerMetadata = null;
            this.totalRegisterItems = 0;
            this.registerErrorMessage = `No Register Found for ${this.registerFilterYear}`;
          }
        },
        error: (err) => {
          this.leaveRegisterRows = [];
          this.leaveTypeSnapshots = [];
          this.registerMetadata = null;
          this.totalRegisterItems = 0;

          if (typeof err === 'string') {
            this.registerErrorMessage = err;
          } else {
            this.registerErrorMessage = err?.originalError?.message || err?.message || `No Register Found for ${this.registerFilterYear}`;
          }

          if (err !== 'Unauthorized' && err?.status !== 404) {
            console.error('Failed to load leave register', err);
          }
        }
      });
  }

  downloadExcel(): void {
    if (!this.registerFilterYear) {
      this.notificationService.show('Please select a year to download', 'error', 3000);
      return;
    }

    this.leaveManagementService.exportLeaveRegister(this.registerFilterYear).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Leave_Register_Form_F_${this.registerFilterYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.notificationService.show('Failed to download Excel file', 'error', 3000);
      }
    });
  }

  generateRegister() {
    this.isGeneratingRegister = true;
    this.leaveManagementService.generateLeaveRegister(this.registerFilterYear, '1')
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isGeneratingRegister = false;
          if (res.status === 200) {
            this.notificationService.show('Leave Register generated successfully', 'success', 3000);
            this.loadLeaveRegister();
          } else {
            this.notificationService.show(res.message || 'Failed to generate register', 'error', 3000);
          }
        },
        error: (err) => {
          this.isGeneratingRegister = false;
          this.notificationService.show('Error generating register', 'error', 3000);
        }
      });
  }

  onRegisterPageChange(page: number) {
    if (this.pRegister !== page) {
      this.pRegister = page;
      this.loadLeaveRegister();
    }
  }
}
