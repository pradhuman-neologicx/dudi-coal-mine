import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './equipments.component.html',
  styleUrl: './equipments.component.scss'
})
export class EquipmentsComponent implements OnInit {
  equipments: Equipment[] = [];
  filteredEquipments: Equipment[] = [];
  categories: {id: number, name: string}[] = [];

  // Pagination
  page: number = 1;
  tableSize: number = 10;
  totalRecords: number = 0;
  tableSizes: any = [10, 25, 50, 'all'];

  // Filters
  filterSearch: string = '';
  filterCategory: string = '';

  // Modal
  isModalOpen = false;
  isEditMode = false;
  equipmentForm!: FormGroup;
  selectedEquipmentId: number | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.equipmentForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      isActive: [true]
    });
    this.loadMockData();
  }

  loadMockData() {
    this.categories = [
      { id: 1, name: 'Excavators' },
      { id: 2, name: 'Dumpers' },
      { id: 3, name: 'Loaders' },
      { id: 4, name: 'Drilling Machines' },
      { id: 5, name: 'Cranes' },
    ];

    this.equipments = [
      { id: 1, name: 'Excavator EX-100', categoryId: 1, categoryName: 'Excavators', isActive: true },
      { id: 2, name: 'Dumper DP-200', categoryId: 2, categoryName: 'Dumpers', isActive: true },
      { id: 3, name: 'Loader LD-50', categoryId: 3, categoryName: 'Loaders', isActive: false },
      { id: 4, name: 'Driller DR-X', categoryId: 4, categoryName: 'Drilling Machines', isActive: true },
      { id: 5, name: 'Crane CR-300', categoryId: 5, categoryName: 'Cranes', isActive: true },
      { id: 6, name: 'Excavator EX-150', categoryId: 1, categoryName: 'Excavators', isActive: true },
      { id: 7, name: 'Dumper DP-250', categoryId: 2, categoryName: 'Dumpers', isActive: true },
    ];
    this.onFilterChange();
  }

  onFilterChange() {
    this.filteredEquipments = this.equipments.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(this.filterSearch.toLowerCase());
      const matchCategory = this.filterCategory ? e.categoryId.toString() === this.filterCategory : true;
      return matchSearch && matchCategory;
    });
    this.totalRecords = this.filteredEquipments.length;
    this.page = 1; // Reset to first page
  }

  resetFilter() {
    this.filterSearch = '';
    this.filterCategory = '';
    this.onFilterChange();
  }

  onTableDataChange(event: any) {
    this.page = event;
  }

  onTableSizeChange(event: any) {
    this.tableSize = event.target.value === 'all' ? this.totalRecords : parseInt(event.target.value);
    this.page = 1;
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
    const cat = this.categories.find(c => c.id == formValue.categoryId);
    const categoryName = cat ? cat.name : '';

    if (this.isEditMode && this.selectedEquipmentId !== null) {
      const index = this.equipments.findIndex(e => e.id === this.selectedEquipmentId);
      if (index > -1) {
        this.equipments[index] = { ...this.equipments[index], ...formValue, categoryName: categoryName };
      }
    } else {
      const newId = this.equipments.length > 0 ? Math.max(...this.equipments.map(e => e.id)) + 1 : 1;
      this.equipments.push({
        id: newId,
        ...formValue,
        categoryName: categoryName
      });
    }

    this.onFilterChange();
    this.closeModal();
  }

  toggleActiveStatus(equipment: Equipment) {
    equipment.isActive = !equipment.isActive;
    // update filtered data if needed
  }
}
