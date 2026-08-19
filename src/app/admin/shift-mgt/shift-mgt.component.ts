import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { ShiftPlanningService, ShiftPlanFilters, ShiftPlan } from '../../core/services/shift-planning.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ShiftSiteOption {
  id: number | string;
  site_name?: string;
  name?: string;
  [key: string]: any;
}

export interface SupervisorOption {
  id: number | string;
  name: string;
  designation?: string;
}

export interface ShiftFilterOption {
  id: number | string;
  name: string;
}

export interface ShiftPlanTableItem {
  id: number | string;
  date: string;
  shiftCode: string;
  shiftName: string;
  location: string;
  supervisor: string;
  targetBCM: number;
  actualBCM: number;
  status: string;
}

export interface ShiftPlanDetailView {
  id: number | string;
  site_name?: string;
  supervisor_name?: string;
  planning_date?: string;
  target_bcm?: number | string;
  actual_bcm?: number | string;
  status?: string;
  summary?: any;
  shift_plan?: any;
  machinery_allocations?: any[];
  workforce?: any[];
  [key: string]: any;
}

@Component({
  selector: 'app-shift-mgt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, NgxPaginationModule],
  templateUrl: './shift-mgt.component.html',
  styleUrls: ['./shift-mgt.component.scss']
})
export class ShiftMgtComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  summary = {
    total_scheduled_shifts: 0,
    active_personnel: 0,
    target_bcm: '0',
    actual_bcm: '0',
    current_efficiency: 0
  };
  pagination: any = { current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 };
  tableSizes: number[] = [10, 20, 50, 100];

  filterLocations: ShiftSiteOption[] = [];
  selectedLocation: number | string | null = null;

  filterStatuses = [
    { id: 'draft', name: 'Draft' },
    { id: 'published', name: 'Published' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' }
  ];
  selectedStatus: string | null = null;

  filterSupervisors: SupervisorOption[] = [];
  selectedSupervisor: number | string | null = null;

  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  selectedPeriod: string = 'monthly';

  searchQuery: string = '';

  filterShifts: ShiftFilterOption[] = [];
  selectedShiftFilter: number | string | null = null;

  shifts: ShiftPlanTableItem[] = [];

  selectedShift: ShiftPlanTableItem | null = null;

  // View Details Modal State
  viewShiftPlanData: ShiftPlanDetailView | null = null;
  isViewDetailsModalOpen: boolean = false;
  viewModalLoading: boolean = false;

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
  }

  loadSites() {
    this.shiftPlanningService.getSites().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.filterLocations = data;
    });
  }

  loadEmployees() {
    this.shiftPlanningService.getEmployees('supervisor').pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      // Sirf name and designation extract kar rahe hain as requested
      this.filterSupervisors = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.name} (${emp.designation})`
      }));
    });
  }

  loadShifts() {
    this.shiftPlanningService.getShifts().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
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
    if (this.filterStartDate && this.filterEndDate) {
      if (new Date(this.filterEndDate) < new Date(this.filterStartDate)) {
        this.filterEndDate = this.filterStartDate;
      }
    }
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
    this.selectedStatus = null;

    this.pagination.current_page = 1;
    this.loadShiftPlans();
  }

  loadShiftPlans() {
    const filters: any = {};
    if (this.pagination.per_page !== 'All') {
      filters.page = this.pagination.current_page;
      filters.limit = this.pagination.per_page;
    }

    if (this.selectedLocation) filters.site_id = this.selectedLocation;
    if (this.selectedSupervisor) filters.supervisor_id = this.selectedSupervisor;
    if (this.selectedShiftFilter) (filters as any).shift_id = this.selectedShiftFilter;
    if (this.filterStartDate) filters.start_date = this.filterStartDate;
    if (this.filterEndDate) filters.end_date = this.filterEndDate;
    if (this.selectedPeriod) filters.period = this.selectedPeriod;
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedStatus) (filters as any).status = this.selectedStatus;

    this.shiftPlanningService.getShiftPlans(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.shifts = res.data.map((item: ShiftPlan) => {
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
              status: item.status
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.loadShiftPlans();
    }
  }

  getPercentage(actual: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  }

  openViewModal(shift: ShiftPlanTableItem) {
    this.router.navigate(['/admin/shift-mgt/summary', shift.id]);
  }

  closeViewModal() {
    this.selectedShift = null;
    document.body.style.overflow = '';
  }

  openShiftPlanDetails(shift: ShiftPlanTableItem) {
    this.isViewDetailsModalOpen = true;
    this.viewModalLoading = true;
    this.viewShiftPlanData = null;
    // Add overflow hidden to body to prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';

    this.shiftPlanningService.getShiftPlanView(shift.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.viewShiftPlanData = res.data;
        }
        this.viewModalLoading = false;
      },
      error: (err) => {
        console.error('Error fetching shift plan view data:', err);
        this.viewModalLoading = false;
      }
    });
  }

  closeShiftPlanDetails() {
    this.isViewDetailsModalOpen = false;
    this.viewShiftPlanData = null;
    document.body.style.overflow = '';
  }

  addShift() {
    this.router.navigate(['/admin/shift-mgt/add']);
  }

  editShift(id: string | number) {
    this.router.navigate(['/admin/shift-mgt/edit', id]);
  }
}
