import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule, NgSelectModule]
})
export class ReportComponent {
  fromDate = '';
  toDate = '';
  selectedMachine = null;
  selectedShift = null;

  machines = [
    { label: 'Select Machine Type', value: null },
    { label: 'Komatsu', value: 'Komatsu' },
    { label: 'CAT', value: 'CAT' }
  ];

  shifts = [
    { label: 'Select Shift', value: null },
    { label: 'Shift A', value: 'Shift A' },
    { label: 'Shift B', value: 'Shift B' },
    { label: 'Shift C', value: 'Shift C' }
  ];

  isReportGenerated = false;

  fuelData = [
    { machineId: 'EXC-201', machineDesc: 'Komatsu PC1250', date: '2024-05-12', shift: 'Shift B', opening: 1240, issued: 850, closing: 920, consumption: 1170, trend: 'up', fuelBcm: 0.92, efficiencyClass: 'bg-gray-100 text-gray-800' },
    { machineId: 'DT-104', machineDesc: 'CAT 777E', date: '2024-05-12', shift: 'Shift A', opening: 450, issued: 400, closing: 380, consumption: 470, trend: 'down', fuelBcm: 0.85, efficiencyClass: 'bg-green-100 text-green-700' },
    { machineId: 'DOZ-003', machineDesc: 'CAT D11', date: '2024-05-11', shift: 'Shift C', opening: 1800, issued: 600, closing: 1550, consumption: 850, trend: 'down', fuelBcm: 0.42, efficiencyClass: 'bg-gray-100 text-gray-800' },
    { machineId: 'DT-105', machineDesc: 'CAT 777E', date: '2024-05-10', shift: 'Shift B', opening: 320, issued: 500, closing: 290, consumption: 530, trend: 'up', fuelBcm: 1.12, efficiencyClass: 'bg-red-100 text-red-700' },
    { machineId: 'GRD-012', machineDesc: 'Komatsu GD825', date: '2024-05-09', shift: 'Shift A', opening: 210, issued: 150, closing: 240, consumption: 120, trend: 'neutral', fuelBcm: 0.76, efficiencyClass: 'bg-gray-100 text-gray-800' }
  ];

  filteredFuelData: any[] = [];

  generateReport() {
    this.isReportGenerated = true;
    
    this.filteredFuelData = this.fuelData.filter(item => {
      let matchMachine = this.selectedMachine ? item.machineDesc.includes(this.selectedMachine) : true;
      let matchShift = this.selectedShift ? item.shift === this.selectedShift : true;
      let matchDate = true;
      
      if (this.fromDate && this.toDate) {
        let itemDate = new Date(item.date);
        let start = new Date(this.fromDate);
        let end = new Date(this.toDate);
        end.setHours(23, 59, 59, 999);
        matchDate = itemDate >= start && itemDate <= end;
      }
      
      return matchMachine && matchShift && matchDate;
    });
  }
}
