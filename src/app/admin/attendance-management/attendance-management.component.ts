import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/mat/mat.module';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { AttendanceManagementService } from 'src/app/core/services/attendance-management.service';
import { LeaveTypeService } from 'src/app/core/services/leave-type.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router, Params } from '@angular/router';
import { saveAs } from 'file-saver';

export interface SiteOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface UploadResult {
  status: number;
  message: string;
  errors: string[];
}

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
  relay: string;
  status: string;
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
  paidLeave?: number;
  unpaidLeave?: number;
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
  
  daysInMonth: number[] = [];
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
  maxDate: string = '';

  sites: SiteOption[] = [];
  mockSites: string[] = [];

  // Freeze date (e.g., records before 3rd of current month are locked)
  freezeDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 3);

  // Modal states
  showCorrectionModal = false;
  showBulkUploadModal = false;
  isUploading = false;
  
  uploadResult: UploadResult | null = null;
  correctionForm!: FormGroup;
  searchbarform!: FormGroup;
  showreset: boolean = false;
  selectedRecord: DailyAttendance | null = null;

  p: number = 1; // Pagination
  showEntries: any = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;

  selectedRecordIds = new Set<string>();

  activeLeaveTypes: any[] = [];
  showBulkLeaveModal = false;
  selectedLeaveTypeId: string | number | null = null;

  toggleSelection(recordId: string | number | undefined): void {
    if (!recordId) return;
    const idStr = recordId.toString();
    if (this.selectedRecordIds.has(idStr)) {
      this.selectedRecordIds.delete(idStr);
    } else {
      this.selectedRecordIds.add(idStr);
    }
  }

  isRecordSelected(recordId: string | number | undefined): boolean {
    if (!recordId) return false;
    return this.selectedRecordIds.has(recordId.toString());
  }

  toggleAllSelection(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.attendanceRecords.forEach(r => {
        if (r.employee_id) this.selectedRecordIds.add(r.employee_id.toString());
      });
    } else {
      this.attendanceRecords.forEach(r => {
        if (r.employee_id) this.selectedRecordIds.delete(r.employee_id.toString());
      });
    }
  }

  isAllSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    return this.attendanceRecords.every(r => r.employee_id && this.selectedRecordIds.has(r.employee_id.toString()));
  }

  isSomeSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    const count = this.attendanceRecords.filter(r => r.employee_id && this.selectedRecordIds.has(r.employee_id.toString())).length;
    return count > 0 && count < this.attendanceRecords.length;
  }

  clearSelection(): void {
    this.selectedRecordIds.clear();
  }

  markBulkAttendance(status: 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Rest Day', leaveTypeId?: string | number): void {
    if (this.selectedRecordIds.size === 0) {
      this.notificationService.show('Please select at least one employee.', 'error', 3000);
      return;
    }

    if (status === 'Leave' && !leaveTypeId) {
      this.selectedLeaveTypeId = null;
      this.showBulkLeaveModal = true;
      return;
    }

    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('attendance_status', status.toLowerCase().replace(' ', '_'));
    if (this.filterDate) {
      const formattedDate = this.datePipe.transform(this.filterDate, 'yyyy-MM-dd');
      if (formattedDate) formData.append('date', formattedDate);
    }
    if (status === 'Leave' && leaveTypeId) {
      formData.append('leave_type_id', leaveTypeId.toString());
    }

    this.selectedRecordIds.forEach(id => {
      formData.append('attendance_ids[]', id.toString());
    });

    this.attendanceService.updateBulkAttendanceStatus(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          this.notificationService.show(res.message, 'success', 3000);
          this.selectedRecordIds.clear();
          this.loadAttendance();
        } else {
          this.notificationService.show(res.message, 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show(err.message, 'error', 3000);
      }
    });
  }

  confirmBulkLeave() {
    if (!this.selectedLeaveTypeId) {
      this.notificationService.show('Please select a Leave Type', 'error', 3000);
      return;
    }
    this.markBulkAttendance('Leave', this.selectedLeaveTypeId);
    this.showBulkLeaveModal = false;
  }

  cancelBulkLeave() {
    this.showBulkLeaveModal = false;
    this.selectedLeaveTypeId = null;
  }

  markIndividualAttendance(record: DailyAttendance, status: 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Rest Day', leaveTypeId?: string | number): void {
    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('attendance_status', status.toLowerCase().replace(' ', '_'));
    const rawDate = record.date || this.filterDate;
    if (rawDate) {
      const formattedDate = this.datePipe.transform(rawDate, 'yyyy-MM-dd');
      if (formattedDate) formData.append('date', formattedDate);
    }
    if (status === 'Leave' && leaveTypeId) {
      formData.append('leave_type_id', leaveTypeId.toString());
    }
    formData.append('attendance_ids[]', record.employee_id?.toString() || '');

    this.attendanceService.updateBulkAttendanceStatus(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.success || res.status === 'success') {
          this.notificationService.show(res.message, 'success', 3000);
          this.loadAttendance();
        } else {
          this.notificationService.show(res.message, 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show(err.message, 'error', 3000);
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
    private leaveTypeService: LeaveTypeService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    this.maxDate = `${year}-${month}-${day}`;
    this.filterDate = this.maxDate;
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    this.filterMonth = `${today.getFullYear()}-${mm}`;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.initForms();
    this.fetchSites();
    this.fetchLeaveTypes();
    this.loadAttendance();
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

  fetchSites() {
    this.attendanceService.getSites().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.sites = res.data;
        }
      },
      error: (err: any) => console.error('Error fetching sites:', err)
    });
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

    this.correctionForm.get('status')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      const checkInCtrl = this.correctionForm.get('checkIn');
      const checkOutCtrl = this.correctionForm.get('checkOut');

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
        if (!this.correctionForm.contains('leaveTypeId')) {
          this.correctionForm.addControl('leaveTypeId', this.fb.control(null, Validators.required));
        }
      } else {
        if (this.correctionForm.contains('leaveTypeId')) {
          this.correctionForm.removeControl('leaveTypeId');
        }
      }
    });
  }


  loadAttendance() {
    let limit = this.showEntries;
    const page = this.p;
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
                shift: record.shift_name || '--',
                relay: record.relay_name || record.relay || '--',
                status: this.mapStatusToFrontend(record.attendance_status, record.attendance_status_label),
                site: record.site_name || '--'
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
            } else if (this.viewMode === 'monthly') {
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
                paidLeave: record.paid_leave || 0,
                unpaidLeave: record.unpaid_leave || 0,
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
            this.notificationService.show(response.message, 'error', 3000);
          }
        },
        error: (err: any) => {
          console.error('Error fetching attendance:', err);
          this.notificationService.show(err.message, 'error', 3000);
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

  mapStatusToFrontend(backendStatus: string, backendLabel?: string): string {
    if (!backendStatus) return 'Not Marked';
    if (backendLabel) return backendLabel;
    
    return backendStatus
      .split(/[-_ ]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    this.filterDate = `${year}-${month}-${day}`;
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
      // Reset the input value so selecting the same file again triggers the event
      input.value = '';
    }
  }

  handleFile(file: File) {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.type !== 'application/vnd.ms-excel' &&
      !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      this.notificationService.show('Invalid file type. Please upload an Excel or CSV file.', 'error', 3000);
      return;
    }

    this.isUploading = true;
    this.uploadResult = null;

    this.attendanceService.bulkUploadAttendance(file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        if (response && (response.status === 200 || response.status === 201) && (!response.errors || response.errors.length === 0)) {
          this.notificationService.show(response.message || 'File uploaded successfully', 'success', 3000);
          this.closeBulkUploadModal();
          this.p = 1;
          this.loadAttendance();
        } else {
          this.uploadResult = {
            status: response.status || 422,
            message: response.message || 'Import process completed with errors.',
            errors: response.errors || []
          };
        }
      },
      error: (err: any) => {
        this.isUploading = false;
        console.error('Error during bulk upload:', err);
        const errObj = err.originalError || err.error || err;
        let formattedErrors: string[] = [];

        if (errObj.errors) {
          if (Array.isArray(errObj.errors)) {
            formattedErrors = errObj.errors.map((e: any) => {
              if (typeof e === 'object' && e !== null) {
                const col = e.column ? ` [${e.column}]` : '';
                return `Row ${e.row || 'N/A'}${col}: ${e.message || 'Unknown error'}`;
              }
              return String(e);
            });
          } else if (typeof errObj.errors === 'object') {
            Object.values(errObj.errors).forEach((errArray: any) => {
              if (Array.isArray(errArray)) {
                formattedErrors.push(...errArray);
              } else if (typeof errArray === 'string') {
                formattedErrors.push(errArray);
              }
            });
          }
        }

        this.uploadResult = {
          status: err.status || errObj.status || 422,
          message: errObj.message || err.message || 'Upload failed',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
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
    if (!record.id) {
      this.fallbackOpenCorrectionModal(record);
      return;
    }

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
            status = this.mapStatusToFrontend(data.attendance_status, data.attendance_status_label);
          }

          this.correctionForm.patchValue({
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            status: status,
            site: data.site_id || '',
            reason: data.remarks || ''
          });

          if (status === 'Leave' && data.leave_type_id) {
            this.correctionForm.patchValue({ leaveTypeId: Number(data.leave_type_id) });
          }
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
      site: (record as any).site_id || '',
      reason: ''
    });

    if (record.status === 'Leave' && (record as any).leave_type_id) {
      this.correctionForm.patchValue({ leaveTypeId: Number((record as any).leave_type_id) });
    }
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

    const newStatus = status as 'Present' | 'Absent' | 'Half Day' | 'Rest Day' | 'Leave'; // Use the explicitly chosen status

    const formData = new FormData();
    
    // Exact keys based on backend JSON schema
    formData.append('employee_id', this.selectedRecord.employee_id?.toString() || '');
    
    const formattedDate = this.datePipe.transform(this.filterDate, 'yyyy-MM-dd');
    formData.append('date', formattedDate || this.filterDate);
    
    formData.append('attendance_status', newStatus.toLowerCase().replace(' ', '_'));
    if (reason) formData.append('remarks', reason);

    if (newStatus === 'Leave') {
      if (formValues.leaveTypeId) {
        formData.append('leave_type_id', formValues.leaveTypeId);
      }
    } else {
      if (newCheckIn) formData.append('check_in', newCheckIn);
      if (newCheckOut) formData.append('check_out', newCheckOut);
      if (site) formData.append('site_id', site);
    }

    this.attendanceService.updateAttendance(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.success || response.status === 'success') {
          this.notificationService.show(response.message, 'success', 3000);
          this.closeCorrectionModal();
          this.p = 1;
          this.loadAttendance();
        } else {
          this.notificationService.show(response.message, 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error updating attendance:', err);
        // Toast is already handled globally by ApiService
      }
    });
  }

  // --- Bulk Upload Modal ---
  openBulkUploadModal() {
    this.showBulkUploadModal = true;
    this.isUploading = false;
    this.uploadResult = null;
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
      case 'Holiday': return 'bg-info text-white';
      case 'Not Marked': return 'bg-light text-muted border border-secondary';
      default: return 'bg-secondary text-white';
    }
  }

  viewRecord(record: DailyAttendance | MonthlyAttendanceSummary | any) {
    const idToPass = record.employee_id || record.empId || (record as any).id;
    const queryParams: { [key: string]: any } = {};

    // Check if it's from daily view (has date) or monthly view
    if (this.viewMode === 'daily' && record.date) {
      queryParams['date'] = record.date;
    } else if (this.filterMonth) {
      const [y, m] = this.filterMonth.split('-');
      queryParams['month'] = parseInt(m, 10).toString();
      queryParams['year'] = y;
    }

    this.router.navigate(['/admin/attendance-management/attendance-detail', idToPass], { queryParams });
  }

}
