import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-vehicles',
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
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent {
  activeTab: 'vehicles' | 'body-types' = 'vehicles';
  
  showEntries: number = 10;
  searchText: string = '';
  pVehicles: number = 1;
  pBodyTypes: number = 1;

  createVehicleOpen: boolean = false;
  updateVehicleOpen: boolean = false;
  createBodyTypeOpen: boolean = false;
  updateBodyTypeOpen: boolean = false;

  currentVehicle: any = null;
  currentBodyType: any = null;

  displayedVehicleColumns: string[] = ['id', 'vehicleNo', 'modelName', 'registrationDate', 'mileage', 'status', 'action'];
  dataSourceVehicle = [
    { id: 1, vehicleNo: 'HETAUDA YARD DRUM', modelName: 'NEPAL DRUM', registrationDate: '01 Apr 2026', mileage: '0.00 liter/Hr', status: true },
    { id: 2, vehicleNo: 'RJ07 LS 4606 (ANKIT BKN)', modelName: 'SCOOTY', registrationDate: '23 May 2026', mileage: '0.00 kmpl', status: true },
    { id: 3, vehicleNo: 'RJ07 VS 1601 (SHYAM SIR)', modelName: 'BIKE', registrationDate: '13 May 2026', mileage: '27.09 kmpl', status: true },
    { id: 4, vehicleNo: 'TUNDI DRUM (NARAYAN GHAT)', modelName: 'NEPAL DRUM', registrationDate: '01 May 2026', mileage: '0.00 liter/Hr', status: true },
    { id: 5, vehicleNo: 'PYUTHAN DRUM', modelName: 'NEPAL DRUM', registrationDate: '01 May 2026', mileage: '00.00 liter/Hr', status: true },
    { id: 6, vehicleNo: 'DOODH KOSI DRUM', modelName: 'NEPAL DRUM', registrationDate: '01 May 2026', mileage: '00.00 liter/Hr', status: true },
    { id: 7, vehicleNo: '6125 TRACTOR (NEPAL)', modelName: 'TRACTOR', registrationDate: '05 May 2026', mileage: '4.00 liter/Hr', status: true },
    { id: 8, vehicleNo: 'OLD WATER TANKER', modelName: 'WATER TANKER', registrationDate: '05 May 2026', mileage: '0.00 kmpl', status: true },
  ];

  displayedBodyTypeColumns: string[] = ['id', 'bodyType', 'status', 'action'];
  dataSourceBodyType = [
    { id: 1, bodyType: 'SINGLE BODY', status: true },
  ];

  bodyTypes = ['SINGLE BODY'];
  manufacturers = ['ACE', 'AJAX', 'ASHOK LEYLAND', 'BAJAJ', 'BHARATBENZ', 'BLB HRG JV'];
  models = ['NEPAL DRUM', 'SCOOTY', 'BIKE', 'TRACTOR', 'WATER TANKER'];
  colors = ['Red', 'White', 'Black', 'Blue'];
  conditions = ['Good', 'Average', 'Poor'];

  setTab(tab: 'vehicles' | 'body-types') {
    this.activeTab = tab;
  }

  openAddVehicleModal() {
    this.createVehicleOpen = true;
  }

  openEditVehicleModal(vehicle: any) {
    this.currentVehicle = vehicle;
    this.updateVehicleOpen = true;
  }

  openAddBodyTypeModal() {
    this.createBodyTypeOpen = true;
  }

  openEditBodyTypeModal(bodyType: any) {
    this.currentBodyType = bodyType;
    this.updateBodyTypeOpen = true;
  }

  closeModal() {
    this.createVehicleOpen = false;
    this.updateVehicleOpen = false;
    this.createBodyTypeOpen = false;
    this.updateBodyTypeOpen = false;
    this.currentVehicle = null;
    this.currentBodyType = null;
  }

  toggleStatus(element: any) {
    element.status = !element.status;
  }
}


