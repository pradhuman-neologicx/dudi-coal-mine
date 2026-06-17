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
  selectedShift = null;
  selectedCategory = null;
  selectedPriority = null;

  shifts = [
    { label: 'Select Shift', value: null },
    { label: 'A (Day)', value: 'A (Day)' },
    { label: 'B (Night)', value: 'B (Night)' },
    { label: 'C (Swing)', value: 'C (Swing)' }
  ];

  categories = [
    { label: 'Select Category', value: null },
    { label: 'Hydraulic', value: 'HYDRAULIC' },
    { label: 'Mechanical', value: 'MECHANICAL' },
    { label: 'Electrical', value: 'ELECTRICAL' }
  ];

  priorities = [
    { label: 'Select Priority', value: null },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' }
  ];

  isReportGenerated = false;

  allTickets = [
    {
      ticketNo: '#BKD-2023-081',
      machineId: 'EXC-105',
      breakdownTime: '2023-10-24 08:30',
      category: 'HYDRAULIC',
      priority: 'CRITICAL',
      status: 'OPEN',
      shift: 'A (Day)'
    },
    {
      ticketNo: '#BKD-2023-079',
      machineId: 'DMP-012',
      breakdownTime: '2023-10-24 06:15',
      category: 'MECHANICAL',
      priority: 'MEDIUM',
      status: 'IN PROGRESS',
      shift: 'B (Night)'
    },
    {
      ticketNo: '#BKD-2023-075',
      machineId: 'DZR-044',
      breakdownTime: '2023-10-23 23:45',
      category: 'ELECTRICAL',
      priority: 'HIGH',
      status: 'CLOSED',
      shift: 'C (Swing)'
    }
  ];

  filteredTickets: any[] = [];

  generateReport() {
    this.isReportGenerated = true;
    
    // Filter logic
    this.filteredTickets = this.allTickets.filter(t => {
      let matchShift = this.selectedShift ? t.shift === this.selectedShift : true;
      let matchCat = this.selectedCategory ? t.category === this.selectedCategory : true;
      let matchPri = this.selectedPriority ? t.priority === this.selectedPriority : true;
      let matchDate = true;
      
      if (this.fromDate && this.toDate) {
        let ticketDate = new Date(t.breakdownTime);
        let start = new Date(this.fromDate);
        let end = new Date(this.toDate);
        end.setHours(23, 59, 59, 999);
        matchDate = ticketDate >= start && ticketDate <= end;
      }
      
      return matchShift && matchCat && matchPri && matchDate;
    });
  }

}
