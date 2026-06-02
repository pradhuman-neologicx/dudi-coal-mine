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
import { DesignationService } from 'src/app/core/services/designation.service';
import { SalaryStructureService } from 'src/app/core/services/salary-structure.service';

@Component({
  selector: 'app-salary-structure',
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
  templateUrl: './salary-structure.component.html',
  styleUrl: './salary-structure.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)', 
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)', 
          }),
        ),
      ]),
    ]),
  ],
})
export class SalaryStructureComponent implements OnInit {
  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createSalaryForm!: FormGroup;
  updateSalaryForm!: FormGroup;
  viewSalaryForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createSalaryOpen: boolean = false;
  updateSalaryOpen: boolean = false;
  viewSalaryOpen: boolean = false;
  currentSalaryId: any;
  selectedSalary: any = null;
  
  salaryList: any[] = [];
  designations: any[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Designation',
      heading2: 'Basic Salary',
      heading3: 'Shift Allowance',
      heading4: 'Incentives',
      heading5: 'Other Deductions',
      heading6: 'PF Applicable',
      heading7: 'Mess Deduction',
      heading8: 'Status',
      heading9: 'Action',
    },
  ];

  mockSalaries: any[] = [
    { id: '1', designationId: '1', basicSalary: 18000, shiftAllowance: 2000, incentives: 1500, otherDeductions: 500, isPfApplicable: true, isMessDeduction: true, is_active: 1 },
    { id: '2', designationId: '1', basicSalary: 25000, shiftAllowance: 3000, incentives: 2000, otherDeductions: 1000, isPfApplicable: true, isMessDeduction: false, is_active: 1 },
    { id: '3', designationId: '1', basicSalary: 15000, shiftAllowance: 1000, incentives: 800, otherDeductions: 300, isPfApplicable: false, isMessDeduction: true, is_active: 1 },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private designationService: DesignationService,
    private salaryStructureService: SalaryStructureService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
    });

    this.createSalaryForm = this.formBuilder.group({
      designationId: ['', [Validators.required]],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['', [Validators.required, Validators.min(0)]],
      incentives: ['', [Validators.required, Validators.min(0)]],
      otherDeductions: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: [true, [Validators.required]],
      isMessDeduction: [true, [Validators.required]],
    });

    this.updateSalaryForm = this.formBuilder.group({
      designationId: ['', [Validators.required]],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['', [Validators.required, Validators.min(0)]],
      incentives: ['', [Validators.required, Validators.min(0)]],
      otherDeductions: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: [true, [Validators.required]],
      isMessDeduction: [true, [Validators.required]],
    });

    this.viewSalaryForm = this.formBuilder.group({
      designationId: [''],
      basicSalary: [''],
      shiftAllowance: [''],
      incentives: [''],
      otherDeductions: [''],
      isPfApplicable: [''],
      isMessDeduction: [''],
    });
    
    this.loadDesignations();
    this.GetSalaryFun();
  }

  loadDesignations() {
    this.designationService.getDesignations('all', 1, '').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.designations = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error fetching designations:', error);
      }
    });
  }

  getDesignationName(id: any): string {
    const designation = this.designations.find(d => d.id == id);
    return designation ? designation.name : 'N/A';
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetSalaryFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetSalaryFun();
  }

  searchfun() {
    if (this.searchbarform.valid) {
      this.showreset = true;
      this.GetSalaryFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetSalaryFun();
  }

  openAddModal() {
    this.createSalaryOpen = true;
  }

  closeModal() {
    this.updateSalaryOpen = false;
    this.createSalaryOpen = false;
    this.viewSalaryOpen = false;
    this.selectedSalary = null;
    this.createSalaryForm.reset({ designationId: '', isPfApplicable: true, isMessDeduction: true });
  }

  OpenEditModal(salary: any): void {
    this.currentSalaryId = salary.id;
    this.updateSalaryOpen = true;
    this.GetupdateSalarybyid(this.currentSalaryId);
  }

  openviewModal(salary: any): void {
    this.viewSalaryOpen = true;
    this.currentSalaryId = salary.id;
    this.selectedSalary = salary;
    this.viewSalaryForm.patchValue({ 
      designationId: this.getDesignationName(salary.designationId),
      basicSalary: salary.basicSalary,
      shiftAllowance: salary.shiftAllowance,
      incentives: salary.incentives,
      otherDeductions: salary.otherDeductions,
      isPfApplicable: salary.isPfApplicable ? 'Yes' : 'No',
      isMessDeduction: salary.isMessDeduction ? 'Yes' : 'No',
    });
  }

  GetupdateSalarybyid(salaryId: any) {
    const salary = this.mockSalaries.find((d) => d.id === salaryId);
    if (salary) {
      this.updateSalaryForm.patchValue({
        designationId: salary.designationId,
        basicSalary: salary.basicSalary,
        shiftAllowance: salary.shiftAllowance,
        incentives: salary.incentives,
        otherDeductions: salary.otherDeductions,
        isPfApplicable: salary.isPfApplicable,
        isMessDeduction: salary.isMessDeduction,
      });
    }
  }

  createSalary() {
    if (this.createSalaryForm.valid) {
      const salaryData = this.createSalaryForm.value;

      const formData = new FormData();
      formData.append('designation_id', salaryData.designationId);
      formData.append('basic_salary', salaryData.basicSalary.toString());
      formData.append('shift_allowance', salaryData.shiftAllowance.toString());
      formData.append('incentives', (salaryData.incentives || 0).toString());
      
      const pfVal = salaryData.isPfApplicable === 'true' || salaryData.isPfApplicable === true ? '1' : '0';
      const messVal = salaryData.isMessDeduction === 'true' || salaryData.isMessDeduction === true ? '1' : '0';
      
      formData.append('pf_applicable', pfVal);
      formData.append('mess_deduction_applicable', messVal);
      formData.append('other_deduction', (salaryData.otherDeductions || 0).toString());

      this.salaryStructureService.createSalaryStructure(formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(
              response.message || 'Salary Structure created successfully',
              'success',
              3000,
            );
            
            const newId = response.data?.id || (this.mockSalaries.length + 1).toString();
            this.mockSalaries.unshift({
              id: newId,
              designationId: salaryData.designationId,
              basicSalary: Number(salaryData.basicSalary),
              shiftAllowance: Number(salaryData.shiftAllowance),
              incentives: Number(salaryData.incentives || 0),
              otherDeductions: Number(salaryData.otherDeductions || 0),
              isPfApplicable: pfVal === '1',
              isMessDeduction: messVal === '1',
              is_active: 1
            });
            this.GetSalaryFun();
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Create Salary Structure failed:', error);
          let errorMsg = 'Something went wrong';
          if (error.error) {
            if (error.error.errors) {
              const errorKeys = Object.keys(error.error.errors);
              if (errorKeys.length > 0) {
                const firstKey = errorKeys[0];
                const messages = error.error.errors[firstKey];
                if (Array.isArray(messages) && messages.length > 0) {
                  errorMsg = messages[0];
                } else if (typeof messages === 'string') {
                  errorMsg = messages;
                }
              }
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.createSalaryForm.markAllAsTouched();
    }
  }

  updateSalary() {
    if (this.updateSalaryForm.valid) {
      const salaryData = this.updateSalaryForm.value;

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('designation_id', salaryData.designationId);
      formData.append('basic_salary', salaryData.basicSalary.toString());
      formData.append('shift_allowance', salaryData.shiftAllowance.toString());
      formData.append('incentives', (salaryData.incentives || 0).toString());
      
      const pfVal = salaryData.isPfApplicable === 'true' || salaryData.isPfApplicable === true ? '1' : '0';
      const messVal = salaryData.isMessDeduction === 'true' || salaryData.isMessDeduction === true ? '1' : '0';
      
      formData.append('pf_applicable', pfVal);
      formData.append('mess_deduction_applicable', messVal);
      formData.append('other_deduction', (salaryData.otherDeductions || 0).toString());

      this.salaryStructureService.updateSalaryStructure(this.currentSalaryId, formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(
              response.message || 'Salary Structure updated successfully',
              'success',
              3000,
            );

            const index = this.mockSalaries.findIndex((d) => d.id === this.currentSalaryId);
            if (index !== -1) {
              this.mockSalaries[index] = {
                ...this.mockSalaries[index],
                designationId: salaryData.designationId,
                basicSalary: Number(salaryData.basicSalary),
                shiftAllowance: Number(salaryData.shiftAllowance),
                incentives: Number(salaryData.incentives || 0),
                otherDeductions: Number(salaryData.otherDeductions || 0),
                isPfApplicable: pfVal === '1',
                isMessDeduction: messVal === '1',
              };
              this.GetSalaryFun();
            }
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Salary Structure failed:', error);
          let errorMsg = 'Something went wrong';
          if (error.error) {
            if (error.error.errors) {
              const errorKeys = Object.keys(error.error.errors);
              if (errorKeys.length > 0) {
                const firstKey = errorKeys[0];
                const messages = error.error.errors[firstKey];
                if (Array.isArray(messages) && messages.length > 0) {
                  errorMsg = messages[0];
                } else if (typeof messages === 'string') {
                  errorMsg = messages;
                }
              }
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.updateSalaryForm.markAllAsTouched();
    }
  }

  GetSalaryFun() {
    const searchText = this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockSalaries;

    if (searchText) {
      filteredData = this.mockSalaries.filter((d) =>
        d.basicSalary.toString().includes(searchText) || 
        this.getDesignationName(d.designationId).toLowerCase().includes(searchText)
      );
    }

    this.totalRecords = filteredData.length;

    if (this.tableSize === 'all') {
      this.salaryList = filteredData;
    } else {
      const startIndex = (this.page - 1) * this.tableSize;
      const endIndex = startIndex + this.tableSize;
      this.salaryList = filteredData.slice(startIndex, endIndex);
    }
  }

  async Status(id: string, status: any) {
    const index = this.mockSalaries.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.mockSalaries[index].is_active = status;
      this.notificationService.show(
        `Salary Structure ${status ? 'activated' : 'deactivated'} successfully`,
        'success',
        2000,
      );
      this.GetSalaryFun();
    }
  }
}
