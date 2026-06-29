import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { BreakdownTypeService } from 'src/app/core/services/breakdown-type.service';

export interface BreakdownType {
  id: string;
  name: string;
  is_active: number;
}

@Component({
  selector: 'app-breakdown-type',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './breakdown-type.component.html',
  styleUrl: './breakdown-type.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class BreakdownTypeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  breakdownTypes: BreakdownType[] = [];
  displayTypes: BreakdownType[] = [];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: any = 10;
  tableSizes: any = [10, 25, 50, 100, 'all'];

  searchbarform!: FormGroup;
  filterStatus: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewBreakdownTypeOpen: boolean = false;
  typeForm!: FormGroup;
  selectedType: BreakdownType | null = null;
  selectedBreakdownType: BreakdownType | null = null;

  constructor(
    private fb: FormBuilder,
    private breakdownTypeService: BreakdownTypeService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });
    this.typeForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.GetBreakdownTypesFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  GetBreakdownTypesFun(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.breakdownTypeService.getBreakdownTypes(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.breakdownTypes = response.data.map((item: any) => ({
              ...item,
              name: item.breakdown_type,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.filterData();
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch breakdown types:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching breakdown types:', error);
        }
      });
  }

  filterData(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.displayTypes = this.breakdownTypes.filter((t) => {
      const matchStatus = this.filterStatus === '' || 
                          (this.filterStatus === 'Active' && t.is_active === 1) ||
                          (this.filterStatus === 'Inactive' && t.is_active === 0);
      return matchStatus;
    });
    this.showreset = searchText !== '' || this.filterStatus !== '';
  }

  searchfun(): void {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetBreakdownTypesFun();
  }

  resetsearchbar(): void {
    this.searchbarform.get('searchbar')?.reset();
    this.filterStatus = '';
    this.showreset = false;
    this.page = 1;
    this.GetBreakdownTypesFun();
  }

  onTableDataChange(event: any): void {
    this.page = event;
    this.GetBreakdownTypesFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value === 'all' ? 'all' : Number(event.target.value);
    this.page = 1;
    this.GetBreakdownTypesFun();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedType = null;
    this.typeForm.reset();
    this.modalOpen = true;
  }

  openEditModal(type: BreakdownType): void {
    this.isEditMode = true;
    this.selectedType = type;
    this.typeForm.patchValue({ name: type.name });
    this.modalOpen = true;

    this.breakdownTypeService.getBreakdownTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const freshData = response.data;
            this.typeForm.patchValue({ name: freshData.breakdown_type });
          }
        },
        error: (error: any) => {
          console.error('Error fetching breakdown type details for edit:', error);
        }
      });
  }

  openviewModal(type: BreakdownType): void {
    this.viewBreakdownTypeOpen = true;
    this.selectedBreakdownType = null;

    this.breakdownTypeService.getBreakdownTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const data = response.data;
            this.selectedBreakdownType = {
              ...data,
              name: data.breakdown_type,
              is_active: data.status !== undefined ? data.status : data.is_active
            };
          }
        },
        error: (error: any) => {
          console.error('Error fetching breakdown type details:', error);
        }
      });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewBreakdownTypeOpen = false;
    this.selectedBreakdownType = null;
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const val = this.typeForm.value;
    if (this.isEditMode && this.selectedType) {
      const formData = new FormData();
      formData.append('breakdown_type', val.name);
      formData.append('_method', 'PUT');

      this.breakdownTypeService.updateBreakdownType(this.selectedType.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Breakdown Type updated successfully',
                'success',
                3000,
              );
              this.GetBreakdownTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Update Breakdown Type failed:', error);
            this.handleApiError(error);
          }
        });
    } else {
      const formData = new FormData();
      formData.append('breakdown_type', val.name);

      this.breakdownTypeService.createBreakdownType(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Breakdown Type created successfully',
                'success',
                3000,
              );
              this.page = 1;
              this.GetBreakdownTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Create Breakdown Type failed:', error);
            this.handleApiError(error);
          }
        });
    }
  }

  toggleStatus(type: BreakdownType, status: number): void {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.breakdownTypeService.updateBreakdownTypeStatus(type.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(
              response.message || 'Breakdown Type status updated successfully',
              'success',
              3000,
            );
            this.GetBreakdownTypesFun();
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Status update failed:', error);
          this.handleApiError(error);
        }
      });
  }

  private handleApiError(error: any, defaultMessage: string = 'Something went wrong'): void {
    let errorMsg = defaultMessage;
    
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (error?.error) {
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
    } else if (error?.message) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
    }
    
    this.notificationService.show(errorMsg, 'error', 3000);
  }
}
