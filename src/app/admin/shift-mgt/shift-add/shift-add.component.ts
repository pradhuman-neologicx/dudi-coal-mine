import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-shift-add',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './shift-add.component.html',
  styleUrls: ['./shift-add.component.scss']
})
export class ShiftAddComponent implements OnInit {
  isEditMode = false;

  // Form Model
  shiftForm = {
    planningDate: '',
    shift: 'B',
    location: 'Block-04 West / Bench-120',
    targetBcm: 45000,
    supervisor: 'S. Rajesh Kumar',
    siteIncharge: 'A. Michael Thompson'
  };

  // Equipment Allocation
  equipments = [
    {
      id: 'EXC-101',
      status: 'OPTIMAL',
      assignedDumpers: ['DMP-01', 'DMP-02', 'DMP-03'],
      estProd: '1,200/hr',
      variance: '+4%'
    },
    {
      id: 'EXC-102',
      status: 'UNDER-ALLOCATED',
      assignedDumpers: ['DMP-04', 'DMP-05'],
      estProd: '850/hr',
      variance: '-12%'
    }
  ];

  // Employee Deployment
  employees = [
    { name: 'Arjun Singh', designation: 'Operator (HEMM)', machine: 'EXC-101', status: 'AVAILABLE', selected: false },
    { name: 'David Richards', designation: 'Driver (Dumper)', machine: 'DMP-01', status: 'ASSIGNED', selected: true },
    { name: 'Maria Gonzales', designation: 'Helper', machine: 'Support Team A', status: 'ON BREAK', selected: false },
    { name: 'Kevin Chen', designation: 'Operator (HEMM)', machine: 'EXC-102', status: 'AVAILABLE', selected: false }
  ];

  // Modal State
  showAddMachineryModal = false;
  newMachine = { type: '', id: '' };
  // Modal Form Model
  excavatorProd = {
    bucketCount: 142,
    totalBcm: 2840,
    haulUnitCount: 24,
    remarks: ''
  };

  dumperPerf = [
    { id: 'DMP-104', trips: 8, bcm: 960 },
    { id: 'DMP-089', trips: 7, bcm: 840 },
    { id: 'DMP-112', trips: 9, bcm: 1040 }
  ];

  // Employee Modal State
  showAddEmployeeModal = false;
  newEmployee = { shift: '', employeeId: '' };

  availableEmployees = [
    { id: 'John Doe', name: 'John Doe', designation: 'Operator (HEMM)' },
    { id: 'Jane Smith', name: 'Jane Smith', designation: 'Driver (Dumper)' },
    { id: 'Amit Kumar', name: 'Amit Kumar', designation: 'Helper' },
    { id: 'Priya Sharma', name: 'Priya Sharma', designation: 'Supervisor' }
  ];

  // Pagination State
  currentPage = 1;
  totalPages = 32; // 128 total employees, 4 per page

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      // Pretend to fetch data using ID here.
      this.shiftForm.planningDate = '2023-10-24';
    } else {
      // Set default for 'Add'
      const today = new Date();
      this.shiftForm.planningDate = today.toISOString().split('T')[0];
    }
  }

  setShift(s: string) {
    this.shiftForm.shift = s;
  }

  targetEquipment: any = null;

  addDumper(eq: any) {
    this.newMachine.type = 'Dumper';
    this.newMachine.id = '';
    this.targetEquipment = eq;
    this.showAddMachineryModal = true;
    document.body.style.overflow = 'hidden';
  }

  allocateNewUnit() {
    this.newMachine.type = 'Excavator';
    this.newMachine.id = '';
    this.targetEquipment = null;
    this.showAddMachineryModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddMachineryModal() {
    this.showAddMachineryModal = false;
    this.newMachine = { type: '', id: '' };
    document.body.style.overflow = '';
  }

  addMachineToShift() {
    if (this.newMachine.id) {
      if (this.targetEquipment) {
        // Adding a Dumper to an existing equipment
        this.targetEquipment.assignedDumpers.push(this.newMachine.id);
      } else {
        // Adding a new primary equipment
        this.equipments.push({
          id: this.newMachine.id,
          status: 'OPTIMAL',
          assignedDumpers: [],
          estProd: '1,000/hr',
          variance: '0%'
        });
      }
    }
    this.closeAddMachineryModal();
  }

  searchAssets() {
    alert('Search Assets feature will open a modal or drawer.');
  }

  openAddEmployeeModal() {
    this.newEmployee = { shift: this.shiftForm.shift, employeeId: '' };
    this.showAddEmployeeModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddEmployeeModal() {
    this.showAddEmployeeModal = false;
    document.body.style.overflow = '';
  }

  addEmployeeToShift() {
    if (this.newEmployee.employeeId) {
      const selectedEmp = this.availableEmployees.find(e => e.id === this.newEmployee.employeeId);
      if (selectedEmp) {
        this.employees.unshift({
          name: selectedEmp.name,
          designation: selectedEmp.designation,
          machine: 'Unassigned',
          status: 'AVAILABLE',
          selected: false
        });
      }
    }
    this.closeAddEmployeeModal();
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goBack() {
    this.router.navigate(['/admin/shift-mgt']);
  }

  saveDraft() {
    console.log('Saved draft', this.shiftForm);
  }

  publishShift() {
    console.log('Published', this.shiftForm);
    this.router.navigate(['/admin/shift-mgt']);
  }
}
