import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface EquipmentCategory {
  id: number;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-equipment-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './equipment-master.component.html',
  styleUrl: './equipment-master.component.scss'
})
export class EquipmentMasterComponent implements OnInit, OnDestroy {
  categories: EquipmentCategory[] = [];
  private destroy$ = new Subject<void>();
  
  isModalOpen = false;
  isEditMode = false;
  categoryForm!: FormGroup;
  selectedCategoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      isActive: [true]
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.equipmentService.getEquipments('all', 1).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.categories = response.data.map((item: any) => ({
            id: item.id,
            name: item.equipment_category,
            isActive: item.status === 1 || item.status === true
          }));
        } else {
          this.notificationService.show(response.message || 'Failed to load categories', 'error', 3000);
        }
      },
      error: (error: any) => {
        console.error('Error loading equipment categories:', error);
        this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
      }
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedCategoryId = null;
    this.categoryForm.reset({ isActive: true });
    this.isModalOpen = true;
  }

  openEditModal(category: EquipmentCategory) {
    this.isEditMode = true;
    this.selectedCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      isActive: category.isActive
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;
    const formData = new FormData();
    formData.append('name', formValue.name);

    if (this.isEditMode && this.selectedCategoryId !== null) {
      formData.append('_method', 'PUT');
      this.equipmentService.updateEquipment(this.selectedCategoryId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Category updated successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(response.message || 'Failed to update category', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error updating category:', error);
            this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      this.equipmentService.createEquipment(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Category created successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(response.message || 'Failed to create category', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error creating category:', error);
            this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
          }
        });
    }
  }

  toggleActiveStatus(category: EquipmentCategory) {
    const nextStatus = category.isActive ? 0 : 1;
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', nextStatus.toString());

    this.equipmentService.updateEquipmentStatus(category.id, formData)
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
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }
}

