import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

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
export class EquipmentMasterComponent implements OnInit {
  categories: EquipmentCategory[] = [];
  
  isModalOpen = false;
  isEditMode = false;
  categoryForm!: FormGroup;
  selectedCategoryId: number | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      isActive: [true]
    });
    this.loadMockData();
  }

  loadMockData() {
    this.categories = [
      { id: 1, name: 'Excavators', isActive: true },
      { id: 2, name: 'Dumpers', isActive: true },
      { id: 3, name: 'Loaders', isActive: false },
      { id: 4, name: 'Drilling Machines', isActive: true },
      { id: 5, name: 'Cranes', isActive: true },
    ];
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

    if (this.isEditMode && this.selectedCategoryId !== null) {
      const index = this.categories.findIndex(c => c.id === this.selectedCategoryId);
      if (index > -1) {
        this.categories[index] = { ...this.categories[index], ...formValue };
      }
    } else {
      const newId = this.categories.length > 0 ? Math.max(...this.categories.map(c => c.id)) + 1 : 1;
      this.categories.push({
        id: newId,
        ...formValue
      });
    }

    this.closeModal();
  }

  toggleActiveStatus(category: EquipmentCategory) {
    category.isActive = !category.isActive;
  }
}
