import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

export interface FuelManagement {
  id: number;
  vehicle: string;
  warehouse: string;
  driver: string;
  fuelType: string;
  quantity: string;
  amount: string;
  date: string;
  addedBy: string;
  status: boolean;
}

const ELEMENT_DATA: FuelManagement[] = [
  { id: 1, vehicle: 'BA PRA 01 031 CH 8244 NEPAL', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '20.00', amount: '2000.00', date: '27 May 2026', addedBy: 'Admin', status: true },
  { id: 2, vehicle: 'MOTIDAN CO. DRUM', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '620.00', amount: '62000.00', date: '27 May 2026', addedBy: 'Admin', status: true },
  { id: 3, vehicle: 'MOTIDAN CO. DRUM', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '36.00', amount: '3600.00', date: '27 May 2026', addedBy: 'Admin', status: true },
  { id: 4, vehicle: 'BA PRA 01 029 CH 9253 NEPAL', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '36.00', amount: '3600.00', date: '27 May 2026', addedBy: 'Admin', status: true },
  { id: 5, vehicle: 'MOTIDAN CO. DRUM', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '400.00', amount: '40000.00', date: '26 May 2026', addedBy: 'Admin', status: true },
  { id: 6, vehicle: 'RIG-8', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '400.00', amount: '40000.00', date: '26 May 2026', addedBy: 'Admin', status: true },
  { id: 7, vehicle: 'MOTIDAN CO. DRUM', warehouse: '-', driver: '-', fuelType: 'Diesel', quantity: '812.00', amount: '81200.00', date: '26 May 2026', addedBy: 'Admin', status: true },
];

@Component({
  selector: 'app-fuel-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxPaginationModule
  ],
  templateUrl: './fuel-management.component.html',
  styleUrl: './fuel-management.component.scss'
})
export class FuelManagementComponent {
  displayedColumns: string[] = ['id', 'vehicle', 'driver', 'fuelType', 'quantity', 'amount', 'date', 'addedBy', 'status', 'action'];
  dataSource = ELEMENT_DATA;
  showEntries: number = 10;
  searchText: string = '';
  p: number = 1;
  
  createFuelOpen: boolean = false;
  updateFuelOpen: boolean = false;
  viewFuelOpen: boolean = false;
  currentFuel: FuelManagement | null = null;
  selectedViewFuel: FuelManagement | null = null;
  
  vehicles = ['BA PRA 01 031 CH 8244 NEPAL', 'MOTIDAN CO. DRUM', 'RIG-8'];
  stations = ['RAJIB PETROLEUM AGENCY', 'RM SAHA'];

  constructor() {}

  openAddModal() {
    this.createFuelOpen = true;
  }

  openEditModal(element: FuelManagement) {
    this.currentFuel = element;
    this.updateFuelOpen = true;
  }

  openViewModal(element: FuelManagement) {
    this.selectedViewFuel = element;
    this.viewFuelOpen = true;
  }

  closeModal() {
    this.createFuelOpen = false;
    this.updateFuelOpen = false;
    this.viewFuelOpen = false;
    this.selectedViewFuel = null;
  }

  toggleStatus(element: FuelManagement) {
    element.status = !element.status;
  }
}

