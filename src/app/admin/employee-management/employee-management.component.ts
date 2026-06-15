import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class EmployeeManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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

  activeTab: 'personal' | 'employment' = 'personal';

  employeeList: any[] = [];

  table_heading = ['S.No.', 'Emp ID', 'Name', 'Contact', 'Department', 'Designation', 'Relay/General', 'Shift Type', 'Status', 'Action'];

  sitesList: any[] = [];
  departmentsList: any[] = [];
  designationsList: any[] = [];

  uploadModalOpen: boolean = false;
  uploadForm!: FormGroup;
  selectedUploadFile: any = null;
  selectedUploadFileName: string = '';

  // Bulk Assign Shift variables
  bulkAssignModalOpen: boolean = false;
  bulkAssignForm!: FormGroup;
  selectedBulkAssignFile: any = null;
  selectedBulkAssignFileName: string = '';

  // Assign Shift variables
  assignShiftModalOpen: boolean = false;
  allShiftsList: any[] = [];
  allEmployeesList: any[] = [];
  selectedEmployeeIds = new Set<string>();
  selectedEmployeeIdsForAssign: any[] = [];
  assignShiftStartDate: string = '';
  assignShiftEndDate: string = '';
  assignShiftType: string = '';
  shiftGroups: { [groupName: string]: string[] } = {};
  get assignShiftModalLabel(): string {
    if (!this.selectedEmployeeIdsForAssign || this.selectedEmployeeIdsForAssign.length === 0) {
      return '';
    }
    if (this.selectedEmployeeIdsForAssign.length === 1) {
      const empId = this.selectedEmployeeIdsForAssign[0];
      const emp = this.allEmployeesList.find(e => String(e.id) === String(empId));
      if (emp) {
        const currentGroup = this.getEmployeeShiftGroup(empId);
        if (currentGroup) {
          return `${emp.name} is currently assigned to ${currentGroup}.`;
        }
      }
      return '';
    }

    // If multiple employees selected
    const groupCounts: { [group: string]: number } = {};
    let withGroupCount = 0;
    this.selectedEmployeeIdsForAssign.forEach(id => {
      const grp = this.getEmployeeShiftGroup(id);
      if (grp) {
        groupCounts[grp] = (groupCounts[grp] || 0) + 1;
        withGroupCount++;
      }
    });

    if (withGroupCount === 0) {
      return '';
    }

    const parts = Object.entries(groupCounts).map(([grp, count]) => `${count} in ${grp}`);
    if (parts.length === 1 && withGroupCount === this.selectedEmployeeIdsForAssign.length) {
      const [grp] = Object.keys(groupCounts);
      return `All selected employees are currently in ${grp}.`;
    }

    return `Current breakdown: ${parts.join(', ')}.`;
  }

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
      siteFilter: [null],
      deptFilter: [null],
      designationFilter: [null],
    });

    this.uploadForm = this.formBuilder.group({
      file: [null, [Validators.required]]
    });

    this.bulkAssignForm = this.formBuilder.group({
      file: [null, [Validators.required]]
    });

    this.loadDropdownData();
    this.initEmployeeForm();
    this.GetEmployeeFun();
    this.loadShiftGroups();
    // this.loadAllEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      empType: [''],
      department: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      relay: ['', [Validators.required]],

    });
  }

  loadDropdownData() {
    // forkJoin: saari APIs ek saath call hoti hain, ek baar mein handle karo
    forkJoin({
      departments: this.departmentService.getAllDepartments(),
      designations: this.designationService.getDesignations('all', 1, ''),
      sites: this.siteService.getAllSites()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any) => {
        if (results.departments?.status === 200) {
          this.departmentsList = (results.departments.data || []).filter(
            (dept: any) => dept.status == 1 || dept.is_active == 1
          );
        }
        if (results.designations?.status === 200) {
          this.designationsList = (results.designations.data || []).filter(
            (desig: any) => desig.status == 1 || desig.is_active == 1
          );
        }
        if (results.sites?.status === 200) {
          this.sitesList = results.sites.data || [];
        }
      },
      error: (err) => console.error('Error fetching dropdown data', err)
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

    this.employeeManagementService.bulkUploadEmployees(formData).pipe(takeUntil(this.destroy$)).subscribe({
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

  openBulkAssignModal() {
    this.bulkAssignModalOpen = true;
    this.selectedBulkAssignFile = null;
    this.selectedBulkAssignFileName = '';
    this.bulkAssignForm.reset();
  }

  closeBulkAssignModal() {
    this.bulkAssignModalOpen = false;
    this.selectedBulkAssignFile = null;
    this.selectedBulkAssignFileName = '';
    this.bulkAssignForm.reset();
  }

  onBulkAssignFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedBulkAssignFile = file;
      this.selectedBulkAssignFileName = file.name;
      this.bulkAssignForm.patchValue({ file: file });
      this.bulkAssignForm.get('file')?.markAsTouched();
      this.bulkAssignForm.get('file')?.updateValueAndValidity();
    }
  }

  removeBulkAssignFile(fileInput: any) {
    this.selectedBulkAssignFile = null;
    this.selectedBulkAssignFileName = '';
    this.bulkAssignForm.reset();
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadBulkAssignFile() {
    if (this.bulkAssignForm.invalid || !this.selectedBulkAssignFile) {
      this.bulkAssignForm.markAllAsTouched();
      return;
    }

    const file = this.selectedBulkAssignFile;
    this.shiftService.bulkUploadShiftAssignments(file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.status === 201) {
          this.notificationService.show(res.message || 'Bulk shift assignments applied successfully', 'success', 3000);
          this.closeBulkAssignModal();
          this.selectedEmployeeIds.clear();
          this.selectedEmployeeIdsForAssign = [];
          this.loadShiftGroups(); // Refresh count of chips
          this.GetEmployeeFun(); // Refresh employee table view
        } else {
          this.notificationService.show(res.message || 'Failed to upload bulk shift assignments', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Bulk shift upload failed:', err);
        const errMsg = err.error?.message || err.message || 'Something went wrong during upload';
        this.notificationService.show(errMsg, 'error', 3000);
      }
    });
  }

  downloadBulkAssignSampleFile() {
    const headers = 'employee_code,shift_code\n';
    const sampleData = 'EMP001,Shift B\nEMP002,Shift A\nEMP003,Shift C\n';
    const blob = new Blob([headers + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_shift_assignment_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.show('Sample file downloaded successfully', 'success', 2000);
  }


  setTab(tab: 'personal' | 'employment') {
    if (tab === 'personal') {
      this.activeTab = 'personal';
    } else if (tab === 'employment') {
      if (this.validateTab('personal')) {
        this.activeTab = 'employment';
      } else {
        this.notificationService.show('Please fill all required personal details correctly.', 'error', 3000);
      }
    }
  }

  validateTab(tab: 'personal' | 'employment'): boolean {
    let controls: string[] = [];
    if (tab === 'personal') {
      controls = ['empId', 'name', 'fatherName', 'dob', 'gender', 'mobile', 'address'];
    } else if (tab === 'employment') {
      controls = ['joiningDate', 'empType', 'department', 'designation'];
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
    }
  }

  prevTab() {
    if (this.activeTab === 'employment') {
      this.activeTab = 'personal';
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
    this.searchbarform.reset({ searchbar: '' });
    this.filterForm.reset({
      siteFilter: null,
      deptFilter: null,
      designationFilter: null
    });
    this.showreset = false;
    this.page = 1;
    this.GetEmployeeFun();
  }

  openAddModal() {
    this.isEditMode = false;
    this.employeeForm.reset({
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
    this.employeeManagementService.getEmployeeById(employee.id).pipe(takeUntil(this.destroy$)).subscribe({
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
            restDay: emp.rest_day || '',
            relay: emp.relay_shift || emp.relay || '',
            empType: emp.employee_type === 'permanent' ? 'Permanent' : (emp.employee_type === 'daily_wage' ? 'Daily Wage' : emp.employee_type),
            salaryType: emp.salary_type === 'monthly' ? 'Monthly' : (emp.salary_type === 'daily_wage' ? 'Daily Wage' : emp.salary_type),
            basicSalary: emp.salary_type === 'monthly' ? emp.basic_salary : emp.daily_wage,
            isPfApplicable: emp.pf_applicable == 1 ? 'Yes' : 'No',
            pfAmount: emp.pf_amount || '',
            pfNumber: emp.pf_number,
            isMessApplicable: emp.mess_deduction_applicable == 1 ? 'Yes' : 'No',
            messDeductionAmount: emp.mess_deduction || '',
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

    this.employeeManagementService.getEmployeeById(employee.id).pipe(takeUntil(this.destroy$)).subscribe({
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

          let rawRelay = String(emp.relay_shift || emp.relay || 'General').trim();
          let formattedRelay = 'General';
          if (rawRelay.toLowerCase() === 'relay 1') formattedRelay = 'Relay 1';
          else if (rawRelay.toLowerCase() === 'relay 2') formattedRelay = 'Relay 2';
          else if (rawRelay.toLowerCase() === 'relay 3') formattedRelay = 'Relay 3';

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
            relay: formattedRelay
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

      let formattedRelayShift = '';
      if (empData.relay === 'Relay 1') formattedRelayShift = 'relay_1';
      else if (empData.relay === 'Relay 2') formattedRelayShift = 'relay_2';
      else if (empData.relay === 'Relay 3') formattedRelayShift = 'relay_3';
      else if (empData.relay === 'General') formattedRelayShift = 'general';
      else formattedRelayShift = empData.relay ? empData.relay.toLowerCase() : '';

      formData.append('relay_shift', formattedRelayShift);

      if (this.isEditMode) {
        formData.append('_method', 'PUT');
        this.employeeManagementService.updateEmployee(this.currentEmployeeId, formData).pipe(takeUntil(this.destroy$)).subscribe({
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
            let errorMsg = error.error?.message || error.message || 'Something went wrong';
            if (error.error?.errors) {
              errorMsg = Object.values(error.error.errors).flat().join(' | ');
            }
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      } else {
        this.employeeManagementService.createEmployee(formData).pipe(takeUntil(this.destroy$)).subscribe({
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
            let errorMsg = error.error?.message || error.message || 'Something went wrong';
            if (error.error?.errors) {
              errorMsg = Object.values(error.error.errors).flat().join(' | ');
            }
            this.notificationService.show(errorMsg, 'error', 3000);
          }
        });
      }
    } else {
      this.employeeForm.markAllAsTouched();
      this.notificationService.show('Please fill all required fields correctly.', 'error', 3000);
    }
  }

  GetEmployeeFun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    const siteFilter = this.filterForm.get('siteFilter')?.value || '';
    const deptFilter = this.filterForm.get('deptFilter')?.value || '';
    const designationFilter = this.filterForm.get('designationFilter')?.value || '';

    this.employeeManagementService.getEmployees(this.tableSize, this.page, searchText, deptFilter, siteFilter, designationFilter)
      .pipe(takeUntil(this.destroy$)).subscribe({
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

    this.employeeManagementService.updateEmployeeStatus(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
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
    this.shiftService.getShiftGroups().pipe(takeUntil(this.destroy$)).subscribe({
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
    this.assignShiftModalOpen = true;
    this.assignShiftType = '';

    if (employee) {
      this.selectedEmployeeIdsForAssign = [employee.id];
      // Senior Approach: Use the existing employee data passed from the table row
      // No need to call getEmployeeById API because we already have all required data!
      this.allEmployeesList = [{
        id: employee.id,
        name: employee.name,
        employee_code: employee.employee_code || employee.empId || ''
      }];

      if (employee.shift_id) {
        this.loadShifts(employee.shift_id);
      } else {
        let currentGroupName = this.getEmployeeShiftGroup(employee.id);
        this.loadShifts(currentGroupName);
      }
    } else {
      this.selectedEmployeeIdsForAssign = [];
      this.loadAllEmployees();
      this.loadShifts();
    }
  }

  closeAssignShiftModal() {
    this.assignShiftModalOpen = false;
    this.selectedEmployeeIdsForAssign = [];
    this.assignShiftType = '';
  }

  areAllAssignEmployeesSelected(): boolean {
    if (!this.allEmployeesList || this.allEmployeesList.length === 0) return false;
    return this.allEmployeesList.every(emp =>
      this.selectedEmployeeIdsForAssign.some(selId => String(selId) === String(emp.id))
    );
  }

  toggleAllAssignEmployees() {
    if (this.areAllAssignEmployeesSelected()) {
      this.selectedEmployeeIdsForAssign = [];
    } else {
      this.selectedEmployeeIdsForAssign = this.allEmployeesList.map(emp => emp.id);
    }
  }

  clearAllAssignSelection(event: Event) {
    event.stopPropagation();
    this.selectedEmployeeIdsForAssign = [];
  }

  customSearchFn(term: string, item: any) {
    term = term.trim().toLowerCase();
    const name = (item.name || '').toLowerCase();
    const code = (item.employee_code || item.empId || '').toLowerCase();
    return name.includes(term) || code.includes(term);
  }

  loadShifts(preselectShift?: any) {
    if (this.allShiftsList && this.allShiftsList.length > 0) {
      this.handlePreselectShift(preselectShift);
      return;
    }

    this.shiftService.getAllShifts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data && res.data.length > 0) {
          this.allShiftsList = res.data.map((s: any) => ({
            id: s.id,
            name: s.shift_name || s.name
          }));
          this.handlePreselectShift(preselectShift);
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
        if (preselectShift) {
          this.assignShiftType = preselectShift;
        }
      }
    });
  }

  handlePreselectShift(preselectShift?: any) {
    if (preselectShift) {
      const matchedById = this.allShiftsList.find(s => String(s.id) === String(preselectShift));
      if (matchedById) {
        this.assignShiftType = matchedById.id;
      } else {
        const matchedByName = this.allShiftsList.find(s => s.name === preselectShift || s.name.includes(String(preselectShift)));
        if (matchedByName) {
          this.assignShiftType = matchedByName.id;
        } else {
          this.assignShiftType = preselectShift;
        }
      }
    }
  }

  loadAllEmployees() {
    this.employeeManagementService.getAllEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data && Array.isArray(res.data)) {
          this.allEmployeesList = res.data;
        } else if (res.status === 200 && res.data && res.data.data && Array.isArray(res.data.data)) {
          this.allEmployeesList = res.data.data;
        } else {
          this.allEmployeesList = this.employeeList.filter(emp => emp.is_active == 1);
        }
      },
      error: (err) => {
        console.error('Error fetching all employees', err);
        this.allEmployeesList = this.employeeList.filter(emp => emp.is_active == 1);
      }
    });
  }

  saveBulkShift() {
    const shiftCode = this.assignShiftType;

    if (!shiftCode) {
      this.notificationService.show('Please select a shift to assign.', 'error', 3000);
      return;
    }

    const targetIds = this.selectedEmployeeIdsForAssign;

    if (targetIds.length === 0) {
      this.notificationService.show('Please select at least one employee.', 'error', 3000);
      return;
    }

    const payload = {
      employee_ids: targetIds,
      shift_code: String(shiftCode)
    };

    this.shiftService.assignBulkShift(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.status === 201) {
          this.notificationService.show(res.message || 'Shift assigned successfully', 'success', 3000);
          this.closeAssignShiftModal();
          this.loadShiftGroups(); // Refresh count of chips
          this.GetEmployeeFun(); // Refresh main employee table to show updated shift groups!
        } else {
          this.notificationService.show(res.message || 'Failed to assign shift', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error assigning bulk shift:', err);
        const errMsg = err?.message || 'Something went wrong while assigning shifts.';
        this.notificationService.show(errMsg, 'error', 3000);
      }
    });
  }

  clearAssignSearch(selectComponent: any) {
    if (selectComponent) {
      selectComponent.searchTerm = '';
      selectComponent.filter('');
    }
  }
}
