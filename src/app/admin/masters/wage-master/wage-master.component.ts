import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../../core/services/Employee.service';

export interface WageRate {
  id?: number | string;
  effectiveDate?: string;
  effective_from?: string;
  status?: string;
  [key: string]: any;
}

export interface SelectedViewRate {
  effectiveDate: string;
  status: string;
  rates: any[];
}

@Component({
  selector: 'app-wage-master',
  templateUrl: './wage-master.component.html',
  styleUrls: ['./wage-master.component.scss']
})
export class WageMasterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  wageForm!: FormGroup;
  isModalOpen = false;

  // Categories from backend
  categories = [
    { id: 1, name: 'Highly Skilled' },
    { id: 2, name: 'Skilled' },
    { id: 3, name: 'Semi Skilled' },
    { id: 4, name: 'Un Skilled' }
  ];

 
  historicalRates: WageRate[] = [];
  editRateId: number | string | null = null;

  isViewModalOpen = false;
  selectedViewRate: SelectedViewRate | null = null;

  page: number = 1;
  tableSize: number = 10;
  totalCount: number = 0;
  
  constructor(private fb: FormBuilder, private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.initForm();
    this.getWagesData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getWagesData(): void {
    this.employeeService.getWagesMasterData(this.tableSize, this.page)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const dataObj = response.data;
          if (Array.isArray(dataObj)) {
            this.historicalRates = dataObj.map((item: any) => {
              let rawStatus = (item.status || 'Current').toLowerCase();
              let itemStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
              return {
                id: item.id || '',
                effectiveDate: item.effective_from || item.effectiveDate,
                status: itemStatus
              };
            });
            this.totalCount = response.pagination?.total || this.historicalRates.length;
          } else if (typeof dataObj === 'object') {
            const effDate = dataObj.effective_from || dataObj.effectiveDate || new Date().toISOString().split('T')[0];
            this.historicalRates = [{
              id: dataObj.id || 1,
              effectiveDate: effDate,
              status: 'Active'
            }];
            this.totalCount = 1;
          }
        } else {
          this.historicalRates = [];
          this.totalCount = 0;
        }
      },
      error: (error: any) => {
        console.error('Error fetching wage data:', error);
        this.historicalRates = [];
        this.totalCount = 0;
      }
    });
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.getWagesData();
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      this.tableSize = Number((event.target as HTMLInputElement).value);
    }
    this.page = 1;
    this.getWagesData();
  }

  initForm(): void {
    this.wageForm = this.fb.group({
      effectiveDate: ['', Validators.required],
      rates: this.fb.array([])
    });
  }

  get ratesFormArray(): FormArray {
    return this.wageForm.get('rates') as FormArray;
  }

  populateRates(): void {
    this.ratesFormArray.clear();
    this.categories.forEach(category => {
      this.ratesFormArray.push(this.fb.group({
        categoryId: [category.id],
        categoryName: [category.name], // For display purposes in UI
        basic: [0, [Validators.required, Validators.min(0)]],
        da: [0, [Validators.required, Validators.min(0)]],
        overtime: [0, [Validators.required, Validators.min(0)]]
      }));
    });
  }

  openAddModal(rate?: WageRate): void {
    if (rate) {
      this.editRateId = rate.id || null; // Or mapped id from your API
      
      let formattedDate = rate.effectiveDate || rate.effective_from || '';
      if (formattedDate && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }

      this.wageForm.patchValue({
        effectiveDate: formattedDate
      });

      this.employeeService.getWagesMatrixData(formattedDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (response: any) => {
          this.ratesFormArray.clear();
          let apiData = response?.data || {};
          let columns = apiData.columns || [];
          let rows = apiData.rows || {};
          
          if (columns && columns.length > 0) {
            columns.forEach((col: any) => {
              let skillCat = col.skill_category;
              let catName = col.label || '';
              if (catName === 'Highly-Skilled') catName = 'Highly Skilled';
              else if (catName === 'Semi-Skilled') catName = 'Semi Skilled';

              this.ratesFormArray.push(this.fb.group({
                categoryId: [null],
                categoryName: [catName],
                basic: [rows.minimum_basic?.[skillCat] || 0, [Validators.required, Validators.min(0)]],
                da: [rows.dearness_allowance?.[skillCat] || 0, [Validators.required, Validators.min(0)]],
                overtime: [rows.overtime?.[skillCat] || 0, [Validators.required, Validators.min(0)]]
              }));
            });
          } else {
            this.populateRates();
          }
          this.isModalOpen = true;
        },
        error: (error: any) => {
          console.error('Error fetching wage matrix:', error);
          this.populateRates();
          this.isModalOpen = true;
        }
      });
    } else {
      this.editRateId = null;
      this.wageForm.reset({
        effectiveDate: ''
      });
      this.populateRates();
      this.isModalOpen = true;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openViewModal(rate: WageRate): void {
    let formattedDate = rate.effectiveDate || rate.effective_from || '';
    if (formattedDate && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    
    this.employeeService.getWagesMatrixData(formattedDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response: any) => {
        let apiData = response?.data || {};
        let columns = apiData.columns || [];
        let rows = apiData.rows || {};
        
        let mappedRates: any[] = [];
        if (columns && columns.length > 0) {
          columns.forEach((col: any) => {
            let skillCat = col.skill_category;
            let catName = col.label || '';
            if (catName === 'Highly-Skilled') catName = 'Highly Skilled';
            else if (catName === 'Semi-Skilled') catName = 'Semi Skilled';
            
            mappedRates.push({
              categoryName: catName,
              basic: rows.minimum_basic?.[skillCat] || 0,
              da: rows.dearness_allowance?.[skillCat] || 0,
              overtime: rows.overtime?.[skillCat] || 0
            });
          });
        }

        this.selectedViewRate = {
          effectiveDate: formattedDate,
          status: rate.status || 'Active', 
          rates: mappedRates
        };
        this.isViewModalOpen = true;
      },
      error: (error: any) => {
        console.error('Error fetching wage matrix for view:', error);
        this.selectedViewRate = {
          effectiveDate: formattedDate,
          status: rate.status || 'Active', 
          rates: []
        };
        this.isViewModalOpen = true;
      }
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedViewRate = null;
  }

  onSubmit(): void {
    if (this.wageForm.valid) {
      console.log('Form Submitted Data:', this.wageForm.value);
      const effectiveDate = this.wageForm.value.effectiveDate;
      const rates = this.wageForm.value.rates;
      
      let payload: any = {
        effective_from: effectiveDate,
        rates: rates.map((rate: any) => {
          let skillCat = (rate.categoryName || '').toLowerCase().replace(/\s+/g, '_');
          if (skillCat === 'un_skilled') skillCat = 'unskilled';
          return {
            skill_category: skillCat,
            minimum_basic: rate.basic,
            dearness_allowance: rate.da,
            overtime_rate: rate.overtime
          };
        }) 
      };

      if (this.editRateId) {
        payload.id = this.editRateId;
      }

      const apiCall = this.employeeService.createSalaryWagesMaster(payload);

      apiCall.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          console.log('Rates saved successfully:', response);
          this.closeModal();
          this.getWagesData(); // Refresh data after saving
        },
        error: (error: any) => {
          console.error('Error saving rates:', error);
        }
      });
    } else {
      this.wageForm.markAllAsTouched();
    }
  }
}
