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
import { RelayService } from 'src/app/core/services/relay.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface DropdownItem {
  id: number | string;
  name: string;
  status?: number;
  is_active?: number;
}

export interface Employee {
  id: number | string;
  employee_code?: string;
  empId?: string;
  name: string;
  surname?: string;
  father_name?: string;
  fatherName?: string;
  mobile?: string;
  dob?: string;
  joining_date?: string;
  joiningDate?: string;
  gender?: string;
  department_id?: number | string;
  department?: any;
  designation_id?: number | string;
  designation?: any;
  site_id?: number | string;
  site?: any;
  relay_id?: number | string;
  relay?: any;
  employee_type?: string;
  empType?: string;
  skill_category?: string;
  category?: string;
  address?: string;
  permanent_address?: string;
  emergency_contact?: string;
  emergencyContact?: string;
  status?: number;
  is_active?: number;
  placeOfWork?: string;
  remarks?: string;
  shift?: string;
  relay_shift?: string;
  nationality?: string;
  educationLevel?: string;
  identificationMark?: string;
  permanentAddress?: string;
  skillCategory?: string;
  serviceBookNo?: string;
  [key: string]: any;
}

export interface UploadResult {
  status: number;
  message: string;
  errors: string[];
}

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

  todayDate: string = new Date().toISOString().split('T')[0];

  employeeForm!: FormGroup;

  tableSize: any = 10;
  tableSizes: any[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;

  employeeModalOpen: boolean = false;
  isEditMode: boolean = false;
  viewEmployeeOpen: boolean = false;
  currentEmployeeId: number | string | null = null;
  selectedEmployee: Employee | null = null;

  selectedPhoto: File | null = null;
  selectedSignature: File | null = null;

  activeTab: 'personal' | 'employment' = 'personal';

  employeeList: Employee[] = [];

  table_heading = ['S.No.', 'Emp Code', 'Name', 'Contact', 'Department', 'Designation', 'Relay/General', 'Shift Type', 'Status', 'Action'];

  sitesList: DropdownItem[] = [];
  departmentsList: DropdownItem[] = [];
  designationsList: DropdownItem[] = [];
  relaysList: DropdownItem[] = [];

  uploadModalOpen: boolean = false;
  uploadForm!: FormGroup;
  selectedUploadFile: File | null = null;
  selectedUploadFileName: string = '';
  isUploading: boolean = false;
  uploadResult: UploadResult | null = null;

  // Bulk Assign Shift variables
  bulkAssignModalOpen: boolean = false;
  bulkAssignForm!: FormGroup;
  selectedBulkAssignFile: File | null = null;
  selectedBulkAssignFileName: string = '';
  isBulkAssigning: boolean = false;
  bulkAssignResult: UploadResult | null = null;

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
    private relayService: RelayService,
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
      surname: [''],
      fatherName: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      nationality: ['Indian'],
      educationLevel: [''],
      markOfIdentification: [''],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', [Validators.required]], // Present Address
      permanentAddress: [''],
      sameAsPresent: [false],
      emergencyContact: ['', [Validators.pattern('^[0-9]{10}$')]],
      photo: [null],
      signature: [null],

      // Employment
      joiningDate: ['', [Validators.required]],
      category: ['', [Validators.required]],
      empType: ['permanent'],
      department: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      relay: ['', [Validators.required]],
      serviceBookNo: [''],
      dateOfExit: [''],
      reasonForExit: [''],
      placeOfWork: [''],
      remarks: [''],
      site: ['', [Validators.required]]
    });
  }

  onSameAsPresentChange(event: any) {
    if (event.target.checked) {
      this.employeeForm.patchValue({
        permanentAddress: this.employeeForm.get('address')?.value
      });
    } else {
      this.employeeForm.patchValue({
        permanentAddress: ''
      });
    }
  }

  loadDropdownData() {
    // forkJoin: saari APIs ek saath call hoti hain, ek baar mein handle karo
    forkJoin({
      departments: this.departmentService.getAllDepartments(),
      designations: this.designationService.getDesignations('all', 1, ''),
      sites: this.siteService.getAllSites(),
      relays: this.relayService.getAllRelays()
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
        if (results.relays?.status === 200) {
          this.relaysList = (results.relays.data || []).filter(
            (relay: any) => relay.status == 1 || relay.is_active == 1
          );
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
    this.uploadResult = null;
    this.uploadForm.reset();
  }

  closeUploadModal() {
    this.uploadModalOpen = false;
    this.isUploading = false;
    if (this.uploadResult?.status === 200 && (!this.uploadResult?.errors || this.uploadResult.errors.length === 0)) {
      this.GetEmployeeFun();
    }
    this.selectedUploadFile = null;
    this.selectedUploadFileName = '';
    this.uploadResult = null;
    this.uploadForm.reset();
  }

  onUploadFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = false;
      this.uploadResult = null;
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
    this.uploadResult = null;
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

    this.isUploading = true;
    this.uploadResult = null;

    const formData = new FormData();
    formData.append('file', this.selectedUploadFile, this.selectedUploadFile.name);

    this.employeeManagementService.bulkUploadEmployees(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        
        if ((res.status === 200 || res.status === 201) && (!res.errors || res.errors.length === 0)) {
          this.notificationService.show(res.message || 'Import process completed successfully.', 'success', 3000);
          this.closeUploadModal();
          this.GetEmployeeFun();
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
          message: errObj.message || 'Import process completed with errors.',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
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
    this.bulkAssignResult = null;
    this.bulkAssignForm.reset();
  }

  closeBulkAssignModal() {
    this.bulkAssignModalOpen = false;
    this.isBulkAssigning = false;
    if (this.bulkAssignResult?.status === 200 && (!this.bulkAssignResult?.errors || this.bulkAssignResult.errors.length === 0)) {
      this.selectedEmployeeIds.clear();
      this.selectedEmployeeIdsForAssign = [];
      this.loadShiftGroups();
      this.GetEmployeeFun();
    }
    this.selectedBulkAssignFile = null;
    this.selectedBulkAssignFileName = '';
    this.bulkAssignResult = null;
    this.bulkAssignForm.reset();
  }

  onBulkAssignFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isBulkAssigning = false;
      this.bulkAssignResult = null;
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
    this.bulkAssignResult = null;
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

    this.isBulkAssigning = true;
    this.bulkAssignResult = null;

    const file = this.selectedBulkAssignFile;
    this.shiftService.bulkUploadShiftAssignments(file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isBulkAssigning = false;
        
        if ((res.status === 200 || res.status === 201) && (!res.errors || res.errors.length === 0)) {
          this.notificationService.show(res.message || 'Bulk assignment completed successfully.', 'success', 3000);
          this.closeBulkAssignModal();
          this.selectedEmployeeIds.clear();
          this.selectedEmployeeIdsForAssign = [];
          this.loadShiftGroups();
          this.GetEmployeeFun();
        } else {
          this.bulkAssignResult = {
            status: res.status || 422,
            message: res.message || 'Bulk assignment completed with errors.',
            errors: res.errors || []
          };
        }
      },
      error: (err: any) => {
        this.isBulkAssigning = false;
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

        this.bulkAssignResult = {
          status: err.status || errObj.status || 422,
          message: errObj.message || 'Bulk assignment completed with errors.',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
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
      controls = ['joiningDate', 'category', 'department', 'designation', 'relay', 'site'];
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
    const value = event && event.target ? event.target.value : event;
    this.tableSize = value === 'all' ? 'all' : Number(value);
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
    this.currentEmployeeId = null;
    this.employeeForm.reset({
      nationality: 'Indian',
      sameAsPresent: false,
      gender: '',
      category: '',
      empType: 'permanent'
    });
    this.selectedPhoto = null;
    this.selectedSignature = null;
    this.activeTab = 'personal';
    this.employeeModalOpen = true;
  }

  closeModal() {
    this.employeeModalOpen = false;
    this.viewEmployeeOpen = false;
    this.selectedEmployee = null;
    this.selectedPhoto = null;
    this.selectedSignature = null;
  }

  onFileSelected(event: any, field: 'photo' | 'signature') {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.notificationService.show(`${field === 'photo' ? 'Photo' : 'Signature'} size should not exceed 2MB.`, 'error', 3000);
        event.target.value = ''; // Reset input
        return;
      }
      if (field === 'photo') {
        this.selectedPhoto = file;
      } else {
        this.selectedSignature = file;
      }
    }
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
            nationality: emp.nationality,
            educationLevel: emp.education_level,
            identificationMark: emp.identification_mark,
            permanentAddress: emp.permanent_address,
            serviceBookNo: emp.service_book_no,
            skillCategory: emp.skill_category,
            site: emp.site,
            placeOfWork: emp.place_of_work,
            remarks: emp.remarks,
            is_active: emp.status !== undefined ? emp.status : emp.is_active
          };
        } else {
          this.notificationService.show(response.message, 'error', 3000);
          this.viewEmployeeOpen = false;
        }
      },
      error: (err: any) => {
        console.error('Error fetching employee details:', err);
        this.notificationService.show(err.error?.message || err.message, 'error', 3000);
        this.viewEmployeeOpen = false;
      }
    });
  }

  private findIdByNameOrId(list: any[], value: any, fallbackId: any): string {
    if (!list || list.length === 0) return fallbackId || '';
    if (value) {
      const valStr = String(value).trim().toLowerCase();
      const obj = list.find(item => 
        (item.name && item.name.trim().toLowerCase() === valStr) ||
        String(item.id) === valStr ||
        item.id === fallbackId
      );
      if (obj) return obj.id;
    }
    return fallbackId || '';
  }

  openEditModal(employee: any): void {
    this.isEditMode = true;
    this.currentEmployeeId = employee.id;

    this.employeeManagementService.getEmployeeById(employee.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const emp = Array.isArray(response.data) ? response.data[0] : response.data;

          const deptId = this.findIdByNameOrId(this.departmentsList, emp.department, emp.department_id);
          const desigId = this.findIdByNameOrId(this.designationsList, emp.designation, emp.designation_id);
          const relayId = this.findIdByNameOrId(this.relaysList, emp.relay_shift || emp.relay, emp.relay_id);
          const siteId = this.findIdByNameOrId(this.sitesList, emp.site, emp.site_id);

          let cat = emp.skill_category || emp.category || '';
          if (cat === 'highly_skilled' || cat === 'HS') cat = 'highly_skilled';
          else if (cat === 'skilled' || cat === 'S') cat = 'skilled';
          else if (cat === 'semi_skilled' || cat === 'SS') cat = 'semi_skilled';
          else if (cat === 'un_skilled' || cat === 'unskilled' || cat === 'US') cat = 'unskilled';
          else cat = (cat || '').toLowerCase();

          let eType = (emp.employee_type || emp.empType || '').toLowerCase();
          const genderVal = emp.gender ? emp.gender.toLowerCase() : '';

          const formData = {
            empId: emp.employee_code || '',
            name: emp.name || '',
            surname: emp.surname || '',
            fatherName: emp.father_name || '',
            dob: this.formatDateToYYYYMMDD(emp.dob),
            gender: genderVal,
            nationality: emp.nationality || 'Indian',
            educationLevel: emp.education_level || '',
            markOfIdentification: emp.identification_mark || emp.mark_of_identification || '',
            mobile: emp.mobile || '',
            address: emp.address || '',
            permanentAddress: emp.permanent_address || '',
            emergencyContact: emp.emergency_contact || '',
            joiningDate: this.formatDateToYYYYMMDD(emp.joining_date),
            category: cat,
            empType: eType,
            department: deptId,
            designation: desigId,
            relay: relayId,
            serviceBookNo: emp.service_book_no || '',
            dateOfExit: this.formatDateToYYYYMMDD(emp.date_of_exit),
            reasonForExit: emp.reason_for_exit || '',
            placeOfWork: emp.place_of_work || '',
            remarks: emp.remarks || '',
            site: siteId
          };

          this.employeeForm.patchValue(formData);
          this.activeTab = 'personal';
          this.employeeModalOpen = true;
        } else {
          this.notificationService.show(response.message, 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error fetching employee details for editing:', err);
        this.notificationService.show(err.error?.message || err.message, 'error', 3000);
      }
    });
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      const empData = this.employeeForm.getRawValue();

      const formData = new FormData();
      formData.append('name', empData.name || '');
      formData.append('surname', empData.surname || '');
      formData.append('mobile', empData.mobile || '');
      formData.append('employee_code', empData.empId || '');
      formData.append('dob', this.formatDateToDMY(empData.dob));
      formData.append('joining_date', this.formatDateToDMY(empData.joiningDate));
      formData.append('gender', empData.gender ? empData.gender.toLowerCase() : '');
      formData.append('nationality', empData.nationality || '');
      formData.append('education_level', empData.educationLevel || '');
      formData.append('identification_mark', empData.markOfIdentification || '');
      formData.append('department_id', empData.department || '');
      formData.append('designation_id', empData.designation || '');
      formData.append('site_id', empData.site || '');
      formData.append('emergency_contact', empData.emergencyContact || '');
      formData.append('address', empData.address || '');
      formData.append('permanent_address', empData.permanentAddress || '');
      formData.append('father_name', empData.fatherName || '');
      formData.append('relay_id', empData.relay || '');
      
      let skillCat = empData.category || '';
      if (skillCat === 'unskilled') skillCat = 'un_skilled';
      formData.append('skill_category', skillCat);
      
      let eType = empData.empType ? empData.empType.toLowerCase() : '';
      formData.append('employee_type', eType);

      formData.append('service_book_no', empData.serviceBookNo || '');
      formData.append('date_of_exit', this.formatDateToDMY(empData.dateOfExit));
      formData.append('reason_for_exit', empData.reasonForExit || '');
      formData.append('place_of_work', empData.placeOfWork || '');
      formData.append('remarks', empData.remarks || '');

      if (this.selectedPhoto) {
        formData.append('photo', this.selectedPhoto);
      }
      if (this.selectedSignature) {
        formData.append('signature', this.selectedSignature);
      }

      if (this.isEditMode) {
        formData.append('_method', 'PUT');
      }

      const saveObservable$ = this.isEditMode
        ? this.employeeManagementService.updateEmployee(this.currentEmployeeId, formData)
        : this.employeeManagementService.createEmployee(formData);

      saveObservable$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(response.message, 'success', 3000);
            this.closeModal();
            this.GetEmployeeFun();
          } else {
            this.notificationService.show(response.message, 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error(this.isEditMode ? 'Update Employee failed:' : 'Create Employee failed:', error);
          let errorMsg = error.error?.message || error.message;
          if (error.error?.errors) {
            errorMsg = Object.values(error.error.errors).flat().join(' | ');
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
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

  async Status(id: string | number, status: any) {
    const formData = new FormData();
    formData.append('status', status.toString());
    formData.append('_method', 'PATCH');

    this.employeeManagementService.updateEmployeeStatus(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(response.message, 'success', 3000);
          this.GetEmployeeFun();
        } else {
          this.notificationService.show(response.message, 'error', 3000);
        }
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        const errorMsg = error.error?.message || error.message;
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

/*
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
        this.allShiftsList = [];
        this.notificationService.show(err.error?.message || err.message || 'Error fetching shifts', 'error', 3000);
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
          this.notificationService.show(res.message, 'success', 3000);
          this.closeAssignShiftModal();
          this.loadShiftGroups(); // Refresh count of chips
          this.GetEmployeeFun(); // Refresh main employee table to show updated shift groups!
        } else {
          this.notificationService.show(res.message, 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error assigning bulk shift:', err);
        const errMsg = err?.error?.message || err?.message;
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
*/
}
