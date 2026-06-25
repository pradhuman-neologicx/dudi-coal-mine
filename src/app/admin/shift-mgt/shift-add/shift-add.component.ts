import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ShiftPlanningService } from '../../../core/services/shift-planning.service';
import { NotificationService } from '../../../core/services/notificationnew.service';

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
  shiftPlanId: any = null; // Generated on Save Plan
  shiftForm = {
    planningDate: '',
    shiftId: null as any,
    locationId: null as any,
    targetBcm: 45000,
    supervisorId: null as any,
    siteInchargeId: null as any
  };

  shiftsList: any[] = [];
  locationsList: any[] = [];
  supervisors: any[] = [];
  siteIncharges: any[] = [];
  machineCategories: any[] = [];
  machineNames: any[] = [];

  // Equipment Allocation
  equipments: any[] = [];

  // Employee Deployment
  employees: any[] = [];
  originalEmployees: any[] = [];
  employeeStats = { planned: 0, present: 0, leave: 0, borrowed: 0 };
  searchQuery = '';
  isSearchActive = false;

  // Modal State
  showAddMachineryModal = false;
  newMachine = { categoryId: null as any, id: null as any };
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
  totalPages = 1;
  totalEmployees = 0;

  // Toast State
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Delete Employee state
  showDeleteEmployeeModal = false;
  employeeToDelete: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.originalEmployees = [...this.employees];
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.shiftPlanId = id;
      this.fetchShiftPlanData(id);
    } else {
      // Set default for 'Add'
      const today = new Date();
      this.shiftForm.planningDate = today.toISOString().split('T')[0];
    }

    this.loadDropdownData();
  }

  fetchShiftPlanData(id: string | number) {
    this.shiftPlanningService.getShiftPlanById(id).subscribe({
      next: (res: any) => {
        console.log('Shift Plan Data:', res);
        if (res.status === 200) {
          const data = res.data;
          this.shiftForm.planningDate = data.planning_date;
          this.shiftForm.shiftId = data.shift_id;
          this.shiftForm.locationId = data.site_id;
          this.shiftForm.targetBcm = data.target_bcm;
          this.shiftForm.supervisorId = data.supervisor_id;
          this.shiftForm.siteInchargeId = data.site_incharge_id;
          
          if (data.machinery_allocations && data.machinery_allocations.length > 0) {
            this.mapEquipments(data.machinery_allocations);
          }
          
          // Also load workforce relay for this shift plan
          this.loadWorkforceRelayData(id);
        }
      },
      error: (err: any) => {
        console.error('Error fetching shift plan:', err);
        this.notificationService.show('Failed to fetch shift plan details', 'error', 3000);
      }
    });
  }

  loadWorkforceRelayData(id: string | number) {
    this.shiftPlanningService.loadWorkforceRelay(id).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          const data = res.data || [];
          this.employees = data.map((emp: any) => ({
            id: emp.id,
            employeeId: emp.employee_id,
            name: emp.employee_name,
            code: emp.employee_code,
            designation: emp.designation,
            machine: emp.assigned_machine || 'None',
            status: emp.status,
            isBorrowed: emp.is_borrowed,
            shiftName: emp.shift_name,
            homeShiftName: emp.home_shift_name
          }));
          this.originalEmployees = [...this.employees];

          if (res.stats) {
            this.employeeStats = {
              planned: res.stats.planned || 0,
              present: res.stats.present || 0,
              leave: res.stats.leave || 0,
              borrowed: res.stats.borrowed || 0
            };
          }

          if (res.pagination) {
            this.currentPage = res.pagination.current_page;
            this.totalPages = res.pagination.last_page;
            this.totalEmployees = res.pagination.total;
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading workforce relay:', err);
      }
    });
  }

  mapEquipments(allocations: any[]) {
    this.equipments = allocations.map((alloc: any) => ({
      id: alloc.machine_number,
      equipment_id: alloc.machine_id,
      category_id: alloc.category_id,
      allocation_id: alloc.allocation_id,
      status: 'OPTIMAL', // Placeholder
      assignedDumpers: alloc.dumpers ? alloc.dumpers.map((d: any) => ({
        id: d.machine_number,
        equipment_id: d.machine_id,
        allocation_id: d.allocation_id
      })) : [],
      estProd: '1,000/hr',
      variance: '0%'
    }));
  }

  loadDropdownData() {
    this.shiftPlanningService.getShifts().subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.shiftsList = data.map((shift: any) => ({
        id: shift.shift_id || shift.id,
        name: shift.shift_name
      }));
    });

    this.shiftPlanningService.getSites().subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.locationsList = data;
    });

    this.shiftPlanningService.getEmployees('supervisor').subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.supervisors = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.name} (${emp.designation})`,
        code: emp.employee_code || emp.code || 'N/A'
      }));
    });

    this.shiftPlanningService.getEmployees('site-incharge').subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.siteIncharges = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.name} (${emp.designation})`,
        code: emp.employee_code || emp.code || 'N/A'
      }));
    });

    this.shiftPlanningService.getMachineCategories().subscribe((res: any) => {
      console.log('Categories API response:', res);
      const data = res.data?.data || res.data || [];
      this.machineCategories = data.map((item: any) => ({
        id: item.category_id || item.id,
        name: item.category_name || item.name || 'Unknown'
      }));
      console.log('Mapped categories:', this.machineCategories);
    });
  }

  onMachineCategoryChange() {
    console.log('Selected Category ID:', this.newMachine.categoryId);
    this.newMachine.id = null;
    this.machineNames = [];
    if (this.newMachine.categoryId) {
      this.shiftPlanningService.getMachineNames(this.newMachine.categoryId).subscribe((res: any) => {
        console.log('Machines API response:', res);
        const data = res.data?.data || res.data || [];
        this.machineNames = data.map((item: any) => ({
          id: item.id || item.equipment_id,
          name: item.equipment_name || item.machine_name || item.name || item.equipment_id || 'Unknown'
        }));
        console.log('Mapped machines:', this.machineNames);
      });
    }
  }

  setShift(s: string) {
    // This method is no longer needed if we use ng-select, but kept for compatibility if needed elsewhere
  }

  targetEquipment: any = null;

  addDumper(eq: any) {
    if (!this.shiftPlanId) {
      this.showNotification('Please save the shift plan first before adding machinery.', 'error');
      return;
    }
    // Determine categoryId for Dumper if needed, or leave blank and let user select.
    // For now we just reset the form.
    this.newMachine.categoryId = null;
    this.newMachine.id = null;
    this.machineNames = [];
    this.targetEquipment = eq;
    this.showAddMachineryModal = true;
    document.body.style.overflow = 'hidden';
  }

  allocateNewUnit() {
    if (!this.shiftPlanId) {
      this.showNotification('Please save the shift plan first before adding machinery.', 'error');
      return;
    }
    this.newMachine.categoryId = null;
    this.newMachine.id = null;
    this.machineNames = [];
    this.targetEquipment = null;
    this.showAddMachineryModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddMachineryModal() {
    this.showAddMachineryModal = false;
    this.newMachine = { categoryId: null, id: null };
    document.body.style.overflow = '';
  }

  addMachineToShift() {
    if (!this.newMachine.id) return;

    const formData = new FormData();
    formData.append('machine_id', String(this.newMachine.id));

    // As per backend quirk: parent_category_id is actually the machine_id of the parent machine
    if (this.targetEquipment) {
      formData.append('parent_category_id', String(this.targetEquipment.equipment_id || this.targetEquipment.id));
    }

    this.shiftPlanningService.assignEquipment(this.shiftPlanId, formData).subscribe({
      next: (res: any) => {
        if (res && (res.status === 409 || res.status === 422 || res.status === 400)) {
          this.showNotification(res.message || 'Error assigning equipment', 'error');
          return;
        }
        this.showNotification(res.message || 'Equipment assigned successfully', 'success');
        this.loadAssignedEquipment();
        this.closeAddMachineryModal();
      },
      error: (err: any) => {
        console.error('Error assigning equipment:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to assign equipment';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  removeDumper(eq: any, dumperId: string | number) {
    this.shiftPlanningService.removeAssignedEquipment(this.shiftPlanId, dumperId).subscribe({
      next: (res: any) => {
        this.showNotification(res.message, 'success');
        this.loadAssignedEquipment();
      },
      error: (err: any) => {
        console.error('Error removing dumper:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to remove dumper';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  removeEquipment(eq: any) {
    this.shiftPlanningService.removeAssignedEquipment(this.shiftPlanId, eq.allocation_id || eq.id).subscribe({
      next: (res: any) => {
        this.showNotification(res.message, 'success');
        this.loadAssignedEquipment();
      },
      error: (err: any) => {
        console.error('Error removing equipment:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to remove equipment';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  loadAssignedEquipment() {
    if (!this.shiftPlanId) return;
    // Assuming getAssignedEquipment returns the same machinery_allocations structure in data
    this.shiftPlanningService.getAssignedEquipment(this.shiftPlanId).subscribe({
      next: (res: any) => {
        console.log('Assigned Equipment Data:', res);
        if (res.status === 200) {
          this.mapEquipments(res.data?.machinery_allocations || res.data || []);
        }
      },
      error: (err: any) => {
        console.error('Error loading assigned equipment:', err);
      }
    });
  }

  searchAssets() {
    alert('Search Assets feature will open a modal or drawer.');
  }

  openAddEmployeeModal() {
    if (!this.shiftPlanId) {
      this.showNotification('Please save the shift plan first before adding employees.', 'error');
      return;
    }
    this.newEmployee = { shift: null as any, employeeId: '', machineAssigned: '', isBorrowed: false, borrowReason: '' };
    this.showAddEmployeeModal = true;
    document.body.style.overflow = 'hidden';
    this.onEmployeeShiftChange();
  }

  onEmployeeShiftChange() {
    console.log('onEmployeeShiftChange triggered', this.newEmployee.shift);
    console.log('Current shiftPlanId:', this.shiftPlanId);

    this.newEmployee.employeeId = '';
    this.availableEmployees = [];

    const planId = this.shiftPlanId;

    if (this.newEmployee.shift && planId) {
      console.log('Calling API with shiftPlanId:', planId, 'shift_id:', this.newEmployee.shift);
      this.shiftPlanningService.getAvailableEmployees(planId, this.newEmployee.shift).subscribe({
        next: (res: any) => {
          console.log('Employees API response:', res);
          if (res && res.status === 422) {
            this.showNotification(res.message || 'Error fetching employees', 'error');
            return;
          }
          const data = res.data?.data || res.data || [];
          this.availableEmployees = data.map((emp: any) => ({
            id: emp.employee_id || emp.id,
            name: emp.employee_name || emp.name || '',
            code: emp.employee_code || emp.code || 'N/A',
            designation: emp.designation || 'Worker',
            availability: emp.availability || 'Available',
            homeRelay: emp.homeRelay || 'Main Site'
          }));
        },
        error: (err: any) => {
          console.error('Error fetching employees:', err);
          const errorMsg = err?.error?.message || err?.message || 'Error fetching employees';
          this.showNotification(errorMsg, 'error');
        }
      });
    }
  }

  closeAddEmployeeModal() {
    this.showAddEmployeeModal = false;
    document.body.style.overflow = '';
  }

  addEmployeeToShift() {
    if (!this.newEmployee.employeeId || !this.newEmployee.borrowReason) return;

    const formData = new FormData();
    formData.append('employee_ids[]', String(this.newEmployee.employeeId));
    formData.append('borrowing_reason', this.newEmployee.borrowReason);

    this.shiftPlanningService.assignBorrowEmployees(this.shiftPlanId, formData).subscribe({
      next: (res: any) => {
        this.showNotification(res.message || 'Employee assigned successfully', 'success');
        this.loadWorkforceRelayData(this.shiftPlanId);
        this.closeAddEmployeeModal();
      },
      error: (err: any) => {
        console.error('Error assigning borrowed employee:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to assign employee';
        this.showNotification(errorMsg, 'error');
      }
    });
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
    this.employeeToDelete = emp;
    this.showDeleteEmployeeModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteEmployeeModal() {
    this.showDeleteEmployeeModal = false;
    this.employeeToDelete = null;
    document.body.style.overflow = '';
  }

  confirmDeleteEmployee() {
    if (!this.employeeToDelete) return;

    this.shiftPlanningService.removeWorkforceEmployee(this.shiftPlanId, this.employeeToDelete.id).subscribe({
      next: (res: any) => {
        this.notificationService.show(res.message || 'Employee removed successfully', 'success', 3000);
        this.loadWorkforceRelayData(this.shiftPlanId);
        this.closeDeleteEmployeeModal();
      },
      error: (err: any) => {
        console.error('Error removing employee:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to remove employee';
        this.notificationService.show(errorMsg, 'error', 3000);
        this.closeDeleteEmployeeModal();
      }
    });
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
    this.notificationService.show(msg, type, 3500);
  }

  savePlan() {
    if (!this.shiftForm.planningDate || !this.shiftForm.shiftId || !this.shiftForm.locationId || !this.shiftForm.targetBcm || !this.shiftForm.supervisorId || !this.shiftForm.siteInchargeId) {
      this.showNotification('Please fill in all mandatory fields before saving the plan.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('planning_date', this.shiftForm.planningDate);
    formData.append('shift_id', String(this.shiftForm.shiftId));
    formData.append('site_id', String(this.shiftForm.locationId));
    formData.append('target_bcm', String(this.shiftForm.targetBcm));
    formData.append('supervisor_id', String(this.shiftForm.supervisorId));
    formData.append('site_incharge_id', String(this.shiftForm.siteInchargeId));

    this.shiftPlanningService.createShiftPlan(formData).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 201)) {
          this.shiftPlanId = res.data?.id || res.data?.shift_plan_id || 1;
          this.showNotification(res.message || 'Shift Plan Saved Successfully! Now you can allocate equipment and employees.', 'success');
        } else {
          this.showNotification(res.message || 'Failed to save shift plan', 'error');
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'An error occurred while saving the shift plan.';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  publishShift() {
    if (!this.shiftPlanId) {
      this.notificationService.show('Please save the shift plan before publishing.', 'error', 3000);
      return;
    }

    this.shiftPlanningService.publishShiftPlan(this.shiftPlanId).subscribe({
      next: (res: any) => {
        this.notificationService.show(res.message || 'Shift Plan published successfully!', 'success', 3000);
        this.router.navigate(['/admin/shift-mgt']);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Failed to publish shift plan.';
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
