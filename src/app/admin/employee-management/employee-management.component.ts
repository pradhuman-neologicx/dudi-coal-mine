import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { DepartmentService } from 'src/app/core/services/department.service';
import { DesignationService } from 'src/app/core/services/designation.service';
import { SiteService } from 'src/app/core/services/site.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ShiftService } from 'src/app/core/services/shift.service';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgxPaginationModule,
    NgSelectModule,
  ],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.95)',
        }),
      ),
      transition(':enter', [
        animate(
          '0.3s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)',
          }),
        ),
      ]),
      transition(':leave', [
        animate(
          '0.2s ease-in',
          style({
            opacity: 0,
            transform: 'scale(0.95)',
          }),
        ),
      ]),
    ]),
  ],
})
export class EmployeeManagementComponent implements OnInit {
  showreset: boolean = false;
  searchbarform!: FormGroup;
  filterForm!: FormGroup;

  employeeForm!: FormGroup;

  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;

  employeeModalOpen: boolean = false;
  isEditMode: boolean = false;
  viewEmployeeOpen: boolean = false;
  currentEmployeeId: any;
  selectedEmployee: any = null;

  activeTab: 'personal' | 'employment' | 'payroll' = 'personal';

  employeeList: any[] = [];

  table_heading = ['S.No.', 'Emp ID', 'Name', 'Contact', 'Department', 'Designation', 'Shift Group', 'Status', 'Action'];

  sitesList: any[] = [];
  departmentsList: any[] = [];
  designationsList: any[] = [];

  uploadModalOpen: boolean = false;
  uploadForm!: FormGroup;
  selectedUploadFile: any = null;
  selectedUploadFileName: string = '';

  // Assign Shift variables
  assignShiftModalOpen: boolean = false;
  allShiftsList: any[] = [];
  allEmployeesList: any[] = [];
  selectedEmployeeIds = new Set<string>();
  assignShiftStartDate: string = '';
  assignShiftEndDate: string = '';
  assignShiftType: string = '';
  shiftGroups: { [groupName: string]: string[] } = {};
  assignShiftModalLabel: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private employeeManagementService: EmployeeManagementService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private siteService: SiteService,
    private shiftService: ShiftService,
  ) { }

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.filterForm = this.formBuilder.group({
      siteFilter: [''],
      deptFilter: [''],
      designationFilter: [''],
    });

    this.uploadForm = this.formBuilder.group({
      file: [null, [Validators.required]]
    });

    this.loadDropdownData();
    this.initEmployeeForm();
    this.GetEmployeeFun();
    this.loadShiftGroups();
    this.loadAllEmployees();
  }

  onDateClick(event: any) {
    if (event.target && typeof event.target.showPicker === 'function') {
      event.target.showPicker();
    }
  }

  initEmployeeForm() {
    this.employeeForm = this.formBuilder.group({
      // Personal
      empId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      fatherName: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', [Validators.required]],
      emergencyContact: ['', [Validators.pattern('^[0-9]{10}$')]],

      // Employment
      joiningDate: ['', [Validators.required]],
      empType: ['', [Validators.required]],
      department: ['', [Validators.required]],
      designation: ['', [Validators.required]],

      // Payroll
      salaryType: ['', [Validators.required]],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: ['No', [Validators.required]],
      pfNumber: [''],
      bankName: ['', [Validators.required]],
      accountNumber: ['', [Validators.required]],
      ifscCode: ['', [Validators.required]],
      isMessApplicable: ['No', [Validators.required]],
      isOthersDeductionApplicable: ['No', [Validators.required]],
      othersDeductionAmount: [''],
    });

    // Dynamic validator for PF Number based on PF Applicability
    this.employeeForm.get('isPfApplicable')?.valueChanges.subscribe(val => {
      const pfNumCtrl = this.employeeForm.get('pfNumber');
      if (val === 'Yes') {
        pfNumCtrl?.setValidators([Validators.required]);
      } else {
        pfNumCtrl?.clearValidators();
        pfNumCtrl?.setValue('');
      }
      pfNumCtrl?.updateValueAndValidity();
    });

    // Dynamic validator for Others Deduction Amount based on Others Deduction Applicability
    this.employeeForm.get('isOthersDeductionApplicable')?.valueChanges.subscribe(val => {
      const amtCtrl = this.employeeForm.get('othersDeductionAmount');
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
    this.departmentService.getDepartments('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.departmentsList = (res.data || []).filter(
            (dept: any) => dept.status == 1 || dept.is_active == 1
          );
        }
      },
      error: (err) => console.error('Error fetching departments', err)
    });

    this.designationService.getDesignations('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.designationsList = (res.data || []).filter(
            (desig: any) => desig.status == 1 || desig.is_active == 1
          );
        }
      },
      error: (err) => console.error('Error fetching designations', err)
    });

    this.siteService.getSites('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.sitesList = res.data;
        }
      },
      error: (err) => console.error('Error fetching sites', err)
    });
  }

  formatDateToYYYYMMDD(dateStr: string | null): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateToDMY(dateStr: string | null): string {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  openUploadModal() {
    this.uploadModalOpen = true;
    this.selectedUploadFile = null;
    this.selectedUploadFileName = '';
    this.uploadForm.reset();
  }

  closeUploadModal() {
    this.uploadModalOpen = false;
    this.selectedUploadFile = null;
    this.selectedUploadFileName = '';
    this.uploadForm.reset();
  }

  onUploadFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedUploadFile = file;
      this.selectedUploadFileName = file.name;
      this.uploadForm.patchValue({ file: file });
      this.uploadForm.get('file')?.markAsTouched();
      this.uploadForm.get('file')?.updateValueAndValidity();
    }
  }

  removeSelectedFile(fileInput: any) {
    this.selectedUploadFile = null;
    this.selectedUploadFileName = '';
    this.uploadForm.reset();
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadFile() {
    if (this.uploadForm.invalid || !this.selectedUploadFile) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedUploadFile, this.selectedUploadFile.name);

    this.employeeManagementService.bulkUploadEmployees(formData).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.status === 201) {
          this.notificationService.show(res.message || 'File uploaded successfully', 'success', 3000);
          this.closeUploadModal();
          this.GetEmployeeFun();
        } else {
          this.notificationService.show(res.message || 'File upload failed', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Bulk upload failed:', err);
        const errorMsg = err.error?.message || err.message || 'Something went wrong';
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }

  downloadSampleFile() {
    const headers = 'name,mobile,employee_code,date_of_birth,joining_date,gender,department_id,designation_id,emergency_contact,employee_type,salary_type,basic_salary,daily_wage,pf_applicable,pf_number,bank_name,bank_account_number,ifsc_code,mess_deduction_applicable,other_deduction_appliacble,other_deduction\n';
    const sampleData = 'Ramu,8823986511,EMP008,1988-05-01,2009-05-02,male,1,2,8823986511,permanent,monthly,14000,200,1,555555,Test,AF56777,G0543534,1,1,100';
    const blob = new Blob([headers + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_bulk_upload_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.show('Sample file downloaded successfully', 'success', 2000);
  }


  setTab(tab: 'personal' | 'employment' | 'payroll') {
    if (tab === 'personal') {
      this.activeTab = 'personal';
    } else if (tab === 'employment') {
      if (this.validateTab('personal')) {
        this.activeTab = 'employment';
      } else {
        this.notificationService.show('Please fill all required personal details correctly.', 'error', 3000);
      }
    } else if (tab === 'payroll') {
      if (this.validateTab('personal') && this.validateTab('employment')) {
        this.activeTab = 'payroll';
      } else if (!this.validateTab('personal')) {
        this.notificationService.show('Please fill all required personal details correctly.', 'error', 3000);
        this.activeTab = 'personal';
      } else {
        this.notificationService.show('Please fill all required employment details correctly.', 'error', 3000);
        this.activeTab = 'employment';
      }
    }
  }

  validateTab(tab: 'personal' | 'employment' | 'payroll'): boolean {
    let controls: string[] = [];
    if (tab === 'personal') {
      controls = ['empId', 'name', 'fatherName', 'dob', 'gender', 'mobile', 'address'];
    } else if (tab === 'employment') {
      controls = ['joiningDate', 'empType', 'department', 'designation'];
    } else if (tab === 'payroll') {
      controls = ['salaryType', 'basicSalary', 'bankName', 'accountNumber', 'ifscCode'];
      if (this.employeeForm.get('isPfApplicable')?.value === 'Yes') {
        controls.push('pfNumber');
      }
      if (this.employeeForm.get('isOthersDeductionApplicable')?.value === 'Yes') {
        controls.push('othersDeductionAmount');
      }
    }

    let isValid = true;
    controls.forEach(ctrlName => {
      const control = this.employeeForm.get(ctrlName);
      if (control) {
        if (control.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      }
    });
    return isValid;
  }

  nextTab() {
    if (this.activeTab === 'personal') {
      if (this.validateTab('personal')) {
        this.activeTab = 'employment';
      } else {
        this.notificationService.show('Please fill all required personal details correctly.', 'error', 3000);
      }
    } else if (this.activeTab === 'employment') {
      if (this.validateTab('employment')) {
        this.activeTab = 'payroll';
      } else {
        this.notificationService.show('Please fill all required employment details correctly.', 'error', 3000);
      }
    }
  }

  prevTab() {
    if (this.activeTab === 'employment') {
      this.activeTab = 'personal';
    } else if (this.activeTab === 'payroll') {
      this.activeTab = 'employment';
    }
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
    const siteFilter = this.filterForm.get('siteFilter')?.value || '';
    const deptFilter = this.filterForm.get('deptFilter')?.value || '';
    const designationFilter = this.filterForm.get('designationFilter')?.value || '';

    this.showreset = (searchText.trim().length > 0 || !!siteFilter || !!deptFilter || !!designationFilter);
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

  openAddModal() {
    this.isEditMode = false;
    this.employeeForm.reset({
      isPfApplicable: 'No',
      isMessApplicable: 'No',
      isOthersDeductionApplicable: 'No',
      othersDeductionAmount: ''
    });
    this.activeTab = 'personal';
    this.employeeModalOpen = true;
  }

  closeModal() {
    this.employeeModalOpen = false;
    this.viewEmployeeOpen = false;
    this.selectedEmployee = null;
  }

  openviewModal(employee: any): void {
    this.viewEmployeeOpen = true;
    this.selectedEmployee = null; // Clear old selection first to avoid flash of old data
    this.employeeManagementService.getEmployeeById(employee.id).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;
          this.selectedEmployee = {
            ...emp,
            empId: emp.employee_code || emp.empId,
            fatherName: emp.father_name,
            dob: emp.dob,
            gender: emp.gender ? (emp.gender.charAt(0).toUpperCase() + emp.gender.slice(1)) : '',
            emergencyContact: emp.emergency_contact,
            joiningDate: emp.joining_date,
            empType: emp.employee_type === 'permanent' ? 'Permanent' : (emp.employee_type === 'daily_wage' ? 'Daily Wage' : emp.employee_type),
            salaryType: emp.salary_type === 'monthly' ? 'Monthly' : (emp.salary_type === 'daily_wage' ? 'Daily Wage' : emp.salary_type),
            basicSalary: emp.salary_type === 'monthly' ? emp.basic_salary : emp.daily_wage,
            isPfApplicable: emp.pf_applicable == 1 ? 'Yes' : 'No',
            pfNumber: emp.pf_number,
            isMessApplicable: emp.mess_deduction_applicable == 1 ? 'Yes' : 'No',
            isOthersDeductionApplicable: emp.other_deduction_appliacble == 1 ? 'Yes' : 'No',
            othersDeductionAmount: emp.other_deduction,
            bankName: emp.bank_name,
            accountNumber: emp.bank_account_number,
            ifscCode: emp.ifsc_code,
            is_active: emp.status !== undefined ? emp.status : emp.is_active
          };
        } else {
          this.notificationService.show(response.message || 'Failed to fetch employee details', 'error', 3000);
          this.viewEmployeeOpen = false;
        }
      },
      error: (err: any) => {
        console.error('Error fetching employee details:', err);
        this.notificationService.show('Error fetching employee details', 'error', 3000);
        this.viewEmployeeOpen = false;
      }
    });
  }

  openEditModal(employee: any): void {
    this.isEditMode = true;
    this.currentEmployeeId = employee.id;

    this.employeeManagementService.getEmployeeById(employee.id).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;

          // Find department ID and designation ID based on name or ID properties
          let deptId = '';
          if (emp.department) {
            const deptObj = this.departmentsList.find(d => 
              (d.name && d.name.trim().toLowerCase() === emp.department.trim().toLowerCase()) || 
              d.id === emp.department_id ||
              String(d.id) === String(emp.department)
            );
            if (deptObj) deptId = deptObj.id;
          } else if (emp.department_id) {
            deptId = emp.department_id;
          }

          let desigId = '';
          if (emp.designation) {
            const desigObj = this.designationsList.find(d => 
              (d.name && d.name.trim().toLowerCase() === emp.designation.trim().toLowerCase()) || 
              d.id === emp.designation_id ||
              String(d.id) === String(emp.designation)
            );
            if (desigObj) desigId = desigObj.id;
          } else if (emp.designation_id) {
            desigId = emp.designation_id;
          }

          // Determine salary type
          const salType = emp.salary_type === 'monthly' ? 'Monthly' : (emp.salary_type === 'daily_wage' ? 'Daily Wage' : '');

          // Determine basicSalary field value based on salaryType
          let basicSal = '';
          if (salType === 'Monthly') {
            basicSal = emp.basic_salary;
          } else if (salType === 'Daily Wage') {
            basicSal = emp.daily_wage;
          }

          const formData = {
            empId: emp.employee_code || '',
            name: emp.name || '',
            fatherName: emp.father_name || '',
            dob: this.formatDateToYYYYMMDD(emp.dob),
            gender: emp.gender ? (emp.gender.charAt(0).toUpperCase() + emp.gender.slice(1)) : '',
            mobile: emp.mobile || '',
            address: emp.address || '',
            emergencyContact: emp.emergency_contact || '',
            joiningDate: this.formatDateToYYYYMMDD(emp.joining_date),
            empType: emp.employee_type === 'permanent' ? 'Permanent' : (emp.employee_type === 'daily_wage' ? 'Daily Wage' : ''),
            department: deptId,
            designation: desigId,
            salaryType: salType,
            basicSalary: basicSal,
            isPfApplicable: emp.pf_applicable == 1 ? 'Yes' : 'No',
            pfNumber: emp.pf_number || '',
            bankName: emp.bank_name || '',
            accountNumber: emp.bank_account_number || '',
            ifscCode: emp.ifsc_code || '',
            isMessApplicable: emp.mess_deduction_applicable == 1 ? 'Yes' : 'No',
            isOthersDeductionApplicable: emp.other_deduction_appliacble == 1 ? 'Yes' : 'No',
            othersDeductionAmount: emp.other_deduction || ''
          };

          this.employeeForm.patchValue(formData);
          this.activeTab = 'personal';
          this.employeeModalOpen = true;
        } else {
          this.notificationService.show(response.message || 'Failed to fetch employee details for editing', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error fetching employee details for editing:', err);
        this.notificationService.show('Error fetching employee details', 'error', 3000);
      }
    });
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      const empData = this.employeeForm.getRawValue();

      const formData = new FormData();
      formData.append('name', empData.name || '');
      formData.append('mobile', empData.mobile || '');
      formData.append('employee_code', empData.empId || '');
      formData.append('dob', this.formatDateToDMY(empData.dob));
      formData.append('joining_date', this.formatDateToDMY(empData.joiningDate));
      formData.append('gender', empData.gender ? empData.gender.toLowerCase() : '');
      formData.append('department_id', empData.department || '');
      formData.append('designation_id', empData.designation || '');
      formData.append('emergency_contact', empData.emergencyContact || '');
      formData.append('address', empData.address || '');
      formData.append('father_name', empData.fatherName || '');

      const employeeType = empData.empType === 'Permanent' ? 'permanent' : (empData.empType === 'Daily Wage' ? 'daily_wage' : '');
      formData.append('employee_type', employeeType);

      const salaryType = empData.salaryType === 'Monthly' ? 'monthly' : (empData.salaryType === 'Daily Wage' ? 'daily_wage' : '');
      formData.append('salary_type', salaryType);

      // Handle basic salary and daily wage
      if (salaryType === 'monthly') {
        formData.append('basic_salary', empData.basicSalary ? empData.basicSalary.toString() : '0.00');
        formData.append('daily_wage', '0.00');
      } else {
        formData.append('basic_salary', '0.00');
        formData.append('daily_wage', empData.basicSalary ? empData.basicSalary.toString() : '0.00');
      }

      formData.append('pf_applicable', empData.isPfApplicable === 'Yes' ? '1' : '0');
      formData.append('pf_number', empData.isPfApplicable === 'Yes' ? (empData.pfNumber || '') : '');
      formData.append('bank_name', empData.bankName || '');
      formData.append('bank_account_number', empData.accountNumber || '');
      formData.append('ifsc_code', empData.ifscCode || '');
      formData.append('mess_deduction_applicable', empData.isMessApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction_appliacble', empData.isOthersDeductionApplicable === 'Yes' ? '1' : '0');
      formData.append('other_deduction', empData.isOthersDeductionApplicable === 'Yes' ? (empData.othersDeductionAmount || '0.00') : '0.00');

      if (this.isEditMode) {
        formData.append('_method', 'PUT');
        this.employeeManagementService.updateEmployee(this.currentEmployeeId, formData).subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Employee updated successfully', 'success', 3000);
              this.closeModal();
              this.GetEmployeeFun();
            } else {
              this.notificationService.show(response.message || 'Failed to update employee', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Update Employee failed:', error);
            const errorMsg = error.error?.message || error.message || 'Something went wrong';
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      } else {
        this.employeeManagementService.createEmployee(formData).subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Employee added successfully', 'success', 3000);
              this.closeModal();
              this.GetEmployeeFun();
            } else {
              this.notificationService.show(response.message || 'Failed to add employee', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Create Employee failed:', error);
            const errorMsg = error.error?.message || error.message || 'Something went wrong';
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      }
    } else {
      this.employeeForm.markAllAsTouched();
      // Switch to first invalid tab
      const personalControls = ['empId', 'name', 'fatherName', 'dob', 'gender', 'mobile', 'address'];
      const employmentControls = ['joiningDate', 'empType', 'department', 'designation'];

      const isPersonalInvalid = personalControls.some(ctrl => this.employeeForm.get(ctrl)?.invalid);
      const isEmploymentInvalid = employmentControls.some(ctrl => this.employeeForm.get(ctrl)?.invalid);

      if (isPersonalInvalid) {
        this.activeTab = 'personal';
      } else if (isEmploymentInvalid) {
        this.activeTab = 'employment';
      } else {
        this.activeTab = 'payroll';
      }
      this.notificationService.show('Please fill all required fields correctly.', 'error', 3000);
    }
  }

  GetEmployeeFun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const siteFilter = this.filterForm.get('siteFilter')?.value || '';
    const deptFilter = this.filterForm.get('deptFilter')?.value || '';
    const designationFilter = this.filterForm.get('designationFilter')?.value || '';

    this.employeeManagementService.getEmployees(this.tableSize, this.page, searchText, deptFilter, siteFilter, designationFilter)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.employeeList = (response.data || []).map((emp: any) => ({
              ...emp,
              empId: emp.employee_code,
              is_active: emp.status !== undefined ? emp.status : emp.is_active
            }));
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch employees:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching employees:', error);
          this.notificationService.show('Error fetching employees', 'error', 3000);
        }
      });
  }

  async Status(id: string, status: any) {
    const formData = new FormData();
    formData.append('status', status.toString());
    formData.append('_method', 'PATCH');

    this.employeeManagementService.updateEmployeeStatus(id, formData).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Employee status updated successfully`,
            'success',
            3000
          );
          this.GetEmployeeFun();
        } else {
          this.notificationService.show(
            response.message || 'Failed to update status',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        const errorMsg = error.error?.message || error.message || 'Something went wrong';
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }

  toggleEmployeeSelection(empId: string) {
    const idStr = String(empId);
    if (this.selectedEmployeeIds.has(idStr)) {
      this.selectedEmployeeIds.delete(idStr);
    } else {
      this.selectedEmployeeIds.add(idStr);
    }
  }

  isEmployeeSelected(empId: string): boolean {
    return this.selectedEmployeeIds.has(String(empId));
  }

  toggleAllEmployees(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.employeeList.forEach(emp => {
        if (emp.is_active == 1) {
          this.selectedEmployeeIds.add(String(emp.id));
        }
      });
    } else {
      this.selectedEmployeeIds.clear();
    }
  }

  areAllEmployeesSelected(): boolean {
    if (this.employeeList.length === 0) return false;
    const activeEmps = this.employeeList.filter(emp => emp.is_active == 1);
    if (activeEmps.length === 0) return false;
    return activeEmps.every(emp => this.selectedEmployeeIds.has(String(emp.id)));
  }

  getSelectedEmployeeNames(): string[] {
    const names: string[] = [];
    this.selectedEmployeeIds.forEach(id => {
      const emp = this.allEmployeesList.find(e => String(e.id) === String(id));
      if (emp) {
        names.push(emp.name);
      }
    });
    return names;
  }

  loadShiftGroups() {
    this.shiftService.getShiftGroups().subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.shiftGroups = res.data;
        }
      },
      error: (err) => console.error('Error fetching shift groups', err)
    });
  }

  getEmployeeShiftGroup(empId: any): string {
    const idStr = String(empId);
    for (const groupName in this.shiftGroups) {
      if (this.shiftGroups[groupName]?.includes(idStr)) {
        return groupName;
      }
    }
    return '';
  }

  openAssignShiftModal(employee?: any) {
    if (!employee && this.selectedEmployeeIds.size === 0) {
      this.notificationService.show('Please select at least one active employee using the checkboxes first.', 'error', 3000);
      return;
    }
    this.assignShiftModalOpen = true;
    this.loadShifts();
    this.loadAllEmployees();

    const today = new Date().toISOString().split('T')[0];
    this.assignShiftStartDate = today;
    this.assignShiftEndDate = today;
    this.assignShiftType = '';
    this.assignShiftModalLabel = '';

    if (employee) {
      this.selectedEmployeeIds.clear();
      this.selectedEmployeeIds.add(String(employee.id));
    }

    // Determine current shift group for pre-selection / helper label
    const targetIds = Array.from(this.selectedEmployeeIds);
    if (targetIds.length === 1) {
      const singleId = targetIds[0];
      const currentGroup = this.getEmployeeShiftGroup(singleId);
      if (currentGroup) {
        this.assignShiftType = currentGroup;
        const emp = this.allEmployeesList.find(e => String(e.id) === String(singleId)) || this.employeeList.find(e => String(e.id) === String(singleId));
        const name = emp ? emp.name : 'Employee';
        this.assignShiftModalLabel = `${name} is currently in ${currentGroup} Group.`;
      }
    } else if (targetIds.length > 1) {
      const groupCounts: { [key: string]: number } = {};
      targetIds.forEach(id => {
        const group = this.getEmployeeShiftGroup(id) || 'No Group';
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      });

      const uniqueGroups = Object.keys(groupCounts);
      if (uniqueGroups.length === 1) {
        const group = uniqueGroups[0];
        if (group !== 'No Group') {
          this.assignShiftType = group;
        }
        this.assignShiftModalLabel = `All selected employees are currently in ${group} Group.`;
      } else {
        const summary = uniqueGroups.map(g => `${groupCounts[g]} in ${g}`).join(', ');
        this.assignShiftModalLabel = `Current assignment breakdown: ${summary}`;
      }
    }
  }

  closeAssignShiftModal() {
    this.assignShiftModalOpen = false;
    this.selectedEmployeeIds.clear();
    this.assignShiftType = '';
    this.assignShiftStartDate = '';
    this.assignShiftEndDate = '';
    this.assignShiftModalLabel = '';
  }

  loadShifts() {
    this.shiftService.getShifts('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data && res.data.length > 0) {
          this.allShiftsList = res.data.map((s: any) => ({
            id: s.name.includes('Shift A') ? 'Shift A' : s.name.includes('Shift B') ? 'Shift B' : s.name.includes('Shift C') ? 'Shift C' : s.name,
            name: s.name
          }));
        } else {
          this.allShiftsList = [
            { id: 'Shift A', name: 'Shift A (Morning)' },
            { id: 'Shift B', name: 'Shift B (Afternoon)' },
            { id: 'Shift C', name: 'Shift C (Night)' },
            { id: 'Off', name: 'Weekly Off' }
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching shifts', err);
        this.allShiftsList = [
          { id: 'Shift A', name: 'Shift A (Morning)' },
          { id: 'Shift B', name: 'Shift B (Afternoon)' },
          { id: 'Shift C', name: 'Shift C (Night)' },
          { id: 'Off', name: 'Weekly Off' }
        ];
      }
    });
  }

  loadAllEmployees() {
    this.employeeManagementService.getEmployees('all', 1).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data && res.data.length > 0) {
          this.allEmployeesList = res.data;
        } else {
          this.allEmployeesList = this.employeeList.length > 0 ? this.employeeList : [
            { id: '1', name: 'Ramesh Kumar', employee_code: 'EMP-001' },
            { id: '2', name: 'Suresh Singh', employee_code: 'EMP-002' },
            { id: '3', name: 'Anita Sharma', employee_code: 'EMP-003' },
            { id: '4', name: 'Rajesh Patel', employee_code: 'EMP-004' },
            { id: '5', name: 'Amit Sen', employee_code: 'EMP-005' },
            { id: '6', name: 'Vikram Singh', employee_code: 'EMP-006' }
          ];
        }
      },
      error: (err) => {
        console.error('Error fetching all employees', err);
        this.allEmployeesList = this.employeeList.length > 0 ? this.employeeList : [
          { id: '1', name: 'Ramesh Kumar', employee_code: 'EMP-001' },
          { id: '2', name: 'Suresh Singh', employee_code: 'EMP-002' },
          { id: '3', name: 'Anita Sharma', employee_code: 'EMP-003' },
          { id: '4', name: 'Rajesh Patel', employee_code: 'EMP-004' },
          { id: '5', name: 'Amit Sen', employee_code: 'EMP-005' },
          { id: '6', name: 'Vikram Singh', employee_code: 'EMP-006' }
        ];
      }
    });
  }

  saveBulkShift() {
    const startDate = this.assignShiftStartDate;
    const endDate = this.assignShiftEndDate;
    const shiftCode = this.assignShiftType;

    if (!startDate || !endDate) {
      this.notificationService.show('Please select a valid start and end date.', 'error', 3000);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      this.notificationService.show('End date cannot be before start date.', 'error', 3000);
      return;
    }

    if (!shiftCode) {
      this.notificationService.show('Please select a shift to assign.', 'error', 3000);
      return;
    }

    const targetIds = Array.from(this.selectedEmployeeIds);

    if (targetIds.length === 0) {
      this.notificationService.show('Please select at least one employee.', 'error', 3000);
      return;
    }

    const payload = {
      employee_ids: targetIds,
      shift_code: shiftCode,
      start_date: startDate,
      end_date: endDate
    };

    this.shiftService.assignBulkShift(payload).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.notificationService.show(res.message || 'Shift assigned successfully', 'success', 3000);
          this.closeAssignShiftModal();
          this.loadShiftGroups(); // Refresh count of chips
        } else {
          this.notificationService.show(res.message || 'Failed to assign shift', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error assigning bulk shift:', err);
        this.notificationService.show('Something went wrong while assigning shifts.', 'error', 3000);
      }
    });
  }
}
