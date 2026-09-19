import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-safety-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './safety-events.component.html',
  styleUrls: ['./safety-events.component.scss']
})
export class SafetyEventsComponent implements OnInit, OnDestroy {
  safetyData: any = null;
  isLoading = true;
  error: string | null = null;
  
  // Filters passed from Dashboard
  rangeFilter: string | null = null;
  fromFilter: string | null = null;
  toFilter: string | null = null;
  machineIdFilter: string | null = null;
  connectivityFilter: string | null = null;
  opStatusFilter: string | null = null;
  fuelStatusFilter: string | null = null;
  sourceFilter: string | null = null;

  // Search
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  // Server-Side Pagination
  currentPage = 1;
  pageSize = 10;
  serverPagination: any = {
    total: 0,
    last_page: 1,
    current_page: 1
  };
  isDropdownOpen = false;

  private destroy$ = new Subject<void>();
  private dataSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.rangeFilter = params['range'] || null;
      this.fromFilter = params['from'] || null;
      this.toFilter = params['to'] || null;
      this.machineIdFilter = params['machine_id'] || null;
      this.connectivityFilter = params['connectivity'] || null;
      this.opStatusFilter = params['operational_status'] || null;
      this.fuelStatusFilter = params['fuel_status'] || null;
      this.sourceFilter = params['source'] || null;
      this.fetchSafetyData();
    });

    // Reactive Search Setup
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchSafetyData();
    });
  }

  fetchSafetyData() {
    this.isLoading = true;
    if (this.dataSub) this.dataSub.unsubscribe();
    
    // We use the existing getFleetOperations API which returns safety_events
    const filters: any = {
        machine_id: this.machineIdFilter,
        connectivity: this.connectivityFilter,
        operational_status: this.opStatusFilter,
        fuel_status: this.fuelStatusFilter,
        source: this.sourceFilter,
        limit: this.pageSize,
        page: this.currentPage
    };

    if (this.rangeFilter) filters.range = this.rangeFilter;
    if (this.fromFilter) filters.from = this.fromFilter;
    if (this.toFilter) filters.to = this.toFilter;

    if (!this.rangeFilter && !this.fromFilter && !this.toFilter) {
      filters.range = 'today';
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
        filters.search = this.searchTerm.trim();
    }
    
    this.dataSub = this.dashboardService.getFleetOperations(filters).subscribe({
      next: (res: any) => {
        if (res.status && res.data && res.data.safety_events) {
          this.safetyData = res.data.safety_events;
          
          // Capture server pagination if available, or fallback to manual calculation
          if (res.pagination) {
            this.serverPagination = res.pagination;
          } else if (res.data.pagination) {
            this.serverPagination = res.data.pagination;
          } else {
            // Using total items from operational basis_count or length
            const total = res.data.operational?.basis_count || this.safetyData.by_vehicle?.length || 0;
            this.serverPagination = {
              total: total,
              last_page: Math.ceil(total / this.pageSize) || 1,
              current_page: this.currentPage
            };
          }
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching safety events:', err);
        this.error = 'Failed to load safety events data.';
        this.isLoading = false;
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.serverPagination.last_page) {
      this.currentPage = page;
      this.fetchSafetyData();
    }
  }

  changePageSize(event: any) {
    this.pageSize = Number(event.target.value);
    this.currentPage = 1; // Reset to first page
    this.fetchSafetyData();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectPageSize(size: number) {
    this.pageSize = size;
    this.isDropdownOpen = false;
    this.currentPage = 1;
    this.fetchSafetyData();
  }

  getPagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.serverPagination.last_page; i++) {
      pages.push(i);
    }
    return pages;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dataSub) this.dataSub.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/admin/dashboard'], { queryParams: { tab: 'dumper-fleet' } });
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }
}
