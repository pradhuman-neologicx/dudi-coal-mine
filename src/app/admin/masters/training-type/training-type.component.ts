import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { TrainingTypeService } from 'src/app/core/services/training-type.service';

export interface TrainingType {
  id: string;
  name: string;
  is_active: number;
}

@Component({
  selector: 'app-training-type',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './training-type.component.html',
  styleUrls: ['./training-type.component.scss'],
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
export class TrainingTypeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  trainingTypes: TrainingType[] = [];
  displayTypes: TrainingType[] = [];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];

  searchbarform!: FormGroup;
  filterStatus: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewTrainingTypeOpen: boolean = false;
  typeForm!: FormGroup;
  selectedType: TrainingType | null = null;
  selectedTrainingType: TrainingType | null = null;

  constructor(
    private fb: FormBuilder,
    private trainingTypeService: TrainingTypeService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });
    this.typeForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.GetTrainingTypesFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  GetTrainingTypesFun(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.trainingTypeService.getTrainingTypes(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.trainingTypes = response.data.map((item: any) => ({
              ...item,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.filterData();
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch training types:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching training types:', error);
        }
      });
  }

  filterData(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.displayTypes = this.trainingTypes.filter((t) => {
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
    this.GetTrainingTypesFun();
  }

  resetsearchbar(): void {
    this.searchbarform.get('searchbar')?.reset();
    this.filterStatus = '';
    this.showreset = false;
    this.page = 1;
    this.GetTrainingTypesFun();
  }

  onTableDataChange(event: number): void {
    this.page = event;
    this.GetTrainingTypesFun();
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      const value = (event.target as HTMLInputElement).value;
      this.tableSize = value === 'all' ? 1000 : Number(value); // Default to a large number for 'all' or fix pagination
    }
    this.page = 1;
    this.GetTrainingTypesFun();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedType = null;
    this.typeForm.reset();
    this.modalOpen = true;
  }

  openEditModal(type: TrainingType): void {
    this.isEditMode = true;
    this.selectedType = type;
    this.typeForm.patchValue({ name: type.name });
    this.modalOpen = true;

    this.trainingTypeService.getTrainingTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const freshData = response.data;
            this.typeForm.patchValue({ name: freshData.name });
          }
        },
        error: (error: any) => {
          console.error('Error fetching training type details for edit:', error);
        }
      });
  }

  openviewModal(type: TrainingType): void {
    this.viewTrainingTypeOpen = true;
    this.selectedTrainingType = null;

    this.trainingTypeService.getTrainingTypeById(type.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const data = response.data;
            this.selectedTrainingType = {
              ...data,
              is_active: data.status !== undefined ? data.status : data.is_active
            };
          }
        },
        error: (error: any) => {
          console.error('Error fetching training type details:', error);
        }
      });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewTrainingTypeOpen = false;
    this.selectedTrainingType = null;
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const val = this.typeForm.value;
    if (this.isEditMode && this.selectedType) {
      const formData = new FormData();
      formData.append('name', val.name);
      formData.append('_method', 'PUT');

      this.trainingTypeService.updateTrainingType(this.selectedType.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Training Type updated successfully',
                'success',
                3000,
              );
              this.GetTrainingTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Update Training Type failed:', error);
            this.handleApiError(error);
          }
        });
    } else {
      const formData = new FormData();
      formData.append('name', val.name);

      this.trainingTypeService.createTrainingType(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Training Type created successfully',
                'success',
                3000,
              );
              this.page = 1;
              this.GetTrainingTypesFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Create Training Type failed:', error);
            this.handleApiError(error);
          }
        });
    }
  }

  toggleStatus(type: TrainingType, status: number): void {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.trainingTypeService.updateTrainingTypeStatus(type.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(
              response.message || 'Training Type status updated successfully',
              'success',
              3000,
            );
            this.GetTrainingTypesFun();
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
