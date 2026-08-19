import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FuelManagementService } from 'src/app/core/services/fuel-management.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { Chart, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

export interface FuelEntryTableItem {
  id: number | string;
  machineId: string;
  machineDesc: string;
  shiftName: string;
  date: string;
  opening: number;
  issued: number;
  closing: number;
  consumption: number;
  fuelBcm: number;
  trend?: string;
  efficiencyClass?: string;
  originalData?: any;
}

export interface FuelShiftOption {
  id: number | string;
  name?: string;
  shift_name?: string;
  [key: string]: any;
}

export interface MachineCategoryOption {
  id: number | string;
  name?: string;
  category_name?: string;
  [key: string]: any;
}

export interface MachineShiftItem {
  machine_id: number | string;
  category_id?: number | string;
  machine_name?: string;
  [key: string]: any;
}

export interface ImportResult {
  status: number | string;
  message: string;
  errors: string[];
}

@Component({
  selector: 'app-fuel-mgt',
  templateUrl: './fuel-mgt.component.html',
  styleUrls: ['./fuel-mgt.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule]
})
export class FuelMgtComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isModalOpen = false;
  isEditMode = false;
  isFilterOpen = false;
  isFormSubmitted = false;
  formData: any = {
    date: '',
    shift: '',
    machineId: '',
    opening: 0,
    issued: 0,
    closing: 0,
    consumption: 0,
    bcm: 0,
    efficiency: 0
  };

  tableSize: number | string = 10;
  tableSizes: number[] = [10, 20, 50, 100];

  topDateRange = 'weekly';
  dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'weekly', label: 'Last 7 Days' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' }
  ];
  topShift = 'All Shifts';
  topLocation = 'All Locations';

  selectedMachine: any = null;
  selectedShift: any = null;
  fromDate = '';
  toDate = '';

  shiftName = '';
  entryShiftPlanId: any = null;
  machinesList: MachineShiftItem[] = [];
  editingFuelId: any = null;
  isBindingData = false;

  currentPage = 1;
  pagination: any = {
    total: 0,
    current_page: 1,
    per_page: 20,
    last_page: 1,
    from: 0,
    to: 0
  };

  isViewModalOpen = false;
  viewItemData: any = null;

  // Import
  isImportModalOpen = false;
  isImporting = false;
  importResult: ImportResult | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters() {
    this.selectedMachine = null;
    this.selectedShift = null;
    this.fromDate = '';
    this.toDate = '';
    this.fetchFuelData();
  }

  summaryStats: any = {
    total_fuel_issued: 0,
    total_fuel_consumption: 0,
    average_fuel_per_bcm: 0,
    distinct_machines: 0,
    active_machines_refueled: 0
  };

  filterShifts: FuelShiftOption[] = [];
  machineCategories: MachineCategoryOption[] = [];
  fuelEntries: FuelEntryTableItem[] = [];

  fuelConsumptionTrendData: any[] = [];
  consumptionByTypeData: any[] = [];
  machineEfficiencyTrendsData: any[] = [];

  get filteredFuelData() {
    return this.fuelEntries;
  }

  fuelData = [];

  constructor(
    private fuelService: FuelManagementService,
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService
  ) { }

  maxDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.maxDate = `${year}-${month}-${day}`;
    this.fetchFilters();
    this.fetchFuelData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.trendChartInstance) this.trendChartInstance.destroy();
    if (this.machineChartInstance) this.machineChartInstance.destroy();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  fetchFilters() {
    this.fuelService.getShifts().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res && res.status === 200) {
        this.filterShifts = res.data?.data || res.data || [];
      }
    });
    this.fuelService.getMachineCategories().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res && res.status === 200) {
        this.machineCategories = res.data || [];
      }
    });
  }

  fetchFuelData() {
    if (this.fromDate && this.toDate) {
      if (new Date(this.toDate) < new Date(this.fromDate)) {
        this.notificationService.show('End date cannot be earlier than start date.', 'error');
        this.toDate = this.fromDate;
      }
    }

    const filters: any = {
      date_from: this.fromDate,
      date_to: this.toDate,
      equipment_id: this.selectedMachine,
      shift_id: this.selectedShift
    };

    if (this.tableSize !== 'All') {
      filters.page = this.currentPage;
      filters.limit = this.tableSize;
    }

    this.fuelService.getFuelEntries(filters).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res && res.status === 200) {
        if (res.summary) {
          this.summaryStats = res.summary;
        }
        if (res.fuel_consumption_trend) {
          this.fuelConsumptionTrendData = res.fuel_consumption_trend;
        }
        if (res.consumption_by_type) {
          this.consumptionByTypeData = res.consumption_by_type;
        }
        if (res.machine_fuel_efficiency_trends) {
          this.machineEfficiencyTrendsData = res.machine_fuel_efficiency_trends;
        } else if (res.efficiency_trends) {
          this.machineEfficiencyTrendsData = res.efficiency_trends;
        }
        if (res.pagination) {
          this.pagination = res.pagination;
        }
        if (res.data) {
          this.fuelEntries = res.data.map((item: any) => ({
            id: item.id,
            machineId: item.machine_name,
            machineDesc: item.category_name,
            shiftName: item.shift_name || item.shift?.name || item.shift?.shift_name || 'N/A',
            date: item.fuel_log_date,
            opening: parseFloat(item.opening_fuel) || 0,
            issued: parseFloat(item.fuel_issued) || 0,
            closing: parseFloat(item.closing_fuel) || 0,
            consumption: parseFloat(item.fuel_consumption) || 0,
            fuelBcm: parseFloat(item.fuel_per_bcm || item.fuel_per_hour) || 0,
            trend: 'neutral',
            efficiencyClass: 'bg-gray-100 text-gray-800',
            originalData: item
          }));
        }
        setTimeout(() => {
          this.initTrendChart();
          this.initMachineChart();
          this.initFuelEfficiencyChart();
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initTrendChart();
      this.initMachineChart();
      this.initFuelEfficiencyChart();
    }, 100);
  }

  chartInstance: any;
  trendChartInstance: any;
  machineChartInstance: any;

  initTrendChart() {
    const ctx = document.getElementById('fuelTrendChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.trendChartInstance) this.trendChartInstance.destroy();

    const labels = this.fuelConsumptionTrendData.map((d: any) => d.date || d.day);
    const data = this.fuelConsumptionTrendData.map((d: any) => d.fuel_consumed);

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Fuel Consumed (Liters)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  initMachineChart() {
    const ctx = document.getElementById('fuelMachineChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.machineChartInstance) this.machineChartInstance.destroy();

    const labels = this.consumptionByTypeData.map((d: any) => d.category_name);
    const data = this.consumptionByTypeData.map((d: any) => d.total_consumption);
    const backgroundColors = ['#0f2a4a', '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

    this.machineChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors.slice(0, data.length)
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  initFuelEfficiencyChart() {
    const ctx = document.getElementById('fuelEfficiencyChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = this.machineEfficiencyTrendsData.map((d: any) => d.machine_name);
    const activeData = this.machineEfficiencyTrendsData.map((d: any) => d.active_selection);
    const fleetAverageData = this.machineEfficiencyTrendsData.map((d: any) => d.fleet_average);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Active Selection',
            data: activeData,
            backgroundColor: '#0f2a4a',
            hoverBackgroundColor: '#0c223c',
            barPercentage: 0.4,
            borderRadius: 2,
            order: 2
          },
          {
            label: 'Fleet Average',
            data: fleetAverageData,
            type: 'line',
            borderColor: '#9ca3af',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#9ca3af',
            fill: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw} L/BCM`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 10, style: 'italic' },
              callback: (value) => `${value} L`
            },
            border: { display: false },
            grid: {
              color: '#f3f4f6'
            }
          }
        }
      }
    });
  }

  openModal() {
    this.isEditMode = false;
    this.isFormSubmitted = false;
    this.resetForm();
    // Auto-fetch shift for default time when opening
    this.onDateChange();
    this.isModalOpen = true;
  }

  resetForm() {
    // Current time formatting for datetime-local
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const localISOTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    this.formData = {
      date: localISOTime,
      shift: null,
      machineId: null,
      opening: 0,
      issued: 0,
      closing: 0,
      consumption: 0,
      bcm: 0,
      efficiency: 0,
      hoursMeterReading: null,
      kilometerReading: null,
      remarks: ''
    };
    this.shiftName = '';
    this.entryShiftPlanId = null;
    this.machinesList = [];
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.currentPage = page;
      this.fetchFuelData();
    }
  }

  onTableSizeChange(): void {
    this.currentPage = 1;
    this.fetchFuelData();
  }

  openViewModal(item: any) {
    const fuelId = item.id || item.originalData?.id;
    this.fuelService.getFuelEntryById(fuelId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.viewItemData = res.data;
          this.isViewModalOpen = true;
        } else {
          this.notificationService.show(res?.message || 'Failed to fetch fuel entry details.', 'error');
        }
      },
      error: (err) => {
        this.notificationService.show('Error fetching fuel entry details.', 'error');
      }
    });
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.viewItemData = null;
  }

  onDateChange() {
    if (this.isBindingData) return;

    if (this.formData.date) {
      this.shiftPlanningService.shiftPlanFilterByDate(this.formData.date).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            this.formData.shift = res.data.id || res.data.shift_id || res.data;
            this.shiftName = res.data.name;
            this.entryShiftPlanId = res.data.shift_plan_id;
            this.machinesList = res.data.machines || [];
          } else if (res && res.status === 404) {
            this.notificationService.show(res.message || 'No active shift covers the given time.', 'error');
            this.formData.shift = null;
            this.shiftName = '';
            this.entryShiftPlanId = null;
            this.machinesList = [];
          }
        },
        error: (err) => {
          console.error('Error fetching shift by datetime', err);
          this.notificationService.show(err.message, 'error');
          this.formData.shift = null;
          this.shiftName = '';
          this.entryShiftPlanId = null;
          this.machinesList = [];
        }
      });
    } else {
      this.formData.shift = null;
      this.shiftName = '';
      this.entryShiftPlanId = null;
      this.machinesList = [];
    }
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.editingFuelId = item.id || item.originalData?.id;
    this.isModalOpen = true;

    this.fuelService.getFuelEntryById(this.editingFuelId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const data = res.data;

          this.isBindingData = true;
          this.formData.date = data.fuel_log_date ? data.fuel_log_date.substring(0, 16).replace(' ', 'T') : '';
          this.formData.shift = data.shift_id;
          this.shiftName = data.shift_plan?.shift?.shift_name || data.shift?.shift_name || data.shift_name || 'Shift ' + data.shift_id;
          this.entryShiftPlanId = data.shift_plan_id;
          this.formData.machineId = data.equipment_name_id;
          this.formData.opening = parseFloat(data.opening_fuel) || 0;
          this.formData.issued = parseFloat(data.fuel_issued) || 0;
          this.formData.closing = parseFloat(data.closing_fuel) || 0;
          this.formData.consumption = parseFloat(data.fuel_consumption) || 0;
          this.formData.bcm = parseFloat(data.work_done_bcm || data.bcm) || 0;
          this.formData.efficiency = parseFloat(data.fuel_per_bcm || data.fuel_per_hour) || 0;
          this.formData.hoursMeterReading = data.hours_meter_reading;
          this.formData.kilometerReading = data.kilometer_reading;
          this.formData.remarks = data.remarks || '';

          // Try to fetch machines for this date, but preserve the shift info
          if (this.formData.date) {
            this.shiftPlanningService.shiftPlanFilterByDate(this.formData.date).pipe(takeUntil(this.destroy$)).subscribe({
              next: (shiftRes: any) => {
                if (shiftRes && shiftRes.status === 200 && shiftRes.data) {
                  this.machinesList = shiftRes.data.machines || [];

                  // If the selected machine is not in the list, add it so the dropdown displays correctly
                  if (data.equipment_name_id && !this.machinesList.find(m => m.machine_id == data.equipment_name_id)) {
                    this.machinesList.push({
                      machine_id: data.equipment_name_id,
                      machine_name: data.equipment_allocation?.equipment_name?.equipment_name || data.equipment?.equipment_name || 'Machine ' + data.equipment_name_id,
                      category_id: data.equipment_id,
                      category_name: data.equipment_allocation?.equipment_name?.equipment?.name || data.equipment_category?.category_name || ''
                    });
                  }
                }
                setTimeout(() => { this.isBindingData = false; }, 100);
              },
              error: (err) => {
                setTimeout(() => { this.isBindingData = false; }, 100);
              }
            });
          } else {
            setTimeout(() => { this.isBindingData = false; }, 100);
          }
        }
      },
      error: (err) => {
        setTimeout(() => { this.isBindingData = false; }, 100);
      }
    });
  }

  get isClosingFuelInvalid(): boolean {
    const opening = Number(this.formData.opening) || 0;
    const issued = Number(this.formData.issued) || 0;
    const closing = Number(this.formData.closing) || 0;
    return closing > (opening + issued);
  }

  get liveConsumption(): number {
    const opening = Number(this.formData.opening) || 0;
    const issued = Number(this.formData.issued) || 0;
    const closing = Number(this.formData.closing) || 0;
    const consumption = (opening + issued) - closing;
    return consumption > 0 ? consumption : 0;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingFuelId = null;
    this.resetForm();
  }

  saveLog() {
    this.isFormSubmitted = true;

    if (!this.formData.date || !this.formData.machineId || this.formData.issued === null || this.formData.issued === undefined || this.formData.issued === '') {
      this.notificationService.show('Please complete all mandatory fields correctly.', 'error');
      return;
    }

    const opening = Number(this.formData.opening) || 0;
    const issued = Number(this.formData.issued) || 0;
    const closing = Number(this.formData.closing) || 0;

    if (closing > (opening + issued)) {
      this.notificationService.show('Closing Fuel cannot be greater than (Opening + Issued) Fuel.', 'error');
      return;
    }

    let categoryId = null;
    if (this.formData.machineId && this.machinesList.length > 0) {
      const selectedMachine = this.machinesList.find(m => m.machine_id == this.formData.machineId);
      if (selectedMachine) {
        categoryId = selectedMachine.category_id;
      }
    }

    const payload: any = {
      fuel_log_date: this.formData.date ? this.formData.date.replace('T', ' ') + ':00' : '',
      shift_id: this.formData.shift,
      shift_plan_id: this.entryShiftPlanId,
      equipment_id: categoryId,
      equipment_name_id: this.formData.machineId,
      opening_fuel: this.formData.opening,
      fuel_issued: this.formData.issued,
      closing_fuel: this.formData.closing,
      hours_meter_reading: this.formData.hoursMeterReading,
      kilometer_reading: this.formData.kilometerReading,
      remarks: this.formData.remarks
    };

    if (this.isEditMode) {
      payload._method = 'PUT';
      this.fuelService.updateFuelEntry(this.editingFuelId, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.notificationService.show(res.message || 'Fuel entry updated successfully!', 'success');
          this.closeModal();
          this.fetchFuelData();
        }
      });
    } else {
      this.fuelService.createFuelEntry(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.notificationService.show(res.message || 'Fuel entry logged successfully!', 'success');
          this.closeModal();
          this.fetchFuelData();
        }
      });
    }
  }

  // Import logic
  openImportModal() {
    this.isImportModalOpen = true;
    this.importResult = null;
  }

  closeImportModal() {
    this.isImportModalOpen = false;
    this.importResult = null;
    this.fetchFuelData();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      this.isImporting = true;
      this.importResult = null;
      this.fuelService.importFuelEntries(file).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isImporting = false;
          if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
            this.importResult = null;
            this.notificationService.show(res.message || 'Import successful.', 'success', 3000);
            this.closeImportModal();
            this.fetchFuelData();
          } else {
            this.importResult = {
              status: res.status || 422,
              message: res.message || 'Import process completed with errors.',
              errors: res.errors || []
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
                   const msg = Array.isArray(e.errors) ? e.errors.join(', ') : (e.message || 'Unknown error');
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
            errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
          };
        }
      });
      if (this.fileInput && this.fileInput.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

}
