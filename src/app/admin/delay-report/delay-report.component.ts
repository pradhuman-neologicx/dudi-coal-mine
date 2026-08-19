import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPrintModule } from 'ngx-print';
import { NgxPaginationModule } from 'ngx-pagination';
import { Chart, registerables } from 'chart.js';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DelayService } from 'src/app/core/services/delay.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

export interface DelayLogItem {
  id: number | string;
  delay_log_date?: string;
  shift_id?: number | string;
  shift_name?: string;
  delay_category_id?: number | string;
  delay_category_name?: string;
  start_time?: string;
  end_time?: string;
  total_delay_hours?: number;
  equipment_name?: string;
  equipment_name_id?: number | string;
  equipment_id?: number | string;
  linked_breakdown_id?: number | string;
  description?: string;
  remarks?: string;
  severity?: string;
  status?: string | number;
  shift?: string;
  delayType?: string;
  duration_minutes?: number;
  hoursLost?: number;
  [key: string]: any;
}

export interface ShiftCategoryOption {
  id: number | string;
  name: string;
  shift_name?: string;
  [key: string]: any;
}

export interface DelayCategoryOption {
  id: number | string;
  name: string;
  delay_category?: string;
  delay_type?: string;
  [key: string]: any;
}

export interface MachineOptionItem {
  machine_id: number | string;
  category_id?: number | string;
  equipment_category_id?: number | string;
  equipment_id?: number | string;
  breakdown?: any;
  [key: string]: any;
}

export interface ImportResult {
  status: number | string;
  message: string;
  errors: string[];
}

@Component({
  selector: 'app-delay-report',
  templateUrl: './delay-report.component.html',
  styleUrls: ['./delay-report.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgxPrintModule, NgxPaginationModule]
})
export class DelayReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService,
    private delayService: DelayService
  ) { }

  isModalOpen = false;
  isFilterOpen = false;

  isViewModalOpen = false;
  viewDelayData: any = null;

  // Import
  isImportModalOpen = false;
  isImporting = false;
  importResult: ImportResult | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Filters
  selectedDateRange = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterShiftId: any = null;
  filterDelayCategoryId: any = null;
  filterSearch = '';
  filterStatus = ''; // From existing if you want to keep

  delayLogs: DelayLogItem[] = [];
  filteredLogs: DelayLogItem[] = [];
  kpiSummary: any = null;
  chartData: any = null;

  // Dropdown lists
  allShifts: ShiftCategoryOption[] = [];
  allDelayCategories: DelayCategoryOption[] = [];

  // Modal State
  selectedShift = null;
  shifts = [
    { label: 'Shift A', value: 'Shift A' },
    { label: 'Shift B', value: 'Shift B' },
    { label: 'Shift C', value: 'Shift C' }
  ];
  totalWorkingHours = 8.0;
  chart: any;
  chart1: any;
  chart2: any;
  chart4: any;
  editingIndex: number = -1;
  p: number = 1;
  totalItems: number = 0;
  itemsPerPage: number | string = 10;
  tableSizes: number[] = [10, 20, 50, 100];

  get limitNumber(): number {
    return this.itemsPerPage === 'All' ? (this.totalItems || 1) : Number(this.itemsPerPage);
  }

  // Form Data
  formData = {
    id: null as any,
    date: '',
    shiftId: null as any,
    shiftPlanId: null as any,
    delayCategoryId: null as any,
    startTime: '',
    endTime: '',
    machineId: null as any,
    machineCategoryId: null as any,
    breakdownId: null as any,
    description: ''
  };
  machinesList: MachineOptionItem[] = [];
  breakdownList: any[] = [];
  shiftName = '';
  isBindingData = false;
  isSaving = false;
  shiftStartTime = '';
  shiftEndTime = '';

  ngOnInit() {
    this.fetchDropdowns();
    this.getDelayLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) this.chart.destroy();
    if (this.chart1) this.chart1.destroy();
    if (this.chart2) this.chart2.destroy();
    if (this.chart4) this.chart4.destroy();
  }

  fetchDropdowns() {
    this.shiftPlanningService.getShifts().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res && res.status === 200) {
        const data = res.data?.data || res.data || [];
        this.allShifts = data.map((s: any) => ({ ...s, name: s.shift_name || s.name }));
      }
    });
    this.shiftPlanningService.getDelayCategories().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res && res.status === 200) {
        this.allDelayCategories = res.data.map((c: any) => ({ ...c, name: c.name || c.delay_category || c.delay_type }));
      }
    });
  }

  getDelayLogs() {
    if (this.filterDateFrom && this.filterDateTo) {
      if (new Date(this.filterDateTo) < new Date(this.filterDateFrom)) {
        this.notificationService.show('End date cannot be earlier than start date.', 'error');
        this.filterDateTo = this.filterDateFrom;
      }
    }

    const params: any = {
      date_from: this.filterDateFrom,
      date_to: this.filterDateTo,
      shift_id: this.filterShiftId,
      delay_category_id: this.filterDelayCategoryId,
      search: this.filterSearch
    };
    if (this.itemsPerPage !== 'All') {
      params.page = this.p;
      params.limit = this.itemsPerPage;
    }
    this.delayService.getDelayLogs(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.delayLogs = res.data || [];
          this.filteredLogs = [...this.delayLogs];
          this.kpiSummary = res.kpi_summary;
          this.chartData = res.chart_data;
          if (res.pagination) {
            this.totalItems = res.pagination.total;
            this.p = res.pagination.current_page;
            if (this.itemsPerPage !== 'All') {
              this.itemsPerPage = res.pagination.per_page;
            }
          } else {
            this.totalItems = this.delayLogs.length;
          }
          setTimeout(() => {
            this.createChart();
            this.createChart1();
            this.createChart2();
            this.createChart4();
          }, 100);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  createChart() {
    const ctx = document.getElementById('delayChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart) {
      this.chart.destroy();
    }

    let labels: string[] = [];
    let data: number[] = [];
    if (this.chartData && this.chartData.delay_distribution_by_category) {
      labels = this.chartData.delay_distribution_by_category.map((d: any) => d.delay_category_name);
      data = this.chartData.delay_distribution_by_category.map((d: any) => d.total_delay_hours);
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Delay Hours',
          data: data,
          backgroundColor: '#8fa4af',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            display: true,
            beginAtZero: true
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
  }

  createChart1() {
    const ctx = document.getElementById('chart1') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart1) this.chart1.destroy();

    let labels: string[] = [];
    let data: number[] = [];
    if (this.chartData && this.chartData.production_loss_trend) {
      labels = this.chartData.production_loss_trend.map((d: any) => d.date);
      data = this.chartData.production_loss_trend.map((d: any) => d.total_production_loss_bcm);
    }

    this.chart1 = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Production Loss (BCM)',
          data: data,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createChart2() {
    const ctx = document.getElementById('chart2') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart2) this.chart2.destroy();

    let labels: string[] = [];
    let data: number[] = [];
    if (this.chartData && this.chartData.delay_category_contribution) {
      labels = this.chartData.delay_category_contribution.map((d: any) => d.delay_category_name);
      data = this.chartData.delay_category_contribution.map((d: any) => d.total_production_loss_bcm);
    }

    this.chart2 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Production Loss (BCM)',
          data: data,
          backgroundColor: '#3498db',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createChart4() {
    const ctx = document.getElementById('chart4') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.chart4) this.chart4.destroy();

    let labels: string[] = [];
    let data: number[] = [];
    if (this.chartData && this.chartData.delay_severity_distribution) {
      labels = this.chartData.delay_severity_distribution.map((d: any) => d.label || d.severity);
      data = this.chartData.delay_severity_distribution.map((d: any) => d.event_count);
    }

    const backgroundColors = labels.map(label => {
      const l = label.toLowerCase();
      if (l === 'minor' || l === 'low') return '#2ecc71';
      if (l === 'moderate' || l === 'medium') return '#f1c40f';
      if (l === 'major' || l === 'high') return '#e67e22';
      if (l === 'critical') return '#e74c3c';
      return '#bdc3c7';
    });

    this.chart4 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  applyFilter() {
    this.p = 1;
    this.getDelayLogs();
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

    this.p = 1;
    this.getDelayLogs();
  }

  onPageChange(page: number) {
    this.p = page;
    this.getDelayLogs();
  }

  onLimitChange() {
    this.p = 1;
    this.getDelayLogs();
  }

  clearFilters() {
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterShiftId = null;
    this.filterDelayCategoryId = null;
    this.filterSearch = '';
    this.p = 1;
    this.getDelayLogs();
  }

  openModal(log?: any, index?: number) {
    if (log && index !== undefined) {
      this.editingIndex = index;

      this.delayService.getDelayById(log.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            const data = res.data;
            this.isBindingData = true;
            this.formData.id = data.id;
            this.formData.date = data.delay_log_date ? data.delay_log_date.replace(' ', 'T').slice(0, 16) : '';
            this.formData.shiftId = data.shift_id;
            this.formData.shiftPlanId = data.shift_plan_id;
            this.formData.delayCategoryId = data.delay_category_id;
            this.formData.startTime = data.start_time ? data.start_time.slice(0, 5) : '';
            this.formData.endTime = data.end_time ? data.end_time.slice(0, 5) : '';
            this.formData.machineId = data.equipment_name_id;
            this.formData.machineCategoryId = data.equipment_id;
            this.formData.breakdownId = data.linked_breakdown_id;
            this.formData.description = data.description || data.remarks || '';

            this.shiftName = data.shift_name || data.shift?.name || data.shift || '';

            if (this.formData.date) {
              this.shiftPlanningService.shiftPlanFilterByDate(this.formData.date).pipe(takeUntil(this.destroy$)).subscribe({
                next: (shiftRes: any) => {
                  if (shiftRes && shiftRes.status === 200 && shiftRes.data) {
                    this.shiftStartTime = shiftRes.data.start_time || '';
                    this.shiftEndTime = shiftRes.data.end_time || '';
                    this.machinesList = shiftRes.data.machines || [];
                    this.breakdownList = [];
                    if (this.formData.machineId && this.machinesList.length > 0) {
                      const selectedM = this.machinesList.find((m: any) => m.machine_id == this.formData.machineId);
                      if (selectedM && selectedM.breakdown) {
                        this.breakdownList = [selectedM.breakdown];
                      }
                    }
                  }
                  setTimeout(() => { this.isBindingData = false; }, 100);
                },
                error: (err: any) => {
                  setTimeout(() => { this.isBindingData = false; }, 100);
                }
              });
            } else {
              setTimeout(() => { this.isBindingData = false; }, 100);
            }
            this.isModalOpen = true;
          } else {
            this.notificationService.show(res?.message || 'Failed to fetch delay details.', 'error');
          }
        },
        error: (err: any) => {
          this.notificationService.show('Error fetching delay details.', 'error');
        }
      });
    } else {
      this.resetModal();
      this.onDateChange();
      this.isModalOpen = true;
    }
  }

  openViewModal(log: any) {
    this.delayService.getDelayById(log.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.viewDelayData = res.data;
          this.isViewModalOpen = true;
        } else {
          this.notificationService.show(res?.message || 'Failed to fetch delay details.', 'error');
        }
      },
      error: (err: any) => {
        this.notificationService.show('Error fetching delay details.', 'error');
      }
    });
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.viewDelayData = null;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetModal();
  }

  resetModal() {
    this.editingIndex = -1;
    this.totalWorkingHours = 8.0;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);

    this.formData = {
      id: null,
      date: localISOTime,
      shiftId: null,
      shiftPlanId: null,
      delayCategoryId: null,
      startTime: '',
      endTime: '',
      machineId: null,
      machineCategoryId: null,
      breakdownId: null,
      description: ''
    };

    this.shiftName = '';
    this.shiftStartTime = '';
    this.shiftEndTime = '';
    this.machinesList = [];
    this.breakdownList = [];
  }

  get isFormValid(): boolean {
    return !!(
      this.formData.date &&
      this.formData.shiftId &&
      this.formData.delayCategoryId &&
      this.formData.startTime &&
      this.formData.endTime &&
      (this.formData.description && this.formData.description.trim() !== '')
    );
  }

  onDateChange() {
    if (this.isBindingData) return;

    if (this.formData.date) {
      this.shiftPlanningService.shiftPlanFilterByDate(this.formData.date).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            console.log('Shift Data Response (by-datetime):', res.data);
            this.shiftStartTime = res.data.start_time || '';
            this.shiftEndTime = res.data.end_time || '';
            this.formData.shiftId = res.data.id || res.data.shift_id || res.data;
            this.shiftName = res.data.name;
            this.formData.shiftPlanId = res.data.shift_plan_id;
            this.machinesList = res.data.machines || [];
            this.breakdownList = [];

            // If editing/pre-selected, populate breakdown list for that specific machine
            if (this.formData.machineId && this.machinesList.length > 0) {
              const selectedM = this.machinesList.find((m: any) => m.machine_id == this.formData.machineId);
              if (selectedM && selectedM.breakdown) {
                this.breakdownList = [selectedM.breakdown];
              }
            }
          } else {
            this.notificationService.show(res?.message || 'No shift plan found for the selected date.', 'error');
            this.formData.shiftId = null;
            this.shiftName = '';
            this.shiftStartTime = '';
            this.shiftEndTime = '';
            this.formData.shiftPlanId = null;
            this.machinesList = [];
            this.breakdownList = [];
          }
        },
        error: (err: any) => {
          console.error('Error fetching shift by datetime', err);
          this.notificationService.show(err.error?.message || err.message || 'Error fetching shift details.', 'error');
          this.formData.shiftId = null;
          this.shiftName = '';
          this.shiftStartTime = '';
          this.shiftEndTime = '';
          this.formData.shiftPlanId = null;
          this.machinesList = [];
          this.breakdownList = [];
          this.isBindingData = false;
        }
      });
    } else {
      this.formData.shiftId = null;
      this.shiftName = '';
      this.shiftStartTime = '';
      this.shiftEndTime = '';
      this.formData.shiftPlanId = null;
      this.machinesList = [];
      this.breakdownList = [];
    }
  }

  onMachineSelect(machine: any) {
    this.breakdownList = [];
    if (!this.isBindingData) {
      this.formData.breakdownId = null;
    }

    if (machine) {
      this.formData.machineCategoryId = machine.category_id || machine.equipment_category_id || machine.equipment_id;

      if (machine.breakdown) {
        this.breakdownList = [machine.breakdown];
        if (!this.isBindingData) {
          this.formData.breakdownId = machine.breakdown.id;
        }
      }
    } else {
      this.formData.machineCategoryId = null;
    }
  }

  saveDelay() {
    if (!this.formData.date || !this.formData.shiftId || !this.formData.delayCategoryId || !this.formData.startTime || !this.formData.endTime || !this.formData.description || this.formData.description.trim() === '') {
      this.notificationService.show('Please fill all required fields', 'error');
      return;
    }

    const [startH, startM] = this.formData.startTime.split(':').map(Number);
    const [endH, endM] = this.formData.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (endMins < startMins) {
      this.notificationService.show('End time cannot be before start time. If the delay crosses midnight, please log it as two separate entries.', 'error');
      return;
    }

    if (this.shiftStartTime && this.shiftEndTime) {
      const [sShiftH, sShiftM] = this.shiftStartTime.split(':').map(Number);
      const shiftStartMins = sShiftH * 60 + (sShiftM || 0);
      
      const [eShiftH, eShiftM] = this.shiftEndTime.split(':').map(Number);
      const shiftEndMins = eShiftH * 60 + (eShiftM || 0);

      let isStartValid = false;
      let isEndValid = false;

      if (shiftStartMins <= shiftEndMins) {
        isStartValid = startMins >= shiftStartMins && startMins <= shiftEndMins;
        isEndValid = endMins >= shiftStartMins && endMins <= shiftEndMins;
      } else {
        isStartValid = startMins >= shiftStartMins || startMins <= shiftEndMins;
        isEndValid = endMins >= shiftStartMins || endMins <= shiftEndMins;
      }

      if (!isStartValid || !isEndValid) {
        this.notificationService.show(`Delay time must fall within the shift hours (${this.shiftStartTime} to ${this.shiftEndTime}).`, 'error');
        return;
      }
    }

    this.isSaving = true;
    let formattedDate = '';
    if (this.formData.date) {
      formattedDate = this.formData.date.replace('T', ' ');
      if (formattedDate.length === 16) {
        formattedDate += ':00';
      }
    }

    const payload = new FormData();
    payload.append('shift_id', this.formData.shiftId);
    payload.append('delay_log_date', formattedDate);
    payload.append('shift_plan_id', this.formData.shiftPlanId);
    payload.append('delay_category_id', this.formData.delayCategoryId);
    payload.append('start_time', this.formData.startTime.length === 5 ? this.formData.startTime + ':00' : this.formData.startTime);
    payload.append('end_time', this.formData.endTime.length === 5 ? this.formData.endTime + ':00' : this.formData.endTime);

    if (this.formData.breakdownId) payload.append('linked_breakdown_id', this.formData.breakdownId);
    if (this.formData.machineCategoryId) payload.append('equipment_id', this.formData.machineCategoryId);
    if (this.formData.machineId) payload.append('equipment_name_id', this.formData.machineId);
    if (this.formData.description) payload.append('description', this.formData.description);

    if (this.editingIndex > -1 && this.formData.id) {
      payload.append('_method', 'PUT');
      this.delayService.updateDelay(this.formData.id, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && (res.status === 200 || res.status === 201)) {
            this.notificationService.show('Delay updated successfully', 'success');
            this.getDelayLogs();
            this.closeModal();
          } else {
            this.notificationService.show(res.message || 'Error updating delay', 'error');
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error(err);
          this.notificationService.show(err.error?.message || err.message || 'Error updating delay', 'error');
        }
      });
    } else {
      this.delayService.saveDelay(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && (res.status === 200 || res.status === 201)) {
            this.notificationService.show('Delay logged successfully', 'success');
            this.getDelayLogs();
            this.closeModal();
          } else {
            this.notificationService.show(res.message || 'Error logging delay', 'error');
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error(err);
          this.notificationService.show(err.error?.message || err.message || 'Error logging delay', 'error');
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
    this.getDelayLogs();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      this.isImporting = true;
      this.importResult = null;
      this.delayService.importDelays(file).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isImporting = false;
          if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
            this.importResult = null;
            this.notificationService.show(res.message || 'Import successful.', 'success', 3000);
            this.closeImportModal();
            this.getDelayLogs();
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
