import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/mat/mat.module';
import * as XLSX from 'xlsx';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { AttendanceManagementService } from 'src/app/core/services/attendance-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
interface RawBiometricLog {
  empId: string;
  date: string;
  checkIn: string;
  checkOut: string;
}

interface DailyAttendance {
  id: string;
  empId: string;
  employee_id?: string | number;
  empName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  shift: string;
  status: 'Present' | 'Half Day' | 'Exception' | 'Absent' | 'Leave' | 'Rest Day' | 'Weekend';
  site: string;
}

interface MonthlyAttendanceSummary {
  empId: string;
  empName: string;
  totalDays: number;
  present: number;
  absent: number;
  halfDay: number;
  restDay: number;
  leave: number;
  exception: number;
  payableDays: number;
}

interface AttendanceCorrectionLog {
  id: string;
  empId: string;
  date: string;
  oldCheckIn: string | null;
  newCheckIn: string | null;
  oldCheckOut: string | null;
  newCheckOut: string | null;
  oldStatus: string;
  newStatus: string;
  reason: string;
  timestamp: Date;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './attendance-management.component.html',
  styleUrl: './attendance-management.component.scss',
  providers: [DatePipe]
})
export class AttendanceManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isDragging = false;
  uploadedLogs: RawBiometricLog[] = [];
  attendanceRecords: DailyAttendance[] = [];

  uploadSummary = { total: 0, success: 0, errors: 0 };

  summaryMetrics = {
    total: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leaves: 0
  };

  // Master list of records
  allAttendanceRecords: DailyAttendance[] = [];
  monthlyAttendanceRecords: MonthlyAttendanceSummary[] = [];
  monthlyP: number = 1;

  // Filter properties
  viewMode: 'daily' | 'monthly' = 'daily';
  filterDate: string = '';
  filterMonth: string = '';
  filterFromDate: string = '';
  filterToDate: string = '';
  filterStatus: string | null = null;
  filterSearch: string = '';
  filterSite: string = '';

  mockSites: string[] = [];

  // Freeze date (e.g., records before 3rd of current month are locked)
  freezeDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 3);

  // Modal states
  showCorrectionModal = false;
  showBulkUploadModal = false;
  correctionForm!: FormGroup;
  searchbarform!: FormGroup;
  showreset: boolean = false;
  selectedRecord: DailyAttendance | null = null;

  p: number = 1; // Pagination
  showEntries: any = 10;
  tableSizes: any[] = [10, 20, 50, 100, 'all'];
  totalRecords: number = 0;

  selectedRecordIds = new Set<string>();

  toggleSelection(recordId: string): void {
    if (this.selectedRecordIds.has(recordId)) {
      this.selectedRecordIds.delete(recordId);
    } else {
      this.selectedRecordIds.add(recordId);
    }
  }

  isRecordSelected(recordId: string): boolean {
    return this.selectedRecordIds.has(recordId);
  }

  toggleAllSelection(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.attendanceRecords.forEach(r => this.selectedRecordIds.add(r.id));
    } else {
      this.attendanceRecords.forEach(r => this.selectedRecordIds.delete(r.id));
    }
  }

  isAllSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    return this.attendanceRecords.every(r => this.selectedRecordIds.has(r.id));
  }

  isSomeSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    const count = this.attendanceRecords.filter(r => this.selectedRecordIds.has(r.id)).length;
    return count > 0 && count < this.attendanceRecords.length;
  }

  clearSelection(): void {
    this.selectedRecordIds.clear();
  }

  markBulkAttendance(status: 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Rest Day'): void {
    if (this.selectedRecordIds.size === 0) {
      this.notificationService.show('Please select at least one employee.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('attendance_status', status.toLowerCase().replace(' ', '_'));

    this.selectedRecordIds.forEach(id => {
      formData.append('attendance_ids[]', id.toString());
    });

    this.attendanceService.updateBulkAttendanceStatus(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          this.notificationService.show(`Successfully marked ${this.selectedRecordIds.size} employees as ${status}.`, 'success', 3000);
          this.selectedRecordIds.clear();
          this.loadAttendance();
        } else {
          this.notificationService.show(res.message || 'Failed to update attendance', 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show(err.message || 'Error updating attendance', 'error', 3000);
      }
    });
  }

  markIndividualAttendance(record: DailyAttendance, status: 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Rest Day'): void {
    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('attendance_status', status.toLowerCase().replace(' ', '_'));
    formData.append('attendance_ids[]', record.id.toString());

    this.attendanceService.updateBulkAttendanceStatus(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          this.notificationService.show(`Successfully marked ${record.empName} as ${status}.`, 'success', 3000);
          this.loadAttendance();
        } else {
          this.notificationService.show(res.message || 'Failed to update attendance', 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show(err.message || 'Error updating attendance', 'error', 3000);
      }
    });
  }

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private attendanceService: AttendanceManagementService,
    private notificationService: NotificationService,
    private datePipe: DatePipe,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const today = new Date();
    this.filterDate = today.toISOString().split('T')[0];
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    this.filterMonth = `${today.getFullYear()}-${mm}`;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.initForms();
    this.loadAttendance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForms() {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });
    this.correctionForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      status: ['', Validators.required],
      reason: ['', Validators.required],
      site: ['', Validators.required]
    });
  }


  loadAttendance() {
    let limit = 'all'; // Fetch all records for client-side pagination
    const page = 1;
    const search = this.searchbarform?.get('searchbar')?.value || '';
    const status = this.filterStatus || '';
    
    let fromDate = '';
    let toDate = '';
    let viewType = this.viewMode;
    let month = '';
    let year = '';

    if (this.viewMode === 'daily') {
      fromDate = this.filterDate || '';
    } else if (this.viewMode === 'monthly' && this.filterMonth) {
      const [y, m] = this.filterMonth.split('-');
      year = y;
      month = parseInt(m, 10).toString();
    }

    this.attendanceService.getAttendance(limit, page, search, fromDate, toDate, status, viewType, month, year)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.totalRecords = response.pagination?.total || response.data?.length || 0;
            
            if (this.viewMode === 'daily') {
              this.attendanceRecords = (response.data || []).map((record: any) => ({
                ...record,
                id: record.id?.toString() || '',
                employee_id: record.employee_id,
                empId: record.employee_code || '',
                empName: record.employee_name || '',
                date: record.date || '',
                checkIn: record.check_in || null,
                checkOut: record.check_out || null,
                shift: record.shift_name || '',
                status: this.mapStatusToFrontend(record.attendance_status),
                site: record.site_name || ''
              }));
              
              if (response.summary) {
                this.summaryMetrics = {
                  total: response.summary.total_employees || this.totalRecords,
                  present: response.summary.present || 0,
                  absent: response.summary.absent || 0,
                  halfDay: response.summary.half_day || 0,
                  leaves: response.summary.leaves || 0
                };
              } else {
                this.calculateMetrics();
              }
            } else {
              this.monthlyAttendanceRecords = (response.data || []).map((record: any) => ({
                employee_id: record.employee_id,
                empId: record.employee_code || record.employee_id?.toString() || '',
                empName: record.employee_name || '',
                totalDays: record.total_days || 0,
                present: record.present || 0,
                absent: record.absent || 0,
                halfDay: record.half_day || 0,
                restDay: record.rest_day || 0,
                leave: record.leave || 0,
                exception: record.exception || 0,
                payableDays: record.payable_days || 0
              }));
              
              if (response.summary) {
                this.summaryMetrics = {
                  total: response.summary.total_employees || this.totalRecords,
                  present: response.summary.present || 0,
                  absent: response.summary.absent || 0,
                  halfDay: response.summary.half_day || 0,
                  leaves: response.summary.leaves || 0
                };
              } else {
                 this.calculateMetrics();
              }
            }
          } else {
            this.notificationService.show(response.message || 'Failed to fetch attendance', 'error', 3000);
          }
        },
        error: (err: any) => {
          console.error('Error fetching attendance:', err);
          this.notificationService.show(err.message || 'Error fetching attendance', 'error', 3000);
        }
      });
  }

  calculateMetrics() {
    this.summaryMetrics = { total: 0, present: 0, absent: 0, halfDay: 0, leaves: 0 };
    
    if (this.viewMode === 'daily') {
      this.summaryMetrics.total = this.totalRecords;
      this.attendanceRecords.forEach(record => {
        const s = record.status;
        if (s === 'Present') this.summaryMetrics.present++;
        else if (s === 'Absent') this.summaryMetrics.absent++;
        else if (s === 'Half Day') this.summaryMetrics.halfDay++;
        else if (s === 'Leave') this.summaryMetrics.leaves++;
      });
    } else {
      this.summaryMetrics.total = this.totalRecords;
      this.monthlyAttendanceRecords.forEach(record => {
        this.summaryMetrics.present += record.present;
        this.summaryMetrics.absent += record.absent;
        this.summaryMetrics.halfDay += record.halfDay;
        this.summaryMetrics.leaves += record.leave;
      });
    }
  }

  // Aggregate method removed since backend provides aggregated data

  mapStatusToFrontend(backendStatus: string): 'Present' | 'Half Day' | 'Exception' | 'Absent' | 'Leave' | 'Rest Day' | 'Weekend' {
    if (!backendStatus) return 'Absent';
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
      case 'weekend': return 'Weekend';
      case 'exception': return 'Exception';
      default: return 'Present';
    }
  }

  onPageChange(page: number) {
    this.p = page;
    this.loadAttendance();
  }

  onShowEntriesChange() {
    this.p = 1;
    this.loadAttendance();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = (searchText.trim().length > 0);
    this.p = 1;
    this.loadAttendance();
  }

  resetsearchbar() {
    this.searchbarform.reset({ searchbar: '' });
    this.showreset = false;
    this.p = 1;
    this.loadAttendance();
  }

  applyFilters() {
    this.p = 1;
    this.loadAttendance();
  }

  setViewMode(mode: 'daily' | 'monthly') {
    this.viewMode = mode;
    this.p = 1;
    this.loadAttendance();
  }

  resetFilters() {
    const today = new Date();
    this.filterDate = today.toISOString().split('T')[0];
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    this.filterMonth = `${today.getFullYear()}-${mm}`;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = null;
    this.filterSearch = '';
    this.filterSite = '';
    this.searchbarform.reset({ searchbar: '' });
    this.showreset = false;
    this.p = 1;
    this.loadAttendance();
  }

  // --- Drag and Drop Logic ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.type !== 'application/vnd.ms-excel' &&
      !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      this.notificationService.show('Invalid file type. Please upload an Excel or CSV file.', 'error', 3000);
      return;
    }

    this.attendanceService.bulkUploadAttendance(file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.notificationService.show(response.message || 'Attendance uploaded successfully.', 'success', 3000);
          this.closeBulkUploadModal();
          this.p = 1;
          this.loadAttendance();
        } else {
          this.notificationService.show(response.message || 'Bulk upload failed.', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error during bulk upload:', err);
        const errorMessage = err.error?.message || err.message || 'Bulk upload failed.';
        this.notificationService.show(errorMessage, 'error', 3000);
      }
    });
  }

  formatTime(timeStr: any): string | null {
    if (!timeStr) return null;

    // Handle excel time (fraction of a day)
    if (typeof timeStr === 'number') {
      const totalSeconds = Math.round(timeStr * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return timeStr.toString();
  }

  // --- Manual Correction Logic ---

  openCorrectionModal(record: DailyAttendance) {
    this.attendanceService.getAttendanceById(record.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          const data = res.data;
          this.selectedRecord = { ...record };

          let checkIn = data.check_in || record.checkIn;
          let checkOut = data.check_out || record.checkOut;

          if (checkIn === '--:--') checkIn = '';
          if (checkOut === '--:--') checkOut = '';

          let status = record.status;
          if (data.attendance_status) {
            status = this.mapStatusToFrontend(data.attendance_status);
          }

          this.correctionForm.patchValue({
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            status: status,
            site: data.remarks || record.site || '',
            reason: data.remarks || ''
          });
          this.showCorrectionModal = true;
        } else {
          this.notificationService.show('Failed to fetch attendance details', 'error', 3000);
          this.fallbackOpenCorrectionModal(record);
        }
      },
      error: (err: any) => {
        console.error('Error fetching attendance details', err);
        this.notificationService.show('Error fetching attendance details', 'error', 3000);
        this.fallbackOpenCorrectionModal(record);
      }
    });
  }

  fallbackOpenCorrectionModal(record: DailyAttendance) {
    this.selectedRecord = { ...record };
    this.correctionForm.patchValue({
      checkIn: record.checkIn === '--:--' ? '' : (record.checkIn || ''),
      checkOut: record.checkOut === '--:--' ? '' : (record.checkOut || ''),
      status: record.status,
      site: record.site,
      reason: ''
    });
    this.showCorrectionModal = true;
  }

  closeCorrectionModal() {
    this.showCorrectionModal = false;
    this.selectedRecord = null;
    this.correctionForm.reset();
  }

  submitCorrection() {
    if (this.correctionForm.invalid || !this.selectedRecord) {
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const formValues = this.correctionForm.value;
    const { reason, status, site } = formValues;
    const newCheckIn = formValues.checkIn || null;
    const newCheckOut = formValues.checkOut || null;

    const newStatus = status as 'Present' | 'Half Day' | 'Exception' | 'Absent'; // Use the explicitly chosen status

    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (newCheckIn) formData.append('check_in', newCheckIn);
    if (newCheckOut) formData.append('check_out', newCheckOut);
    formData.append('attendance_status', newStatus.toLowerCase());
    if (reason) formData.append('remarks', reason);
    formData.append('employee_id', this.selectedRecord.employee_id?.toString() || '');
    formData.append('date', this.filterDate); // filterDate is in YYYY-MM-DD format

    this.attendanceService.updateAttendance(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.success || response.status === 'success') {
          this.notificationService.show(response.message || 'Attendance updated successfully.', 'success', 3000);
          this.closeCorrectionModal();
          this.p = 1;
          this.loadAttendance();
        } else {
          this.notificationService.show(response.message || 'Failed to update attendance', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error updating attendance:', err);
        this.notificationService.show(err.message || 'Error updating attendance', 'error', 3000);
      }
    });
  }

  // --- Bulk Upload Modal ---
  openBulkUploadModal() {
    this.showBulkUploadModal = true;
    this.uploadSummary = { total: 0, success: 0, errors: 0 };
  }

  closeBulkUploadModal() {
    this.showBulkUploadModal = false;
  }



  getStatusClass(status: string): string {
    switch (status) {
      case 'Present': return 'bg-success text-white';
      case 'Half Day': return 'bg-warning text-dark';
      case 'Exception': return 'bg-danger text-white';
      case 'Absent': return 'bg-secondary text-white';
      case 'Leave': return 'bg-info text-white';
      case 'Rest Day': return 'bg-primary text-white';
      default: return 'bg-light text-dark';
    }
  }

  viewRecord(record: any) {
    const idToPass = record.employee_id || record.empId || record.id;
    const queryParams: any = {};
    
    // Check if it's from daily view (has date) or monthly view
    if (record.date) {
      queryParams.date = record.date;
    } else {
      const [year, month] = this.filterMonth.split('-');
      queryParams.month = month;
      queryParams.year = year;
    }
    
    this.router.navigate(['/admin/attendance-management/attendance-detail', idToPass], { queryParams });
  }
}
