import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/mat/mat.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPrintModule } from 'ngx-print';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { SiteService } from 'src/app/core/services/site.service';
import { DepartmentService } from 'src/app/core/services/department.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, catchError } from 'rxjs/operators';

export interface EmployeeOption {
  id: number | string;
  name: string;
  employee_code?: string;
  [key: string]: any;
}

export interface SiteOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface DepartmentOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface UploadResult {
  status: number;
  message: string;
  errors: string[];
}

export interface SchedulePreviewItem {
  installment_no: number;
  month_year: string;
  amount: number;
  remaining_balance: number;
  [key: string]: any;
}

export interface ScheduleSummary {
  installmentAmount: number;
  numberOfInstallments: number;
  firstMonthStr: string;
  lastMonthStr: string;
  dateOfCompleteRecovery: string;
  monthlyLimit: number;
  fullyRecoverable: boolean;
}

interface PayrollRecord {
  empId: string;
  dbId?: number;
  empName: string;
  designation: string;
  department: string;
  site: string;
  basicSalary: number;
  shiftAllowance: number;
  totalDays: number;
  presentCount: number;
  halfDayCount: number;
  exceptionCount: number;
  absentCount: number;
  leaveCount: number;
  unpaidLeaveCount: number;
  restDayCount: number;
  payableDays: number;
  pfDeduction: number;
  messDeduction: number;
  leaveDeduction: number;
  othersDeduction: number;
  incentives: number;
  penalties: any[];
  penaltyTotalAmount: number;
  overtimePayment?: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  monthly_salary?: number;
  status?: string;
  createdAt?: Date;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
}

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxPaginationModule,
    NgSelectModule,
    NgxPrintModule
  ],
  templateUrl: './payroll-management.component.html',
  styleUrl: './payroll-management.component.scss',
  providers: [DatePipe]
})
export class PayrollManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fetchScheduleSubject$ = new Subject<void>();

  employees: EmployeeOption[] = [];
  allAttendanceRecords: any[] = [];

  // Filters
  currentMonth: string = '';
  currentMaxMonth: string = '';
  selectedSite: number | null = null;
  selectedDept: number | null = null;
  filterSearch: string = '';

  // State Machine
  payrollState: 'Draft' | 'Pending Verification' | 'Finalized' = 'Draft';
  activeView: 'standard' | 'government' = 'standard';

  // Calculated Payroll list
  payrollRecords: PayrollRecord[] = [];
  filteredPayrollRecords: PayrollRecord[] = [];

  // Pagination
  p: number = 1;
  showEntries: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;

  // Selected Payslip for A4 Print/Preview
  selectedPayslipRecord: PayrollRecord | null = null;
  showPayslipModal: boolean = false;

  // Adjustments Modal (Draft mode only)
  showEditModal: boolean = false;
  editForm!: FormGroup;
  recoveryTypeOptions: string[] = ['Damage', 'Loss', 'Fine', 'Advance', 'Loans'];
  yesNoOptions: string[] = ['No', 'Yes'];
  currentEditingRecord: PayrollRecord | null = null;

  // Add Manual Record Modal
  showAddModal: boolean = false;
  addForm!: FormGroup;

  // Penalty Modals
  penaltyModalOpen: boolean = false;
  bulkPenaltyModalOpen: boolean = false;
  isUploading: boolean = false;
  uploadResult: UploadResult | null = null;
  penaltyForm!: FormGroup;
  viewPenaltyModalOpen: boolean = false;
  selectedPenaltyEmployee: PayrollRecord | null = null;
  selectedBulkFile: File | null = null;

  // Installments Schedule Preview State
  previewScheduleList: SchedulePreviewItem[] = [];
  scheduleSummary: ScheduleSummary | null = null;
  isPreviewLoading: boolean = false;
  previewErrorMessage: string = '';

  // Dropdown options
  sites: SiteOption[] = [];
  departments: DepartmentOption[] = [];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private employeeManagementService: EmployeeManagementService,
    private notificationService: NotificationService,
    private datePipe: DatePipe,
    private siteService: SiteService,
    private departmentService: DepartmentService
  ) {
    this.editForm = this.fb.group({
      empId: [{ value: '', disabled: true }],
      empName: [{ value: '', disabled: true }],
      incentives: [0, [Validators.required, Validators.min(0)]],
      messDeduction: [1000, [Validators.required, Validators.min(0)]],
      pfDeduction: [1800, [Validators.required, Validators.min(0)]],
      othersDeduction: [0, [Validators.required, Validators.min(0)]]
    });

    this.addForm = this.fb.group({
      isCustomEmployee: [false],
      selectedEmpId: [''],
      empId: [{ value: '', disabled: true }, Validators.required],
      empName: [{ value: '', disabled: true }, Validators.required],
      designation: ['Contract Worker', Validators.required],
      department: ['Operations', Validators.required],
      site: ['East Mine', Validators.required],
      basicSalary: [20000, [Validators.required, Validators.min(0)]],
      shiftAllowance: [1500, [Validators.required, Validators.min(0)]],
      incentives: [0, [Validators.required, Validators.min(0)]],
      pfDeduction: [2000, [Validators.required, Validators.min(0)]],
      messDeduction: [1000, [Validators.required, Validators.min(0)]],
      othersDeduction: [0, [Validators.required, Validators.min(0)]],
      presentCount: [26, [Validators.required, Validators.min(0)]],
      halfDayCount: [0, [Validators.required, Validators.min(0)]],
      absentCount: [0, [Validators.required, Validators.min(0)]]
    });

    this.penaltyForm = this.fb.group({
      employeeId: ['', Validators.required],
      recoveryType: ['', Validators.required],
      particulars: ['', Validators.required],
      penaltyDate: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      showCauseIssued: ['No'],
      witnessName: [''],
      installments: [null, [Validators.required, Validators.min(1)]],
      firstMonth: ['', Validators.required],
      lastMonth: [''],
      remarks: ['']
    });



    this.penaltyForm.get('recoveryType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.fetchSchedulePreview());
    this.penaltyForm.get('employeeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.fetchSchedulePreview());
    this.penaltyForm.get('penaltyDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.fetchSchedulePreview());

    // Setup switchMap for handling race conditions on API calls
    this.fetchScheduleSubject$.pipe(
      switchMap(() => {
        const formVal = this.penaltyForm.value;
        if (!formVal.employeeId || !formVal.amount || !formVal.recoveryType) {
          this.previewScheduleList = [];
          this.scheduleSummary = null;
          this.isPreviewLoading = false;
          return of(null);
        }

        const penaltyDateVal = formVal.penaltyDate || (formVal.firstMonth ? `${formVal.firstMonth}-01` : this.datePipe.transform(new Date(), 'yyyy-MM-dd')) || '';
        const payload = {
          employee_id: String(formVal.employeeId),
          penalty_date: penaltyDateVal,
          recovery_type: formVal.recoveryType ? String(formVal.recoveryType).toLowerCase() : '',
          amount: String(formVal.amount)
        };

        this.isPreviewLoading = true;
        this.previewErrorMessage = '';

        return this.employeeManagementService.previewPenaltySchedule(payload).pipe(
          catchError((err: any) => {
            this.isPreviewLoading = false;
            this.previewScheduleList = [];
            this.scheduleSummary = null;
            console.error('Error loading penalty schedule preview:', err);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (!res) return;

      this.isPreviewLoading = false;
      if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && res.data) {
        const data = res.data;

        const firstMStr = (data.first_year && data.first_month) ? `${data.first_year}-${String(data.first_month).padStart(2, '0')}` : '';
        const lastMStr = (data.last_year && data.last_month) ? `${data.last_year}-${String(data.last_month).padStart(2, '0')}` : '';

        this.scheduleSummary = {
          installmentAmount: data.installment_amount || 0,
          numberOfInstallments: data.number_of_installments || 1,
          firstMonthStr: firstMStr,
          lastMonthStr: lastMStr,
          dateOfCompleteRecovery: data.date_of_complete_recovery || '',
          monthlyLimit: data.monthly_limit || 0,
          fullyRecoverable: data.fully_recoverable !== false
        };

        this.penaltyForm.patchValue({
          installments: data.number_of_installments || 1,
          lastMonth: lastMStr || this.penaltyForm.get('lastMonth')?.value
        }, { emitEvent: false });

        if (firstMStr && !this.penaltyForm.get('firstMonth')?.value) {
          this.penaltyForm.patchValue({ firstMonth: firstMStr }, { emitEvent: false });
        }

        if (Array.isArray(data.schedule)) {
          this.previewScheduleList = data.schedule;
        } else if (Array.isArray(data.installments)) {
          this.previewScheduleList = data.installments;
        } else if (data.number_of_installments) {
          this.previewScheduleList = [];
          let currM = Number(data.first_month || 1);
          let currY = Number(data.first_year || new Date().getFullYear());
          const formAmt = this.penaltyForm.get('amount')?.value;
          const totalAmt = Number(formAmt) || ((data.installment_amount || 0) * (data.number_of_installments || 1));
          let remBal = totalAmt;

          for (let i = 0; i < data.number_of_installments; i++) {
            const mStr = `${currY}-${String(currM).padStart(2, '0')}`;
            const instAmt = data.installment_amount || 0;
            remBal = Math.max(0, remBal - instAmt);

            this.previewScheduleList.push({
              installment_no: i + 1,
              month_year: mStr,
              amount: instAmt,
              remaining_balance: remBal
            });

            currM++;
            if (currM > 12) {
              currM = 1;
              currY++;
            }
          }
        } else {
          this.previewScheduleList = [];
        }
      } else {
        this.previewScheduleList = [];
        this.scheduleSummary = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAmountBlur(): void {
    const amtVal = this.penaltyForm.get('amount')?.value;
    const amt = parseFloat(String(amtVal));
    if (amtVal !== null && amtVal !== undefined && !isNaN(amt) && amt > 0) {
      this.fetchSchedulePreview();
    } else {
      this.previewScheduleList = [];
      this.scheduleSummary = null;
    }
  }

  ngOnInit(): void {
    const today = new Date();
    this.currentMonth = this.datePipe.transform(today, 'yyyy-MM') || '';
    this.currentMaxMonth = this.currentMonth;
    this.loadActiveEmployees();
    this.loadSites();
    this.loadDepartments();
    this.loadPayrollData();
  }

  loadActiveEmployees(): void {
    this.employeeManagementService.getActiveEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          const apiData = res.data || [];
          this.employees = apiData.map((emp: any) => ({
            id: emp.id,
            name: emp.name + ' (' + emp.employee_code + ')'
          }));
        }
      },
      error: () => {
        console.error('Failed to load active employees');
      }
    });
  }

  loadSites(): void {
    this.siteService.getAllSites().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.sites = res.data || [];
        }
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.departments = res.data || [];
        }
      }
    });
  }

  loadPayrollData(): void {
    const [year, month] = this.currentMonth.split('-').map(Number);
    this.employeeManagementService.getPayroll(month, year, this.showEntries, this.p, this.filterSearch, this.selectedDept, this.selectedSite)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200) {
            const apiData = res.data || [];

            this.payrollRecords = apiData.map((emp: any) => {
              return {
                empId: emp.employee_code,
                dbId: emp.id || emp.employee_id,
                empName: emp.name,
                designation: emp.designation || 'N/A',
                department: emp.department || 'N/A',
                site: emp.site || 'N/A',
                basicSalary: emp.basic_salary || 0,
                shiftAllowance: emp.shift_allowance || 0,
                totalDays: emp.days_in_month || 0,
                presentCount: emp.present_days || 0,
                halfDayCount: emp.half_days || 0,
                exceptionCount: 0,
                absentCount: emp.absent_days || 0,
                leaveCount: emp.paid_leave_days || 0,
                unpaidLeaveCount: emp.unpaid_leave_days || 0,
                restDayCount: emp.rest_days || 0,
                payableDays: emp.payable_days !== undefined ? Number(emp.payable_days) : 0,
                pfDeduction: emp.pf_deduction || 0,
                messDeduction: emp.mess_deduction || 0,
                leaveDeduction: emp.leave_deduction || 0,
                othersDeduction: emp.other_deduction || 0,
                incentives: emp.incentives || 0,
                penalties: [],
                penaltyTotalAmount: emp.penalty_amount || 0,
                overtimePayment: emp.overtime_payment || 0,
                totalEarnings: emp.gross_salary || 0,
                totalDeductions: (emp.pf_deduction || 0) + (emp.mess_deduction || 0) + (emp.leave_deduction || 0) + (emp.other_deduction || 0) + (emp.penalty_amount || 0),
                netSalary: emp.net_salary || 0,
                monthly_salary: emp.monthly_salary || 0,
                createdAt: emp.created_at || new Date()
              };
            });
            this.filteredPayrollRecords = [...this.payrollRecords];
            this.totalRecords = res.pagination?.total || this.payrollRecords.length;
          } else {
            this.payrollRecords = [];
            this.filteredPayrollRecords = [];
            this.totalRecords = 0;
          }
        },
        error: () => {
          this.payrollRecords = [];
          this.filteredPayrollRecords = [];
          this.totalRecords = 0;
          this.notificationService.show('Failed to fetch payroll data', 'error', 3000);
        }
      });
  }

  setView(view: 'standard' | 'government'): void {
    this.activeView = view;
  }

  applyFilters(): void {
    this.p = 1;
    this.loadPayrollData();
  }

  resetFilters(): void {
    this.selectedSite = null;
    this.selectedDept = null;
    this.filterSearch = '';
    this.p = 1;
    this.loadPayrollData();
  }

  onMonthChange(): void {
    this.p = 1;
    this.loadPayrollData();
  }

  onPageChange(page: number): void {
    this.p = page;
    this.loadPayrollData();
  }

  onShowEntriesChange(): void {
    this.p = 1;
    this.loadPayrollData();
  }

  // Workflow transitions
  submitForVerification(): void {
    this.payrollState = 'Pending Verification';
    // Add backend API call to update month state if required
    this.notificationService.show('Payroll submitted for Verification successfully!', 'success', 3000);
  }

  finalizePayroll(): void {
    this.payrollState = 'Finalized';
    // Add backend API call to update month state if required
    this.notificationService.show('Payroll approved and Finalized successfully!', 'success', 3000);
  }

  rejectToDraft(): void {
    this.payrollState = 'Draft';
    // Add backend API call to update month state if required
    this.notificationService.show('Payroll rejected and sent back to Draft.', 'success', 3000);
  }

  // Manual Entry CRUD Operations
  openAddModal(): void {
    if (this.payrollState !== 'Draft') return;
    this.addForm.reset({
      isCustomEmployee: false,
      selectedEmpId: '',
      empId: '',
      empName: '',
      designation: 'Contract Worker',
      department: 'Operations',
      site: 'East Mine',
      basicSalary: 20000,
      shiftAllowance: 1500,
      incentives: 0,
      pfDeduction: 2000,
      messDeduction: 1000,
      othersDeduction: 0,
      presentCount: 26,
      halfDayCount: 0,
      absentCount: 0
    });
    this.addForm.get('empId')?.disable();
    this.addForm.get('empName')?.disable();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onCustomEmployeeToggle(): void {
    const isCustom = this.addForm.get('isCustomEmployee')?.value;
    if (isCustom) {
      this.addForm.get('selectedEmpId')?.setValue('');
      this.addForm.get('empId')?.enable();
      this.addForm.get('empName')?.enable();
      this.addForm.patchValue({
        empId: 'EMP' + Math.floor(Math.random() * 9000 + 1000),
        empName: ''
      });
    } else {
      this.addForm.get('empId')?.disable();
      this.addForm.get('empName')?.disable();
      this.addForm.patchValue({
        empId: '',
        empName: ''
      });
    }
  }

  onEmployeeSelectChange(): void {
    const isCustom = this.addForm.get('isCustomEmployee')?.value;
    if (isCustom) return;

    const empId = this.addForm.get('selectedEmpId')?.value;
    const selectedEmp = this.employees.find(e => e.id === empId);
    if (selectedEmp) {
      this.addForm.patchValue({
        empId: selectedEmp.id,
        empName: selectedEmp.name,
        designation: (selectedEmp as any).designation,
        department: (selectedEmp as any).department,
        site: (selectedEmp as any).site,
        basicSalary: (selectedEmp as any).basicSalary,
        pfDeduction: Math.round(((selectedEmp as any).basicSalary || 0) * 0.1)
      });
    }
  }

  onBasicSalaryChange(): void {
    const basic = this.addForm.get('basicSalary')?.value || 0;
    this.addForm.patchValue({
      pfDeduction: Math.round(basic * 0.1)
    });
  }

  submitManualRecord(): void {
    if (this.addForm.valid) {
      const rawVal = this.addForm.getRawValue();

      const [year, month] = this.currentMonth.split('-');
      const payload = {
        employee_id: rawVal.empId,
        month: Number(month),
        year: Number(year),
        basic_salary: rawVal.basicSalary,
        shift_allowance: rawVal.shiftAllowance,
        incentives: rawVal.incentives,
        pf_deduction: rawVal.pfDeduction,
        mess_deduction: rawVal.messDeduction,
        other_deduction: rawVal.othersDeduction,
        present_days: rawVal.presentCount,
        half_days: rawVal.halfDayCount,
        absent_days: rawVal.absentCount
      };

      this.employeeManagementService.createEmployeePayroll(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.notificationService.show(`Manual payroll record added for ${rawVal.empName}`, 'success', 3000);
          this.closeAddModal();
          this.loadPayrollData();
        },
        error: (err: any) => {
          this.notificationService.show(err.error?.message || 'Failed to add manual record', 'error', 3000);
        }
      });
    } else {
      this.addForm.markAllAsTouched();
    }
  }

  isManualRecord(empId: string): boolean {
    return false; // Replaced with proper backend state if applicable
  }

  deleteManualRecord(empId: string): void {
    if (this.payrollState !== 'Draft') return;
    if (confirm('Are you sure you want to delete this manual payroll record?')) {
      // Backend integration for delete employee payroll goes here
      this.notificationService.show('Manual payroll record deleted.', 'success', 3000);
      this.loadPayrollData();
    }
  }

  // Edit Adjustments
  openEditModal(rec: PayrollRecord): void {
    if (this.payrollState !== 'Draft') return;

    this.currentEditingRecord = rec;
    this.editForm.patchValue({
      empId: rec.empId,
      empName: rec.empName,
      pfDeduction: rec.pfDeduction,
      messDeduction: rec.messDeduction,
      othersDeduction: rec.othersDeduction || 0,
      incentives: rec.incentives
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.currentEditingRecord = null;
  }

  submitAdjustments(): void {
    if (this.editForm.valid && this.currentEditingRecord && this.currentEditingRecord.dbId) {
      const formVal = this.editForm.value;
      const payload = {
        pf_deduction: formVal.pfDeduction,
        mess_deduction: formVal.messDeduction,
        incentives: formVal.incentives,
        other_deduction: formVal.othersDeduction
      };

      this.employeeManagementService.updateEmployeePayroll(this.currentEditingRecord.dbId, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.notificationService.show(`Adjustments saved for ${this.currentEditingRecord?.empName}`, 'success', 3000);
          this.closeEditModal();
          this.loadPayrollData();
        },
        error: (err: any) => {
          this.notificationService.show(err.error?.message || 'Failed to save adjustments', 'error', 3000);
        }
      });
    }
  }

  // Payslip Actions
  viewPayslip(rec: PayrollRecord): void {
    if (!rec.dbId) {
      this.selectedPayslipRecord = rec;
      this.showPayslipModal = true;
      return;
    }
    const [year, month] = this.currentMonth.split('-').map(Number);
    this.employeeManagementService.getPayrollDetail(rec.dbId, month, year).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const emp = res.data;
          this.selectedPayslipRecord = {
            empId: emp.employee?.employee_code || rec.empId,
            dbId: emp.employee?.id || rec.dbId,
            empName: emp.employee?.name || rec.empName,
            designation: emp.employee?.designation || rec.designation,
            department: emp.employee?.department || rec.department,
            site: emp.employee?.site || rec.site,
            bankName: emp.employee?.bank_name || 'N/A',
            bankAccountNumber: emp.employee?.bank_account_number || 'N/A',
            ifscCode: emp.employee?.ifsc_code || 'N/A',
            basicSalary: emp.earnings?.basic_salary || rec.basicSalary,
            shiftAllowance: emp.earnings?.shift_allowance || rec.shiftAllowance,
            totalDays: emp.payroll_period?.days_in_month || rec.totalDays,
            presentCount: emp.attendance?.present_days || rec.presentCount,
            halfDayCount: emp.attendance?.half_days || rec.halfDayCount,
            exceptionCount: 0,
            absentCount: emp.attendance?.absent_days || rec.absentCount,
            leaveCount: emp.attendance?.paid_leave_days || rec.leaveCount,
            unpaidLeaveCount: emp.attendance?.unpaid_leave_days || rec.unpaidLeaveCount,
            restDayCount: emp.attendance?.rest_days || rec.restDayCount,
            payableDays: emp.attendance?.payable_days !== undefined ? Number(emp.attendance.payable_days) : rec.payableDays,
            pfDeduction: emp.deductions?.pf_deduction || rec.pfDeduction,
            messDeduction: emp.deductions?.mess_deduction || rec.messDeduction,
            leaveDeduction: emp.deductions?.leave_deduction || rec.leaveDeduction,
            othersDeduction: emp.deductions?.other_deduction || rec.othersDeduction,
            incentives: emp.earnings?.incentives || rec.incentives,
            penalties: emp.penalties || [],
            penaltyTotalAmount: emp.deductions?.penalty_amount || rec.penaltyTotalAmount,
            overtimePayment: emp.earnings?.overtime_payment || rec.overtimePayment,
            totalEarnings: emp.earnings?.gross_salary || rec.totalEarnings,
            totalDeductions: emp.deductions?.total_deductions || rec.totalDeductions,
            netSalary: emp.net_salary || rec.netSalary,
            createdAt: emp.payroll_record?.created_at || rec.createdAt,
            monthly_salary: emp.earnings?.monthly_salary || rec.monthly_salary || emp.earnings?.gross_salary
          };
          this.showPayslipModal = true;
        } else {
          this.selectedPayslipRecord = rec;
          this.showPayslipModal = true;
        }
      },
      error: () => {
        this.selectedPayslipRecord = rec;
        this.showPayslipModal = true;
        this.notificationService.show('Failed to fetch updated payslip details', 'error', 3000);
      }
    });
  }

  closePayslipModal(): void {
    this.showPayslipModal = false;
    this.selectedPayslipRecord = null;
  }

  printPayslip(): void {
    setTimeout(() => {
      window.print();
    }, 100);
  }

  downloadMockPDF(): void {
    if (!this.selectedPayslipRecord) return;

    const rec = this.selectedPayslipRecord;
    const content = `========================================================================
                          DUDI COAL MINE PVT. LTD.
           East Mine Sector, Block-A, Jharia Coalfield, Dhanbad, Jharkhand
========================================================================
                       PAYSLIP FOR THE MONTH OF: ${this.formatMonthName(this.currentMonth).toUpperCase()}
========================================================================
EMPLOYEE DETAILS:
------------------------------------------------------------------------
Employee ID     : ${rec.empId}             Designation   : ${rec.designation}
Employee Name   : ${rec.empName}             Department    : ${rec.department}
Location/Site   : ${rec.site}             Bank A/C No   : ********5432 (Mock)
========================================================================
EARNINGS (Rs.)                         DEDUCTIONS (Rs.)
------------------------------------------------------------------------
Basic Salary    : ${rec.basicSalary.toLocaleString()}         PF Deduction    : ${rec.pfDeduction.toLocaleString()}
Shift Allowance : ${rec.shiftAllowance.toLocaleString()}         Mess Deduction  : ${rec.messDeduction.toLocaleString()}
Incentives      : ${rec.incentives.toLocaleString()}         Leave Deduction : ${rec.leaveDeduction.toLocaleString()}
                                       (P: ${rec.presentCount}, HD: ${rec.halfDayCount}, A: ${rec.absentCount}, L: ${rec.leaveCount})
------------------------------------------------------------------------
TOTAL EARNINGS  : ${rec.totalEarnings.toLocaleString()}         TOTAL DEDUCTIONS: ${rec.totalDeductions.toLocaleString()}
========================================================================
NET SALARY PAID : Rs. ${rec.netSalary.toLocaleString()}/-
In Words        : Rupees ${this.numberToWords(rec.netSalary)} Only.
========================================================================
This is a computer-generated payslip and does not require an authorized signature.
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${rec.empId}_${this.currentMonth}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.show('Mock PDF Payslip downloaded successfully!', 'success', 2500);
  }

  // Utility helpers
  formatMonthName(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return this.datePipe.transform(date, 'MMMM yyyy') || monthStr;
  }

  numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.floor(num);
    if (n === 0) return 'Zero';

    const convert = (val: number): string => {
      let str = '';
      if (val >= 100) {
        str += a[Math.floor(val / 100)] + 'Hundred ';
        val %= 100;
        if (val > 0) str += 'and ';
      }
      if (val >= 20) {
        str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
      } else if (val > 0) {
        str += a[val];
      }
      return str;
    };

    let res = '';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remaining = n % 1000;

    if (crore > 0) res += convert(crore) + 'Crore ';
    if (lakh > 0) res += convert(lakh) + 'Lakh ';
    if (thousand > 0) res += convert(thousand) + 'Thousand ';
    if (remaining > 0) res += convert(remaining);

    return res.trim();
  }

  // Penalty Modals Logic


  fetchSchedulePreview(): void {
    this.fetchScheduleSubject$.next();
  }

  openPenaltyModal(): void {
    const today = new Date();
    const defaultDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    const currentMonthStr = this.datePipe.transform(today, 'yyyy-MM') || '';
    this.previewScheduleList = [];
    this.scheduleSummary = null;
    this.isPreviewLoading = false;
    this.previewErrorMessage = '';
    this.penaltyForm.reset({
      employeeId: '',
      recoveryType: '',
      particulars: '',
      penaltyDate: defaultDate,
      amount: null,
      showCauseIssued: 'No',
      witnessName: '',
      installments: null,
      firstMonth: '',
      lastMonth: '',
      remarks: ''
    });
    this.penaltyModalOpen = true;
  }

  closePenaltyModal(): void {
    this.penaltyModalOpen = false;
  }

  savePenalty(): void {
    if (this.penaltyForm.valid) {
      const formValue = this.penaltyForm.value;
      const penaltyDateVal = formValue.penaltyDate || (formValue.firstMonth ? `${formValue.firstMonth}-01` : this.datePipe.transform(new Date(), 'yyyy-MM-dd'));

      const payload = {
        employee_id: String(formValue.employeeId),
        penalty_date: penaltyDateVal,
        recovery_type: formValue.recoveryType ? String(formValue.recoveryType).toLowerCase() : '',
        reason: formValue.particulars,
        particulars: formValue.particulars,
        amount: formValue.amount,
        show_cause_issued: (formValue.showCauseIssued === 'Yes' || formValue.showCauseIssued === '1' || formValue.showCauseIssued === 1) ? 1 : 0,
        witness_name: formValue.witnessName || '',
        remarks: formValue.remarks || ''
      };

      this.employeeManagementService.addPenalty(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 201 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Penalty applied successfully', 'success', 3000);
            this.closePenaltyModal();
            this.loadPayrollData();
          } else {
            this.notificationService.show(res.message || 'Failed to apply penalty', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errorMsg = err?.error?.message || err?.message || 'Failed to apply penalty';
          // this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.penaltyForm.markAllAsTouched();
    }
  }

  openBulkPenaltyModal(): void {
    this.selectedBulkFile = null;
    this.isUploading = false;
    this.uploadResult = null;
    this.bulkPenaltyModalOpen = true;
  }

  closeBulkPenaltyModal(): void {
    this.bulkPenaltyModalOpen = false;
    this.selectedBulkFile = null;
  }

  onBulkFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      this.selectedBulkFile = file;
    }
  }

  uploadBulkPenalty(): void {
    if (!this.selectedBulkFile) {
      this.notificationService.show('Please select a file to upload', 'error', 3000);
      return;
    }

    this.isUploading = true;
    this.uploadResult = null;
    const formData = new FormData();
    formData.append('file', this.selectedBulkFile);

    this.employeeManagementService.uploadBulkPenalties(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
          this.notificationService.show(res.message || 'Bulk penalties applied successfully!', 'success', 3000);
          this.closeBulkPenaltyModal();
          this.loadPayrollData();
        } else {
          this.uploadResult = {
            status: res.status || 422,
            message: res.message || 'Import process completed with errors.',
            errors: res.errors || []
          };
        }
      },
      error: (err: any) => {
        this.isUploading = false;
        console.error('Error during bulk penalty upload:', err);
        const errObj = err.originalError || err.error || err;
        let formattedErrors: string[] = [];

        if (errObj.errors) {
          if (Array.isArray(errObj.errors)) {
            formattedErrors = errObj.errors.map((e: any) => {
              if (typeof e === 'object' && e !== null) {
                const col = e.column ? ` [${e.column}]` : '';
                const msg = Array.isArray(e.errors) ? e.errors.join(', ') : (e.message || 'Unknown error');
                return `Row ${e.row || 'N/A'}${col}: ${msg}`;
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
          message: errObj.message || err.message || 'Failed to apply bulk penalties.',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
      }
    });
  }

  openViewPenaltyModal(rec: PayrollRecord): void {
    this.selectedPenaltyEmployee = rec;
    this.selectedPenaltyEmployee.penalties = []; // Clear old/initial data
    const [year, month] = this.currentMonth.split('-').map(Number);

    if (rec.dbId) {
      this.employeeManagementService.getEmployeePenalties(rec.dbId, month, year).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data && this.selectedPenaltyEmployee) {
            this.selectedPenaltyEmployee.penalties = res.data.penalties.map((p: any) => ({
              date: p.date || p.penalty_date,
              reason: p.reason,
              amount: p.amount
            }));
          }
        },
        error: () => {
          this.notificationService.show('Failed to fetch penalty details', 'error', 3000);
        }
      });
    }

    this.viewPenaltyModalOpen = true;
  }

  closeViewPenaltyModal(): void {
    this.viewPenaltyModalOpen = false;
    this.selectedPenaltyEmployee = null;
  }
}
