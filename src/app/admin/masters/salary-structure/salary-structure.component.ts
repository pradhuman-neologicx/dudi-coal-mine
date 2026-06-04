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



  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private designationService: DesignationService,
    private salaryStructureService: SalaryStructureService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createSalaryForm = this.formBuilder.group({
      designationId: ['', [Validators.required]],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['0', [Validators.min(0)]],
      incentives: ['0', [Validators.min(0)]],
      otherDeductions: ['0', [Validators.min(0)]],
      isPfApplicable: [false, [Validators.required]],
      isMessDeduction: [false, [Validators.required]],
    });

    this.updateSalaryForm = this.formBuilder.group({
      designationId: ['', [Validators.required]],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['0', [Validators.min(0)]],
      incentives: ['0', [Validators.min(0)]],
      otherDeductions: ['0', [Validators.min(0)]],
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
          this.GetSalaryFun();
        }
      },
      error: (error: any) => {
        console.error('Error fetching designations:', error);
      }
    });
  }

  getDesignationName(id: any): string {
    if (!id) return 'N/A';
    const designation = this.designations.find(d => d.id == id);
    return designation ? designation.name : id;
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
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetSalaryFun();
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
    this.createSalaryForm.reset({ designationId: '', isPfApplicable: false, isMessDeduction: false });
  }

  OpenEditModal(salary: any): void {
    this.currentSalaryId = salary.id;
    this.updateSalaryOpen = true;
    this.GetupdateSalarybyid(this.currentSalaryId);
  }

  openviewModal(salary: any): void {
    this.viewSalaryOpen = true;
    this.currentSalaryId = salary.id;
    this.selectedSalary = null;

    this.salaryStructureService.getSalaryStructureById(salary.id).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const resSalary = response.data;
          
          let designationIdVal = resSalary.designation_id;
          if (!designationIdVal && resSalary.designation) {
            const foundDesignation = this.designations.find(d => d.name === resSalary.designation);
            designationIdVal = foundDesignation ? foundDesignation.id : resSalary.designation;
          }

          this.selectedSalary = {
            id: resSalary.id,
            designationId: designationIdVal,
            basicSalary: Number(resSalary.basic_salary),
            shiftAllowance: Number(resSalary.shift_allowance),
            incentives: Number(resSalary.incentives || 0),
            otherDeductions: Number(resSalary.other_deduction || 0),
            isPfApplicable: resSalary.pf_applicable,
            isMessDeduction: resSalary.mess_deduction_applicable,
            is_active: resSalary.status !== undefined ? resSalary.status : resSalary.is_active
          };

          this.viewSalaryForm.patchValue({ 
            designationId: this.getDesignationName(this.selectedSalary.designationId),
            basicSalary: this.selectedSalary.basicSalary,
            shiftAllowance: this.selectedSalary.shiftAllowance,
            incentives: this.selectedSalary.incentives,
            otherDeductions: this.selectedSalary.otherDeductions,
            isPfApplicable: this.selectedSalary.isPfApplicable ? 'Yes' : 'No',
            isMessDeduction: this.selectedSalary.isMessDeduction ? 'Yes' : 'No',
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching salary structure details:', error);
      }
    });
  }

  GetupdateSalarybyid(salaryId: any) {
    this.salaryStructureService.getSalaryStructureById(salaryId).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const salary = response.data;
          
          let designId = salary.designation_id || salary.designation;
          if (isNaN(Number(designId))) {
            const found = this.designations.find(d => d.name === designId);
            if (found) {
              designId = found.id;
            }
          }

          this.updateSalaryForm.patchValue({
            designationId: designId,
            basicSalary: Number(salary.basic_salary),
            shiftAllowance: Number(salary.shift_allowance),
            incentives: Number(salary.incentives || 0),
            otherDeductions: Number(salary.other_deduction || 0),
            isPfApplicable: salary.pf_applicable,
            isMessDeduction: salary.mess_deduction_applicable,
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching salary structure for edit:', error);
      }
    });
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
    const searchText = this.searchbarform.get('searchbar')?.value || '';

    this.salaryStructureService.getSalaryStructures(this.tableSize, this.page, searchText).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.salaryList = response.data.map((item: any) => {
            let designationIdVal = item.designation_id;
            if (!designationIdVal && item.designation) {
              const foundDesignation = this.designations.find(d => d.name === item.designation);
              designationIdVal = foundDesignation ? foundDesignation.id : item.designation;
            }
            return {
              id: item.id,
              designationId: designationIdVal,
              basicSalary: item.basic_salary,
              shiftAllowance: item.shift_allowance,
              incentives: item.incentives,
              otherDeductions: item.other_deduction,
              isPfApplicable: item.pf_applicable,
              isMessDeduction: item.mess_deduction_applicable,
              is_active: item.status !== undefined ? item.status : item.is_active
            };
          });
          this.totalRecords = response.pagination?.total || response.data.length;
        } else {
          console.error('Failed to fetch salary structures:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching salary structures:', error);
      }
    });
  }

  async Status(id: string, status: any) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.salaryStructureService.updateSalaryStructureStatus(id, formData).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Salary Structure status updated successfully`,
            'success',
            3000
          );
          this.GetSalaryFun();
        } else {
          this.notificationService.show(
            response.message || 'Something went wrong',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Error updating status:', error);
        let errorMsg = 'Something went wrong';
        if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
