import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface Equipment {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-equipments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './equipments.component.html',
  styleUrl: './equipments.component.scss'
})
export class EquipmentsComponent implements OnInit, OnDestroy {
  equipments: Equipment[] = [];
  filteredEquipments: Equipment[] = [];
  categories: {id: number, name: string}[] = [];
  activeCategories: {id: number, name: string}[] = [];
  private destroy$ = new Subject<void>();

  // Pagination
  page: number = 1;
  tableSize: any = 10;
  totalRecords: number = 0;
  tableSizes: any = [10, 25, 50, 'all'];

  // Filters
  filterSearch: string = '';
  filterCategory: any = null;

  // Modal
  isModalOpen = false;
  isEditMode = false;
  equipmentForm!: FormGroup;
  selectedEquipmentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.equipmentForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      isActive: [true]
    });
    this.loadData();
    this.loadActiveCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActiveCategories() {
    this.equipmentService.getMachineCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.activeCategories = res.data.map((c: any) => ({
              id: c.category_id,
              name: c.category_name
            }));
          }
        },
        error: (err: any) => {
          console.error('Error loading active categories:', err);
        }
      });
  }

  loadData() {
    // Fetch categories first if not fetched
    if (this.categories.length === 0) {
      this.equipmentService.getEquipments('all', 1)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 && res.data) {
              this.categories = res.data.map((c: any) => ({
                id: c.id,
                name: c.equipment_category
              }));
            }
          },
          error: (err: any) => {
            console.error('Error loading categories:', err);
          }
        });
    }

    // Fetch equipments
    this.equipmentService.getEquipmentNames(this.tableSize, this.page, this.filterSearch, this.filterCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            this.filteredEquipments = response.data.map((item: any) => ({
              id: item.id,
              name: item.equipment_name,
              categoryId: item.equipment_category_id,
              categoryName: item.equipment_category_name,
              isActive: item.status === 1 || item.status === true
            }));
            this.totalRecords = response.pagination?.total || this.filteredEquipments.length;
          } else {
            this.notificationService.show(response.message || 'Failed to load equipments', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error loading equipments:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  onFilterChange() {
    this.page = 1; // Reset to first page
    this.loadData();
  }

  resetFilter() {
    this.filterSearch = '';
    this.filterCategory = null;
    this.onFilterChange();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.loadData();
  }

  onTableSizeChange(event: any) {
    this.tableSize = event.target.value === 'all' ? 'all' : parseInt(event.target.value);
    this.page = 1;
    this.loadData();
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedEquipmentId = null;
    this.equipmentForm.reset({ isActive: true, categoryId: '' });
    this.isModalOpen = true;
  }

  openEditModal(equipment: Equipment) {
    this.isEditMode = true;
    this.selectedEquipmentId = equipment.id;
    this.equipmentForm.patchValue({
      name: equipment.name,
      categoryId: equipment.categoryId,
      isActive: equipment.isActive
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveEquipment() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.equipmentForm.value;
    const formData = new FormData();
    formData.append('equipment_name', formValue.name);
    formData.append('equipment_id', formValue.categoryId.toString());

    if (this.isEditMode && this.selectedEquipmentId !== null) {
      formData.append('_method', 'PUT');
      this.equipmentService.updateEquipmentName(this.selectedEquipmentId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 || res.status === 201) {
              this.notificationService.show(res.message || 'Equipment updated successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(res.message || 'Failed to update equipment', 'error', 3000);
            }
          },
          error: (err: any) => {
            console.error('Error updating equipment:', err);
            this.notificationService.show(err.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      this.equipmentService.createEquipmentName(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 || res.status === 201) {
              this.notificationService.show(res.message || 'Equipment created successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(res.message || 'Failed to create equipment', 'error', 3000);
            }
          },
          error: (err: any) => {
            console.error('Error creating equipment:', err);
            this.notificationService.show(err.message || 'Something went wrong', 'error', 3000);
          }
        });
    }
  }

  toggleActiveStatus(equipment: Equipment) {
    const nextStatus = equipment.isActive ? 0 : 1;
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', nextStatus.toString());

    this.equipmentService.updateEquipmentNameStatus(equipment.id, formData)
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

