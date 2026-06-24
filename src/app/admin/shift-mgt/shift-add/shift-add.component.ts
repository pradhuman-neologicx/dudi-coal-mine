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
    supervisorId: 47,
    siteInchargeId: 23
  };

  supervisors = [
    { id: 45, name: 'Ramesh Kumar', code: 'EMP-0045' },
    { id: 46, name: 'Vikram Singh', code: 'EMP-0046' },
    { id: 47, name: 'S. Rajesh Kumar', code: 'EMP-0047' }
  ];

  siteIncharges = [
    { id: 22, name: 'Suresh Yadav', code: 'EMP-0022' },
    { id: 23, name: 'A. Michael Thompson', code: 'EMP-0023' }
  ];

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
    { name: 'Arjun Singh', designation: 'Operator (HEMM)', machine: 'EXC-101', status: 'AVAILABLE', selected: false, isBorrowed: false },
    { name: 'David Richards', designation: 'Driver (Dumper)', machine: 'DMP-01', status: 'ASSIGNED', selected: true, isBorrowed: false },
    { name: 'Maria Gonzales', designation: 'Helper', machine: 'Support Team A', status: 'ON BREAK', selected: false, isBorrowed: true },
    { name: 'Kevin Chen', designation: 'Operator (HEMM)', machine: 'EXC-102', status: 'AVAILABLE', selected: false, isBorrowed: false }
  ];

  originalEmployees: any[] = [];
  searchQuery = '';
  isSearchActive = false;

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
  showEditEmployeeModal = false;
  newEmployee = { shift: '', employeeId: '', machineAssigned: '', isBorrowed: false, borrowReason: '' };
  editEmployeeData: any = null;

  availableEmployees = [
    { id: '101', code: 'EMP-101', name: 'John Doe', designation: 'Operator (HEMM)', homeRelay: 'Relay_1', availability: 'Available' },
    { id: '102', code: 'EMP-102', name: 'Jane Smith', designation: 'Driver (Dumper)', homeRelay: 'Relay_2', availability: 'Leave' },
    { id: '103', code: 'EMP-103', name: 'Amit Kumar', designation: 'Helper', homeRelay: 'Relay_3', availability: 'Assigned To Another Shift' },
    { id: '104', code: 'EMP-104', name: 'Priya Sharma', designation: 'Supervisor', homeRelay: 'Relay_1', availability: 'Available' }
  ];

  // Pagination State
  currentPage = 1;
  totalPages = 32; // 128 total employees, 4 per page

  // Toast State
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.originalEmployees = [...this.employees];
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

  removeDumper(eq: any, dumper: string) {
    eq.assignedDumpers = eq.assignedDumpers.filter((d: string) => d !== dumper);
  }

  removeEquipment(eq: any) {
    this.equipments = this.equipments.filter(e => e !== eq);
  }

  searchAssets() {
    alert('Search Assets feature will open a modal or drawer.');
  }

  openAddEmployeeModal() {
    this.newEmployee = { shift: this.shiftForm.shift, employeeId: '', machineAssigned: '', isBorrowed: false, borrowReason: '' };
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
        const newEmp = {
          name: selectedEmp.name,
          designation: selectedEmp.designation,
          machine: this.newEmployee.machineAssigned || 'Unassigned',
          status: this.newEmployee.machineAssigned ? 'ASSIGNED' : 'AVAILABLE',
          selected: false,
          isBorrowed: this.newEmployee.isBorrowed
        };
        this.originalEmployees.unshift(newEmp);
        if (!this.isSearchActive) {
          this.employees.unshift(newEmp);
        } else {
          this.applySearch();
        }
      }
    }
    this.closeAddEmployeeModal();
  }

  editEmployee(emp: any) {
    this.editEmployeeData = { ...emp, machineAssigned: emp.machine === 'Unassigned' ? '' : emp.machine };
    this.showEditEmployeeModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditEmployeeModal() {
    this.showEditEmployeeModal = false;
    this.editEmployeeData = null;
    document.body.style.overflow = '';
  }

  saveEmployeeEdit() {
    if (this.editEmployeeData) {
      const origIndex = this.originalEmployees.findIndex(e => e.name === this.editEmployeeData.name);
      if (origIndex !== -1) {
        this.originalEmployees[origIndex].machine = this.editEmployeeData.machineAssigned || 'Unassigned';
        this.originalEmployees[origIndex].status = this.editEmployeeData.machineAssigned ? 'ASSIGNED' : 'AVAILABLE';
      }
      const index = this.employees.findIndex(e => e.name === this.editEmployeeData.name);
      if (index !== -1) {
        this.employees[index].machine = this.editEmployeeData.machineAssigned || 'Unassigned';
        this.employees[index].status = this.editEmployeeData.machineAssigned ? 'ASSIGNED' : 'AVAILABLE';
      }
    }
    this.closeEditEmployeeModal();
  }

  removeEmployee(emp: any) {
    this.originalEmployees = this.originalEmployees.filter(e => e !== emp);
    this.employees = this.employees.filter(e => e !== emp);
  }

  applySearch() {
    if (!this.searchQuery.trim()) {
      this.resetSearch();
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.employees = this.originalEmployees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.designation.toLowerCase().includes(q) || 
      e.machine.toLowerCase().includes(q)
    );
    this.isSearchActive = true;
  }

  resetSearch() {
    this.searchQuery = '';
    this.employees = [...this.originalEmployees];
    this.isSearchActive = false;
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

  showNotification(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }

  savePlan() {
    if (!this.shiftForm.planningDate || !this.shiftForm.targetBcm || !this.shiftForm.supervisorId || !this.shiftForm.siteInchargeId) {
      this.showNotification('Please fill in all mandatory fields before saving the plan.', 'error');
      return;
    }
    this.showNotification('Shift Plan Saved Successfully! Now you can allocate equipment and employees.', 'success');
  }

  publishShift() {
    console.log('Published', this.shiftForm);
    this.router.navigate(['/admin/shift-mgt']);
  }
}
