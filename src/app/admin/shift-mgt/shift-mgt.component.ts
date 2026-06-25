import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ShiftPlanningService, ShiftPlanFilters, ShiftPlan } from '../../core/services/shift-planning.service';

@Component({
  selector: 'app-shift-mgt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
  templateUrl: './shift-mgt.component.html',
  styleUrls: ['./shift-mgt.component.scss']
})
export class ShiftMgtComponent implements OnInit {
  summary = {
    total_scheduled_shifts: 0,
    active_personnel: 0,
    target_bcm: '0',
    actual_bcm: '0',
    current_efficiency: 0
  };
  pagination = { current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 };

  filterLocations: any[] = [];
  selectedLocation: any = null;

  filterSupervisors: any[] = [];
  selectedSupervisor: any = null;

  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  selectedPeriod: string = 'monthly';

  searchQuery: string = '';

  filterShifts: any[] = [];
  selectedShiftFilter: any = null;

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

  shifts: any[] = [];

  selectedShift: any = null;

  constructor(
    private router: Router,
    private shiftPlanningService: ShiftPlanningService
  ) { }

  ngOnInit(): void {
    this.loadSites();
    this.loadEmployees();
    this.loadShifts();
    this.loadShiftPlans();
  }

  loadSites() {
    this.shiftPlanningService.getSites().subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.filterLocations = data;
    });
  }

  loadEmployees() {
    this.shiftPlanningService.getEmployees('supervisor').subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      // Sirf name and designation extract kar rahe hain as requested
      this.filterSupervisors = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.name} (${emp.designation})`
      }));
    });
  }

  loadShifts() {
    this.shiftPlanningService.getShifts().subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      // API returns shift_name, but ng-select uses 'name' bindLabel
      this.filterShifts = data.map((shift: any) => ({
        id: shift.id,
        name: shift.shift_name
      }));
    });
  }

  setPeriod(period: string) {
    this.selectedPeriod = period;
    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  onFilterChange() {
    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  onSearch() {
    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  onLimitChange() {
    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  resetFilters() {
    // Top filters
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.selectedPeriod = 'monthly';
    this.searchQuery = '';

    // Bottom filters
    this.selectedShiftFilter = null;
    this.selectedLocation = null;
    this.selectedSupervisor = null;

    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  loadShiftPlans() {
    const filters: ShiftPlanFilters = {
      page: this.pagination.current_page,
      limit: this.pagination.per_page
    };

    if (this.selectedLocation) filters.site_id = this.selectedLocation;
    if (this.selectedSupervisor) filters.supervisor_id = this.selectedSupervisor;
    if (this.selectedShiftFilter) (filters as any).shift_id = this.selectedShiftFilter;
    if (this.filterStartDate) filters.start_date = this.filterStartDate;
    if (this.filterEndDate) filters.end_date = this.filterEndDate;
    if (this.selectedPeriod) filters.period = this.selectedPeriod;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.shiftPlanningService.getShiftPlans(filters).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.shifts = res.data.map((item: ShiftPlan) => {
            // Map the API status to UI friendly status
            let uiStatus = item.status;
            if (item.status === 'in_progress') uiStatus = 'IN-PROGRESS';
            else if (item.status === 'draft') uiStatus = 'PLANNED';
            else if (item.status === 'completed') uiStatus = 'COMPLETED';

            // Extract shift code (e.g., 'Shift A' -> 'A')
            const shiftCodeMatch = item.shift_name ? item.shift_name.match(/Shift\s+([A-Z])/i) : null;
            const shiftCode = shiftCodeMatch ? shiftCodeMatch[1] : item.shift_name;

            return {
              id: item.id,
              date: item.planning_date,
              shiftCode: shiftCode,
              shiftName: item.shift_name,
              location: item.site_name,
              supervisor: item.supervisor_name,
              targetBCM: Number(item.target_bcm),
              actualBCM: Number(item.actual_bcm),
              status: uiStatus
            };
          });

          if (res.summary) {
            this.summary = res.summary;
          }
          if (res.pagination) {
            this.pagination = res.pagination;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching shift plans:', err);
      }
    });
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
