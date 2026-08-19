import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { DepartmentService } from 'src/app/core/services/department.service';

export interface DepartmentOption {
  id: number | string;
  name: string;
  status?: number;
  is_active?: number;
}

export interface WageBreakdown {
  basic: number;
  da: number;
  total: number;
  overtime_rate: number;
}

export interface EmployeePayroll {
  id: number | string;
  employee_id?: number | string;
  emp_id?: number | string;
  employee_code?: string;
  name: string;
  mobile?: string;
  dob?: string;
  joining_date?: string;
  gender?: string;
  department_id?: number | string;
  designation_id?: number | string;
  emergency_contact?: string;
  address?: string;
  father_name?: string;
  employee_type?: string;
  relay?: string;
  salary_type?: string;
  basic_salary?: string | number;
  daily_wage?: string | number;
  rest_days?: number;
  aadhaar?: string;
  pan?: string;
  esic_ip?: string;
  lwf_applicable?: number | string | boolean;
  pf_applicable?: number | string | boolean;
  pf_amount?: string | number;
  pf_number?: string;
  uan?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  mess_deduction_applicable?: number | string | boolean;
  mess_deduction_amount?: string | number;
  mess_deduction?: string | number;
  other_deduction_appliacble?: number | string | boolean;
  other_deduction?: string | number;
  penalty_count?: number;
  uan_number?: string;
  pan_number?: string;
  esic_number?: string;
  aadhaar_number?: string;
  employee_name?: string;
  is_active?: boolean | number | string;
  empId?: string | number;
  qualification?: string;
  doj?: string;
  designation?: string;
  category?: string;
  contact_no?: string;
  surname?: string;
  nationality?: string;
  education_level?: string;
  skill_category_label?: string;
  payroll?: any;
  permanent_address?: string;
  service_book_no?: string;
  date_of_exit?: string;
  reason_for_exit?: string;
  identification_mark?: string;
  remarks?: string;
  place_of_employment?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-employee-payroll',
  templateUrl: './employee-payroll.component.html',
  styleUrl: './employee-payroll.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition(':enter', [
        animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
  ],
})
export class EmployeePayrollComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchbarform!: FormGroup;
  filterForm!: FormGroup;
  payrollForm!: FormGroup;
  penaltyForm!: FormGroup;

  tableSize: any = 10;
  tableSizes: any[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  showreset: boolean = false;

  payrollModalOpen: boolean = false;
  viewModalOpen: boolean = false;
  penaltyModalOpen: boolean = false;
  isEditMode: boolean = false;
  isTopLevelAdd: boolean = false;
  currentEmployeeId: number | string | null = null;
  currentPayrollId: number | string | null = null;
  selectedEmployeeData: EmployeePayroll | null = null;
  selectedEmployeeForPenalty: EmployeePayroll | null = null;

  // Smart Payroll Logic Variables
  selectedEmployeeCategory: string = '';
  wageBreakdown: WageBreakdown | null = null;
  cachedPfAmount: number | string | null = null;
  
  employeeList: EmployeePayroll[] = [];
  allEmployeeList: EmployeePayroll[] = [];
  departmentsList: DepartmentOption[] = [];
  
  table_heading = ['S.No.', 'Emp ID', 'Name', 'Action'];


  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private employeeManagementService: EmployeeManagementService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.filterForm = this.formBuilder.group({
      deptFilter: [null],
    });

    this.initPayrollForm();
    this.initPenaltyForm();
    this.loadDropdownData();
    this.GetEmployeeFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initPenaltyForm(): void {
    this.penaltyForm = this.formBuilder.group({
      reason: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  initPayrollForm(): void {
    this.payrollForm = this.formBuilder.group({
      basicSalary: ['', [Validators.required, Validators.min(0)]],

      // Statutory Identifiers
      aadhaar: ['', [Validators.pattern('^[0-9]{12}$')]],
      pan: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      esicIp: [''],
      lwfApplicable: ['No'],
      lwfNumber: [''],
      isPfApplicable: ['No', [Validators.required]],
      pfAmount: [''],
      pfNumber: [''],
      uan: [''],
      bankName: ['', [Validators.required]],
      accountNumber: ['', [Validators.required]],
      ifscCode: ['', [Validators.required]],
      isMessApplicable: ['No', [Validators.required]],
      messDeductionAmount: [''],
      isOthersDeductionApplicable: ['No', [Validators.required]],
      othersDeductionAmount: [''],
    });

    this.payrollForm.get('isPfApplicable')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const pfAmtCtrl = this.payrollForm.get('pfAmount');
      const uanCtrl = this.payrollForm.get('uan');
      if (val === 'Yes') {
        pfAmtCtrl?.setValidators([Validators.required, Validators.min(0)]);
        uanCtrl?.setValidators([Validators.required]);
        if (this.cachedPfAmount && !pfAmtCtrl?.value) {
          pfAmtCtrl?.setValue(this.cachedPfAmount);
        }
      } else {
        pfAmtCtrl?.clearValidators();
        uanCtrl?.clearValidators();
        pfAmtCtrl?.setValue('');
        uanCtrl?.setValue('');
      }
      pfAmtCtrl?.updateValueAndValidity();
      uanCtrl?.updateValueAndValidity();
    });

    this.payrollForm.get('lwfApplicable')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const numCtrl = this.payrollForm.get('lwfNumber');
      if (val === 'Yes') {
        numCtrl?.setValidators([Validators.required]);
      } else {
        numCtrl?.clearValidators();
        numCtrl?.setValue('');
      }
      numCtrl?.updateValueAndValidity();
    });

    this.payrollForm.get('isMessApplicable')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const amtCtrl = this.payrollForm.get('messDeductionAmount');
      if (val === 'Yes') {
        amtCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        amtCtrl?.clearValidators();
        amtCtrl?.setValue('');
      }
      amtCtrl?.updateValueAndValidity();
    });

    this.payrollForm.get('isOthersDeductionApplicable')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const amtCtrl = this.payrollForm.get('othersDeductionAmount');
      if (val === 'Yes') {
        amtCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        amtCtrl?.clearValidators();
        amtCtrl?.setValue('');
      }
      amtCtrl?.updateValueAndValidity();
    });

  }

  loadDropdownData(): void {
    this.departmentService.getAllDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.departmentsList = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error fetching departments:', error);
      }
    });
  }

  GetEmployeeFun(): void {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const deptId = this.filterForm.get('deptFilter')?.value || '';

    this.employeeManagementService.getEmployeePayrollsList(this.tableSize, this.page, searchText, deptId, '')
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.employeeList = response.data?.data || response.data || [];
            if (this.employeeList.length > 0) {
              this.employeeList[0].penalty_count = 2; // Mock for design
            }
            this.totalRecords = response.pagination?.total || response.data?.total || this.employeeList.length;
          } else {
            this.employeeList = [];
            this.totalRecords = 0;
          }
        },
        error: (err: any) => {
          console.error('Error fetching employees', err);
          this.employeeList = [];
        }
      });
  }

  onTableSizeChange(event: any): void {
    const value = event && event.target ? event.target.value : event;
    this.tableSize = value === 'all' ? 'all' : Number(value);
    this.page = 1;
    this.GetEmployeeFun();
  }

  onTableDataChange(event: number): void {
    this.page = event;
    this.GetEmployeeFun();
  }

  searchfun(): void {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const deptFilter = this.filterForm.get('deptFilter')?.value || '';
    this.showreset = (searchText.trim().length > 0 || !!deptFilter);
    this.page = 1;
    this.GetEmployeeFun();
  }

  resetsearchbar(): void {
    this.searchbarform.reset();
    this.filterForm.reset();
    this.showreset = false;
    this.page = 1;
    this.GetEmployeeFun();
  }

  openPayrollModal(employee: any): void {
    this.isTopLevelAdd = false;
    // Since we use v1/admin/employee-payrolls, employee object is the payroll itself.
    this.currentPayrollId = employee.payroll?.id || employee.id;
    this.currentEmployeeId = employee.employee_id || employee.empId || employee.id;

    this.payrollForm.reset({
      isPfApplicable: 'No',
      isMessApplicable: 'No',
      isOthersDeductionApplicable: 'No',
      lwfApplicable: 'No'
    });

    const targetEmpId = this.currentEmployeeId;
    
    if (this.currentPayrollId) {
      this.employeeManagementService.getEmployeePayrollById(this.currentPayrollId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;
          this.selectedEmployeeData = emp;

          const actualEmpId = emp.employee_id || emp.emp_id || targetEmpId;
          
          let basicSal = '';
          if (emp.salary_type === 'monthly') {
            basicSal = emp.basic_salary;
          } else if (emp.salary_type === 'daily_wage') {
            basicSal = emp.daily_wage;
          }

          this.isEditMode = true; // explicitly set Edit Mode

          if (this.isEditMode) {
            this.payrollForm.patchValue({
              basicSalary: basicSal || '',
              aadhaar: emp.aadhaar_last4 || emp.aadhaar || '',
              pan: emp.pan || '',
              esicIp: emp.esic_ip_number || emp.esic_ip || '',
              lwfApplicable: (emp.lwf_number_applicable == 1 || emp.lwf_number_applicable === 'Yes' || emp.lwf_number_applicable === true || emp.lwf_applicable == 1 || emp.lwf_applicable === 'Yes' || emp.lwf_applicable === true) ? 'Yes' : 'No',
              lwfNumber: emp.lwf_number || '',
              isPfApplicable: (emp.pf_applicable == 1 || emp.pf_applicable === 'Yes' || emp.pf_applicable === true) ? 'Yes' : 'No',
              pfAmount: emp.pf_amount || '',
              pfNumber: emp.pf_number || '',
              uan: emp.uan || '',
              bankName: emp.bank_name || '',
              accountNumber: emp.bank_account_number || '',
              ifscCode: emp.ifsc_code || '',
              isMessApplicable: (emp.mess_deduction_applicable == 1 || emp.mess_deduction_applicable === 'Yes' || emp.mess_deduction_applicable === true) ? 'Yes' : 'No',
              messDeductionAmount: emp.mess_deduction_amount || '',
              isOthersDeductionApplicable: (emp.other_deduction_appliacble == 1 || emp.other_deduction_appliacble === 'Yes' || emp.other_deduction_appliacble === true) ? 'Yes' : 'No',
              othersDeductionAmount: emp.other_deduction || ''
            });
          }
          
          this.payrollModalOpen = true;

          // As requested, call wages API to prefill wage data on edit success
          if (actualEmpId) {
            this.fetchEmployeeWageDetails(actualEmpId, true);
          }

        } else {
          this.notificationService.show('Failed to load employee details.', 'error', 3000);
        }
      },
      error: () => this.notificationService.show('Error loading details.', 'error', 3000)
    });
    } else {
      this.selectedEmployeeData = employee;
      this.isEditMode = false;
      this.payrollModalOpen = true;
      if (targetEmpId) {
        this.fetchEmployeeWageDetails(targetEmpId, true);
      }
    }
  }

  closeModal(): void {
    this.payrollModalOpen = false;
    this.selectedEmployeeData = null;
    this.currentEmployeeId = null;
    this.selectedEmployeeCategory = '';
    this.wageBreakdown = null;
    this.cachedPfAmount = null;
  }

  fetchEmployeeWageDetails(empId: any, isSilent: boolean = false): void {
    if (!empId) return;
    this.employeeManagementService.getEmployeeWageByEmployeeId(empId, isSilent).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const data = response.data;
          const wage = data.wage || data;
          
          this.selectedEmployeeCategory = data.skill_category_label || wage?.skill_category_label || data.skill_category || wage?.skill_category || '';
          
          if (wage) {
            const basic = parseFloat(wage.minimum_basic || data.minimum_basic || '0');
            const da = parseFloat(wage.dearness_allowance || data.dearness_allowance || '0');
            const total = (wage.basic_salary !== undefined && wage.basic_salary !== null) 
              ? parseFloat(wage.basic_salary) 
              : (data.basic_salary !== undefined && data.basic_salary !== null ? parseFloat(data.basic_salary) : (basic + da));

            this.wageBreakdown = {
              basic: basic,
              da: da,
              total: total,
              overtime_rate: wage.overtime_rate ? parseFloat(wage.overtime_rate) : 0
            };

            this.cachedPfAmount = wage.pf_amount !== undefined ? wage.pf_amount : null;

            // Only prefill basic salary and pfAmount from wages
            const patchData: any = {};
            patchData.basicSalary = total;
            
            // Check current form state for PF Applicability
            const currentPfApp = this.payrollForm.get('isPfApplicable')?.value;
            if (this.cachedPfAmount !== null && currentPfApp === 'Yes') {
              patchData.pfAmount = this.cachedPfAmount;
            } else if (this.cachedPfAmount !== null && this.isTopLevelAdd) {
               // When adding, if wage has pf_amount, we don't automatically set isPfApplicable to Yes 
               // because employee personal data might not have PF applicable. But we store it in cache.
            }

            this.payrollForm.patchValue(patchData, { emitEvent: false });
          } else {
            this.wageBreakdown = null;
          }
        } else {
          this.selectedEmployeeCategory = '';
          this.wageBreakdown = null;
        }
      },
      error: () => {
        // Silent catch if no wage rate is configured for employee
        this.selectedEmployeeCategory = '';
        this.wageBreakdown = null;
      }
    });
  }

  openAddPayrollModal(): void {
    this.isEditMode = false;
    this.isTopLevelAdd = true;
    this.currentEmployeeId = null;
    this.selectedEmployeeData = null;
    this.selectedEmployeeCategory = '';
    this.wageBreakdown = null;
    this.payrollForm.reset({
      isPfApplicable: 'No',
      isMessApplicable: 'No',
      isOthersDeductionApplicable: 'No',
      lwfApplicable: 'No'
    });
    
    this.employeeManagementService.getActiveEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.allEmployeeList = response.data || [];
        }
      }
    });

    this.payrollModalOpen = true;
  }

  onEmployeeSelect(event: any): void {
    let empId: any = null;
    if (event && event.target) {
      empId = event.target.value; // For native select
    } else if (event && event.id !== undefined) {
      empId = event.id; // For ng-select where it emits the whole object
    } else {
      empId = event; // Fallback
    }
    
    if (empId) {
      this.currentEmployeeId = empId;
      this.fetchEmployeeWageDetails(empId);
    } else {
      this.selectedEmployeeData = null;
      this.currentEmployeeId = null;
      this.selectedEmployeeCategory = '';
      this.wageBreakdown = null;
      this.payrollForm.get('basicSalary')?.reset();
    }
  }

  openViewModal(employee: any): void {
    this.employeeManagementService.getEmployeePayrollById(employee.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;
          this.selectedEmployeeData = emp;
          this.viewModalOpen = true;
        } else {
          this.notificationService.show('Failed to load employee details.', 'error', 3000);
        }
      },
      error: () => this.notificationService.show('Error loading details.', 'error', 3000)
    });
  }

  closeViewModal(): void {
    this.viewModalOpen = false;
    this.selectedEmployeeData = null;
  }

  savePayrollDetails(): void {
    if (this.isTopLevelAdd && !this.currentEmployeeId) {
      this.notificationService.show('Please select an employee first.', 'error', 3000);
      return;
    } else if (!this.isTopLevelAdd && !this.selectedEmployeeData) {
      this.notificationService.show('Please select an employee first.', 'error', 3000);
      return;
    }

    if (this.payrollForm.invalid) {
      this.payrollForm.markAllAsTouched();
      this.notificationService.show('Please fill all required fields correctly.', 'error', 3000);
      return;
    }

    const payrollData = this.payrollForm.getRawValue();
    
    if (this.isTopLevelAdd) {
      const formData = new FormData();
      if (this.currentEmployeeId) {
        formData.append('employee_id', this.currentEmployeeId.toString());
      }
      
      const emp: any = this.selectedEmployeeData || {};
      formData.append('salary_type', emp.salary_type || 'monthly');
      
      if (emp.salary_type === 'daily_wage') {
        formData.append('basic_salary', '0');
        formData.append('daily_wage', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
      } else {
        formData.append('basic_salary', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
        formData.append('daily_wage', '0');
      }
      
      formData.append('aadhaar_number', payrollData.aadhaar || '');
      formData.append('pan', payrollData.pan || '');
      formData.append('esic_ip_number', payrollData.esicIp || '');
      formData.append('lwf_number_applicable', payrollData.lwfApplicable === 'Yes' ? '1' : '0');
      formData.append('lwf_number', payrollData.lwfApplicable === 'Yes' ? (payrollData.lwfNumber || '') : '');
      
      formData.append('pf_applicable', payrollData.isPfApplicable === 'Yes' ? '1' : '0');
      formData.append('pf_amount', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfAmount || '0').toString() : '0');
      formData.append('pf_number', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfNumber || '') : '');
      formData.append('uan', payrollData.isPfApplicable === 'Yes' ? (payrollData.uan || '') : '');
      formData.append('bank_name', payrollData.bankName || '');
      formData.append('bank_account_number', payrollData.accountNumber || '');
      formData.append('ifsc_code', payrollData.ifscCode || '');
      formData.append('mess_deduction_applicable', payrollData.isMessApplicable === 'Yes' ? '1' : '0');
      formData.append('mess_deduction_amount', payrollData.isMessApplicable === 'Yes' ? (payrollData.messDeductionAmount || '0').toString() : '0');
      formData.append('other_deduction_appliacble', payrollData.isOthersDeductionApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction', payrollData.isOthersDeductionApplicable === 'Yes' ? (payrollData.othersDeductionAmount || '0').toString() : '0');

      this.employeeManagementService.createEmployeePayroll(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(response.message || 'Payroll details added successfully!', 'success', 3000);
            this.closeModal();
            this.GetEmployeeFun();
          } else {
            this.notificationService.show(response.message || 'Failed to add payroll', 'error', 3000);
          }
        },
        error: (error: any) => {
          const errorMsg = error.error?.message || error.message || 'Something went wrong';
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });

    } else {
      const emp: any = this.selectedEmployeeData || {};
      
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const parts = dateStr.split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
      };

      const formData = new FormData();
      if (this.currentEmployeeId) {
        formData.append('id', this.currentEmployeeId.toString());
      }
      
      // All employee data that needs to be retained
      formData.append('name', emp.name || '');
      formData.append('mobile', emp.mobile || '');
      formData.append('employee_code', emp.employee_code || '');
      formData.append('dob', formatDate(emp.dob));
      formData.append('joining_date', formatDate(emp.joining_date));
      formData.append('gender', emp.gender || '');
      formData.append('department_id', emp.department_id || '');
      formData.append('designation_id', emp.designation_id || '');
      formData.append('emergency_contact', emp.emergency_contact || '');
      formData.append('address', emp.address || '');
      formData.append('father_name', emp.father_name || '');
      formData.append('employee_type', emp.employee_type || 'permanent');
      formData.append('relay', emp.relay || 'General');
      
      formData.append('salary_type', emp.salary_type || 'monthly');
      
      if (emp.salary_type === 'daily_wage') {
        formData.append('basic_salary', '0');
        formData.append('daily_wage', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
      } else {
        formData.append('basic_salary', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
        formData.append('daily_wage', '0');
      }

      formData.append('aadhaar_number', payrollData.aadhaar || '');
      formData.append('pan', payrollData.pan || '');
      formData.append('esic_ip_number', payrollData.esicIp || '');
      formData.append('lwf_number_applicable', payrollData.lwfApplicable === 'Yes' ? '1' : '0');
      formData.append('lwf_number', payrollData.lwfApplicable === 'Yes' ? (payrollData.lwfNumber || '') : '');
      
      formData.append('pf_applicable', payrollData.isPfApplicable === 'Yes' ? '1' : '0');
      formData.append('pf_amount', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfAmount || '0').toString() : '0');
      formData.append('pf_number', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfNumber || '') : '');
      formData.append('uan', payrollData.isPfApplicable === 'Yes' ? (payrollData.uan || '') : '');
      formData.append('bank_name', payrollData.bankName || '');
      formData.append('bank_account_number', payrollData.accountNumber || '');
      formData.append('ifsc_code', payrollData.ifscCode || '');
      formData.append('mess_deduction_applicable', payrollData.isMessApplicable === 'Yes' ? '1' : '0');
      formData.append('mess_deduction_amount', payrollData.isMessApplicable === 'Yes' ? (payrollData.messDeductionAmount || '0').toString() : '0');
      formData.append('other_deduction_appliacble', payrollData.isOthersDeductionApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction', payrollData.isOthersDeductionApplicable === 'Yes' ? (payrollData.othersDeductionAmount || '0').toString() : '0');

      if (this.currentPayrollId) {
        formData.append('_method', 'PUT');
        this.employeeManagementService.updateEmployeePayroll(this.currentPayrollId, formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show('Payroll details updated successfully!', 'success', 3000);
              this.closeModal();
              this.GetEmployeeFun();
            } else {
              this.notificationService.show(response.message || 'Failed to update payroll', 'error', 3000);
            }
          },
          error: (error: any) => {
            const errorMsg = error.error?.message || error.message || 'Something went wrong';
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      } else {
        this.employeeManagementService.createEmployeePayroll(formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Payroll details added successfully!', 'success', 3000);
              this.closeModal();
              this.GetEmployeeFun();
            } else {
              this.notificationService.show(response.message || 'Failed to add payroll', 'error', 3000);
            }
          },
          error: (error: any) => {
            const errorMsg = error.error?.message || error.message || 'Something went wrong';
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      }
    }
  }

  openPenaltyModal(employee: any): void {
    this.selectedEmployeeForPenalty = employee;
    this.penaltyForm.reset();
    this.penaltyModalOpen = true;
  }

  closePenaltyModal(): void {
    this.penaltyModalOpen = false;
    this.selectedEmployeeForPenalty = null;
    this.penaltyForm.reset();
  }

  savePenalty(): void {
    if (this.penaltyForm.invalid || !this.selectedEmployeeForPenalty) {
      this.penaltyForm.markAllAsTouched();
      return;
    }

    const penaltyData = this.penaltyForm.getRawValue();
    const payload = {
      employee_id: String(this.selectedEmployeeForPenalty.id || this.selectedEmployeeForPenalty.employee_id),
      penalty_date: new Date().toISOString().split('T')[0],
      recovery_type: penaltyData.recoveryType ? String(penaltyData.recoveryType).toLowerCase() : 'advance',
      reason: penaltyData.reason,
      particulars: penaltyData.reason,
      amount: String(penaltyData.amount)
    };

    this.employeeManagementService.addPenalty(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 201)) {
          this.notificationService.show(res.message || 'Penalty applied successfully!', 'success', 3000);
          this.closePenaltyModal();
          this.GetEmployeeFun();
        } else {
          this.notificationService.show(res.message || 'Failed to apply penalty', 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show(err.error?.message || 'Failed to apply penalty', 'error', 3000);
      }
    });
  }
}
