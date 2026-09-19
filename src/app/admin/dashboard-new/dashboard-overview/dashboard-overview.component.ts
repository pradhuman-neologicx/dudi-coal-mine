import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Chart, registerables } from 'chart.js';

import { EmployeeService } from 'src/app/core/services/Employee.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent implements OnInit, OnDestroy {
  name: string | null = '';
  userRole: any;

  selectedDateRange: string = 'today';
  filterDateFrom: string = '';
  filterDateTo: string = '';

  dashboardData: any = null;
  isLoading = false;
  mineSiteId: any = '';
  shiftId: any = '';
  
  sites: any[] = [];
  shifts: any[] = [];

  dateRangeOptions = [
    { id: '', name: 'Custom Range' },
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'last_7_days', name: 'Last 7 Days' },
    { id: 'last_30_days', name: 'Last 30 Days' }
  ];

  productionChartInstance: any;
  obProgressChartInstance: any;
  shiftDelayChartInstance: any;

  // Inventory Dashboard Variables
  totalProductsCount = 0;
  belowMinLevelCount = 0;
  outOfStockCount = 0;
  belowMinLevelProducts: any[] = [];
  outOfStockProducts: any[] = [];

  outOfStockPage = 1;
  outOfStockTotalPages = 1;
  belowMinLevelPage = 1;
  belowMinLevelTotalPages = 1;

  activeDropdownId: string | null = null;

  toggleDropdown(event: Event, id: string) {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownId = null;
  }

  constructor(
    private jwtService: JwtService,
    private employeeService: EmployeeService,
    private shiftPlanningService: ShiftPlanningService,
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.name = this.jwtService.getName();
    this.userRole = this.jwtService.getadmiRole();
    this.fetchSites();
    this.fetchShifts();
    this.fetchDashboardData();
    this.fetchInventoryData();
  }

  ngOnDestroy(): void {
    if (this.productionChartInstance) this.productionChartInstance.destroy();
    if (this.obProgressChartInstance) this.obProgressChartInstance.destroy();
    if (this.shiftDelayChartInstance) this.shiftDelayChartInstance.destroy();
  }

  fetchSites() {
    this.shiftPlanningService.getSites().subscribe((res: any) => {
      if (res.status && res.data) {
        const mappedData = res.data.map((s: any) => ({ ...s, site_name: s.site_name || s.name }));
        this.sites = [{ id: '', site_name: 'All Sites' }, ...mappedData];
      }
    });
  }

  fetchShifts() {
    this.shiftPlanningService.getShifts().subscribe((res: any) => {
      if (res.status && res.data) {
        const mappedData = res.data.map((s: any) => ({ ...s, shift_name: s.shift_name || s.name }));
        this.shifts = [{ id: '', shift_name: 'All Shifts' }, ...mappedData];
      }
    });
  }

  fetchDashboardData() {
    this.isLoading = true;
    const params: any = {};
    if (this.mineSiteId) {
      params.mine_site_id = this.mineSiteId;
    }
    if (this.shiftId) {
      params.shift_id = this.shiftId;
    }

    if (this.selectedDateRange) {
      params.date_range = this.selectedDateRange;
    } else if (this.filterDateFrom && this.filterDateTo) {
      params.date_from = this.filterDateFrom;
      params.date_to = this.filterDateTo;
    } else {
      params.date_range = 'today';
    }

    this.employeeService.GetDashboardData(params).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status && res.data) {
          this.dashboardData = res.data;
          this.updateCharts();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  fetchInventoryData() {
    this.fetchOutOfStockData();
    this.fetchBelowMinLevelData();
  }

  fetchOutOfStockData(page: number = 1) {
    this.outOfStockPage = page;
    this.inventoryService.getDashboardOutOfStock(page, 10).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          const summary = res.data.summary || {};
          if (summary.total_products) this.totalProductsCount = summary.total_products;
          if (summary.out_of_stock !== undefined) this.outOfStockCount = summary.out_of_stock;
          
          this.outOfStockTotalPages = res.data.last_page || 1;
          
          const mapItem = (item: any) => ({
            ...item,
            product_name: item.product || item.product_name,
            store_name: item.location || item.store_name,
            min_stock: item.minimum_stock !== undefined ? item.minimum_stock : item.min_stock,
            left_quantity: item.quantity !== undefined ? item.quantity : item.left_quantity
          });
          
          this.outOfStockProducts = (res.data.items || []).map(mapItem);
        }
      },
      error: (err) => console.error('Failed to load out of stock data', err)
    });
  }

  fetchBelowMinLevelData(page: number = 1) {
    this.belowMinLevelPage = page;
    this.inventoryService.getDashboardBelowMinLevel(page, 10).subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          const summary = res.data.summary || {};
          if (summary.total_products) this.totalProductsCount = summary.total_products;
          if (summary.below_min_level !== undefined) this.belowMinLevelCount = summary.below_min_level;

          this.belowMinLevelTotalPages = res.data.last_page || 1;
          
          const mapItem = (item: any) => ({
            ...item,
            product_name: item.product || item.product_name,
            store_name: item.location || item.store_name,
            min_stock: item.minimum_stock !== undefined ? item.minimum_stock : item.min_stock,
            left_quantity: item.quantity !== undefined ? item.quantity : item.left_quantity
          });
          
          this.belowMinLevelProducts = (res.data.items || []).map(mapItem);
        }
      },
      error: (err) => console.error('Failed to load below min level data', err)
    });
  }

  getPages(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || i >= currentPage - delta && i <= currentPage + delta) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }

  navigate(route: string, queryParams?: any) {
    this.router.navigate([route], { queryParams });
  }

  updateCharts() {
    setTimeout(() => {
      this.initProductionChart();
      this.initObProgressChart();
      this.initShiftDelayChart();
    }, 100);
  }

  resetFilters() {
    this.selectedDateRange = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.mineSiteId = '';
    this.shiftId = '';
    this.fetchDashboardData();
  }

  get dateRangeLabel(): string {
    switch (this.selectedDateRange) {
      case 'today':
        return 'PRODUCTION TODAY';
      case 'last_7_days':
        return 'PRODUCTION (LAST 7 DAYS)';
      case 'last_30_days':
        return 'PRODUCTION (LAST 30 DAYS)';
      default:
        if (this.filterDateFrom && this.filterDateTo) {
          return `PRODUCTION (${this.filterDateFrom} - ${this.filterDateTo})`;
        }
        return 'PRODUCTION TODAY';
    }
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
  }

  initProductionChart() {
    const ctx = document.getElementById('productionChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.productionChartInstance) this.productionChartInstance.destroy();

    const chartData = this.dashboardData?.overview?.charts?.production_vs_target;
    if (!chartData) return;

    this.productionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.dates || [],
        datasets: [
          {
            label: 'Actual',
            data: chartData.actual || [],
            backgroundColor: '#0f2a4a',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Target',
            data: chartData.target || [],
            backgroundColor: '#e5e7eb',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }

  initObProgressChart() {
    const ctx = document.getElementById('obProgressChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.obProgressChartInstance) this.obProgressChartInstance.destroy();

    const progress = this.dashboardData?.overview?.ob_milestone_progress;
    if (!progress) return;

    const percentage = progress.percentage || 0;
    const remaining = 100 - percentage > 0 ? 100 - percentage : 0;

    this.obProgressChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Reached', 'Remaining'],
        datasets: [{
          data: [percentage, remaining],
          backgroundColor: ['#0f2a4a', '#f3f4f6'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true }
      }
    });
  }

  initShiftDelayChart() {
    const ctx = document.getElementById('shiftDelayChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.shiftDelayChartInstance) this.shiftDelayChartInstance.destroy();

    const delayData = this.dashboardData?.overview?.shift_delay_analysis;
    if (!delayData) return;

    const categories = (delayData.categories && delayData.categories.length) 
      ? delayData.categories.map((c: any) => c.category) 
      : ['No Delay'];
    const values = (delayData.categories && delayData.categories.length) 
      ? delayData.categories.map((c: any) => c.duration_minutes) 
      : [1];
    const colors = ['#1e3a8a', '#6b7280', '#dc2626', '#f59e0b', '#10b981'];

    this.shiftDelayChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}
