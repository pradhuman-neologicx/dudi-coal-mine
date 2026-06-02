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
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Basic Salary',
      heading2: 'Shift Allowance',
      heading3: 'Incentives',
      heading4: 'Other Deductions',
      heading5: 'PF Applicable',
      heading6: 'Mess Deduction',
      heading7: 'Status',
      heading8: 'Action',
    },
  ];

  mockSalaries: any[] = [
    { id: '1', basicSalary: 18000, shiftAllowance: 2000, incentives: 1500, otherDeductions: 500, isPfApplicable: true, isMessDeduction: true, is_active: 1 },
    { id: '2', basicSalary: 25000, shiftAllowance: 3000, incentives: 2000, otherDeductions: 1000, isPfApplicable: true, isMessDeduction: false, is_active: 1 },
    { id: '3', basicSalary: 15000, shiftAllowance: 1000, incentives: 800, otherDeductions: 300, isPfApplicable: false, isMessDeduction: true, is_active: 1 },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
    });

    this.createSalaryForm = this.formBuilder.group({
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['', [Validators.required, Validators.min(0)]],
      incentives: ['', [Validators.required, Validators.min(0)]],
      otherDeductions: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: [true, [Validators.required]],
      isMessDeduction: [true, [Validators.required]],
    });

    this.updateSalaryForm = this.formBuilder.group({
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      shiftAllowance: ['', [Validators.required, Validators.min(0)]],
      incentives: ['', [Validators.required, Validators.min(0)]],
      otherDeductions: ['', [Validators.required, Validators.min(0)]],
      isPfApplicable: [true, [Validators.required]],
      isMessDeduction: [true, [Validators.required]],
    });

    this.viewSalaryForm = this.formBuilder.group({
      basicSalary: [''],
      shiftAllowance: [''],
      incentives: [''],
      otherDeductions: [''],
      isPfApplicable: [''],
      isMessDeduction: [''],
    });
    
    this.GetSalaryFun();
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
    this.createSalaryForm.reset({ isPfApplicable: true, isMessDeduction: true });
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
      
      if (typeof salaryData.isPfApplicable === 'string') {
        salaryData.isPfApplicable = salaryData.isPfApplicable === 'true';
      }
      if (typeof salaryData.isMessDeduction === 'string') {
        salaryData.isMessDeduction = salaryData.isMessDeduction === 'true';
      }

      const newId = (this.mockSalaries.length + 1).toString();
      this.mockSalaries.unshift({ 
        id: newId, 
        ...salaryData, 
        is_active: 1 
      });
      
      this.closeModal();
      this.notificationService.show(
        'Salary Structure created successfully',
        'success',
        3000,
      );
      this.GetSalaryFun();
    } else {
      this.createSalaryForm.markAllAsTouched();
    }
  }

  updateSalary() {
    if (this.updateSalaryForm.valid) {
      const salaryData = this.updateSalaryForm.value;

      if (typeof salaryData.isPfApplicable === 'string') {
        salaryData.isPfApplicable = salaryData.isPfApplicable === 'true';
      }
      if (typeof salaryData.isMessDeduction === 'string') {
        salaryData.isMessDeduction = salaryData.isMessDeduction === 'true';
      }

      const index = this.mockSalaries.findIndex((d) => d.id === this.currentSalaryId);
      if (index !== -1) {
        this.mockSalaries[index] = { ...this.mockSalaries[index], ...salaryData };
        this.closeModal();
        this.notificationService.show(
          'Salary Structure updated successfully',
          'success',
          3000,
        );
        this.GetSalaryFun();
      }
    } else {
      this.updateSalaryForm.markAllAsTouched();
    }
  }

  GetSalaryFun() {
    const searchText = this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockSalaries;

    if (searchText) {
      filteredData = this.mockSalaries.filter((d) =>
        d.basicSalary.toString().includes(searchText)
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
