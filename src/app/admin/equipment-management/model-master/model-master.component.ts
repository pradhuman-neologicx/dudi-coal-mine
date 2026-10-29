import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface EquipmentModel {
  id: number;
  name: string;
  isActive: boolean;
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
  paginatedModels: EquipmentModel[] = [];

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
      name: ['', Validators.required],
      isActive: [true]
    });

    this.initMockData();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initMockData() {
    this.models = [
      { id: 1, name: 'CAT 320D', isActive: true },
      { id: 2, name: 'Komatsu PC210-10M0', isActive: true },
      { id: 3, name: 'Volvo EC210D', isActive: true },
      { id: 4, name: 'Hyundai R210-7', isActive: true },
      { id: 5, name: 'Tata Prima 2530.K', isActive: true },
      { id: 6, name: 'Ashok Leyland 2820 Tipper', isActive: true },
      { id: 7, name: 'Scania G440 XT Tipper', isActive: true },
      { id: 8, name: 'BharatBenz 2828C', isActive: true },
      { id: 9, name: 'BEML BD155', isActive: true },
      { id: 10, name: 'CAT D8R', isActive: true },
      { id: 11, name: 'Komatsu D155A', isActive: true },
      { id: 12, name: 'CAT 140M Motor Grader', isActive: true },
      { id: 13, name: 'Komatsu GD535', isActive: true },
      { id: 14, name: 'BEML BG825', isActive: true },
      { id: 15, name: 'Volvo L120H Wheel Loader', isActive: true }
    ];
  }

  loadData() {
    // Client-side pagination over mock data (ready for API substitution once backend is ready)
    this.totalRecords = this.models.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.tableSize));

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const startIndex = (this.page - 1) * this.tableSize;
    const endIndex = startIndex + this.tableSize;
    this.paginatedModels = this.models.slice(startIndex, endIndex);

    this.generatePagination();
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
      name: '',
      isActive: true
    });
    this.isModalOpen = true;
  }

  openEditModal(model: EquipmentModel) {
    this.isEditMode = true;
    this.selectedModelId = model.id;
    this.modelForm.patchValue({
      name: model.name,
      isActive: model.isActive
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
      const index = this.models.findIndex(m => m.id === this.selectedModelId);
      if (index !== -1) {
        this.models[index] = {
          ...this.models[index],
          name: formValue.name
        };
      }
      this.notificationService.show('Model updated successfully', 'success', 3000);
      this.closeModal();
      this.loadData();
    } else {
      const newModel: EquipmentModel = {
        id: Date.now(),
        name: formValue.name,
        isActive: true
      };
      this.models.unshift(newModel);
      this.notificationService.show('Model created successfully', 'success', 3000);
      this.closeModal();
      this.page = 1;
      this.loadData();
    }
  }

  toggleActiveStatus(model: EquipmentModel) {
    const index = this.models.findIndex(m => m.id === model.id);
    if (index !== -1) {
      this.models[index].isActive = !this.models[index].isActive;
      const statusText = this.models[index].isActive ? 'activated' : 'deactivated';
      this.notificationService.show(`Model ${statusText} successfully`, 'success', 3000);
      this.loadData();
    }
  }
}
