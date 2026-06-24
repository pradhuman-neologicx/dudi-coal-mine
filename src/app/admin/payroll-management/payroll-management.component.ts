import { Component, OnInit } from '@angular/core';
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
export class PayrollManagementComponent implements OnInit {
  employees: any[] = [];
  allAttendanceRecords: any[] = [];
  
  // Filters
  currentMonth: string = '';
  currentMaxMonth: string = '';
  selectedSite: number | null = null;
  selectedDept: number | null = null;
  filterSearch: string = '';
  
  // State Machine
  payrollState: 'Draft' | 'Pending Verification' | 'Finalized' = 'Draft';
  
  // Calculated Payroll list
  payrollRecords: PayrollRecord[] = [];
  filteredPayrollRecords: PayrollRecord[] = [];
  
  // Pagination
  p: number = 1;
  showEntries: number = 10;
  totalRecords: number = 0;
  
  // Selected Payslip for A4 Print/Preview
  selectedPayslipRecord: PayrollRecord | null = null;
  showPayslipModal: boolean = false;
  
  // Adjustments Modal (Draft mode only)
  showEditModal: boolean = false;
  editForm!: FormGroup;
  currentEditingRecord: PayrollRecord | null = null;

  // Add Manual Record Modal
  showAddModal: boolean = false;
  addForm!: FormGroup;
  
  // Penalty Modals
  penaltyModalOpen: boolean = false;
  bulkPenaltyModalOpen: boolean = false;
  penaltyForm!: FormGroup;
  viewPenaltyModalOpen: boolean = false;
  selectedPenaltyEmployee: any = null;
  selectedBulkFile: File | null = null;
  
  // Dropdown options
  sites: any[] = [];
  departments: any[] = [];

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
      penaltyDate: ['', Validators.required],
      reason: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]]
    });
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
    this.employeeManagementService.getActiveEmployees().subscribe({
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
    this.siteService.getAllSites().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.sites = res.data || [];
        }
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.departments = res.data || [];
        }
      }
    });
  }

  loadPayrollData(): void {
    const [year, month] = this.currentMonth.split('-').map(Number);
    this.employeeManagementService.getPayroll(month, year, this.showEntries, this.p, this.filterSearch, this.selectedDept, this.selectedSite).subscribe({
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
        designation: selectedEmp.designation,
        department: selectedEmp.department,
        site: selectedEmp.site,
        basicSalary: selectedEmp.basicSalary,
        pfDeduction: Math.round(selectedEmp.basicSalary * 0.1)
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

      this.employeeManagementService.createEmployeePayroll(payload).subscribe({
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

      this.employeeManagementService.updateEmployeePayroll(this.currentEditingRecord.dbId, payload).subscribe({
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
    this.employeeManagementService.getPayrollDetail(rec.dbId, month, year).subscribe({
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
  openPenaltyModal(): void {
    const today = new Date();
    const defaultDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    this.penaltyForm.reset({
      penaltyDate: defaultDate
    });
    this.penaltyModalOpen = true;
  }

  closePenaltyModal(): void {
    this.penaltyModalOpen = false;
  }

  savePenalty(): void {
    if (this.penaltyForm.valid) {
      const formValue = this.penaltyForm.value;
      const payload = {
        employee_id: formValue.employeeId,
        penalty_date: formValue.penaltyDate,
        reason: formValue.reason,
        amount: formValue.amount
      };

      this.employeeManagementService.addPenalty(payload).subscribe({
        next: (res: any) => {
          if (res && res.status === 200) {
            this.notificationService.show('Penalty applied successfully!', 'success', 3000);
            this.closePenaltyModal();
            this.loadPayrollData();
          } else {
            this.notificationService.show(res.message || 'Failed to apply penalty', 'error', 3000);
          }
        },
        error: (err: any) => {
          this.notificationService.show(err?.error?.message || 'Failed to apply penalty', 'error', 3000);
        }
      });
    } else {
      this.penaltyForm.markAllAsTouched();
    }
  }

  openBulkPenaltyModal(): void {
    this.selectedBulkFile = null;
    this.bulkPenaltyModalOpen = true;
  }

  closeBulkPenaltyModal(): void {
    this.bulkPenaltyModalOpen = false;
    this.selectedBulkFile = null;
  }

  onBulkFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedBulkFile = file;
    }
  }

  uploadBulkPenalty(): void {
    if (!this.selectedBulkFile) {
      this.notificationService.show('Please select a file to upload', 'error', 3000);
      return;
    }
    const formData = new FormData();
    formData.append('file', this.selectedBulkFile);

    this.employeeManagementService.uploadBulkPenalties(formData).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 201 || res.status === 'success')) {
          this.notificationService.show(res.message || 'Bulk penalties applied successfully!', 'success', 3000);
          this.closeBulkPenaltyModal();
          this.loadPayrollData();
        } else {
          this.notificationService.show(res.message || 'Failed to apply bulk penalties', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error during bulk penalty upload:', err);
        const originalError = err.originalError || err.error || err;
        let errorMessage = originalError.message || err.message || 'Failed to apply bulk penalties.';

        if (originalError.errors && Array.isArray(originalError.errors)) {
          const formattedErrors = originalError.errors.map((e: any) => {
            const msgs = Array.isArray(e.errors) ? e.errors.join(', ') : e.message;
            return `Row ${e.row}: ${msgs}`;
          }).join('\n');
          errorMessage += '\n' + formattedErrors;
        }

        const duration = originalError.errors ? 8000 : 3000;
        this.notificationService.show(errorMessage, 'error', duration);
      }
    });
  }

  openViewPenaltyModal(rec: PayrollRecord): void {
    this.selectedPenaltyEmployee = rec;
    this.selectedPenaltyEmployee.penalties = []; // Clear old/initial data
    const [year, month] = this.currentMonth.split('-').map(Number);
    
    if (rec.dbId) {
      this.employeeManagementService.getEmployeePenalties(rec.dbId, month, year).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
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
