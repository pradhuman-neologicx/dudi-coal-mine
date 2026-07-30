import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DispatchDumpingService } from 'src/app/core/services/dispatch-dumping.service';
import { DumpingPointService } from 'src/app/core/services/dumping-point.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';

export interface DumperTrip {
  id?: string;
  trip_ref_no?: string;
  shift_date?: string;
  shift_name?: string;
  dumper_no: string;
  driver_name: string;
  excavator_no: string;
  loading_point: string;
  dumping_point: string;
  start_time: string;
  end_time: string;
  quantity: number;
  distance: number;
  total_cycles?: number;
  cycle_time?: string;
  site_name?: string;
  status?: string;
  created_at?: string;
}

import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-dumping',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './dumping.component.html',
  styleUrl: './dumping.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class DumpingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  trips: DumperTrip[] = [];
  displayTrips: DumperTrip[] = [];

  // Dumper Summary Stats
  totalTrips: number = 0;
  totalQuantity: number = 0;
  avgCycleTime: string = '00:00:00';

  bestPerformingDumper = { dumper: 'N/A', quantity: 0 };
  highestTripDumper = { dumper: 'N/A', trips: 0 };
  fastestDumper = { dumper: 'N/A', cycleTime: 0 };

  page: number = 1;
  totalRecords: number = 0;
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100];

  searchbarform!: FormGroup;
  showreset: boolean = false;

  modalOpen: boolean = false;
  viewModalOpen: boolean = false;
  tripForm!: FormGroup;
  selectedTrip: DumperTrip | null = null;

  isEditMode: boolean = false;
  editTripId: any = null;

  isImportModalOpen: boolean = false;
  isImporting: boolean = false;
  importResult: any = null;

  // Date / Shift auto-select (same pattern as Breakdown)
  entryDate: string = '';
  entryShift: string = '';
  shiftName: string = '';
  entryShiftPlanId: any = null;
  machinesList: any[] = [];

  // Dropdown data
  dumpers: any[] = [];
  excavators: any[] = [];
  drivers: string[] = [];
  sites: any[] = [];
  loadingPoints: any[] = [];
  dumpingPoints: any[] = [];
  allShifts: any[] = [];

  // Filters
  filterShiftId: any = null;
  filterDateFrom: string = '';
  filterDateTo: string = '';
  selectedDateRange: string = '';

  constructor(
    private fb: FormBuilder,
    private dispatchService: DispatchDumpingService,
    private pointService: DumpingPointService,
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });

    this.tripForm = this.fb.group({
      site_id: [null, Validators.required],
      driver_name: [null, Validators.required],
      excavator_no: [null],
      dumper_no: [null, Validators.required],
      loading_point: ['', Validators.required],
      dumping_point: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      distance: ['', [Validators.required, Validators.min(0.1)]],
      cycle_time: [{ value: '', disabled: true }],
      total_trips: [1, [Validators.required, Validators.min(1)]]
    });

    // Auto calculate cycle time on time changes
    this.tripForm.get('start_time')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calculateCycleTime());
    this.tripForm.get('end_time')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calculateCycleTime());

    // Fetch initial data
    this.fetchShifts();
    this.GetTripsFun();
    this.fetchSites();
    this.fetchDrivers();
  }

  fetchSites(): void {
    this.pointService.getSites().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.sites = res.data;
        }
      },
      error: (err: any) => console.error('Error fetching sites:', err)
    });
  }

  fetchDrivers(): void {
    this.dispatchService.getDrivers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          // Map the driver objects to explicitly guarantee 'id' and 'name' 
          // properties exist for the ng-select binding, regardless of API property names.
          this.drivers = res.data.map((d: any) => ({
            ...d,
            id: d.id ? Number(d.id) : (d.employee_id ? Number(d.employee_id) : null),
            name: d.name || d.employee_name || d.first_name || 'Unknown'
          })).filter((d: any) => d.id !== null);
        }
      },
      error: (err: any) => console.error('Error fetching drivers:', err)
    });
  }

  fetchSitePoints(siteId: any): void {
    this.pointService.getSitePointsBySiteId(siteId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.loadingPoints = res.data.filter((p: any) => p.type?.toLowerCase() === 'loading');
          this.dumpingPoints = res.data.filter((p: any) => p.type?.toLowerCase() === 'dumping');
        }
      },
      error: (err: any) => console.error('Error fetching site points:', err)
    });
  }

  onSiteChange(): void {
    // Reset points when site is manually changed
    this.tripForm.patchValue({
      loading_point: null,
      dumping_point: null
    });
    this.loadingPoints = [];
    this.dumpingPoints = [];

    const siteId = this.tripForm.get('site_id')?.value;
    if (siteId) {
      this.fetchSitePoints(siteId);
    }
  }

  // ─── Date → Shift auto-select (same as Breakdown module) ───────────────────
  onDateChange(): void {
    if (this.entryDate) {
      this.shiftPlanningService.shiftPlanFilterByDate(this.entryDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            this.entryShift = res.data.id || res.data.shift_id;
            this.shiftName = res.data.name;
            this.entryShiftPlanId = res.data.shift_plan_id;
            this.machinesList = res.data.machines || [];
            this.dumpers = this.machinesList
              .filter((m: any) => m.category_name?.toLowerCase().includes('dumper'));
            this.excavators = this.machinesList
              .filter((m: any) => m.category_name?.toLowerCase().includes('excavator'));

            if (res.data.site && res.data.site.id) {
              this.tripForm.patchValue({ site_id: res.data.site.id });
              this.fetchSitePoints(res.data.site.id);
            }
          } else {
            this.notificationService.show(res?.message || 'No shift plan found for the selected date.', 'error');
            this.resetShiftFields();
            this.shiftName = 'No data found for this date';
          }
        },
        error: (err: any) => {
          this.notificationService.show(err.error?.message || err.message || 'Error fetching shift details.', 'error');
          this.resetShiftFields();
          this.shiftName = 'No data found for this date';
        }
      });
    } else {
      this.resetShiftFields();
    }
  }

  resetShiftFields(): void {
    this.entryShift = '';
    this.shiftName = '';
    this.entryShiftPlanId = null;
    this.machinesList = [];
    this.dumpers = [];
    this.excavators = [];
  }

  getSiteName(): string {
    const siteId = this.tripForm.get('site_id')?.value;
    if (siteId && this.sites) {
      const site = this.sites.find((s: any) => s.id === siteId);
      return site ? site.name : '';
    }
    return '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculateCycleTime(): void {
    const start = this.tripForm.get('start_time')?.value;
    const end = this.tripForm.get('end_time')?.value;

    if (start && end) {
      const startTime = new Date(`1970-01-01T${start}:00`);
      let endTime = new Date(`1970-01-01T${end}:00`);

      if (endTime < startTime) {
        // Handle next day scenario (e.g. 23:00 to 01:00)
        endTime.setDate(endTime.getDate() + 1);
      }

      const diffMs = endTime.getTime() - startTime.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);

      const cycleTimeStr = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')} Hrs`;
      this.tripForm.patchValue({ cycle_time: cycleTimeStr }, { emitEvent: false });
    } else {
      this.tripForm.patchValue({ cycle_time: '' }, { emitEvent: false });
    }
  }

  fetchShifts(): void {
    this.shiftPlanningService.getShifts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          const data = res.data?.data || res.data || [];
          this.allShifts = data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching shifts:', err);
      }
    });
  }

  applyFilter(): void {
    this.page = 1;
    this.GetTripsFun();
  }

  resetFilters(): void {
    this.filterShiftId = null;
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.selectedDateRange = '';
    this.applyFilter();
  }

  onDateRangeChange(): void {
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
    
    this.applyFilter();
  }

  GetTripsFun(): void {
    if (this.filterDateFrom && this.filterDateTo) {
      if (new Date(this.filterDateTo) < new Date(this.filterDateFrom)) {
        this.notificationService.show('End date cannot be earlier than start date.', 'error', 3000);
        this.filterDateTo = this.filterDateFrom;
      }
    }

    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    const filters = {
      date_from: this.filterDateFrom,
      date_to: this.filterDateTo,
      shift_id: this.filterShiftId
    };

    const effectiveTableSize = searchText ? 'all' : this.tableSize;
    const apiSearchText = searchText ? '' : searchText; // Disable backend search if we are searching locally

    this.dispatchService.getTrips(effectiveTableSize, this.page, apiSearchText, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            this.trips = response.data.map((item: any) => {
              const getShortTime = (dateStr: string) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? dateStr : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              };
              const shiftDateStr = item.shift_plan?.planning_date;
              const dateObj = shiftDateStr ? new Date(shiftDateStr) : null;
              const shortDate = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '';

              return {
                id: item.id,
                trip_ref_no: item.trip_reference_no,
                shift_date: shortDate,
                shift_name: item.shift_plan?.shift?.shift_name || '',
                dumper_no: item.dumper?.equipment_name || '',
                driver_name: item.driver?.name || '',
                excavator_no: item.excavator?.equipment_name || '',
                loading_point: item.loading_point?.name || '',
                dumping_point: item.dumping_point?.name || '',
                start_time: getShortTime(item.start_time),
                end_time: getShortTime(item.end_time),
                quantity: parseFloat(item.quantity_bcm) || 0,
                distance: parseFloat(item.distance_meters) || 0,
                total_cycles: item.total_cycles || 0,
                cycle_time: item.cycle_time_minutes ? `${item.cycle_time_minutes} Mins` : '',
                site_name: item.site?.site_name || '',
                status: item.status || '',
                created_at: item.created_at || '',
                cycle_time_raw: parseFloat(item.cycle_time_minutes) || 0
              };
            });
            
            if (searchText) {
              const s = searchText.toLowerCase();
              this.displayTrips = this.trips.filter(t => 
                t.dumper_no?.toLowerCase().includes(s) || 
                t.trip_ref_no?.toLowerCase().includes(s) ||
                t.driver_name?.toLowerCase().includes(s) ||
                t.excavator_no?.toLowerCase().includes(s) ||
                t.loading_point?.toLowerCase().includes(s) ||
                t.dumping_point?.toLowerCase().includes(s)
              );
              this.totalRecords = this.displayTrips.length;
            } else {
              this.displayTrips = this.trips;
              this.totalRecords = response.pagination?.total || response.data.length;
            }

            if (response.dashboard) {
              this.totalTrips = response.dashboard.total_trips || 0;
              this.totalQuantity = response.dashboard.total_quantity_bcm || 0;
              this.avgCycleTime = (response.dashboard.average_cycle_time_minutes || 0) + ' Mins';
              
              this.bestPerformingDumper = {
                dumper: response.dashboard.best_performing_dumper?.dumper_number || 'N/A',
                quantity: response.dashboard.best_performing_dumper?.value || 0
              };
              
              this.highestTripDumper = {
                dumper: response.dashboard.highest_trip_count_dumper?.dumper_number || 'N/A',
                trips: response.dashboard.highest_trip_count_dumper?.value || 0
              };
              
              this.fastestDumper = {
                dumper: response.dashboard.fastest_dumper?.dumper_number || 'N/A',
                cycleTime: response.dashboard.fastest_dumper?.value || 0
              };
            }
          }
        },
        error: (error: any) => {
          console.error('Error fetching trips:', error);
        }
      });
  }

  searchfun(): void {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.page = 1;
    this.GetTripsFun();
  }

  resetsearchbar(): void {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetTripsFun();
  }

  onTableDataChange(event: any): void {
    this.page = event;
    this.GetTripsFun();
  }

  onTableSizeChange(event: any): void {
    const val = event?.target?.value !== undefined ? event.target.value : event;
    this.tableSize = val === 'all' ? 'all' : Number(val);
    this.page = 1;
    this.GetTripsFun();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editTripId = null;
    this.tripForm.reset({ total_trips: 1 });
    this.resetShiftFields();
    this.modalOpen = true;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    this.entryDate = localISOTime;
    this.onDateChange();
  }

  openEditModal(trip: DumperTrip): void {
    this.isEditMode = true;
    this.editTripId = trip.id;
    this.tripForm.reset();

    if (trip.id) {
      this.dispatchService.getTripById(trip.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 && response.data) {
              const item = response.data;

              if (item.trip_info?.trip_date_time) {
                this.entryDate = item.trip_info.trip_date_time.replace(' ', 'T').substring(0, 16);
                this.onDateChange();
              }

              const getShortTime = (dateStr: string) => {
                if (!dateStr) return '';
                const parts = dateStr.split(' ');
                if (parts.length > 1) {
                  return parts[1].substring(0, 5);
                }
                const d = new Date(dateStr.replace(' ', 'T'));
                return isNaN(d.getTime()) ? dateStr : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              };

              const siteId = item.operational_info?.site?.id;
              if (siteId) {
                this.fetchSitePoints(siteId);
              }

              this.tripForm.patchValue({
                site_id: siteId,
                driver_name: item.equipment_info?.driver?.id,
                excavator_no: item.equipment_info?.excavator?.id,
                dumper_no: item.equipment_info?.dumper?.id,
                loading_point: item.route_info?.loading_point?.id,
                dumping_point: item.route_info?.dumping_point?.id,
                start_time: getShortTime(item.trip_info?.start_time),
                end_time: getShortTime(item.trip_info?.end_time),
                quantity: parseFloat(item.trip_info?.quantity_bcm) || 0,
                distance: parseFloat(item.trip_info?.distance_meters) || 0,
                total_trips: 1
              });

              this.modalOpen = true;
            }
          },
          error: (error: any) => {
            console.error('Error fetching trip details for edit:', error);
          }
        });
    }
  }

  openViewModal(trip: DumperTrip): void {
    this.viewModalOpen = true;
    this.selectedTrip = null;

    if (trip.id) {
      this.dispatchService.getTripById(trip.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 && response.data) {
              const item = response.data;
              const getShortTime = (dateStr: string) => {
                if (!dateStr) return '';
                const parts = dateStr.split(' ');
                if (parts.length > 1) {
                  return parts[1].substring(0, 5); // Returns HH:mm
                }
                const d = new Date(dateStr.replace(' ', 'T'));
                return isNaN(d.getTime()) ? dateStr : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              };

              const shiftDateStr = item.operational_info?.shift_plan?.planning_date || '';

              this.selectedTrip = {
                id: item.trip_info?.id,
                trip_ref_no: item.trip_info?.trip_reference_no || '',
                shift_date: shiftDateStr.split(' ')[0], // Extracts YYYY-MM-DD
                shift_name: item.operational_info?.shift_plan?.shift_name || '',
                dumper_no: item.equipment_info?.dumper?.machine_number || '',
                driver_name: item.equipment_info?.driver?.name || '',
                excavator_no: item.equipment_info?.excavator?.machine_number || '',
                loading_point: item.route_info?.loading_point?.name || '',
                dumping_point: item.route_info?.dumping_point?.name || '',
                start_time: getShortTime(item.trip_info?.start_time),
                end_time: getShortTime(item.trip_info?.end_time),
                quantity: parseFloat(item.trip_info?.quantity_bcm) || 0,
                distance: parseFloat(item.trip_info?.distance_meters) || 0,
                total_cycles: item.trip_info?.total_cycles || trip.total_cycles || 0,
                cycle_time: item.trip_info?.cycle_time_minutes ? `${item.trip_info?.cycle_time_minutes} Mins` : '',
                site_name: item.operational_info?.site?.name || '',
                status: item.trip_info?.status || '',
                created_at: item.trip_info?.created_at || ''
              };
            }
          },
          error: (error: any) => {
            console.error('Error fetching trip details:', error);
          }
        });
    }
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewModalOpen = false;
    this.selectedTrip = null;
  }

  openImportModal(): void {
    this.importResult = null;
    this.isImportModalOpen = true;
  }

  closeImportModal(): void {
    this.isImportModalOpen = false;
    this.isImporting = false;
    if (this.importResult?.status === 200 && (!this.importResult?.errors || this.importResult.errors.length === 0)) {
      this.GetTripsFun();
    }
    this.importResult = null;
  }

  onImportFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isImporting = true;
      this.importResult = null;
      
      const formData = new FormData();
      formData.append('file', file);
      
      this.dispatchService.importTrips(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isImporting = false;
          if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
            this.importResult = null;
            this.notificationService.show(res.message || 'Import successful.', 'success', 3000);
            this.closeImportModal();
            this.GetTripsFun();
          } else {
            this.importResult = {
              status: res.status || 422,
              message: res.message || 'Import process completed with errors.',
              errors: res.errors || []
            };
          }
          event.target.value = '';
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
          event.target.value = '';
        }
      });
    }
  }

  saveTrip(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }
    const val = this.tripForm.getRawValue();

    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    };

    let tripDateTime = '';
    if (this.entryDate) {
      tripDateTime = this.entryDate.length === 16 ? this.entryDate.replace('T', ' ') + ':00' : this.entryDate.replace('T', ' ');
    }

    const payload: any = {
      trip_date_time: tripDateTime,
      shift_id: this.entryShift || null,
      shift_plan_id: this.entryShiftPlanId || null,
      excavator_equipment_id: val.excavator_no,
      dumper_equipment_id: val.dumper_no,
      driver_id: val.driver_name,
      loading_point_id: val.loading_point,
      dumping_point_id: val.dumping_point,
      start_time: formatTime(val.start_time),
      end_time: formatTime(val.end_time),
      quantity_bcm: val.quantity,
      distance_meters: val.distance,
      site_id: val.site_id
    };

    if (val.total_trips) {
      payload.total_cycles = val.total_trips;
    }

    const request$ = this.isEditMode
      ? this.dispatchService.updateTrip(this.editTripId, payload)
      : this.dispatchService.logTrip(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.closeModal();
          this.notificationService.show(response.message || `Trip ${this.isEditMode ? 'updated' : 'logged'} successfully!`, 'success', 3000);
          this.GetTripsFun();
        } else {
          this.notificationService.show(response.message || `Failed to ${this.isEditMode ? 'update' : 'log'} trip`, 'error', 3000);
        }
      },
      error: (error: any) => {
        console.error(`Error ${this.isEditMode ? 'updating' : 'logging'} trip:`, error);

        let errorMsg = 'An error occurred';
        if (error.error?.errors) {
          const firstErrorKey = Object.keys(error.error.errors)[0];
          errorMsg = error.error.errors[firstErrorKey][0];
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        // this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
