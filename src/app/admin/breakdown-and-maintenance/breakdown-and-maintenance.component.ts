import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreakdownTypeService } from 'src/app/core/services/breakdown-type.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { Subject, Observable, concat, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  map,
} from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface Ticket {
  ticketNo: string;
  machineId: string;
  machineType: string;
  breakdownTime: string;
  category: string;
  priority: string;
  status: string;
  shift: string;
}

@Component({
  selector: 'app-breakdown-and-maintenance',
  templateUrl: './breakdown-and-maintenance.component.html',
  styleUrls: ['./breakdown-and-maintenance.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgSelectModule,
    NgxPaginationModule,
  ],
})
export class BreakdownAndMaintenanceComponent implements OnInit {
  tickets: any[] = [];

  chart1: any;
  chart2: any;
  chart3: any;
  chart4: any;

  breakdownTypes: any[] = [];
  selectedBreakdownType: any = null;
  filterShifts: any[] = [];

  // Date Filters
  selectedDateRange = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Dashboard Stats
  dashboardStats: any = {
    open_tickets: 0,
    closed_today: 0,
    total_downtime_hours: 0,
    mttr_hours: 0,
    equipment_availability_percent: 0,
    total_breakdown_events: 0,
    affected_machines: 0,
    avg_downtime_per_breakdown: 0,
    most_reliable_machine: {
      machine: 'N/A',
      downtime: 0,
      breakdowns: 0,
      reliability_score: 0,
    },
    least_reliable_machine: {
      machine: 'N/A',
      downtime: 0,
      breakdowns: 0,
      reliability_score: 0,
    },
  };

  employees$!: Observable<any[]>;
  employeeInput$ = new Subject<string>();
  searchTrigger$ = new Subject<string>();
  currentEmployeeTerm = '';
  selectedEmployee: any = null;
  employeesLoading = false;

  entryDate: string = '';
  entryShift: string = '';
  shiftName: string = '';
  entryMachine: any = null;
  entrySeverity: any = null;
  entryDescription: string = '';
  entryRepairStart: string = '';
  entryRepairEnd: string = '';
  entryActionTaken: string = '';
  editingTicketId: any = null;
  entryShiftPlanId: any = null;
  machinesList: any[] = [];
  machinesLoading: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 1;
  paginationNumbers: number[] = [];
  tableSizes: any = [10, 20, 50, 100];

  // Import
  isImportModalOpen = false;
  isImporting = false;
  importResult: any = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private breakdownTypeService: BreakdownTypeService,
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.fetchBreakdownTypes();
    this.loadShifts();
    this.setupEmployeeSearch();
    this.fetchBreakdownData();
  }

  setupEmployeeSearch() {
    this.employeeInput$.subscribe((term) => {
      this.currentEmployeeTerm = term;
    });

    this.employees$ = concat(
      of([]),
      this.searchTrigger$.pipe(
        tap(() => (this.employeesLoading = true)),
        switchMap((term) => {
          if (!term) {
            this.employeesLoading = false;
            return of([]);
          }
          return this.breakdownTypeService.searchEmployee(term).pipe(
            catchError(() => of({ data: [] })),
            map((res: any) => {
              return res.data || res || [];
            }),
            tap(() => (this.employeesLoading = false)),
          );
        }),
      ),
    );
  }

  triggerEmployeeSearch(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.searchTrigger$.next(this.currentEmployeeTerm);
  }

  onDateChange() {
    if (this.entryDate) {
      this.shiftPlanningService
        .shiftPlanFilterByDate(this.entryDate)
        .subscribe({
          next: (res: any) => {
            if (res && res.status === 200 && res.data) {
              this.entryShift = res.data.id || res.data.shift_id || res.data;
              this.shiftName = res.data.name;
              this.entryShiftPlanId = res.data.shift_plan_id;
              this.machinesList = res.data.machines || [];
            } else {
              this.notificationService.show(
                res?.message || 'No active shift covers the given time.',
                'error',
              );
              this.entryShift = '';
              this.shiftName = 'No data found for this date';
              this.entryShiftPlanId = null;
              this.machinesList = [];
            }
          },
          error: (err) => {
            console.error('Error fetching shift by datetime', err);
            this.notificationService.show(
              err.error?.message ||
                err.message ||
                'Error fetching shift details.',
              'error',
            );
            this.entryShift = '';
            this.shiftName = 'No data found for this date';
            this.entryShiftPlanId = null;
            this.machinesList = [];
          },
        });
    } else {
      this.entryShift = '';
      this.shiftName = '';
      this.entryShiftPlanId = null;
      this.machinesList = [];
    }
  }

  onSelectKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'Tab') {
      this.triggerEmployeeSearch(event);
    }
  }

  fetchBreakdownTypes(): void {
    this.breakdownTypeService.getPublicBreakdownTypes().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          // Assuming we only want active breakdown types
          this.breakdownTypes = res.data
            .filter((type: any) => type.is_active === 1 || type.status === 1)
            .map((type: any) => ({
              ...type,
              name: type.name || type.breakdown_type,
            }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching breakdown types', err);
      },
    });
  }

  fetchBreakdownData() {
    if (this.filterDateFrom && this.filterDateTo) {
      if (new Date(this.filterDateTo) < new Date(this.filterDateFrom)) {
        this.notificationService.show(
          'End date cannot be earlier than start date.',
          'error',
        );
        this.filterDateTo = this.filterDateFrom;
      }
    }

    const filters = {
      breakdown_type_id: this.selectedCategory,
      severity: this.selectedSeverity,
      shift_id: this.selectedShift,
      date_from: this.filterDateFrom,
      date_to: this.filterDateTo,
    };

    this.breakdownTypeService
      .getBreakdowns(this.pageSize, this.currentPage, '', filters)
      .subscribe({
        next: (res: any) => {
          if (res && res.status === 200) {
            // Update Dashboard
            if (res.dashboard) {
              this.dashboardStats = {
                ...this.dashboardStats,
                ...res.dashboard,
              };
            }

            // Update Table Data
            const data = res.data || [];
            this.tickets = data.map((item: any) => ({
              ticketNo: item.ticket_number,
              machineId: item.equipment_name,
              machineType: item.equipment_category,
              breakdownTime: item.breakdown_date_time,
              category: item.equipment_category,
              severity: item.severity,
              status: item.status,
              shift: item.shift_name,
              originalData: item,
            }));

            // Pagination
            if (res.pagination) {
              this.totalRecords = res.pagination.total;
              this.currentPage = res.pagination.current_page;
              this.pageSize = res.pagination.per_page;
              this.totalPages = res.pagination.last_page;
              this.generatePagination();
            }

            setTimeout(() => {
              this.createChart1();
              this.createChart2();
              this.createChart3();
              this.createChart4();
            }, 100);
          }
        },
        error: (err) => {
          console.error('Error fetching breakdown data:', err);
        },
      });
  }

  generatePagination() {
    this.paginationNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.paginationNumbers.push(i);
    }
  }

  createChart1() {
    const ctx = document.getElementById(
      'breakdownTrendChart',
    ) as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart1) this.chart1.destroy();

    const trendData: any[] = (this.dashboardStats as any).breakdown_trend || [];
    const labels = trendData.map((d: any) => d.label || d.date);
    const data = trendData.map((d: any) => d.count);

    this.chart1 = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Breakdown Count',
            data: data,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  createChart2() {
    const ctx = document.getElementById(
      'downtimeMachineChart',
    ) as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart2) this.chart2.destroy();

    const downtimeData: any[] =
      (this.dashboardStats as any).downtime_by_machine || [];
    const labels = downtimeData.map((d: any) => d.machine);
    const data = downtimeData.map((d: any) => d.downtime_hours);

    this.chart2 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Downtime Hours',
            data: data,
            backgroundColor: '#ef4444',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  createChart3() {
    const ctx = document.getElementById(
      'breakdownCategoryChart',
    ) as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart3) this.chart3.destroy();

    const categoryData: any[] =
      (this.dashboardStats as any).category_analysis || [];
    const labels = categoryData.map((d: any) => d.breakdown_type);
    const data = categoryData.map((d: any) => d.count);

    this.chart3 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#3b82f6',
              '#ef4444',
              '#eab308',
              '#22c55e',
              '#a855f7',
              '#f97316',
              '#64748b',
              '#ec4899',
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  createChart4() {
    const ctx = document.getElementById(
      'reliabilityRankingChart',
    ) as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart4) this.chart4.destroy();

    const rankingData: any[] =
      (this.dashboardStats as any).reliability_ranking || [];
    const labels = rankingData.map((d: any) => d.machine);
    const data = rankingData.map((d: any) => d.reliability_score);

    this.chart4 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Reliability Score',
            data: data,
            backgroundColor: '#10b981',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
      },
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchBreakdownData();
    }
  }

  loadShifts() {
    this.shiftPlanningService.getShifts().subscribe((res: any) => {
      const data = res.data?.data || res.data || [];
      this.filterShifts = data.map((shift: any) => ({
        id: shift.id,
        name: shift.shift_name,
      }));
    });
  }

  isFilterOpen = false;
  isModalOpen = false;
  editingTicketNo: string | null = null;

  // View Modal specific
  isViewModalOpen = false;
  viewModalData: any = null;
  viewModalLoading = false;

  selectedCategory: any = null;
  selectedSeverity: any = null;
  selectedShift: any = null;

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  viewModal(ticket: any) {
    this.isViewModalOpen = true;
    this.viewModalLoading = true;
    const ticketId = ticket.originalData?.id || ticket.id;

    this.breakdownTypeService.getBreakdownById(ticketId).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.viewModalData = res.data;
        }
        this.viewModalLoading = false;
      },
      error: (err) => {
        console.error('Error fetching details', err);
        this.viewModalLoading = false;
      },
    });
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.viewModalData = null;
  }

  openModal(ticket?: any) {
    if (ticket) {
      this.editingTicketNo = ticket.ticketNo;
      this.editingTicketId = ticket.originalData?.id || ticket.id;
      this.isModalOpen = true;

      // Prefill fields using getBreakdownById
      this.breakdownTypeService
        .getBreakdownById(this.editingTicketId)
        .subscribe({
          next: (res: any) => {
            if (res && res.status === 200 && res.data) {
              const data = res.data;
              this.entryDate = this.parseDateTimeToInput(
                data.breakdown_date_time,
              );
              this.entryShift = data.shift_id;
              this.shiftName = data.shift_name;
              this.selectedBreakdownType = data.breakdown_type_id;
              this.entrySeverity = data.severity;
              this.entryDescription = data.description;
              this.entryRepairStart = this.parseDateTimeToInput(
                data.downtime_start,
              );
              this.entryRepairEnd = this.parseDateTimeToInput(
                data.downtime_end,
              );
              this.entryActionTaken = data.resolution_notes;
              this.selectedEmployee = data.reported_by;

              // Fetch shift machines to populate dropdown
              if (this.entryDate) {
                this.shiftPlanningService
                  .shiftPlanFilterByDate(this.entryDate)
                  .subscribe((shiftRes: any) => {
                    if (shiftRes && shiftRes.status === 200 && shiftRes.data) {
                      this.entryShiftPlanId = shiftRes.data.shift_plan_id;
                      this.machinesList = shiftRes.data.machines || [];
                      this.entryMachine = data.equipment_name_id;
                    }
                  });
              }
            }
          },
        });
    } else {
      this.editingTicketNo = null;
      this.editingTicketId = null;
      this.isModalOpen = true;
      this.resetForm();

      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(Date.now() - tzOffset)
        .toISOString()
        .slice(0, 16);
      this.entryDate = localISOTime;
      this.onDateChange();
    }
  }

  resetForm() {
    this.entryDate = '';
    this.entryShift = '';
    this.shiftName = '';
    this.entryMachine = null;
    this.selectedBreakdownType = null;
    this.entrySeverity = null;
    this.entryDescription = '';
    this.entryRepairStart = '';
    this.entryRepairEnd = '';
    this.entryActionTaken = '';
    this.selectedEmployee = null;
    this.entryShiftPlanId = null;
    this.machinesList = [];
  }

  private formatDateTime(dt: string): string | null {
    if (!dt) return null;
    let formatted = dt.replace('T', ' ');
    if (formatted.split(':').length === 2) {
      formatted += ':00';
    }
    return formatted;
  }

  private parseDateTimeToInput(dt: string): string {
    if (!dt) return '';
    const normalized = dt.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) {
      return '';
    }
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  submitEntry() {
    const now = new Date();

    if (this.entryRepairStart) {
      if (new Date(this.entryRepairStart) < new Date(this.entryDate)) {
        this.notificationService.show(
          'Repair start time cannot be before breakdown time.',
          'error',
        );
        return;
      }
      if (new Date(this.entryRepairStart) > now) {
        this.notificationService.show(
          'Repair start time cannot be in the future.',
          'error',
        );
        return;
      }
    }

    if (this.entryRepairEnd) {
      const compareDate = this.entryRepairStart
        ? this.entryRepairStart
        : this.entryDate;
      if (new Date(this.entryRepairEnd) < new Date(compareDate)) {
        this.notificationService.show(
          'Repair end time cannot be before repair start or breakdown time.',
          'error',
        );
        return;
      }
      if (new Date(this.entryRepairEnd) > now) {
        this.notificationService.show(
          'Repair end time cannot be in the future.',
          'error',
        );
        return;
      }
    }

    let categoryId = null;
    if (this.entryMachine && this.machinesList.length > 0) {
      const selectedMachine = this.machinesList.find(
        (m) => m.machine_id == this.entryMachine,
      );
      if (selectedMachine) {
        categoryId = selectedMachine.category_id;
      }
    }

    const payload = {
      shift_id: this.entryShift,
      shift_plan_id: this.entryShiftPlanId,
      breakdown_date_time: this.formatDateTime(this.entryDate),
      equipment_id: categoryId,
      equipment_name_id: this.entryMachine,
      breakdown_type_id: this.selectedBreakdownType,
      severity: this.entrySeverity,
      description: this.entryDescription,
      downtime_start: this.formatDateTime(this.entryRepairStart),
      downtime_end: this.formatDateTime(this.entryRepairEnd),
      resolution_notes: this.entryActionTaken || null,
      reported_by: this.selectedEmployee,
    };

    if (this.editingTicketId) {
      this.breakdownTypeService
        .updateBreakdown(this.editingTicketId, payload)
        .subscribe({
          next: (res) => {
            this.closeModal();
            this.fetchBreakdownData();
          },
          error: (err) => {
            // this.displayToast('Failed to update entry', 'error');
            console.log(err);
          },
        });
    } else {
      this.breakdownTypeService.createBreakdown(payload).subscribe({
        next: (res) => {
          this.closeModal();
          this.fetchBreakdownData();
        },
        error: (err) => {
          // this.displayToast(err.message, 'error');
          console.log(err);
        },
      });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingTicketNo = null;
    this.editingTicketId = null;
    this.resetForm();
  }

  clearFilters() {
    this.selectedCategory = null;
    this.selectedSeverity = null;
    this.selectedShift = null;
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
    this.fetchBreakdownData();
  }

  onLimitChange() {
    this.currentPage = 1;
    this.fetchBreakdownData();
  }

  get isFormValid(): boolean {
    const baseValid = !!(
      this.entryDate &&
      this.entryShift &&
      this.selectedBreakdownType &&
      this.entrySeverity &&
      this.entryMachine &&
      this.selectedEmployee &&
      this.entryDescription &&
      this.entryDescription.trim().length > 0
    );

    if (!baseValid) return false;

    // Resolution Validation
    const hasRepairEnd = !!this.entryRepairEnd;
    const hasRepairStart = !!this.entryRepairStart;

    // If repair end time is provided, repair start time must also be provided
    if (hasRepairEnd && !hasRepairStart) {
      return false;
    }

    return true;
  }

  onFilterChange() {
    this.currentPage = 1;
    this.fetchBreakdownData();
  }

  onDateRangeChange() {
    const today = new Date();

    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (this.selectedDateRange === 'today') {
      const todayStr = toYMD(today);
      this.filterDateFrom = todayStr;
      this.filterDateTo = todayStr;
    } else if (this.selectedDateRange === 'last7days') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      this.filterDateFrom = toYMD(last7);
      this.filterDateTo = toYMD(today);
    } else if (this.selectedDateRange === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.filterDateFrom = toYMD(firstDay);
      this.filterDateTo = toYMD(today);
    } else {
      this.filterDateFrom = '';
      this.filterDateTo = '';
    }

    this.currentPage = 1;
    this.fetchBreakdownData();
  }

  // Import logic
  openImportModal() {
    this.isImportModalOpen = true;
    this.importResult = null;
  }

  closeImportModal() {
    this.isImportModalOpen = false;
    this.importResult = null;
    this.fetchBreakdownData();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isImporting = true;
      this.importResult = null;
      this.breakdownTypeService.importBreakdowns(file).subscribe({
        next: (res: any) => {
          this.isImporting = false;
          if (
            res &&
            (res.status === 200 ||
              res.status === 201 ||
              res.status === 'success') &&
            (!res.errors || res.errors.length === 0)
          ) {
            this.importResult = null;
            this.notificationService.show(
              res.message || 'Import successful.',
              'success',
              3000,
            );
            this.closeImportModal();
            this.fetchBreakdownData();
          } else {
            this.importResult = {
              status: res.status || 422,
              message: res.message || 'Import process completed with errors.',
              errors: res.errors || [],
            };
          }
        },
        error: (err: any) => {
          this.isImporting = false;
          const errObj = err.originalError || err.error || err;
          let formattedErrors: string[] = [];

          if (errObj.errors) {
            if (Array.isArray(errObj.errors)) {
              formattedErrors = errObj.errors.map((e: any) => {
                if (typeof e === 'object' && e !== null) {
                  const col = e.column ? ` [${e.column}]` : '';
                  const msg = Array.isArray(e.errors)
                    ? e.errors.join(', ')
                    : e.message || 'Unknown error';
                  return `Row ${e.row || 'N/A'}${col}: ${msg}`;
                }
                return String(e);
              });
            } else if (typeof errObj.errors === 'object') {
              Object.values(errObj.errors).forEach((errArray: any) => {
                if (Array.isArray(errArray)) {
                  formattedErrors.push(...errArray);
                } else if (typeof errArray === 'string') {
                  formattedErrors.push(errArray);
                }
              });
            }
          }

          this.importResult = {
            status: err.status || errObj.status || 422,
            message: errObj.message || err.message || 'Failed to import.',
            errors:
              formattedErrors.length > 0
                ? formattedErrors
                : errObj.errors || [],
          };
        },
      });
      if (this.fileInput && this.fileInput.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  get filteredTickets(): any[] {
    return this.tickets;
  }
}
