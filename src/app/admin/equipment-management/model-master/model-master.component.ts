import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface EquipmentModel {
  id: number;
  model_number: string;
  manufacturer: string;
  equipment_id?: number | null;
  categoryName?: string;
  isActive: boolean;
}

export interface EquipmentCategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-model-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './model-master.component.html',
  styleUrl: './model-master.component.scss'
})
export class ModelMasterComponent implements OnInit, OnDestroy {
  models: EquipmentModel[] = [];
  categories: EquipmentCategoryOption[] = [];

  private destroy$ = new Subject<void>();

  isModalOpen = false;
  isEditMode = false;
  modelForm!: FormGroup;
  selectedModelId: number | null = null;

  tableSize: number = 10;
  page: number = 1;
  totalRecords: number = 0;
  totalPages: number = 1;
  paginationNumbers: number[] = [];
  tableSizes: number[] = [10, 20, 50, 100];

  constructor(
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.modelForm = this.fb.group({
      equipment_id: [null, Validators.required],
      model_number: ['', Validators.required],
      manufacturer: ['', Validators.required]
    });

    this.loadCategories();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.equipmentService.getEquipments('all', 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
            this.categories = res.data.map((c: any) => ({
              id: Number(c.id),
              name: c.equipment_category || c.name || c.category_name
            }));
          } else {
            this.fallbackMachineCategories();
          }
        },
        error: () => {
          this.fallbackMachineCategories();
        }
      });
  }

  fallbackMachineCategories() {
    this.equipmentService.getMachineCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && Array.isArray(res.data)) {
            this.categories = res.data.map((c: any) => ({
              id: Number(c.category_id || c.id),
              name: c.category_name || c.name || c.equipment_category
            }));
          }
        },
        error: (err: any) => {
          console.warn('Could not load categories:', err);
        }
      });
  }

  getCategoryName(equipmentId: any): string {
    if (!equipmentId) return '';
    const cat = this.categories.find(c => c.id == equipmentId);
    return cat ? cat.name : '';
  }

  loadData() {
    this.equipmentService.getEquipmentModels(this.tableSize, this.page)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.status === 200 && response.data) {
            this.models = response.data.map((item: any) => {
              const categoryName = item.equipment_category_name
                || item.equipment?.equipment_category 
                || item.equipment_category 
                || item.category_name 
                || item.equipment_name 
                || item.equipment?.name
                || this.getCategoryName(item.equipment_id);

              return {
                id: item.id,
                model_number: item.model_number || item.name || '',
                manufacturer: item.manufacturer || '',
                equipment_id: item.equipment_id || item.equipment?.id || null,
                categoryName: categoryName || 'N/A',
                isActive: item.status === 1 || item.status === true || item.status === '1'
              };
            });

            if (response.pagination) {
              this.totalRecords = Number(response.pagination.total) || 0;
              this.page = Number(response.pagination.current_page) || 1;
              this.tableSize = Number(response.pagination.per_page) || 10;
              this.totalPages = Number(response.pagination.last_page) || Math.max(1, Math.ceil(this.totalRecords / this.tableSize));
              this.generatePagination();
            } else {
              this.totalRecords = this.models.length;
              this.totalPages = 1;
              this.generatePagination();
            }
          } else {
            this.models = [];
            this.totalRecords = 0;
            this.notificationService.show(response?.message || 'Failed to load models', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error loading equipment models:', error);
          this.models = [];
          this.totalRecords = 0;
          // this.notificationService.show(error?.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  generatePagination() {
    this.paginationNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.paginationNumbers.push(i);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.loadData();
    }
  }

  onTableSizeChange(event: Event | number) {
    const target = (event as Event)?.target as HTMLSelectElement | null;
    this.tableSize = target ? Number(target.value) : Number(event);
    this.page = 1;
    this.loadData();
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedModelId = null;
    this.modelForm.reset({
      equipment_id: null,
      model_number: '',
      manufacturer: ''
    });
    this.isModalOpen = true;
  }

  openEditModal(model: EquipmentModel) {
    this.isEditMode = true;
    this.selectedModelId = model.id;
    this.modelForm.patchValue({
      equipment_id: model.equipment_id ? Number(model.equipment_id) : null,
      model_number: model.model_number,
      manufacturer: model.manufacturer
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveModel() {
    if (this.modelForm.invalid) {
      this.modelForm.markAllAsTouched();
      return;
    }

    const formValue = this.modelForm.value;

    if (this.isEditMode && this.selectedModelId !== null) {
      // Postman PUT /v1/admin/equipment-model-numbers/:id
      // Body: raw JSON { equipment_id, model_number, manufacturer }
      const payload = {
        equipment_id: Number(formValue.equipment_id),
        model_number: formValue.model_number,
        manufacturer: formValue.manufacturer
      };

      this.equipmentService.updateEquipmentModel(this.selectedModelId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Model updated successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(response.message || 'Failed to update model', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error updating model:', error);
            // this.notificationService.show(error?.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      // Postman POST /v1/admin/equipment-model-numbers
      // Body: form-data (equipment_id, model_number, manufacturer)
      const formData = new FormData();
      formData.append('equipment_id', formValue.equipment_id);
      formData.append('model_number', formValue.model_number);
      formData.append('manufacturer', formValue.manufacturer);

      this.equipmentService.createEquipmentModel(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Model created successfully', 'success', 3000);
              this.closeModal();
              this.page = 1;
              this.loadData();
            } else {
              this.notificationService.show(response.message || 'Failed to create model', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error creating model:', error);
            // this.notificationService.show(error?.message || 'Something went wrong', 'error', 3000);
          }
        });
    }
  }

  toggleActiveStatus(model: EquipmentModel) {
    const nextStatus = model.isActive ? 0 : 1;
    // Postman PATCH /v1/admin/equipment-model-numbers/:id/status
    // Body: raw JSON { status: 1 | 0 }
    const payload = {
      status: nextStatus
    };

    this.equipmentService.updateEquipmentModelStatus(model.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(response.message || 'Status updated successfully', 'success', 3000);
            this.loadData();
          } else {
            this.notificationService.show(response.message || 'Failed to update status', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error toggling status:', error);
          // this.notificationService.show(error?.message || 'Something went wrong', 'error', 3000);
        }
      });
  }
}
