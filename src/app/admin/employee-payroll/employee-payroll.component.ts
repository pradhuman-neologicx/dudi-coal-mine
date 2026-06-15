import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { DepartmentService } from 'src/app/core/services/department.service';

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
export class EmployeePayrollComponent implements OnInit {
  searchbarform!: FormGroup;
  filterForm!: FormGroup;
  payrollForm!: FormGroup;
  penaltyForm!: FormGroup;

  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  showreset: boolean = false;

  payrollModalOpen: boolean = false;
  viewModalOpen: boolean = false;
  penaltyModalOpen: boolean = false;
  isEditMode: boolean = false;
  isTopLevelAdd: boolean = false;
  currentEmployeeId: any;
  selectedEmployeeData: any = null;
  selectedEmployeeForPenalty: any = null;
  
  employeeList: any[] = [];
  allEmployeeList: any[] = [];
  departmentsList: any[] = [];
  
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

  initPenaltyForm() {
    this.penaltyForm = this.formBuilder.group({
      reason: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  initPayrollForm() {
    this.payrollForm = this.formBuilder.group({
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      restDays: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: ['No', [Validators.required]],
      pfAmount: [''],
      pfNumber: [''],
      bankName: ['', [Validators.required]],
      accountNumber: ['', [Validators.required]],
      ifscCode: ['', [Validators.required]],
      isMessApplicable: ['No', [Validators.required]],
      messDeductionAmount: [''],
      isOthersDeductionApplicable: ['No', [Validators.required]],
      othersDeductionAmount: [''],
    });

    this.payrollForm.get('isPfApplicable')?.valueChanges.subscribe(val => {
      const pfNumCtrl = this.payrollForm.get('pfNumber');
      const pfAmtCtrl = this.payrollForm.get('pfAmount');
      if (val === 'Yes') {
        pfNumCtrl?.setValidators([Validators.required]);
        pfAmtCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        pfNumCtrl?.clearValidators();
        pfAmtCtrl?.clearValidators();
        pfNumCtrl?.setValue('');
        pfAmtCtrl?.setValue('');
      }
      pfNumCtrl?.updateValueAndValidity();
      pfAmtCtrl?.updateValueAndValidity();
    });

    this.payrollForm.get('isMessApplicable')?.valueChanges.subscribe(val => {
      const amtCtrl = this.payrollForm.get('messDeductionAmount');
      if (val === 'Yes') {
        amtCtrl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        amtCtrl?.clearValidators();
        amtCtrl?.setValue('');
      }
      amtCtrl?.updateValueAndValidity();
    });

    this.payrollForm.get('isOthersDeductionApplicable')?.valueChanges.subscribe(val => {
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

  loadDropdownData() {
    this.departmentService.getAllDepartments().subscribe({
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

  GetEmployeeFun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const deptId = this.filterForm.get('deptFilter')?.value || '';

    this.employeeManagementService.getEmployeePayrolls(this.tableSize, this.page, searchText, deptId, '').subscribe({
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
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetEmployeeFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetEmployeeFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const deptFilter = this.filterForm.get('deptFilter')?.value || '';
    this.showreset = (searchText.trim().length > 0 || !!deptFilter);
    this.page = 1;
    this.GetEmployeeFun();
  }

  resetsearchbar() {
    this.searchbarform.reset();
    this.filterForm.reset();
    this.showreset = false;
    this.page = 1;
    this.GetEmployeeFun();
  }

  openPayrollModal(employee: any) {
    this.isTopLevelAdd = false;
    this.currentEmployeeId = employee.id;
    this.payrollForm.reset({
      isPfApplicable: 'No',
      isMessApplicable: 'No',
      isOthersDeductionApplicable: 'No'
    });
    
    this.employeeManagementService.getEmployeePayrollById(employee.id).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;
          this.selectedEmployeeData = emp;
          
          let basicSal = '';
          if (emp.salary_type === 'monthly') {
            basicSal = emp.basic_salary;
          } else if (emp.salary_type === 'daily_wage') {
            basicSal = emp.daily_wage;
          }

          this.isEditMode = (parseFloat(basicSal || '0') > 0);

          if (this.isEditMode) {
            this.payrollForm.patchValue({
              basicSalary: basicSal || '',
              restDays: emp.rest_day || '',
              isPfApplicable: emp.pf_applicable == 1 ? 'Yes' : 'No',
              pfAmount: emp.pf_amount || '',
              pfNumber: emp.pf_number || '',
              bankName: emp.bank_name || '',
              accountNumber: emp.bank_account_number || '',
              ifscCode: emp.ifsc_code || '',
              isMessApplicable: emp.mess_deduction_applicable == 1 ? 'Yes' : 'No',
              messDeductionAmount: emp.mess_deduction || '',
              isOthersDeductionApplicable: emp.other_deduction_appliacble == 1 ? 'Yes' : 'No',
              othersDeductionAmount: emp.other_deduction || ''
            });
          }
          
          this.payrollModalOpen = true;
        } else {
          this.notificationService.show('Failed to load employee details.', 'error', 3000);
        }
      },
      error: () => this.notificationService.show('Error loading details.', 'error', 3000)
    });
  }

  closeModal() {
    this.payrollModalOpen = false;
    this.selectedEmployeeData = null;
    this.currentEmployeeId = null;
  }

  openAddPayrollModal() {
    this.isEditMode = false;
    this.isTopLevelAdd = true;
    this.currentEmployeeId = null;
    this.selectedEmployeeData = null;
    this.payrollForm.reset({
      isPfApplicable: 'No',
      isMessApplicable: 'No',
      isOthersDeductionApplicable: 'No'
    });
    
    this.employeeManagementService.getActiveEmployees().subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.allEmployeeList = response.data || [];
        }
      }
    });

    this.payrollModalOpen = true;
  }

  onEmployeeSelect(event: any) {
    let empId = null;
    if (event && event.target) {
      empId = event.target.value; // For native select
    } else if (event && event.id !== undefined) {
      empId = event.id; // For ng-select where it emits the whole object
    } else {
      empId = event; // Fallback
    }
    
    if (empId) {
      this.currentEmployeeId = empId;
      this.employeeManagementService.getEmployeeById(empId).subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            const emp = Array.isArray(response.data) ? response.data[0] : response.data;
            this.selectedEmployeeData = emp;
            // The form remains blank intentionally for add mode
          }
        }
      });
    } else {
      this.selectedEmployeeData = null;
      this.currentEmployeeId = null;
    }
  }

  openViewModal(employee: any) {
    this.employeeManagementService.getEmployeePayrollById(employee.id).subscribe({
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

  closeViewModal() {
    this.viewModalOpen = false;
    this.selectedEmployeeData = null;
  }

  savePayrollDetails() {
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
      console.log('Form is invalid', this.payrollForm.errors, this.payrollForm.value);
      return;
    }

    const payrollData = this.payrollForm.getRawValue();
    
    if (this.isTopLevelAdd) {
      const formData = new FormData();
      formData.append('employee_id', this.currentEmployeeId);
      
      const emp = this.selectedEmployeeData || {};
      formData.append('salary_type', emp.salary_type || 'monthly');
      
      if (emp.salary_type === 'daily_wage') {
        formData.append('basic_salary', '0');
        formData.append('daily_wage', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
      } else {
        formData.append('basic_salary', payrollData.basicSalary ? payrollData.basicSalary.toString() : '0');
        formData.append('daily_wage', '0');
      }
      
      formData.append('pf_applicable', payrollData.isPfApplicable === 'Yes' ? '1' : '0');
      formData.append('pf_number', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfNumber || '') : '');
      formData.append('bank_name', payrollData.bankName || '');
      formData.append('bank_account_number', payrollData.accountNumber || '');
      formData.append('ifsc_code', payrollData.ifscCode || '');
      formData.append('mess_deduction_applicable', payrollData.isMessApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction_appliacble', payrollData.isOthersDeductionApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction', payrollData.isOthersDeductionApplicable === 'Yes' ? (payrollData.othersDeductionAmount || '0') : '0');
      
      if(payrollData.restDays) {
        formData.append('rest_day', payrollData.restDays.toString());
      }

      this.employeeManagementService.createEmployeePayroll(formData).subscribe({
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
      const emp = this.selectedEmployeeData;
      
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const parts = dateStr.split('-');
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
      };

      const formData = new FormData();
      formData.append('id', this.currentEmployeeId);
      
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

      formData.append('pf_applicable', payrollData.isPfApplicable === 'Yes' ? '1' : '0');
      formData.append('pf_number', payrollData.isPfApplicable === 'Yes' ? (payrollData.pfNumber || '') : '');
      formData.append('bank_name', payrollData.bankName || '');
      formData.append('bank_account_number', payrollData.accountNumber || '');
      formData.append('ifsc_code', payrollData.ifscCode || '');
      formData.append('mess_deduction_applicable', payrollData.isMessApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction_appliacble', payrollData.isOthersDeductionApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction', payrollData.isOthersDeductionApplicable === 'Yes' ? (payrollData.othersDeductionAmount || '0') : '0');
      
      if(payrollData.restDays) {
        formData.append('rest_day', payrollData.restDays.toString());
      }

      formData.append('_method', 'PUT');

      this.employeeManagementService.updateEmployeePayroll(this.currentEmployeeId, formData).subscribe({
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
    }
  }

  openPenaltyModal(employee: any) {
    this.selectedEmployeeForPenalty = employee;
    this.penaltyForm.reset();
    this.penaltyModalOpen = true;
  }

  closePenaltyModal() {
    this.penaltyModalOpen = false;
    this.selectedEmployeeForPenalty = null;
    this.penaltyForm.reset();
  }

  savePenalty() {
    if (this.penaltyForm.invalid) {
      this.penaltyForm.markAllAsTouched();
      return;
    }

    const penaltyData = this.penaltyForm.getRawValue();
    console.log('Saving Penalty:', { employeeId: this.selectedEmployeeForPenalty.id, ...penaltyData });

    // Mock API Call Success
    this.notificationService.show('Penalty added successfully!', 'success', 3000);
    this.closePenaltyModal();
    this.GetEmployeeFun();
  }
}
