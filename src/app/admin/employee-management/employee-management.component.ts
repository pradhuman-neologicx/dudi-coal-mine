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

  table_heading = ['S.No.', 'Emp ID', 'Name', 'Contact', 'Department', 'Designation', 'Status', 'Action'];



  sitesList: any[] = [];
  departmentsList: any[] = [];
  designationsList: any[] = [];

  uploadModalOpen: boolean = false;
  uploadForm!: FormGroup;
  selectedUploadFile: any = null;
  selectedUploadFileName: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private employeeManagementService: EmployeeManagementService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private siteService: SiteService,
  ) { }

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.filterForm = this.formBuilder.group({
      siteFilter: [''],
      deptFilter: [''],
    });

    this.uploadForm = this.formBuilder.group({
      file: [null, [Validators.required]]
    });

    this.loadDropdownData();
    this.initEmployeeForm();
    this.GetEmployeeFun();
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

  removeSelectedFile() {
    this.selectedUploadFile = null;
    this.selectedUploadFileName = '';
    this.uploadForm.reset();
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

    this.showreset = (searchText.trim().length > 0 || !!siteFilter || !!deptFilter);
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

    // Find department ID and designation ID based on name or ID properties
    let deptId = '';
    if (employee.department) {
      const deptObj = this.departmentsList.find(d => 
        (d.name && d.name.trim().toLowerCase() === employee.department.trim().toLowerCase()) || 
        d.id === employee.department_id ||
        String(d.id) === String(employee.department)
      );
      if (deptObj) deptId = deptObj.id;
    }

    let desigId = '';
    if (employee.designation) {
      const desigObj = this.designationsList.find(d => 
        (d.name && d.name.trim().toLowerCase() === employee.designation.trim().toLowerCase()) || 
        d.id === employee.designation_id ||
        String(d.id) === String(employee.designation)
      );
      if (desigObj) desigId = desigObj.id;
    }

    // Determine salary type
    const salType = employee.salary_type === 'monthly' ? 'Monthly' : (employee.salary_type === 'daily_wage' ? 'Daily Wage' : '');

    // Determine basicSalary field value based on salaryType
    let basicSal = '';
    if (salType === 'Monthly') {
      basicSal = employee.basic_salary;
    } else if (salType === 'Daily Wage') {
      basicSal = employee.daily_wage;
    }

    const formData = {
      empId: employee.employee_code || '',
      name: employee.name || '',
      fatherName: employee.father_name || '',
      dob: this.formatDateToYYYYMMDD(employee.dob),
      gender: employee.gender ? (employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)) : '',
      mobile: employee.mobile || '',
      address: employee.address || '',
      emergencyContact: employee.emergency_contact || '',
      joiningDate: this.formatDateToYYYYMMDD(employee.joining_date),
      empType: employee.employee_type === 'permanent' ? 'Permanent' : (employee.employee_type === 'daily_wage' ? 'Daily Wage' : ''),
      department: deptId,
      designation: desigId,
      salaryType: salType,
      basicSalary: basicSal,
      isPfApplicable: employee.pf_applicable == 1 ? 'Yes' : 'No',
      pfNumber: employee.pf_number || '',
      bankName: employee.bank_name || '',
      accountNumber: employee.bank_account_number || '',
      ifscCode: employee.ifsc_code || '',
      isMessApplicable: employee.mess_deduction_applicable == 1 ? 'Yes' : 'No',
      isOthersDeductionApplicable: employee.other_deduction_appliacble == 1 ? 'Yes' : 'No',
      othersDeductionAmount: employee.other_deduction || ''
    };

    this.employeeForm.patchValue(formData);
    this.activeTab = 'personal';
    this.employeeModalOpen = true;
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

    this.employeeManagementService.getEmployees(this.tableSize, this.page, searchText, deptFilter, siteFilter)
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
}
