import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

export interface VehicleManufacturer {
  id: number;
  manufacturerName: string;
  sortName: string;
  status: boolean;
}

export interface VehicleModel {
  id: number;
  modelName: string;
  manufacturerName: string;
  fuelType: string;
  status: boolean;
}

const MANUFACTURER_DATA: VehicleManufacturer[] = [
  { id: 1, manufacturerName: 'ACE', sortName: 'ACE', status: true },
  { id: 2, manufacturerName: 'AJAX', sortName: 'AJAX', status: true },
  { id: 3, manufacturerName: 'ASHOK LEYLAND', sortName: 'AL', status: true },
  { id: 4, manufacturerName: 'BAJAJ', sortName: 'BAJAJ', status: true },
  { id: 5, manufacturerName: 'BHARATBENZ', sortName: 'B B', status: true },
  { id: 6, manufacturerName: 'BLB HRG JV', sortName: 'BLB HRG JV', status: true },
  { id: 7, manufacturerName: 'BLB HRG JV', sortName: 'BL', status: true },
  { id: 8, manufacturerName: 'CATERPILLAR', sortName: 'CAT', status: true },
];

const MODEL_DATA: VehicleModel[] = [
  { id: 1, modelName: '110 DREAM DELUXE', manufacturerName: 'HONDA', fuelType: 'Petrol', status: true },
  { id: 2, modelName: '1815 TRUCK', manufacturerName: 'AL', fuelType: 'Diesel', status: true },
  { id: 3, modelName: '1920 TRUCK', manufacturerName: 'AL', fuelType: 'Diesel', status: true },
  { id: 4, modelName: '2826C DUMPER', manufacturerName: 'B B', fuelType: 'Diesel', status: true },
  { id: 5, modelName: '3DX PLUS BACKHOE LOADER', manufacturerName: 'JCB', fuelType: 'Diesel', status: true },
  { id: 6, modelName: '890-XL', manufacturerName: 'HD', fuelType: 'Petrol', status: true },
  { id: 7, modelName: 'ACTIVA 125', manufacturerName: 'HONDA', fuelType: 'Petrol', status: true },
  { id: 8, modelName: 'ACTIVA 3G', manufacturerName: 'HONDA', fuelType: 'Petrol', status: true },
];

@Component({
  selector: 'app-vehicle-master',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxPaginationModule
  ],
  templateUrl: './vehicle-master.component.html',
  styleUrl: './vehicle-master.component.scss'
})
export class VehicleMasterComponent {
  activeTab: 'manufacturer' | 'model' = 'manufacturer';
  
  displayedManufacturerColumns: string[] = ['id', 'manufacturerName', 'sortName', 'status', 'action'];
  dataSourceManufacturer = MANUFACTURER_DATA;
  
  displayedModelColumns: string[] = ['id', 'modelName', 'manufacturerName', 'fuelType', 'status', 'action'];
  dataSourceModel = MODEL_DATA;

  showEntries: number = 10;
  searchText: string = '';
  pManufacturer: number = 1;
  pModel: number = 1;

  createManufacturerOpen: boolean = false;
  createModelOpen: boolean = false;
  
  manufacturers = ['ACE', 'AJAX', 'ASHOK LEYLAND', 'BAJAJ', 'BHARATBENZ', 'BLB HRG JV', 'CATERPILLAR', 'HONDA', 'JCB', 'HD'];
  tyreTypes = ['Radial', 'Bias'];
  fuelTypes = ['Petrol', 'Diesel', 'Electric', 'CNG'];

  isEditManufacturer: boolean = false;
  selectedManufacturerId: number | null = null;
  manufacturerName: string = '';
  manufacturerSortName: string = '';

  isEditModel: boolean = false;
  selectedModelId: number | null = null;
  modelName: string = '';
  modelManufacturer: string | null = null;
  modelBatteries: number | null = null;
  modelTyres: number | null = null;
  modelTyreType: string | null = null;
  modelFuelType: string | null = null;

  constructor() {}

  setTab(tab: 'manufacturer' | 'model') {
    this.activeTab = tab;
  }

  openAddManufacturerModal() {
    this.isEditManufacturer = false;
    this.selectedManufacturerId = null;
    this.manufacturerName = '';
    this.manufacturerSortName = '';
    this.createManufacturerOpen = true;
  }

  openEditManufacturerModal(manufacturer: VehicleManufacturer) {
    this.isEditManufacturer = true;
    this.selectedManufacturerId = manufacturer.id;
    this.manufacturerName = manufacturer.manufacturerName;
    this.manufacturerSortName = manufacturer.sortName;
    this.createManufacturerOpen = true;
  }

  saveManufacturer() {
    if (this.isEditManufacturer) {
      const index = this.dataSourceManufacturer.findIndex(m => m.id === this.selectedManufacturerId);
      if (index !== -1) {
        this.dataSourceManufacturer[index].manufacturerName = this.manufacturerName;
        this.dataSourceManufacturer[index].sortName = this.manufacturerSortName;
      }
    } else {
      const newId = this.dataSourceManufacturer.length > 0 ? Math.max(...this.dataSourceManufacturer.map(m => m.id)) + 1 : 1;
      this.dataSourceManufacturer = [
        ...this.dataSourceManufacturer,
        {
          id: newId,
          manufacturerName: this.manufacturerName,
          sortName: this.manufacturerSortName,
          status: true
        }
      ];
    }
    this.closeModal();
  }

  openAddModelModal() {
    this.isEditModel = false;
    this.selectedModelId = null;
    this.modelName = '';
    this.modelManufacturer = null;
    this.modelBatteries = null;
    this.modelTyres = null;
    this.modelTyreType = null;
    this.modelFuelType = null;
    this.createModelOpen = true;
  }

  openEditModelModal(model: VehicleModel) {
    this.isEditModel = true;
    this.selectedModelId = model.id;
    this.modelName = model.modelName;
    this.modelManufacturer = model.manufacturerName;
    this.modelFuelType = model.fuelType;
    this.modelBatteries = null;
    this.modelTyres = null;
    this.modelTyreType = null;
    this.createModelOpen = true;
  }

  saveModel() {
    if (this.isEditModel) {
      const index = this.dataSourceModel.findIndex(m => m.id === this.selectedModelId);
      if (index !== -1) {
        this.dataSourceModel[index].modelName = this.modelName;
        this.dataSourceModel[index].manufacturerName = this.modelManufacturer || '';
        this.dataSourceModel[index].fuelType = this.modelFuelType || '';
      }
    } else {
      const newId = this.dataSourceModel.length > 0 ? Math.max(...this.dataSourceModel.map(m => m.id)) + 1 : 1;
      this.dataSourceModel = [
        ...this.dataSourceModel,
        {
          id: newId,
          modelName: this.modelName,
          manufacturerName: this.modelManufacturer || '',
          fuelType: this.modelFuelType || '',
          status: true
        }
      ];
    }
    this.closeModal();
  }

  closeModal() {
    this.createManufacturerOpen = false;
    this.createModelOpen = false;
    
    this.isEditManufacturer = false;
    this.selectedManufacturerId = null;
    this.manufacturerName = '';
    this.manufacturerSortName = '';

    this.isEditModel = false;
    this.selectedModelId = null;
    this.modelName = '';
    this.modelManufacturer = null;
    this.modelBatteries = null;
    this.modelTyres = null;
    this.modelTyreType = null;
    this.modelFuelType = null;
  }

  toggleStatus(element: any) {
    element.status = !element.status;
  }
}

