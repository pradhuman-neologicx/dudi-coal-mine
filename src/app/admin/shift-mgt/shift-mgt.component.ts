import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-shift-mgt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './shift-mgt.component.html',
  styleUrls: ['./shift-mgt.component.scss']
})
export class ShiftMgtComponent implements OnInit {
  filterLocations = [
    'Block-04 West / Bench-120',
    'Block-02 North / Bench-140',
    'Block-05 East / Bench-105'
  ];
  selectedLocation: string | null = null;

  filterSupervisors = [
    'S. Rajesh Kumar',
    'A. Thompson',
    'M. Richards'
  ];
  selectedSupervisor: string | null = null;

  shiftClosure = {
    attendanceSubmitted: false,
    fuelLogsAvailable: false,
    delayLogsUpdated: false,
    breakdownLogsUpdated: false,
    productionDataAvailable: false,
    safetyDataReviewed: false,
    shiftRemarks: '',
    handoverNotes: ''
  };

  shifts = [
    {
      date: 'Oct 24, 2023',
      shiftCode: 'B',
      location: 'Block-04 West / Bench-120',
      supervisor: 'S. Rajesh Kumar',
      targetBCM: 45000,
      actualBCM: 42200,
      status: 'IN-PROGRESS'
    },
    {
      date: 'Oct 24, 2023',
      shiftCode: 'A',
      location: 'Block-02 North / Bench-140',
      supervisor: 'A. Thompson',
      targetBCM: 38000,
      actualBCM: 38500,
      status: 'COMPLETED'
    },
    {
      date: 'Oct 25, 2023',
      shiftCode: 'C',
      location: 'Block-05 East / Bench-105',
      supervisor: 'M. Richards',
      targetBCM: 42000,
      actualBCM: 0,
      status: 'PLANNED'
    }
  ];

  selectedShift: any = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  getPercentage(actual: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  }

  openViewModal(shift: any) {
    this.router.navigate(['/admin/shift-mgt/summary', shift.shiftCode]);
  }

  closeViewModal() {
    this.selectedShift = null;
    document.body.style.overflow = '';
  }

  showCloseModal = false;

  openCloseModal() {
    this.showCloseModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCloseModal() {
    this.showCloseModal = false;
    document.body.style.overflow = '';
  }

  addShift() {
    this.router.navigate(['/admin/shift-mgt/add']);
  }

  editShift(id: string) {
    this.router.navigate(['/admin/shift-mgt/edit', id]);
  }
}
