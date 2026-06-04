import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { trigger, transition, style, animate } from '@angular/animations';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule],
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
export class TrainingTypeComponent implements OnInit {
  trainingTypes: TrainingType[] = [];
  displayTypes: TrainingType[] = [];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: any = 10;
  tableSizes: any = [10, 25, 50, 100, 'all'];

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

  GetTrainingTypesFun(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.trainingTypeService.getTrainingTypes(this.tableSize, this.page, searchText).subscribe({
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

  onTableDataChange(event: any): void {
    this.page = event;
    this.GetTrainingTypesFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value === 'all' ? 'all' : Number(event.target.value);
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

    this.trainingTypeService.getTrainingTypeById(type.id).subscribe({
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

    this.trainingTypeService.getTrainingTypeById(type.id).subscribe({
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

      this.trainingTypeService.updateTrainingType(this.selectedType.id, formData).subscribe({
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
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      const formData = new FormData();
      formData.append('name', val.name);

      this.trainingTypeService.createTrainingType(formData).subscribe({
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
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    }
  }

  toggleStatus(type: TrainingType, status: number): void {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.trainingTypeService.updateTrainingTypeStatus(type.id, formData).subscribe({
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
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
