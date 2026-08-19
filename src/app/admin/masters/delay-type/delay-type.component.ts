import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DelayTypeService } from 'src/app/core/services/delay-type.service';

export interface DelayType {
  id: string;
  name: string;
  is_active: number;
}

@Component({
  selector: 'app-delay-type',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './delay-type.component.html',
  styleUrl: './delay-type.component.scss',
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
export class DelayTypeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  delayTypes: DelayType[] = [];
  displayTypes: DelayType[] = [];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];

  searchbarform!: FormGroup;
  filterStatus: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewDelayTypeOpen: boolean = false;
  typeForm!: FormGroup;
  selectedType: DelayType | null = null;
  selectedDelayType: DelayType | null = null;

  constructor(
    private fb: FormBuilder,
    private delayTypeService: DelayTypeService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });
    this.typeForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.GetDelayTypesFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  GetDelayTypesFun(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.delayTypeService.getDelayTypes(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.delayTypes = response.data.map((item: any) => ({
              ...item,
              name: item.delay_category || item.category_name || item.name || item.delay_type,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.filterData();
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch delay types:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching delay types:', error);
        }
      });
  }

  filterData(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.displayTypes = this.delayTypes.filter((t) => {
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
    this.GetDelayTypesFun();
  }

  resetsearchbar(): void {
    this.searchbarform.get('searchbar')?.reset();
    this.filterStatus = '';
    this.showreset = false;
    this.page = 1;
    this.GetDelayTypesFun();
  }

  onTableDataChange(event: number): void {
    this.page = event;
    this.GetDelayTypesFun();
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      const value = (event.target as HTMLInputElement).value;
      this.tableSize = value === 'all' ? 1000 : Number(value); // Default to a large number for 'all' or fix pagination
    }
    this.page = 1;
    this.GetDelayTypesFun();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedType = null;
    this.typeForm.reset();
    this.modalOpen = true;
  }

  openEditModal(type: DelayType): void {
    this.isEditMode = true;
    this.selectedType = type;
    this.typeForm.patchValue({ name: type.name });
    this.modalOpen = true;

    this.delayTypeService.getDelayTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const freshData = response.data;
            this.typeForm.patchValue({ name: freshData.delay_category || freshData.category_name || freshData.name || freshData.delay_type });
          }
        },
        error: (error: any) => {
          console.error('Error fetching delay type details for edit:', error);
        }
      });
  }

  openviewModal(type: DelayType): void {
    this.viewDelayTypeOpen = true;
    this.selectedDelayType = null;

    this.delayTypeService.getDelayTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const data = response.data;
            this.selectedDelayType = {
              ...data,
              name: data.delay_category || data.category_name || data.name || data.delay_type,
              is_active: data.status !== undefined ? data.status : data.is_active
            };
          }
        },
        error: (error: any) => {
          console.error('Error fetching delay type details:', error);
        }
      });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewDelayTypeOpen = false;
    this.selectedDelayType = null;
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const val = this.typeForm.value;
    if (this.isEditMode && this.selectedType) {
      const formData = new FormData();
      formData.append('delay_category', val.name);
      formData.append('_method', 'PUT');

      this.delayTypeService.updateDelayType(this.selectedType.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Delay Type updated successfully',
                'success',
                3000,
              );
              this.GetDelayTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Update Delay Type failed:', error);
            this.handleApiError(error);
          }
        });
    } else {
      const formData = new FormData();
      formData.append('delay_category', val.name);

      this.delayTypeService.createDelayType(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Delay Type created successfully',
                'success',
                3000,
              );
              this.page = 1;
              this.GetDelayTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Create Delay Type failed:', error);
            this.handleApiError(error);
          }
        });
    }
  }

  toggleStatus(type: DelayType, status: number): void {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.delayTypeService.updateDelayTypeStatus(type.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(
              response.message || 'Delay Type status updated successfully',
              'success',
              3000,
            );
            this.GetDelayTypesFun();
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
