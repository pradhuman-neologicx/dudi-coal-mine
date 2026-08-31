import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { EmployeeService } from '../../core/services/Employee.service';
import { NotificationService } from '../../core/services/notificationnew.service';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

export interface ReportSummary {
  id: number | string;
  monthLabel: string;
  generatedAt: string;
  generatedBy: string;
  employeeCount: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNet: number;
  unrecoveredDeduction: number;
}

export interface UploadedFileSummary {
  uploadId: number | string | null;
  documentId: string;
  fileName: string;
  uploadBy: string;
  status: string;
  hasErrors: boolean;
}

export interface ApiFileInfo {
  name: string;
  size: string;
  url: string;
}

interface MonthlySalary {
  month: string;
  year: number;
  totalEmployees: number | string;
  grossSalary: number | string;
  totalDeductions: number | string;
  netSalary: number | string;
  status: 'GENERATED' | 'NOT GENERATED' | 'PROCESSING' | string;
  reportId?: number | null;
  rawMonthNumber?: number;
  generatedAt?: string | null;
}

interface EmployeeSalaryDetail {
  id: string;
  name: string;
  initials: string;
  bgColor: string;
  department: string;
  designation: string;
  // Earnings
  rateOfWage: string;
  daysWorked: number;
  overtimeHours: number;
  basic: number;
  specialBasic: number;
  da: number;
  overtimePayments: number;
  hra: number;
  othersEarn: number;
  totalEarn: number;
  // Deductions
  pf: number;
  esic: number;
  society: number;
  incomeTax: number;
  insurance: number;
  othersDed: number;
  recoveries: number;
  totalDed: number;
  // Net & Meta
  netSalary: number;
  employerPfWelfare: number;
  bankTxnId: string;
  paymentDate: string;
  remarks: string;
  status: 'PAID' | 'PROCESSING';
}

interface PreviewRow extends EmployeeSalaryDetail {
  excelRow?: number | string;
  hasError: boolean;
  idError?: boolean;
  nameError?: boolean;
  netSalaryError?: boolean;
  rateOfWageError?: boolean;
  isEditingid?: boolean;
  isEditingname?: boolean;
  isEditingnetSalary?: boolean;
  isEditingrateOfWage?: boolean;
  isSaving?: boolean;
  [key: string]: any; // Allow dynamic editing flags
}

@Component({
  selector: 'app-salary-payroll-management',
  templateUrl: './salary-payroll-management.component.html',
  styleUrl: './salary-payroll-management.component.scss'
})
export class SalaryPayrollManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentView: 'overview' | 'detail' | 'add' | 'preview' | 'file-preview-details' = 'overview';

  // Overview Data
  selectedYear: number = new Date().getFullYear();
  selectedDate: Date = new Date();
  years: number[] = [];

  monthlySalaries: MonthlySalary[] = [];
  summaryData: any = null;
  isLoadingOverview: boolean = false;

  overviewP: number = 1;
  overviewShowEntries: number = 10;

  // Detail Data
  selectedMonthDetails: MonthlySalary | null = null;
  activeReportId: number | string | null = null;
  isLoadingDetail: boolean = false;
  selectedReportSummary: any = null;
  detailSearchQuery: string = '';
  employeeSalaries: EmployeeSalaryDetail[] = [];

  // Pagination State
  p: number = 1;
  showEntries: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecordsDetail: number = 0;

  // Add / Generate Data
  addYear: number = new Date().getFullYear();
  addMonth: string = new Date().toLocaleString('en-US', { month: 'long' });
  addSelectedDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  selectedFile: File | null = null;
  fileSizeStr: string = '';
  isValidating: boolean = false;
  isAlreadyGenerated: boolean = false;
  apiFile: any = null;

  // Preview Data
  showTemplateModal: boolean = false;
  uploadedFileSummary: any = null;
  hasValidationErrors: boolean = false;
  activeUploadId: number | string | null = null;
  isLoadingPreviewDetails: boolean = false;
  isSubmitting: boolean = false;
  previewP: number = 1;
  previewShowEntries: number = 10;
  totalPreviewRecords: number = 0;

  // Locked month/year at the time of "Check Salary" — used for import
  checkedMonth: number = 0;
  checkedYear: number = 0;

  previewData: PreviewRow[] = [];

  constructor(
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    // Allow selection up to 1 year in the future, down to 2015
    const maxYear = Math.max(currentYear + 1, 2026);
    for (let i = maxYear; i >= 2015; i--) {
      this.years.push(i);
    }
    this.selectedDate = new Date(this.selectedYear, 0, 1);
    this.loadWageRegisterReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWageRegisterReports(): void {
    this.isLoadingOverview = true;
    this.employeeService.getWageRegisterReports(this.selectedYear).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoadingOverview = false;
        if (res && res.data && Array.isArray(res.data)) {
          this.monthlySalaries = res.data.map((item: any) => {
            const isGenerated = item.status === 'generated';
            const monthName = item.month_label ? item.month_label.split(' ')[0] : this.getMonthName(item.month);
            return {
              month: monthName,
              year: item.year || this.selectedYear,
              totalEmployees: isGenerated && item.employee_count !== null ? item.employee_count : '-',
              grossSalary: isGenerated && item.total_earnings !== null ? item.total_earnings : '-',
              totalDeductions: isGenerated && item.total_deductions !== null ? item.total_deductions : '-',
              netSalary: isGenerated && item.total_net !== null ? item.total_net : '-',
              status: isGenerated ? 'GENERATED' : 'NOT GENERATED',
              reportId: item.report_id,
              rawMonthNumber: item.month,
              generatedAt: item.generated_at
            };
          });
        } else {
          this.monthlySalaries = [];
        }

        if (res && res.summary) {
          this.summaryData = res.summary;
        }

        if (res && res.available_years && Array.isArray(res.available_years) && res.available_years.length > 0) {
          res.available_years.forEach((y: number) => {
            if (!this.years.includes(y)) {
              this.years.push(y);
            }
          });
          this.years.sort((a, b) => b - a);
        }
      },
      error: (error: any) => {
        this.isLoadingOverview = false;
        console.error('Error loading wage register reports:', error);
      }
    });
  }

  private getMonthName(monthNumber: number): string {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNumber - 1] || '';
  }

  // Material Datepicker handler for Year (Overview)
  chosenYearHandler(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    this.selectedYear = normalizedYear.getFullYear();
    this.selectedDate = new Date(this.selectedYear, 0, 1);
    this.loadWageRegisterReports();
    datepicker.close();
  }

  // Material Datepicker handler for Month & Year (Add View)
  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    this.addSelectedDate = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), 1);
    this.addYear = normalizedMonth.getFullYear();
    this.addMonth = normalizedMonth.toLocaleString('en-US', { month: 'long' });
    this.isAlreadyGenerated = false;
    this.apiFile = null;
    this.selectedFile = null;
    this.uploadedFileSummary = null;
    this.activeUploadId = null;
    this.previewData = [];
    this.hasValidationErrors = false;
    datepicker.close();
    this.loadPendingUpload();
  }

  // Navigation
  goToOverview() {
    this.currentView = 'overview';
    this.selectedMonthDetails = null;
    this.selectedFile = null;
    this.loadWageRegisterReports();
  }

  goToDetail(monthData: MonthlySalary) {
    if (monthData.status === 'NOT GENERATED') return;
    this.selectedMonthDetails = monthData;
    this.activeReportId = monthData.reportId || (monthData as any).id;
    this.currentView = 'detail';
    this.p = 1;
    this.detailSearchQuery = '';
    if (this.activeReportId) {
      this.loadReportDetails(this.activeReportId, 1);
    }
  }

  loadReportDetails(reportId: number | string, page: number = 1) {
    this.isLoadingDetail = true;
    this.p = page;
    this.employeeService.getWageRegisterReportDetails(reportId, page, this.showEntries, this.detailSearchQuery)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isLoadingDetail = false;
          if (res && res.data) {
            const reportData = res.data;
            this.selectedReportSummary = {
              id: reportData.id,
              monthLabel: reportData.month_label,
              generatedAt: reportData.generated_at,
              generatedBy: reportData.generated_by?.name || 'System-Administrator',
              employeeCount: reportData.employee_count ?? 0,
              totalEarnings: reportData.total_earnings ?? 0,
              totalDeductions: reportData.total_deductions ?? 0,
              totalNet: reportData.total_net ?? 0,
              unrecoveredDeduction: reportData.unrecovered_deduction ?? 0
            };

            if (Array.isArray(reportData.rows)) {
              this.employeeSalaries = reportData.rows.map((row: any) => {
                const name = row.name || 'N/A';
                const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'E';
                return {
                  id: row.employee_code || `EMP-${row.employee_id || row.serial_no}`,
                  serialNo: row.serial_no,
                  employeeId: row.employee_id,
                  name: name,
                  initials: initials,
                  bgColor: 'bg-blue-600',
                  department: 'N/A',
                  designation: row.skill_category || 'N/A',
                  rateOfWage: row.rate_of_wage !== null && row.rate_of_wage !== undefined ? String(row.rate_of_wage) : '0',
                  daysWorked: row.days_worked ?? 0,
                  overtimeHours: row.overtime_hours ?? 0,
                  basic: row.basic ?? 0,
                  specialBasic: row.special_basic ?? 0,
                  da: row.dearness_allowance ?? 0,
                  overtimePayments: row.overtime_payment ?? 0,
                  hra: row.hra ?? 0,
                  othersEarn: row.other_earnings ?? 0,
                  totalEarn: row.total_earnings ?? 0,
                  pf: row.pf_deduction ?? 0,
                  esic: row.esic_deduction ?? 0,
                  society: row.society_deduction ?? 0,
                  incomeTax: row.income_tax ?? 0,
                  insurance: row.insurance ?? 0,
                  othersDed: row.other_deductions ?? 0,
                  recoveries: row.recoveries ?? 0,
                  totalDed: row.total_deductions ?? 0,
                  netSalary: row.net_payment ?? 0,
                  employerPfWelfare: row.employer_pf_share ?? 0,
                  bankTxnId: row.payment_reference || 'N/A',
                  paymentDate: row.payment_date || 'N/A',
                  remarks: row.remarks || '-',
                  status: 'PAID'
                };
              });
            } else {
              this.employeeSalaries = [];
            }

            if (res.pagination) {
              this.p = res.pagination.current_page;
              this.showEntries = res.pagination.per_page;
              this.totalRecordsDetail = res.pagination.total;
            } else {
              this.totalRecordsDetail = this.employeeSalaries.length;
            }
          }
        },
        error: (err: any) => {
          this.isLoadingDetail = false;
          console.error('Error fetching report details:', err);
        }
      });
  }

  onDetailSearch(): void {
    if (this.activeReportId) {
      this.p = 1; // reset to page 1
      this.loadReportDetails(this.activeReportId, 1);
    }
  }

  goToAdd() {
    this.currentView = 'add';
    this.selectedFile = null;
    this.uploadedFileSummary = null;
    this.activeUploadId = null;
    this.previewData = [];
    this.isValidating = false;
    this.isAlreadyGenerated = false;
    this.apiFile = null;
    this.showPreviewTable = false;
    this.hasValidationErrors = false;
    this.loadPendingUpload();
  }

  loadPendingUpload() {
    this.employeeService.getUpdatedPreviewData().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (this.selectedFile || this.isValidating) return;
        const records = res?.data || res;
        if (Array.isArray(records)) {
          const targetMonthIndex = this.addSelectedDate.getMonth() + 1;
          const targetYear = this.addYear;
          const pendingRecord = records.find(r => r.month === targetMonthIndex && r.year === targetYear && (r.status === 'ready' || r.status === 'pending' || r.status === 'failed'));

          if (pendingRecord) {
            this.activeUploadId = pendingRecord.upload_id || pendingRecord.id;
            this.uploadedFileSummary = {
              uploadId: pendingRecord.upload_id || pendingRecord.id,
              documentId: pendingRecord.document_id || pendingRecord.documentId,
              fileName: pendingRecord.file_name || pendingRecord.fileName,
              uploadBy: pendingRecord.uploaded_by?.name || pendingRecord.uploaded_by || 'System-Administrator',
              status: pendingRecord.status_label || pendingRecord.status || 'Ready',
              hasErrors: pendingRecord.has_errors || pendingRecord.hasErrors || false
            };
            this.hasValidationErrors = this.uploadedFileSummary.hasErrors;
            this.showPreviewTable = true;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching pending uploads:', err);
      }
    });
  }

  // Pagination Handlers
  onPageChange(page: number): void {
    this.p = page;
    if (this.activeReportId) {
      this.loadReportDetails(this.activeReportId, page);
    }
  }

  onShowEntriesChange(): void {
    this.p = 1;
    if (this.activeReportId) {
      this.loadReportDetails(this.activeReportId, 1);
    }
  }

  onOverviewPageChange(page: number): void {
    this.overviewP = page;
  }

  onOverviewShowEntriesChange(): void {
    this.overviewP = 1;
  }

  showPreviewTable: boolean = false;

  goToPreview() {
    this.showPreviewTable = true;
  }

  // Add Workflow logic
  checkSalaryStatus() {
    // Handled in continueToCheckSalary now
  }

  continueToCheckSalary() {
    this.isValidating = true;
    this.isAlreadyGenerated = false;
    this.apiFile = null;
    this.showPreviewTable = false;
    this.uploadedFileSummary = null;
    this.activeUploadId = null;
    this.previewData = [];
    this.hasValidationErrors = false;

    // Lock the month/year at this point — used for import later
    this.checkedMonth = this.addSelectedDate.getMonth() + 1;
    this.checkedYear = this.addYear;

    this.employeeService.checkSalaryGenerated(this.checkedMonth, this.checkedYear).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isValidating = false;
        const status = response.headers.get('X-Wage-Register-Status');

        if (status === 'not_generated') {
          // Download blob
          const blob = response.body;
          const url = window.URL.createObjectURL(blob);
          const monthStr = this.checkedMonth < 10 ? '0' + this.checkedMonth : this.checkedMonth;
          const fileName = `wage-register-${this.checkedYear}-${monthStr}.xlsx`;

          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          // Not revoking immediately so the user can re-download using the UI button

          this.apiFile = {
            name: fileName,
            size: (blob.size / 1024).toFixed(2) + ' KB',
            url: url
          };
        } else {
          // Already generated
          this.isAlreadyGenerated = true;
        }
      },
      error: (error: any) => {
        this.isValidating = false;
        console.error('Error checking salary generated status', error);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      this.selectedFile = file;
      this.fileSizeStr = (file.size / 1024).toFixed(2) + ' KB';
      this.isAlreadyGenerated = false;
      this.uploadedFileSummary = null;

      this.isValidating = true;
      this.showPreviewTable = false;

      // Use the locked month/year from "Check Salary" step
      const monthNumber = this.checkedMonth;
      const year = this.checkedYear;

      this.employeeService.importSalaryFile(monthNumber, year, file).pipe(
        switchMap(() => this.employeeService.getUpdatedPreviewData()),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (previewRes: any) => {
          this.isValidating = false;
          // The API returns { data: [ { upload_id, document_id, ... } ] }
          const records = previewRes?.data || previewRes;
          if (Array.isArray(records) && records.length > 0) {
            const latest = records[0];
            this.activeUploadId = latest.upload_id;
            this.uploadedFileSummary = {
              uploadId: latest.upload_id,
              documentId: latest.document_id,
              fileName: latest.file_name,
              uploadBy: latest.uploaded_by?.name || 'System-Administrator',
              status: latest.status_label || latest.status || 'Ready',
              hasErrors: latest.has_errors || false
            };

            // Set the error flag for the 'ERRORS FOUND' badge
            this.hasValidationErrors = latest.has_errors || false;
          }

          this.checkOverallValidation();
        },
        error: (error: any) => {
          this.isValidating = false;
          console.error('Error uploading salary file', error);
          this.uploadedFileSummary = {
            uploadId: null,
            documentId: '-',
            fileName: file.name,
            uploadBy: 'Admin User',
            status: 'Failed',
            hasErrors: true
          };
          this.hasValidationErrors = true;
        }
      });
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadedFileSummary = null;
    this.activeUploadId = null;
    this.showPreviewTable = false;
  }

  // Row Level Preview Functions
  openFilePreview(uploadId?: number | string) {
    const targetUploadId = uploadId || this.activeUploadId || this.uploadedFileSummary?.uploadId;
    this.currentView = 'file-preview-details';
    if (targetUploadId) {
      this.activeUploadId = targetUploadId;
      this.loadPreviewDetails(targetUploadId, 1);
    }
  }

  loadPreviewDetails(uploadId: number | string, page: number = 1) {
    this.isLoadingPreviewDetails = true;
    this.previewP = page;
    this.employeeService.getWageRegisterPreviewDetails(uploadId, page, this.previewShowEntries).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoadingPreviewDetails = false;
        if (res && res.data) {
          const dataObj = res.data;
          if (dataObj.summary) {
            this.hasValidationErrors = dataObj.summary.errors_found || false;
          }
          if (Array.isArray(dataObj.rows)) {
            this.previewData = dataObj.rows.map((r: any) => {
              const v = r.values || {};
              const ef = r.error_flags || {};
              const errCols = r.error_columns || [];
              const isRowValid = r.is_valid !== false && r.status === 'valid' && errCols.length === 0;

              return {
                excelRow: r.excel_row || r.excelRow || r.id,
                id: v.employee_code || r.employee_code || `EMP-${r.employee_id || r.id}`,
                name: v.employee_name || r.employee_name || 'N/A',
                rateOfWage: v.rate_of_wage !== null && v.rate_of_wage !== undefined ? String(v.rate_of_wage) : '0',
                daysWorked: v.days_worked ?? 0,
                overtimeHours: v.overtime_hours ?? 0,
                basic: v.basic ?? 0,
                specialBasic: v.special_basic ?? 0,
                da: v.dearness_allowance ?? 0,
                overtimePayments: v.overtime_payment ?? 0,
                hra: v.hra ?? 0,
                othersEarn: v.other_earnings ?? 0,
                totalEarn: v.total_earnings ?? 0,
                pf: v.pf_deduction ?? 0,
                esic: v.esic_deduction ?? 0,
                society: v.society_deduction ?? 0,
                incomeTax: v.income_tax ?? 0,
                insurance: v.insurance ?? 0,
                othersDed: v.other_deductions ?? 0,
                recoveries: v.recoveries ?? 0,
                totalDed: v.total_deductions ?? 0,
                netSalary: v.net_payment ?? 0,
                employerPfWelfare: v.employer_pf_share ?? 0,
                bankTxnId: v.payment_reference || 'N/A',
                paymentDate: v.payment_date || 'N/A',
                remarks: v.remarks || (r.errors && r.errors.length ? r.errors.join(', ') : 'Valid'),
                status: isRowValid ? 'PAID' : 'PROCESSING',
                hasError: !isRowValid,
                idError: ef.employee_code === 1 || errCols.includes('employee_code'),
                nameError: ef.employee_name === 1 || errCols.includes('employee_name'),
                netSalaryError: ef.net_payment === 1 || errCols.includes('net_payment'),
                rateOfWageError: ef.rate_of_wage === 1 || errCols.includes('rate_of_wage'),
                initials: (v.employee_name || 'E').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                bgColor: isRowValid ? 'bg-blue-600' : 'bg-red-300',
                department: 'N/A',
                designation: 'N/A'
              };
            });
          }
        }
        if (res && res.pagination) {
          this.previewP = res.pagination.current_page;
          this.previewShowEntries = res.pagination.per_page;
          this.totalPreviewRecords = res.pagination.total;
        }
      },
      error: (err: any) => {
        this.isLoadingPreviewDetails = false;
        console.error('Error fetching wage register preview details:', err);
      }
    });
  }

  onPreviewPageChange(page: number) {
    if (this.activeUploadId) {
      this.loadPreviewDetails(this.activeUploadId, page);
    }
  }


  goBackToUpload() {
    this.currentView = 'add';
  }

  closeRowPreview() {
    this.removeFile();
    this.goToOverview();
  }

  editField(row: any, field: string) {
    row['isEditing' + field] = true;
  }

  saveField(row: any, field: string) {
    row['isEditing' + field] = false;

    let apiFieldName = field;
    if (field === 'id') apiFieldName = 'employee_code';
    else if (field === 'name') apiFieldName = 'employee_name';
    else if (field === 'netSalary') apiFieldName = 'net_payment';
    else if (field === 'rateOfWage') apiFieldName = 'rate_of_wage';
    else if (field === 'daysWorked') apiFieldName = 'days_worked';
    else if (field === 'overtimeHours') apiFieldName = 'overtime_hours';
    else if (field === 'specialBasic') apiFieldName = 'special_basic';
    else if (field === 'da') apiFieldName = 'dearness_allowance';
    else if (field === 'overtimePayments') apiFieldName = 'overtime_payment';
    else if (field === 'othersEarn') apiFieldName = 'other_earnings';
    else if (field === 'totalEarn') apiFieldName = 'total_earnings';
    else if (field === 'pf') apiFieldName = 'pf_deduction';
    else if (field === 'esic') apiFieldName = 'esic_deduction';
    else if (field === 'society') apiFieldName = 'society_deduction';
    else if (field === 'incomeTax') apiFieldName = 'income_tax';
    else if (field === 'othersDed') apiFieldName = 'other_deductions';
    else if (field === 'totalDed') apiFieldName = 'total_deductions';
    else if (field === 'employerPfWelfare') apiFieldName = 'employer_pf_share';

    const newValue = row[field];
    const updateBody = { values: { [apiFieldName]: newValue } };

    const uploadId = this.activeUploadId || this.uploadedFileSummary?.uploadId;
    const excelRow = row.excelRow || row.excel_row || row.id;

    if (uploadId && excelRow) {
      row.isSaving = true;
      this.employeeService.updateWageRegisterRowField(uploadId, excelRow, updateBody).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          row.isSaving = false;
          if (res && res.data) {
            const dataObj = res.data;
            row.hasError = dataObj.row_is_valid === false;

            const remErrors = dataObj.remaining_errors || [];
            row.idError = remErrors.includes('employee_code');
            row.nameError = remErrors.includes('employee_name');
            row.netSalaryError = remErrors.includes('net_payment');
            row.rateOfWageError = remErrors.includes('rate_of_wage');

            if (dataObj.can_submit !== undefined) {
              this.hasValidationErrors = !dataObj.can_submit;
            } else if (dataObj.error_rows !== undefined) {
              this.hasValidationErrors = dataObj.error_rows > 0;
            }

            if (this.uploadedFileSummary) {
              this.uploadedFileSummary.hasErrors = this.hasValidationErrors;
              this.uploadedFileSummary.status = this.hasValidationErrors ? 'Errors Found' : 'Ready';
            }
          }
        },
        error: (err: any) => {
          row.isSaving = false;
          console.error('Error updating row field:', err);
          this.checkValidation(row);
        }
      });
    } else {
      this.checkValidation(row);
    }
  }

  checkValidation(row: any) {
    // Basic validation mock
    row.idError = !row.id || row.id === 'EMP-NULL';
    row.netSalaryError = row.netSalary < 0;
    row.hasError = row.idError || row.netSalaryError;
    this.checkOverallValidation();
  }

  checkOverallValidation() {
    this.hasValidationErrors = this.previewData.some(r => r.hasError);
    if (!this.hasValidationErrors && this.uploadedFileSummary) {
      this.uploadedFileSummary.status = 'Success';
    }
  }

  saveRowLevelChanges() {
    if (!this.hasValidationErrors) {
      if (this.uploadedFileSummary) {
        this.uploadedFileSummary.status = 'Success';
      }
      this.goBackToUpload();
    }
  }

  simulateValidation() {
    this.isValidating = true;
    setTimeout(() => {
      this.isValidating = false;
      this.showPreviewTable = true;
    }, 1500);
  }

  submitSalary() {
    const uploadId = this.activeUploadId || this.uploadedFileSummary?.uploadId;
    if (!uploadId) {
      this.notificationService.show('No active salary upload found to submit.', 'error', 3000);
      return;
    }

    this.isSubmitting = true;
    this.employeeService.submitWageRegister(uploadId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const msg = res?.message || 'Wage register data submitted successfully!';
        this.notificationService.show(msg, 'success', 3000);

        this.uploadedFileSummary = null;
        this.activeUploadId = null;
        this.selectedFile = null;
        this.previewData = [];
        this.hasValidationErrors = false;
        this.goToOverview();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Error submitting wage register data:', err);
        const rawErr = err?.originalError || err;
        const errorMessage = err?.message || rawErr?.message || '1 row(s) still have errors. Correct them before submitting.';

        if (rawErr?.status === 422 || rawErr?.data?.columns_with_errors) {
          this.hasValidationErrors = true;
          if (this.uploadedFileSummary) {
            this.uploadedFileSummary.hasErrors = true;
            this.uploadedFileSummary.status = 'Errors Found';
          }
        }
      }
    });
  }

  downloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "S. No.,EMP ID,Name,Rate of Wage,No. of days worked,Overtime hours Worked,Basic,Special basic,Dearness Allowance,Payments Overtime,HRA,*Others,Total Earn,PF,ESIC,Society,Income Tax,Insurance,Others,Recoveries,Total Ded,Net Payment,Employer Share PF Welfare Fund,Receipt by Employee/Bank Transaction ID,Date of Payment,Remarks\n"
      + "1,EMP-1042,Sarah Jenkins,1000,26,10,26000,5000,2000,3000,8000,1000,45000,1800,340,500,1200,300,100,0,4240,40760,1950,TXN8912347901,2026-02-05,Valid record";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "salary_template.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  }

  openTemplate() {
    this.showTemplateModal = true;
  }

  closeTemplate() {
    this.showTemplateModal = false;
  }

  // Export Wage Register Reports API Integration
  isExporting: boolean = false;

  exportReports(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    const yearToExport = this.selectedYear || new Date().getFullYear();
    this.employeeService.exportWageRegisterReports(yearToExport).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isExporting = false;
        const blob = response.body || response;
        if (!blob || blob.size === 0) {
          this.notificationService.show('Failed to download report file.', 'error', 3000);
          return;
        }

        let filename = `wage-register-reports-${yearToExport}.xlsx`;
        const contentDisposition = response.headers ? response.headers.get('content-disposition') : null;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.notificationService.show('Wage register reports exported successfully!', 'success', 3000);
      },
      error: (err: any) => {
        this.isExporting = false;
        console.error('Error exporting wage register reports:', err);
        this.notificationService.show(err?.error?.message || 'Failed to export wage register reports.', 'error', 3000);
      }
    });
  }

  // Export Single Wage Register Report Detail (v1/admin/wage-register/reports/{reportId}/export)
  exportSingleReportDetail(): void {
    const reportId = this.activeReportId || (this.selectedMonthDetails as any)?.reportId || (this.selectedMonthDetails as any)?.id;
    if (!reportId) {
      this.notificationService.show('No active report selected to export.', 'error', 3000);
      return;
    }
    if (this.isExporting) return;

    this.isExporting = true;
    this.employeeService.exportWageRegisterReportDetail(reportId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isExporting = false;
        const blob = response.body || response;
        if (!blob || blob.size === 0) {
          this.notificationService.show('Failed to download report detail file.', 'error', 3000);
          return;
        }

        let filename = `wage-register-report-${reportId}.xlsx`;
        const contentDisposition = response.headers ? response.headers.get('content-disposition') : null;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.notificationService.show('Wage register report detail exported successfully!', 'success', 3000);
      },
      error: (err: any) => {
        this.isExporting = false;
        console.error('Error exporting wage register report detail:', err);
        this.notificationService.show(err?.error?.message || 'Failed to export report detail.', 'error', 3000);
      }
    });
  }

}
