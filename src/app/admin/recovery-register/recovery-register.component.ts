import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface RecoveryUploadFile {
  id: number | string;
  month: string;
  year: number;
  fileName: string;
  userName: string;
  totalEmployees: number;
  errorRows: number;
  canSubmit: boolean;
  isSubmitted: boolean;
  status: string;
  documentId: string;
  uploadedAt: string;
}

export interface RecoveryUploadSummary {
  id: number | string | null;
  documentId?: string;
  document_id?: string;
  fileName?: string;
  file_name?: string;
  month?: string;
  year?: number;
  uploadBy?: string;
  uploaded_by?: string;
  status: string;
  totalRows?: number;
  total_employees?: number;
  errorRows?: number;
  canSubmit?: boolean;
}

export interface RecoveryRowItem {
  id: number | string;
  recoveryUploadId?: number | string;
  employeeId?: number | string;
  employeeCode: string;
  employeeName: string;
  recoveryType: string;
  particulars: string;
  amount: number;
  damageLossDate: string;
  showCauseIssued: boolean | string;
  explanationWitness: string;
  numberOfInstallments: number;
  firstMonthYear: string;
  lastMonthYear: string;
  completeRecoveryDate: string;
  remarks: string;
  createdAt?: string;
  hasError?: boolean;
  isEditingremarks?: boolean;
  isExtra?: boolean;
  isEditingparticulars?: boolean;
  dateOfDamageLoss?: string;
  isEditingamount?: boolean;
  amountError?: boolean;
  witnessName?: string;
  installments?: number;
  firstMonth?: string;
  lastMonth?: string;
  dateOfCompleteRecovery?: string;
  empCode?: string;
  name?: string;
  isEditingname?: boolean;
  isEditingrecoveryType?: boolean;
  typeError?: boolean;
  isEditingempCode?: boolean;
  sNo?: number | string;
  errorMessages?: string[];
  errors?: any;

  // Explicitly defined error flags for strict templates
  empCodeError?: boolean;
  nameError?: boolean;
  particularsError?: boolean;
  dateOfDamageLossError?: boolean;
  showCauseIssuedError?: boolean;
  witnessNameError?: boolean;
  installmentsError?: boolean;
  firstMonthError?: boolean;
  lastMonthError?: boolean;
  dateOfCompleteRecoveryError?: boolean;
  remarksError?: boolean;

  // Explicitly defined editing flags for strict templates
  isEditingdateOfDamageLoss?: boolean;
  isEditingshowCauseIssued?: boolean;
  isEditingwitnessName?: boolean;
  isEditinginstallments?: boolean;
  isEditingfirstMonth?: boolean;
  isEditinglastMonth?: boolean;
  isEditingdateOfCompleteRecovery?: boolean;

  [key: string]: any;
}

export interface SingleRecoveryDetail {
  id: number | string;
  recoveryUploadId: number | string;
  documentId: string;
  employeeId: number | string;
  employeeCode: string;
  employeeName: string;
  recoveryType: string;
  totalAmount: number;
  installments: number;
  damageLossDate: string;
  showCauseIssued: boolean;
  firstMonthYear: string;
  lastMonthYear: string;
  completeRecoveryDate: string;
  explanationWitness: string;
  particulars: string;
  remarks: string;
  createdAt: string;
}

@Component({
  selector: 'app-recovery-register',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './recovery-register.component.html',
  styleUrls: ['./recovery-register.component.scss']
})
export class RecoveryRegisterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentView: string = 'overview'; // 'overview', 'detail', 'add', 'file-preview-details'
  selectedYear: number = new Date().getFullYear();
  years: number[] = [2026, 2025, 2024, 2023];
  tableSizes: number[] = [10, 20, 50, 100];

  overviewP: number = 1;
  overviewShowEntries: number = 10;
  totalOverviewRecords: number = 0;
  isLoadingUploads: boolean = false;

  p: number = 1;
  showEntries: number = 10;
  totalDetailRecords: number = 0;
  isLoadingDetails: boolean = false;
  searchTerm: string = '';

  overviewSearchTerm: string = '';
  selectedRecoveryType: string = 'All';
  recoveryTypes: string[] = ['All', 'Damage', 'Penalty', 'Advance'];
  selectedShowCause: string = 'All';
  showCauseOptions: string[] = ['All', 'Yes', 'No'];
  selectedStatus: string = 'All';
  statusOptions: string[] = ['All', 'In Progress', 'Completed'];

  viewDetailsOpen: boolean = false;
  viewingRecord: any = null;

  selectedRecord: RecoveryUploadFile | null = null;
  selectedUploadSummary: RecoveryUploadSummary | null = null;
  singleRecoveryDetail: SingleRecoveryDetail | null = null;
  isLoadingSingleDetail: boolean = false;
  uploadRowsList: RecoveryRowItem[] = [];
  isLoadingUploadRows: boolean = false;
  uploadRowsP: number = 1;
  uploadRowsShowEntries: number = 10;
  totalUploadRowsRecords: number = 0;
  uploadRowsSearchTerm: string = '';
  selectedMonthDetails: any = {
    month: 'N/A',
    year: '2026',
    totalAmount: 0,
    totalPenalties: 0,
    status: 'Active'
  };

  recoveryRecords: RecoveryRowItem[] = [];
  uploadedFilesList: RecoveryUploadFile[] = [];
  previewRecords: RecoveryRowItem[] = [];

  hasValidationErrors: boolean = false;
  uploadedFileSummary: RecoveryUploadSummary | null = null;
  currentUploadId: number | string | null = null;
  isLoadingPreview: boolean = false;
  isSubmitting: boolean = false;

  isFileUploaded: boolean = false;
  fileName: string = '';
  fileSizeStr: string = '';
  fileDate: string = '';

  isDragging: boolean = false;
  selectedFile: File | null = null;
  isValidating: boolean = false;
  showPreviewTable: boolean = false;

  constructor(
    private router: Router,
    private employeeManagementService: EmployeeManagementService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadRecoveryUploads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecoveryUploads(): void {
    this.isLoadingUploads = true;
    this.employeeManagementService.getRecoveryUploads(this.selectedYear, this.overviewP, this.overviewShowEntries, this.overviewSearchTerm)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isLoadingUploads = false;
          if (res && (res.status === 200 || res.status === 201) && res.data) {
            const paginatedData = res.data;
            const apiData = Array.isArray(paginatedData) ? paginatedData : (paginatedData.data || paginatedData.items || []);

            this.uploadedFilesList = apiData.map((item: any) => ({
              id: item.id || item.document_id,
              month: item.month || item.month_name || 'N/A',
              year: item.year || this.selectedYear,
              fileName: item.file_name || item.filename || 'recovery_file.xlsx',
              userName: typeof item.uploaded_by === 'string' ? item.uploaded_by : (item.uploaded_by?.name || 'Admin User'),
              totalEmployees: item.total_rows !== undefined ? item.total_rows : (item.total_employees || 0),
              errorRows: item.error_rows || 0,
              canSubmit: item.can_submit !== false,
              isSubmitted: true,
              status: item.status || 'Success',
              documentId: item.document_id || (`DOC-000` + item.id),
              uploadedAt: item.uploaded_at || item.created_at || ''
            }));
            this.totalOverviewRecords = paginatedData.total !== undefined ? paginatedData.total : (res.pagination?.total || this.uploadedFilesList.length);
          } else {
            this.uploadedFilesList = [];
            this.totalOverviewRecords = 0;
          }
        },
        error: (err: any) => {
          this.isLoadingUploads = false;
          console.error('Failed to load recovery uploads:', err);
        }
      });
  }

  onOverviewPageChange(event: any): void {
    this.overviewP = event;
    this.loadRecoveryUploads();
  }

  onOverviewShowEntriesChange(): void {
    this.overviewP = 1;
    this.loadRecoveryUploads();
  }

  onPageChange(event: any): void {
    this.p = event;
    if (this.selectedRecord) {
      this.loadRecoveryReportDetails(this.selectedRecord.id || this.selectedRecord.documentId);
    }
  }

  onShowEntriesChange(): void {
    this.p = 1;
    if (this.selectedRecord) {
      this.loadRecoveryReportDetails(this.selectedRecord.id || this.selectedRecord.documentId);
    }
  }

  goToOverview(): void {
    this.currentView = 'overview';
    this.selectedRecord = null;
    this.loadRecoveryUploads();
  }

  goToDetail(rec: any): void {
    this.viewFileDetails(rec);
  }

  goToAdd(): void {
    this.currentView = 'add';
    this.removeFile();
    this.loadStagingUploads();
  }

  loadStagingUploads(): void {
    this.employeeManagementService.getRecoveryUploadsLog(this.selectedYear, 1, 10).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const apiData = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
          const unsubmittedItem = apiData.find((item: any) => item.is_submitted === false || item.submitted === false);

          if (unsubmittedItem) {
            this.currentUploadId = unsubmittedItem.id;
            this.hasValidationErrors = unsubmittedItem.status === 'failed' || (unsubmittedItem.error_rows && unsubmittedItem.error_rows > 0) || unsubmittedItem.can_submit === false;

            this.uploadedFileSummary = {
              id: unsubmittedItem.id,
              documentId: unsubmittedItem.document_id || ('DOC-000' + unsubmittedItem.id),
              fileName: unsubmittedItem.file_name || 'Loan_Recovery.xlsx',
              uploadBy: typeof unsubmittedItem.uploaded_by === 'string' ? unsubmittedItem.uploaded_by : (unsubmittedItem.uploaded_by?.name || 'Admin User'),
              status: this.hasValidationErrors ? 'Failed' : 'Success',
              totalRows: unsubmittedItem.total_rows || 0,
              errorRows: unsubmittedItem.error_rows || 0,
              canSubmit: unsubmittedItem.can_submit !== false
            };
            this.showPreviewTable = true;
          }
        }
      },
      error: (err: any) => {
        console.error('Failed to check staging upload logs:', err);
      }
    });
  }

  setYear(normalizedYear: Date, datepicker: MatDatepicker<Date>): void {
    this.selectedYear = normalizedYear.getFullYear();
    datepicker.close();
    this.loadRecoveryUploads();
  }

  openViewDetails(rec: any): void {
    this.viewingRecord = rec;
    this.viewDetailsOpen = true;
  }

  closeViewDetails(): void {
    this.viewDetailsOpen = false;
    this.viewingRecord = null;
  }

  viewFileDetails(file: any): void {
    this.openUploadRowsPreview(file);
  }

  openUploadRowsPreview(file: any): void {
    this.selectedRecord = file;
    this.uploadRowsP = 1;
    this.uploadRowsSearchTerm = '';
    this.currentView = 'upload-rows-preview';
    this.loadUploadRows(file.id || file.documentId);
  }

  loadUploadRows(uploadId: any): void {
    this.isLoadingUploadRows = true;
    const targetId = uploadId || (this.selectedRecord ? (this.selectedRecord.id || this.selectedRecord.documentId) : null);
    if (!targetId) {
      this.isLoadingUploadRows = false;
      return;
    }

    this.employeeManagementService.getRecoveryUploadRows(targetId, this.uploadRowsP, this.uploadRowsShowEntries, this.uploadRowsSearchTerm)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isLoadingUploadRows = false;
          if (res && (res.status === 200 || res.status === 201) && res.data) {
            const data = res.data;

            if (data.upload) {
              this.selectedUploadSummary = {
                id: data.upload.id,
                document_id: data.upload.document_id || ('DOC-000' + data.upload.id),
                file_name: data.upload.file_name || 'Loan_Recovery.xlsx',
                month: data.upload.month || 'N/A',
                year: data.upload.year || this.selectedYear,
                uploaded_by: typeof data.upload.uploaded_by === 'string'
                  ? data.upload.uploaded_by
                  : (data.upload.uploaded_by?.name || 'Admin'),
                status: data.upload.status || 'success',
                total_employees: data.upload.total_employees || 0
              };
            } else {
              this.selectedUploadSummary = {
                id: targetId,
                document_id: this.selectedRecord?.documentId || ('DOC-000' + targetId),
                file_name: this.selectedRecord?.fileName || 'Loan_Recovery.xlsx',
                month: this.selectedRecord?.month || 'N/A',
                year: this.selectedRecord?.year || this.selectedYear,
                uploaded_by: this.selectedRecord?.userName || 'Admin',
                status: this.selectedRecord?.status || 'success',
                total_employees: this.selectedRecord?.totalEmployees || 0
              };
            }

            const rowsObj = data.rows;
            let rawRows: any[] = [];
            if (Array.isArray(rowsObj)) {
              rawRows = rowsObj;
              this.totalUploadRowsRecords = rawRows.length;
            } else if (rowsObj && Array.isArray(rowsObj.data)) {
              rawRows = rowsObj.data;
              this.totalUploadRowsRecords = rowsObj.total !== undefined ? rowsObj.total : rawRows.length;
            } else {
              rawRows = [];
              this.totalUploadRowsRecords = 0;
            }

            this.uploadRowsList = rawRows.map((r: any, idx: number) => ({
              id: r.id || idx + 1,
              recoveryUploadId: r.recovery_upload_id,
              employeeId: r.employee_id,
              employeeCode: r.employee_code || r.emp_code || 'N/A',
              employeeName: r.employee_name || r.name || 'N/A',
              recoveryType: r.recovery_type || 'Damage',
              particulars: r.particulars || '-',
              amount: parseFloat(r.amount || 0),
              damageLossDate: r.damage_loss_date || '-',
              showCauseIssued: r.show_cause_issued === true || r.show_cause_issued === 1 || r.show_cause_issued === '1' || String(r.show_cause_issued).toLowerCase() === 'true' || String(r.show_cause_issued).toLowerCase() === 'yes',
              explanationWitness: r.explanation_witness || r.witness_name || '-',
              numberOfInstallments: r.number_of_installments || 1,
              firstMonthYear: r.first_month_year || '-',
              lastMonthYear: r.last_month_year || '-',
              completeRecoveryDate: r.complete_recovery_date || '-',
              remarks: r.remarks || '-',
              createdAt: r.created_at || '-'
            }));

          } else {
            this.uploadRowsList = [];
            this.totalUploadRowsRecords = 0;
          }
        },
        error: (err: any) => {
          this.isLoadingUploadRows = false;
          console.error('Failed to load recovery upload rows:', err);
        }
      });
  }

  onUploadRowsPageChange(event: any): void {
    this.uploadRowsP = event;
    if (this.selectedRecord) {
      this.loadUploadRows(this.selectedRecord.id || this.selectedRecord.documentId);
    }
  }

  onUploadRowsShowEntriesChange(): void {
    this.uploadRowsP = 1;
    if (this.selectedRecord) {
      this.loadUploadRows(this.selectedRecord.id || this.selectedRecord.documentId);
    }
  }

  calculateUploadTotalAmount(): number {
    return this.uploadRowsList.reduce((sum, row) => sum + (row.amount || 0), 0);
  }

  getRecoveryTypeBadgeClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('DAMAGE')) return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (t.includes('LOSS')) return 'bg-warning-subtle text-dark border border-warning-subtle';
    if (t.includes('FINE')) return 'bg-info-subtle text-info border border-info-subtle';
    if (t.includes('ADVANCE')) return 'bg-primary-subtle text-primary border border-primary-subtle';
    if (t.includes('LOAN')) return 'bg-success-subtle text-success border border-success-subtle';
    return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }

  previousViewBeforeSingleDetail: string = 'upload-rows-preview';

  openSingleRecoveryDetail(rec: any): void {
    const rowId = rec?.id || rec;
    if (!rowId) return;

    this.previousViewBeforeSingleDetail = this.currentView || 'upload-rows-preview';
    this.isLoadingSingleDetail = true;
    this.singleRecoveryDetail = null;
    this.currentView = 'single-recovery-detail';

    this.employeeManagementService.getSingleRecoveryDetail(rowId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoadingSingleDetail = false;
        if (res && (res.status === 200 || res.status === 201) && res.data) {
          const data = res.data;
          this.singleRecoveryDetail = {
            id: data.id,
            recoveryUploadId: data.recovery_upload_id,
            documentId: data.document_id || ('DOC-000' + data.id),
            employeeId: data.employee_id,
            employeeCode: data.employee_code || 'N/A',
            employeeName: data.employee_name || 'N/A',
            recoveryType: data.recovery_type || 'Damage Recovery',
            totalAmount: parseFloat(data.total_amount || data.amount || 0),
            installments: data.installments || data.number_of_installments || 1,
            damageLossDate: data.damage_loss_date || '-',
            showCauseIssued: data.show_cause_issued === true || data.show_cause_issued === 1 || String(data.show_cause_issued).toLowerCase() === 'yes',
            firstMonthYear: data.first_month_year || '-',
            lastMonthYear: data.last_month_year || '-',
            completeRecoveryDate: data.complete_recovery_date || '-',
            explanationWitness: data.explanation_witness || '-',
            particulars: data.particulars || '-',
            remarks: data.remarks || '-',
            createdAt: data.created_at || '-'
          };
        } else {
          this.singleRecoveryDetail = null;
        }
      },
      error: (err: any) => {
        this.isLoadingSingleDetail = false;
        console.error('Failed to fetch single recovery detail:', err);
      }
    });
  }

  goBackToUploadPreview(): void {
    this.currentView = this.previousViewBeforeSingleDetail || 'upload-rows-preview';
  }

  loadRecoveryReportDetails(reportId: any): void {
    this.isLoadingDetails = true;
    this.employeeManagementService.getRecoveryReportDetails(reportId, this.p, this.showEntries, this.searchTerm)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isLoadingDetails = false;
          if (res && (res.status === 200 || res.status === 201) && res.data) {
            const data = res.data;
            this.selectedMonthDetails = {
              month: data.month || this.selectedRecord?.month || 'N/A',
              year: data.year || this.selectedRecord?.year || this.selectedYear,
              totalAmount: data.total_amount || data.total_recovered_amount || 0,
              totalPenalties: data.total_penalties || data.total_rows || 0,
              status: data.status || 'Active'
            };
            const rows = Array.isArray(data) ? data : (data.records || data.rows || data.items || []);
            this.recoveryRecords = this.mapPreviewRows(rows);
            this.totalDetailRecords = res.pagination?.total || this.recoveryRecords.length;
          } else {
            this.recoveryRecords = [];
            this.totalDetailRecords = 0;
          }
        },
        error: (err: any) => {
          this.isLoadingDetails = false;
          console.error('Failed to fetch recovery report details:', err);
        }
      });
  }

  downloadTemplate(): void {
    const link = document.createElement("a");
    link.setAttribute("href", "assets/Loan_Recovery.xlsx");
    link.setAttribute("download", "Loan_Recovery.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    this.selectedFile = file;
    this.isFileUploaded = true;
    this.fileName = file.name;
    this.fileSizeStr = (file.size / 1024).toFixed(2) + ' KB';
    this.fileDate = new Date().toLocaleDateString();

    this.isValidating = true;
    this.showPreviewTable = false;

    const formData = new FormData();
    formData.append('file', file);

    this.employeeManagementService.uploadBulkRecoveries(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isValidating = false;
        if (response && (response.status === 200 || response.status === 201) && response.data) {
          const data = response.data;
          this.notificationService.show(response.message || 'File uploaded and validated successfully.', 'success', 3000);

          this.currentUploadId = data.id;
          this.hasValidationErrors = data.status === 'failed' || (data.error_rows && data.error_rows > 0) || data.can_submit === false;

          this.uploadedFileSummary = {
            id: data.id,
            documentId: data.document_id || ('DOC-000' + data.id),
            fileName: data.file_name || file.name,
            uploadBy: typeof data.uploaded_by === 'string' ? data.uploaded_by : (data.uploaded_by?.name || 'Admin User'),
            status: this.hasValidationErrors ? 'Failed' : 'Success',
            totalRows: data.total_rows || 0,
            errorRows: data.error_rows || 0,
            canSubmit: data.can_submit !== false
          };

          this.showPreviewTable = true;
          if (data.preview || data.rows) {
            this.previewRecords = this.mapPreviewRows(data.preview || data.rows);
          }
        } else {
          this.notificationService.show(response.message || 'File upload failed', 'error', 3000);
          this.uploadedFileSummary = {
            id: null,
            documentId: '-',
            fileName: file.name,
            uploadBy: 'Admin User',
            status: 'Failed'
          };
          this.hasValidationErrors = true;
          this.showPreviewTable = true;
        }
      },
      error: (error: any) => {
        this.isValidating = false;
        const errorMsg = error.error?.message || error.message || 'File upload failed';
        this.notificationService.show(errorMsg, 'error', 3000);
        this.uploadedFileSummary = {
          id: null,
          documentId: '-',
          fileName: file.name,
          uploadBy: 'Admin User',
          status: 'Failed'
        };
        this.hasValidationErrors = true;
        this.showPreviewTable = true;
      }
    });
  }

  loadPreviewDetails(uploadId: any): void {
    this.isLoadingPreview = true;
    this.employeeManagementService.getRecoveryPreviewDetails(uploadId, 1, 100).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoadingPreview = false;
        if (res && (res.status === 200 || res.status === 201) && res.data) {
          const uploadData = res.data;

          this.uploadedFileSummary = {
            id: uploadData.id || uploadId,
            documentId: uploadData.document_id || ('DOC-000' + (uploadData.id || uploadId)),
            fileName: uploadData.file_name || 'Loan_Recovery.xlsx',
            uploadBy: typeof uploadData.uploaded_by === 'string' ? uploadData.uploaded_by : (uploadData.uploaded_by?.name || 'Admin User'),
            status: uploadData.status === 'failed' || uploadData.can_submit === false ? 'Failed' : 'Success',
            totalRows: uploadData.total_rows || 0,
            errorRows: uploadData.error_rows || 0,
            canSubmit: uploadData.can_submit !== false
          };

          const rows = Array.isArray(uploadData) ? uploadData : (uploadData.rows || uploadData.preview || []);
          this.previewRecords = this.mapPreviewRows(rows);
          this.hasValidationErrors = uploadData.can_submit === false || uploadData.status === 'failed' || this.previewRecords.some((r: any) => r.hasError);
        }
      },
      error: (err: any) => {
        this.isLoadingPreview = false;
        console.error('Failed to load preview details:', err);
      }
    });
  }

  mapPreviewRows(rows: any[]): any[] {
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any, idx: number) => {
      const errorsObj = r.errors || {};
      const errorMessages = typeof errorsObj === 'object' && errorsObj !== null ? Object.values(errorsObj).flat().filter(Boolean) : [];
      const isInvalid = r.is_valid === false || r.has_error || errorMessages.length > 0;

      const isExtraRow = !!r.is_extra || !!r.isExtra || errorMessages.some(msg => typeof msg === 'string' && msg.includes('Employee does not exist.'));

      return {
        id: r.id || r.row_id || idx + 1,
        sNo: r.s_no || r.row_no || idx + 1,
        empCode: r.employee_code || r.emp_code || r.empId || r.employee_id || '',
        name: r.name || r.employee_name || 'N/A',
        recoveryType: (r.recovery_type || r.recoveryType || 'damage').toUpperCase(),
        particulars: r.particulars || r.reason || '',
        dateOfDamageLoss: r.damage_loss_date || r.date_of_damage_loss || r.dateOfDamageLoss || '',
        amount: r.amount || 0,
        showCauseIssued: String(r.show_cause_issued).toLowerCase() === 'yes' || r.show_cause_issued === 1 || r.show_cause_issued === '1' ? 'Yes' : 'No',
        witnessName: r.explanation_witness || r.witness_name || r.witnessName || '',
        installments: r.number_of_installments || r.installments || 1,
        firstMonth: r.first_month_year || r.first_month || r.firstMonth || '',
        lastMonth: r.last_month_year || r.last_month || r.lastMonth || '',
        dateOfCompleteRecovery: r.complete_recovery_date || r.date_of_complete_recovery || r.dateOfCompleteRecovery || '',
        remarks: r.remarks || '',
        errors: errorsObj,
        errorMessages: errorMessages,
        hasError: isInvalid,
        typeError: !!(errorsObj && errorsObj.recovery_type) || !!r.type_error || !!r.typeError,
        amountError: !!(errorsObj && errorsObj.amount) || !!r.amount_error || !!r.amountError,
        empCodeError: !!(errorsObj && errorsObj.employee_code),
        nameError: !!(errorsObj && errorsObj.name),
        particularsError: !!(errorsObj && errorsObj.particulars),
        dateOfDamageLossError: !!(errorsObj && errorsObj.damage_loss_date),
        showCauseIssuedError: !!(errorsObj && errorsObj.show_cause_issued),
        witnessNameError: !!(errorsObj && errorsObj.explanation_witness),
        installmentsError: !!(errorsObj && errorsObj.number_of_installments),
        firstMonthError: !!(errorsObj && errorsObj.first_month_year),
        lastMonthError: !!(errorsObj && errorsObj.last_month_year),
        dateOfCompleteRecoveryError: !!(errorsObj && errorsObj.complete_recovery_date),
        remarksError: !!(errorsObj && errorsObj.remarks),
        isExtra: isExtraRow
      };
    });
  }

  removeFile(): void {
    this.isFileUploaded = false;
    this.selectedFile = null;
    this.fileName = '';
    this.fileSizeStr = '';
    this.fileDate = '';
    this.previewRecords = [];
    this.hasValidationErrors = false;
    this.showPreviewTable = false;
    this.uploadedFileSummary = null;
    this.currentUploadId = null;
  }

  openFilePreview(): void {
    this.currentView = 'file-preview-details';
    if (this.currentUploadId) {
      this.loadPreviewDetails(this.currentUploadId);
    }
  }

  goBackToUpload(): void {
    this.currentView = 'add';
  }

  closeRowPreview(): void {
    this.removeFile();
    this.goToOverview();
  }

  submitPenaltyData(): void {
    if (!this.currentUploadId) {
      this.notificationService.show('No document available to submit.', 'error', 3000);
      return;
    }

    if (this.hasValidationErrors) {
      this.notificationService.show('Please resolve all validation errors before submitting.', 'error', 3000);
      return;
    }

    this.isSubmitting = true;
    this.employeeManagementService.submitRecoveryUpload(this.currentUploadId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && (res.status === 200 || res.status === 201 || res.status === 'success')) {
          this.notificationService.show(res.message || 'Recovery data submitted successfully!', 'success', 3000);
          this.removeFile();
          this.goToOverview();
        } else {
          this.notificationService.show(res.message || 'Failed to submit recovery data', 'error', 3000);
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.message || 'Failed to submit recovery data';
        this.notificationService.show(msg, 'error', 3000);
        console.error('Failed to submit recovery upload:', err);
      }
    });
  }

  saveRowLevelChanges(): void {
    this.submitPenaltyData();
  }

  deletePreviewRow(index: number): void {
    const row = this.previewRecords[index];
    if (this.currentUploadId && row && row.id) {
      this.employeeManagementService.deleteRecoveryPreviewRow(this.currentUploadId, row.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.previewRecords.splice(index, 1);
          this.hasValidationErrors = this.previewRecords.some((r: any) => r.hasError);
          this.notificationService.show('Row deleted successfully', 'success', 2000);
        },
        error: (err: any) => {
          // this.notificationService.show('Failed to delete row', 'error', 3000);
        }
      });
    } else {
      this.previewRecords.splice(index, 1);
      this.hasValidationErrors = this.previewRecords.some((r: any) => r.hasError);
    }
  }

  editField(row: any, field: string): void {
    row['isEditing' + field] = true;
  }

  getApiFieldName(field: string): string {
    const map: { [key: string]: string } = {
      empCode: 'employee_code',
      name: 'name',
      recoveryType: 'recovery_type',
      particulars: 'particulars',
      dateOfDamageLoss: 'damage_loss_date',
      amount: 'amount',
      showCauseIssued: 'show_cause_issued',
      witnessName: 'explanation_witness',
      installments: 'number_of_installments',
      firstMonth: 'first_month_year',
      lastMonth: 'last_month_year',
      dateOfCompleteRecovery: 'complete_recovery_date',
      remarks: 'remarks'
    };
    return map[field] || field;
  }

  saveField(row: any, field: string): void {
    row['isEditing' + field] = false;

    if (row && row.id) {
      const apiFieldName = this.getApiFieldName(field);
      const val = row[field] !== undefined && row[field] !== null ? String(row[field]) : '';

      const payload = {
        field: apiFieldName,
        value: val,
        _method: 'PUT'
      };

      this.employeeManagementService.updateRecoveryRow(row.id, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 201 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Row updated successfully.', 'success', 2000);

            if (res.data) {
              const updated = res.data;
              row.empCode = updated.employee_code || row.empCode;
              row.name = updated.name || row.name;
              if (updated.recovery_type) {
                row.recoveryType = updated.recovery_type.toUpperCase();
              }
              row.particulars = updated.particulars || row.particulars;
              row.amount = updated.amount || row.amount;
              row.hasError = updated.is_valid === false;
              row.errors = updated.errors || {};
              row.errorMessages = typeof updated.errors === 'object' && updated.errors !== null
                ? Object.values(updated.errors).flat().filter(Boolean)
                : [];

              row.empCodeError = !!row.errors.employee_code;
              row.nameError = !!row.errors.name;
              row.typeError = !!row.errors.recovery_type;
              row.particularsError = !!row.errors.particulars;
              row.dateOfDamageLossError = !!row.errors.damage_loss_date;
              row.amountError = !!row.errors.amount;
              row.showCauseIssuedError = !!row.errors.show_cause_issued;
              row.witnessNameError = !!row.errors.explanation_witness;
              row.installmentsError = !!row.errors.number_of_installments;
              row.firstMonthError = !!row.errors.first_month_year;
              row.lastMonthError = !!row.errors.last_month_year;
              row.dateOfCompleteRecoveryError = !!row.errors.complete_recovery_date;
              row.remarksError = !!row.errors.remarks;
              row.isExtra = !!updated.is_extra || !!updated.isExtra || row.errorMessages.some((msg: any) => typeof msg === 'string' && msg.includes('Employee does not exist.'));
            }

            const uploadInfo = res.upload || res.data?.upload;
            if (uploadInfo) {
              const canSubmit = uploadInfo.can_submit !== undefined ? uploadInfo.can_submit : (uploadInfo.error_rows === 0);
              this.hasValidationErrors = !canSubmit;
              if (this.uploadedFileSummary) {
                this.uploadedFileSummary.errorRows = uploadInfo.error_rows !== undefined ? uploadInfo.error_rows : this.uploadedFileSummary.errorRows;
                this.uploadedFileSummary.canSubmit = canSubmit;
                this.uploadedFileSummary.status = canSubmit ? 'Success' : 'Failed';
              }
            } else {
              this.hasValidationErrors = this.previewRecords.some((r: any) => r.hasError);
            }
          } else {
            this.notificationService.show(res.message || 'Failed to update row', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errMsg = err?.error?.message || err?.message || 'Failed to update row';
          this.notificationService.show(errMsg, 'error', 3000);
          console.error('Failed to update row:', err);
        }
      });
    }
  }

  checkValidation(row: any): void {
    if (row.recoveryType !== 'Invalid Type') {
      row.typeError = false;
    }
    if (row.amount > 0) {
      row.amountError = false;
    }

    if (!row.typeError && !row.amountError) {
      row.hasError = false;
      row.remarks = 'Corrected by user';
    } else {
      row.hasError = true;
    }

    this.hasValidationErrors = this.previewRecords.some((r: any) => r.hasError || r.typeError || r.amountError);
  }

  chosenYearHandler(event: any, datepicker: any): void {
    this.selectedYear = event.getFullYear();
    datepicker.close();
    this.loadRecoveryUploads();
  }
}