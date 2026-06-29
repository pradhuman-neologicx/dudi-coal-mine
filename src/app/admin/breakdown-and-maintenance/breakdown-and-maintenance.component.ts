import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreakdownTypeService } from 'src/app/core/services/breakdown-type.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, Observable, concat, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap, map } from 'rxjs/operators';
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
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule]
})
export class BreakdownAndMaintenanceComponent implements OnInit {

  tickets: any[] = [];

  breakdownTypes: any[] = [];
  selectedBreakdownType: string = '';
  filterShifts: any[] = [];

  // Dashboard Stats
  dashboardStats = {
    open_tickets: 0,
    closed_today: 0,
    total_downtime_hours: 0,
    mttr_hours: 0,
    equipment_availability_percent: 0
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
  entryMachine: string = '';
  entrySeverity: string = '';
  entryDescription: string = '';
  entryRepairStart: string = '';
  entryRepairEnd: string = '';
  entryActionTaken: string = '';
  editingTicketId: any = null;
  entryShiftPlanId: any = null;
  machinesList: any[] = [];
  machinesLoading: boolean = false;

  // Toast State
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  displayToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 1;
  paginationNumbers: number[] = [];

  constructor(
    private breakdownTypeService: BreakdownTypeService,
    private shiftPlanningService: ShiftPlanningService
  ) { }

  ngOnInit(): void {
    this.fetchBreakdownTypes();
    this.loadShifts();
    this.setupEmployeeSearch();
    this.fetchBreakdownData();
  }

  setupEmployeeSearch() {
    this.employeeInput$.subscribe(term => {
      this.currentEmployeeTerm = term;
    });

    this.employees$ = concat(
      of([]),
      this.searchTrigger$.pipe(
        tap(() => this.employeesLoading = true),
        switchMap(term => {
          if (!term) {
            this.employeesLoading = false;
            return of([]);
          }
          return this.breakdownTypeService.searchEmployee(term).pipe(
            catchError(() => of({ data: [] })),
            map((res: any) => {
              return res.data || res || [];
            }),
            tap(() => this.employeesLoading = false)
          );
        })
      )
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
      this.shiftPlanningService.shiftPlanFilterByDate(this.entryDate).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            this.entryShift = res.data.id || res.data.shift_id || res.data;
            this.shiftName = res.data.name;
            this.entryShiftPlanId = res.data.shift_plan_id;
            this.machinesList = res.data.machines || [];
          } else if (res && res.status === 404) {
            this.displayToast(res.message || 'No active shift covers the given time.', 'error');
            this.entryShift = '';
            this.shiftName = '';
            this.entryShiftPlanId = null;
            this.machinesList = [];
          }
        },
        error: (err) => {
          console.error('Error fetching shift by datetime', err);
          if (err.status === 404 || (err.error && err.error.status === 404)) {
            this.displayToast(err.error?.message || err.message || 'No active shift covers the given time.', 'error');
          } else {
            this.displayToast('Failed to fetch shift details', 'error');
          }
          this.entryShift = '';
          this.shiftName = '';
          this.entryShiftPlanId = null;
          this.machinesList = [];
        }
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
          this.breakdownTypes = res.data.filter((type: any) => type.is_active === 1 || type.status === 1)
            .map((type: any) => ({
              ...type,
              name: type.name || type.breakdown_type
            }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching breakdown types', err);
      }
    });
  }

  fetchBreakdownData() {
    this.breakdownTypeService.getBreakdowns(this.pageSize, this.currentPage, '').subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          // Update Dashboard
          if (res.dashboard) {
            this.dashboardStats = res.dashboard;
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
            originalData: item
          }));

          // Pagination
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
            this.currentPage = res.pagination.current_page;
            this.pageSize = res.pagination.per_page;
            this.totalPages = res.pagination.last_page;
            this.generatePagination();
          }
        }
      },
      error: (err) => {
        console.error('Error fetching breakdown data:', err);
      }
    });
  }

  generatePagination() {
    this.paginationNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.paginationNumbers.push(i);
    }
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
        name: shift.shift_name
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

  selectedCategory: string = '';
  selectedSeverity: string = '';
  selectedShift: string = '';

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
      }
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
      this.breakdownTypeService.getBreakdownById(this.editingTicketId).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            const data = res.data;
            this.entryDate = data.breakdown_date_time;
            this.entryShift = data.shift_id;
            this.shiftName = data.shift_name;
            this.selectedBreakdownType = data.breakdown_type_id;
            this.entrySeverity = data.severity;
            this.entryDescription = data.description;
            this.entryRepairStart = data.downtime_start;
            this.entryRepairEnd = data.downtime_end;
            this.entryActionTaken = data.resolution_notes;
            this.selectedEmployee = data.reported_by;

            // Fetch shift machines to populate dropdown
            if (this.entryDate) {
              this.shiftPlanningService.shiftPlanFilterByDate(this.entryDate).subscribe((shiftRes: any) => {
                if (shiftRes && shiftRes.status === 200 && shiftRes.data) {
                  this.entryShiftPlanId = shiftRes.data.shift_plan_id;
                  this.machinesList = shiftRes.data.machines || [];
                  this.entryMachine = data.equipment_name_id;
                }
              });
            }
          }
        }
      });
    } else {
      this.editingTicketNo = null;
      this.editingTicketId = null;
      this.isModalOpen = true;
      this.resetForm();
    }
  }

  resetForm() {
    this.entryDate = '';
    this.entryShift = '';
    this.shiftName = '';
    this.entryMachine = '';
    this.selectedBreakdownType = '';
    this.entrySeverity = '';
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

  submitEntry() {
    let categoryId = null;
    if (this.entryMachine && this.machinesList.length > 0) {
      const selectedMachine = this.machinesList.find(m => m.machine_id == this.entryMachine);
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
      reported_by: this.selectedEmployee
    };

    if (this.editingTicketId) {
      this.breakdownTypeService.updateBreakdown(this.editingTicketId, payload).subscribe({
        next: (res) => {
          this.displayToast(res.message, 'success');
          this.closeModal();
          this.fetchBreakdownData();
        },
        error: (err) => {
          this.displayToast('Failed to update entry', 'error');
        }
      });
    } else {
      this.breakdownTypeService.createBreakdown(payload).subscribe({
        next: (res) => {
          this.displayToast(res.message, 'success');
          this.closeModal();
          this.fetchBreakdownData();
        },
        error: (err) => {
          this.displayToast(err.message, 'error');
        }
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
    this.selectedCategory = '';
    this.selectedSeverity = '';
    this.selectedShift = '';
  }

  get filteredTickets(): any[] {
    let result = this.tickets;

    if (this.selectedCategory) {
      result = result.filter(t => t.category === this.selectedCategory);
    }
    if (this.selectedSeverity) {
      result = result.filter(t => t.severity === this.selectedSeverity);
    }
    if (this.selectedShift) {
      result = result.filter(t => t.shift === this.selectedShift);
    }

    return result;
  }
}
