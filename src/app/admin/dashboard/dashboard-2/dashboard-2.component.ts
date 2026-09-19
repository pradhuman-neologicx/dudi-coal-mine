import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { Subject, of, Observable, Subscription, concat } from 'rxjs';
import { concatMap, delay, repeat, takeUntil, catchError, tap, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';

export interface FuelVehicle {
  source: string;
  chassis_number: string;
  machine_id: string | null;
  dumper_no: string | null;
  display_name: string;
  connectivity: string;
  is_stale: boolean;
  age_minutes: number;
  last_reported_at: string;
  vendor_status: string | null;
  vehicle_speed: number | null;
  engine_rpm: number | null;
  ignition: boolean | null;
  operational_state: string;
  fuel_level_pct: number;
  fuel_level_ltr: number | null;
  fuel_status: string;
  adblue_pct: number | null;
  def_level_ltr: number | null;
  odometer_km: number | null;
  engine_hours: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface FuelDashboardResponse {
  counts: {
    normal: number;
    low: number;
    critical: number;
    unknown: number;
  };
  percentages: {
    normal: number;
    low: number;
    critical: number;
  };
  average_pct: number;
  total_litres: number;
  basis: string;
  basis_count: number;
  stale_readings: number;
  thresholds: {
    normal_min: number;
    critical_max: number;
  };
  lowest: FuelVehicle[];
}

export interface SafetyEventVehicle {
  machine_id: string | null;
  chassis_number: string;
  dumper_no: string;
  count: number;
  critical: number;
  warning: number;
}

export interface FleetOperationsResponse {
  operational: {
    counts: any;
    percentages: any;
    basis: string;
    basis_count: number;
  };
  safety_events: {
    available: boolean;
    from: string;
    to: string;
    counts: any;
    breakdown: any[];
    total: number;
    by_vehicle: SafetyEventVehicle[];
    basis: string;
    basis_count: number;
    fleet_count: number;
    truck_connect_harsh: {
      harsh_braking: number;
      harsh_acceleration: number;
      harsh_cornering: number;
      readings_in_range: number;
    };
  };
}

@Component({
  selector: 'app-dashboard-2',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './dashboard-2.component.html',
  styleUrls: ['./dashboard-2.component.scss']
})
export class Dashboard2Component implements OnInit, OnDestroy {
  summaryData: any = null;
  isLoading: boolean = true;
  error: string | null = null;
  
  telemetryData: any[] = [];
  isVehiclesLoading: boolean = true;
  vehiclesError: string | null = null;
  
  fuelStatusData: any = null;
  isFuelStatusLoading: boolean = true;
  fuelStatusError: string | null = null;
  
  operationsData: any = null;
  isOperationsLoading: boolean = true;
  operationsError: string | null = null;
  
  // Refresh State
  isRefreshing: boolean = false;
  syncProgressPercentage: number = 0;
  lastSyncTime: Date = new Date();
  
  refreshStatusData: any = null;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // API Subscriptions for request cancellation
  private summarySub?: Subscription;
  private vehiclesSub?: Subscription;
  private fuelSub?: Subscription;
  private operationsSub?: Subscription;
  private pollingSub?: Subscription;
  private activeMachinesSub?: Subscription;
  allActiveMachines: any[] = [{ id: 'All Dumpers', name: 'All Dumpers' }]; // Bind directly to dropdown
  dumperTypeahead = new Subject<string>();
  isDumperLoading = false;
  
  pagination: any = {
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 0,
    to: 0
  };

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    console.log('Dumper Fleet Dashboard initialized. Refresh status check removed.');
    this.fetchFleetSummary();
    this.fetchVehicles();
    this.fetchFuelStatus();
    this.fetchOperations();
    this.fetchActiveMachines();
    this.fetchRecentAlerts();

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.refreshData();
    });
  }

  fetchActiveMachines() {
    this.isDumperLoading = true;
    this.activeMachinesSub = this.dashboardService.getActiveMachines().subscribe({
      next: (res: any) => {
        if (res?.status === 200 && res?.data) {
          // Map active machines, using chassis_number as ID
          const mapped = res.data.map((m: any) => ({
            id: m.id,
            name: m.chassis_number || m.equipment_name
          }));
          
          this.allActiveMachines = [{ id: 'All Dumpers', name: 'All Dumpers' }, ...mapped];
        }
        this.isDumperLoading = false;
      },
      error: (err) => {
        console.error('Error fetching active machines:', err);
        this.isDumperLoading = false;
      }
    });

    this.dumperTypeahead.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isDumperLoading = true),
      switchMap(term => this.dashboardService.getActiveMachines(term).pipe(
        catchError(() => of(null))
      )),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res?.status === 200 && res?.data) {
        const mapped = res.data.map((m: any) => ({
          id: m.id,
          name: m.chassis_number || m.equipment_name
        }));
        this.allActiveMachines = [{ id: 'All Dumpers', name: 'All Dumpers' }, ...mapped];
      }
      this.isDumperLoading = false;
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  manualRefresh(event: Event | null) {
    if (event) event.stopPropagation();
    
    this.isRefreshing = true;
    
    // Explicitly reset the complete status to false locally 
    // so that the next true transition will definitely trigger a data refresh.
    if (this.refreshStatusData?.data) {
        this.refreshStatusData.data.complete = false;
    } else {
        this.refreshStatusData = { data: { complete: false } };
    }

    this.dashboardService.triggerFleetRefresh().subscribe({
      next: (res: any) => {
        if (this.pollingSub) this.pollingSub.unsubscribe();
        
        // Start polling only when manual refresh is clicked
        this.pollingSub = of(null).pipe(
          concatMap(() => this.fetchRefreshStatus()),
          delay(5000), // Poll every 5s while refreshing
          repeat(),
          takeUntil(this.destroy$)
        ).subscribe();
      },
      error: (err: any) => {
        console.error('Error triggering fleet refresh:', err);
        // Fallback: If trigger fails, refresh data anyway so UI doesn't hang
        this.refreshData(); 
        setTimeout(() => this.isRefreshing = false, 500);
      }
    });
  }

  fetchRefreshStatus(): Observable<any> {
    return this.dashboardService.getFleetRefreshStatus().pipe(
      tap((res: any) => {
        if (res?.status) {
          
          // Track state transition to determine when sync finishes
          const wasComplete = this.refreshStatusData?.data?.complete;
          const isNowComplete = res.data?.complete;
          
          if (this.refreshStatusData) {
            // Targeted mutation: update properties instead of replacing the object
            // This preserves memory reference and entirely prevents DOM blinking/flickering
            this.refreshStatusData.message = res.message;
            if (this.refreshStatusData.data && res.data) {
              Object.assign(this.refreshStatusData.data, res.data);
            } else {
              this.refreshStatusData.data = res.data;
            }
          } else {
            this.refreshStatusData = res;
          }

          // Calculate Progress Percentage for the Premium UI Bar
          if (res.data?.progress) {
            const parts = res.data.progress.split('/');
            if (parts.length === 2) {
              this.syncProgressPercentage = (parseInt(parts[0]) / parseInt(parts[1])) * 100;
            }
          }
          if (isNowComplete === true) {
            this.syncProgressPercentage = 100;
          } else if (isNowComplete === false && !res.data?.progress) {
            // Initial tiny progress when started but progress string not yet available
            this.syncProgressPercentage = 5; 
          }

          // Event-Driven Data Loading:
          // If the sync was NOT complete previously, but is now complete:
          if (wasComplete === false && isNowComplete === true) {
            this.refreshData(); // Fetch fresh data for all dashboard cards and tables exactly ONCE!
          }
          
          // Sync UI spinner state with actual backend state
          if (isNowComplete === true) {
            this.isRefreshing = false;
            if (this.pollingSub) this.pollingSub.unsubscribe();
          } else if (isNowComplete === false) {
            this.isRefreshing = true;
          }
        }
      }),
      catchError(err => {
        console.error('Error fetching refresh status:', err);
        return of(null);
      })
    );
  }

  fetchFleetSummary() {
    this.isLoading = true;
    if (this.summarySub) this.summarySub.unsubscribe();
    const filters = this.buildFilters();
    this.summarySub = this.dashboardService.getFleetSummary(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.summaryData = res.data;
          this.lastSyncTime = res.parsedSyncTime || new Date();
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching fleet summary:', err);
        this.error = 'Failed to load fleet summary.';
        this.isLoading = false;
      }
    });
  }

  buildFilters(): any {
    const filters: any = {};
    
    if (this.selectedDate) {
      const dateMap: any = {
        'Today': 'today',
        'Yesterday': 'yesterday',
        'Last 7 Days': 'last_7_days',
        'Last 30 Days': 'last_30_days'
      };
      
      if (dateMap[this.selectedDate]) {
        filters.range = dateMap[this.selectedDate];
      } else if (this.selectedDate.includes(' to ')) {
        const parts = this.selectedDate.split(' to ');
        if (parts.length === 2) {
          filters.from = parts[0];
          filters.to = parts[1];
        }
      }
    }
    
    if (this.selectedDumper !== 'All Dumpers') {
      filters.machine_id = String(this.selectedDumper);
    }
    
    if (this.selectedConnectivity !== 'All') {
      filters.connectivity = this.selectedConnectivity.toLowerCase();
    }
    
    if (this.selectedOpStatus !== 'All') {
      filters.operational_status = this.selectedOpStatus.toLowerCase().replace(' ', '_');
    }
    
    if (this.selectedFuelStatus !== 'All') {
      const fuelStatusMap: any = {
        'Normal (>40%)': 'normal',
        'Low (20-40%)': 'low',
        'Critical (<20%)': 'critical'
      };
      if (fuelStatusMap[this.selectedFuelStatus]) {
        filters.fuel_status = fuelStatusMap[this.selectedFuelStatus];
      }
    }
    
    if (this.selectedSource !== 'All') {
      const sourceMap: any = {
        'VECV': 'vecv',
        'Truck Connect': 'truck_connect'
      };
      if (sourceMap[this.selectedSource]) {
        filters.source = sourceMap[this.selectedSource];
      }
    }
    
    if (this.searchTerm) filters.search = this.searchTerm;
    
    return filters;
  }

  refreshData() {
    this.pagination.current_page = 1;
    this.fetchFleetSummary();
    this.fetchVehicles();
    this.fetchFuelStatus();
    this.fetchOperations();
    this.fetchRecentAlerts();
  }

  fetchVehicles() {
    this.isVehiclesLoading = true;
    if (this.vehiclesSub) this.vehiclesSub.unsubscribe();
    const filters = {
      ...this.buildFilters(),
      page: this.pagination.current_page,
      limit: this.selectedPageSize
    };

    this.vehiclesSub = this.dashboardService.getFleetVehicles(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.telemetryData = res.data;
          this.pagination = res.pagination;
          if (this.sortColumn) {
             this.sortTelemetryData();
          }
        }
        this.isVehiclesLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching fleet vehicles:', err);
        this.vehiclesError = 'Failed to load vehicles.';
        this.isVehiclesLoading = false;
      }
    });
  }

  fetchFuelStatus() {
    this.isFuelStatusLoading = true;
    if (this.fuelSub) this.fuelSub.unsubscribe();
    const filters = this.buildFilters();
    this.fuelSub = this.dashboardService.getFleetFuel(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.fuelStatusData = res.data;
        }
        this.isFuelStatusLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching fuel status:', err);
        this.fuelStatusError = 'Failed to load fuel status.';
        this.isFuelStatusLoading = false;
      }
    });
  }

  fetchOperations() {
    this.isOperationsLoading = true;
    if (this.operationsSub) this.operationsSub.unsubscribe();
    const filters = this.buildFilters();
    this.operationsSub = this.dashboardService.getFleetOperations(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.operationsData = res.data;
          
          if (res.data.safety_events && res.data.safety_events.by_vehicle) {
            const rawEvents = res.data.safety_events.by_vehicle;
            const maxCount = rawEvents.length > 0 ? Math.max(...rawEvents.map((r: any) => r.count)) : 0;
            this.eventsByDumper = rawEvents.map((r: any) => ({
              no: r.dumper_no,
              count: r.count,
              width: maxCount > 0 ? `${(r.count / maxCount) * 100}%` : '0%'
            }));
          } else {
            this.eventsByDumper = [];
          }
        }
        this.isOperationsLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching fleet operations:', err);
        this.operationsError = 'Failed to load fleet operations.';
        this.isOperationsLoading = false;
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.pagination.current_page = page;
      this.fetchVehicles();
    }
  }

  getFuelColorClass(fuel: number | null | undefined): string {
    if (fuel === null || fuel === undefined) return 'bg-gray-200';
    if (fuel < 20) return 'bg-red-500';
    if (fuel < 40) return 'bg-amber-500';
    return 'bg-green-500';
  }

  getFuelStatusBadge(status: string) {
    switch(status?.toLowerCase()) {
      case 'critical': return { text: 'text-red-500', bg: 'bg-red-50', color: 'bg-red-500' };
      case 'low': return { text: 'text-amber-500', bg: 'bg-amber-50', color: 'bg-amber-500' };
      default: return { text: 'text-green-500', bg: 'bg-green-50', color: 'bg-green-500' };
    }
  }

  eventsByDumper: any[] = [];

  alertsSub?: Subscription;
  isAlertsLoading: boolean = false;
  alertsError: string | null = null;
  alertsPagination: any = { current_page: 1, total: 0, last_page: 1, from: 0, to: 0 };
  recentAlerts: any[] = [];

  fetchRecentAlerts(page: number = 1) {
    this.isAlertsLoading = true;
    if (this.alertsSub) this.alertsSub.unsubscribe();
    const filters = {
      ...this.buildFilters(),
      page: page,
      limit: 5 // Show 5 per page
    };
    
    this.alertsSub = this.dashboardService.getFleetAlerts(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data && res.data.recent) {
          this.recentAlerts = res.data.recent.map((alert: any) => this.formatAlert(alert));
          this.alertsPagination = res.data.pagination;
        }
        this.isAlertsLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching alerts:', err);
        this.alertsError = 'Failed to load alerts.';
        this.isAlertsLoading = false;
      }
    });
  }

  formatAlert(alert: any) {
    let typeClass = 'text-blue-500 bg-blue-50';
    let icon = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info

    if (alert.severity === 'warning') {
        typeClass = 'text-red-500 bg-red-50';
        icon = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'; // Warning
    } else if (alert.severity === 'critical' || alert.severity === 'error') {
        typeClass = 'text-red-600 bg-red-100';
        icon = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'; // Error
    }

    let timeStr = alert.alerted_at; // Display exactly what comes from backend

    return {
        ...alert,
        type: alert.title,
        desc: alert.description,
        dumper: alert.dumper_no,
        typeClass: typeClass,
        icon: icon,
        time: timeStr
    };
  }

  get alertsPages(): number[] {
     const pages: number[] = [];
     if (!this.alertsPagination.last_page) return pages;
     
     let startPage = Math.max(1, this.alertsPagination.current_page - 2);
     let endPage = Math.min(this.alertsPagination.last_page, startPage + 4);
     
     if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
     }
     
     for(let i=startPage; i<=endPage; i++) {
        pages.push(i);
     }
     return pages;
  }

  changeAlertsPage(page: number) {
    if (page >= 1 && page <= this.alertsPagination.last_page) {
       this.fetchRecentAlerts(page);
    }
  }

  // --- UI State Management ---

  // Dropdown states
  activeDropdown: string | null = null;

  selectedDate: string = 'Today';
  selectedDumper: string = 'All Dumpers';
  selectedConnectivity: string = 'All';
  selectedOpStatus: string = 'All';
  selectedFuelStatus: string = 'All';
  selectedSource: string = 'All';
  selectedPageSize: number = 10;

  isCustomDateRangeOpen: boolean = false;
  customStartDate: string = '';
  customEndDate: string = '';

  clearFilters() {
    this.selectedDate = 'Today';
    this.selectedDumper = 'All Dumpers';
    this.selectedConnectivity = 'All';
    this.selectedOpStatus = 'All';
    this.selectedFuelStatus = 'All';
    this.selectedSource = 'All';
    this.searchTerm = '';
    this.refreshData();
  }

  // Table Search and Sort state
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  // Modal State
  isDetailModalOpen: boolean = false;
  selectedVehicle: any = null;

  toggleDropdown(dropdownName: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdown === dropdownName) {
      this.activeDropdown = null; // Close if already open
      this.isCustomDateRangeOpen = false;
    } else {
      this.activeDropdown = dropdownName; // Open the clicked one
      this.isCustomDateRangeOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns() {
    this.activeDropdown = null;
    this.isCustomDateRangeOpen = false;
  }

  selectOption(filter: string, value: string) {
    if (filter === 'date') {
      if (value === 'Custom Range...') {
        this.isCustomDateRangeOpen = true;
        return; // Don't close the dropdown
      }
      this.selectedDate = value;
      this.isCustomDateRangeOpen = false;
      this.refreshData();
    } else {
      switch (filter) {
        case 'dumper': this.selectedDumper = value; break;
        case 'connectivity': this.selectedConnectivity = value; break;
        case 'opStatus': this.selectedOpStatus = value; break;
        case 'fuelStatus': this.selectedFuelStatus = value; break;
        case 'source': this.selectedSource = value; break;
        case 'pageSize': 
          this.selectedPageSize = parseInt(value, 10); 
          break;
      }
      this.refreshData();
    }
    this.activeDropdown = null;
  }

  applyCustomDateRange() {
    if (this.customStartDate && this.customEndDate) {
      // Optional: Format dates to a nicer string here if desired
      this.selectedDate = `${this.customStartDate} to ${this.customEndDate}`;
      this.activeDropdown = null;
      this.isCustomDateRangeOpen = false;
      this.refreshData();
    }
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortTelemetryData();
  }

  sortTelemetryData() {
    if (!this.telemetryData || this.telemetryData.length === 0) return;
    
    this.telemetryData.sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];
      
      if (this.sortColumn === 'no') {
        valA = a.chassis_number || a.dumper_no;
        valB = b.chassis_number || b.dumper_no;
      } else if (this.sortColumn === 'conn') {
        valA = a.connectivity;
        valB = b.connectivity;
      } else if (this.sortColumn === 'ign') {
        valA = a.ignition_status || a.engine_status;
        valB = b.ignition_status || b.engine_status;
      } else if (this.sortColumn === 'speed') {
        valA = a.speed;
        valB = b.speed;
      } else if (this.sortColumn === 'rpm') {
        valA = a.rpm;
        valB = b.rpm;
      } else if (this.sortColumn === 'fuel') {
        valA = a.fuel_level_pct;
        valB = b.fuel_level_pct;
      } else if (this.sortColumn === 'odo') {
        valA = a.odometer;
        valB = b.odometer;
      } else if (this.sortColumn === 'update') {
        valA = new Date(a.gps_time || a.last_updated || a.timestamp).getTime();
        valB = new Date(b.gps_time || b.last_updated || b.timestamp).getTime();
      }

      if (valA === valB) return 0;
      if (valA == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (valB == null) return this.sortDirection === 'asc' ? -1 : 1;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
          const res = valA.localeCompare(valB);
          return this.sortDirection === 'asc' ? res : -res;
      }
      
      return this.sortDirection === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
  }

  viewFullFuelReport() {
    const filters = this.buildFilters();
    this.router.navigate(['/admin/fuel-analytics'], {
      queryParams: {
        range: filters.range,
        from: filters.from,
        to: filters.to,
        machine_id: filters.machine_id,
        connectivity: filters.connectivity,
        operational_status: filters.operational_status,
        fuel_status: filters.fuel_status,
        source: filters.source
      }
    });
  }

  viewAllSafetyEvents() {
    const filters = this.buildFilters();
    this.router.navigate(['/admin/safety-events'], {
      queryParams: {
        range: filters.range,
        from: filters.from,
        to: filters.to,
        machine_id: filters.machine_id,
        connectivity: filters.connectivity,
        operational_status: filters.operational_status,
        fuel_status: filters.fuel_status,
        source: filters.source
      }
    });
  }

  openVehicleDetail(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.isDetailModalOpen = true;
  }

  closeVehicleDetail() {
    this.isDetailModalOpen = false;
    this.selectedVehicle = null;
  }
}
