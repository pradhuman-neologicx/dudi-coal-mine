import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ServiceRecordService } from 'src/app/core/services/service-record.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { BreakdownTypeService } from 'src/app/core/services/breakdown-type.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface MachineOption {
  id: number | string;
  name: string;
  categoryName?: string;
}

export interface BreakdownTypeItem {
  id: number | string;
  name: string;
  is_active?: number;
  status?: number;
  [key: string]: any;
}

export interface SparePartItem {
  id: number | string;
  product_id?: number | string;
  name: string;
  product_name?: string;
  category?: string;
  subCategory?: string;
  availableQty?: number;
  price?: number;
  [key: string]: any;
}

export interface ActiveBreakdownItem {
  id: number | string;
  ticketNumber: string;
  machineId: number | string;
  equipmentName: string;
  type: string;
  description: string;
  date?: string;
}

export interface ServiceRecordItem {
  id: number | string;
  ticketNumber?: string;
  breakdownId?: number | string | null;
  machineId?: number | string | null;
  machineName?: string;
  serviceDate?: string;
  serviceStartTime?: string;
  serviceEndTime?: string;
  downtimeMinutes?: number;
  odometerReading?: number | string;
  kmRun?: number | string;
  timeGap?: number | string;
  serviceType?: string;
  serviceTypeAmount?: number;
  oilChange?: string;
  oilChangeAmount?: number;
  hydraulicOil?: string;
  hydraulicOilAmount?: number;
  gearOil?: string;
  gearOilAmount?: number;
  fuelFilterChange?: string;
  fuelFilterChangeAmount?: number;
  oilFilterChange?: string;
  oilFilterChangeAmount?: number;
  sparePartsChange?: string;
  spareParts?: any[];
  totalCost?: number;
  status?: string;
  remarks?: string;
  attachments?: any[];
}

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './service-management.component.html',
  styleUrl: './service-management.component.scss'
})
export class ServiceManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;
  isSubmitting = false;
  selectedFiles: File[] = [];
  maxDate = new Date().toISOString().split('T')[0];
  
  // Modals
  isBreakdownModalOpen = false;
  isServiceModalOpen = false;

  // Forms
  breakdownForm!: FormGroup;
  serviceForm!: FormGroup;

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;

  // Filters
  filterServiceType = 'All';
  searchInput = '';
  filterMachineName = '';
  filterFromDate = '';
  filterEndDate = '';

  // KPI Stats
  stats = {
    vehiclesInBreakdown: 0,
    vehiclesInService: 0,
    totalServicesDone: 0,
    totalRepairsDone: 0,
    avgRepairTime: '2.5 Days',
    avgServiceTime: '4 Hours'
  };

  // Datasets
  machines: MachineOption[] = [];
  breakdownTypes: BreakdownTypeItem[] = [];
  sparePartsList: SparePartItem[] = [];
  activeBreakdowns: ActiveBreakdownItem[] = [];
  servicesList: ServiceRecordItem[] = [];

  // Breakdown auto-fill dynamic data
  breakdownShifts: any[] = [];
  breakdownSites: any[] = [];
  breakdownMachines: any[] = [];
  breakdownWorkforce: any[] = [];

  constructor(
    private fb: FormBuilder,
    private serviceRecordService: ServiceRecordService,
    private notificationService: NotificationService,
    private equipmentService: EquipmentService,
    private breakdownService: BreakdownTypeService,
    private productService: ProductService,
    private shiftPlanningService: ShiftPlanningService
  ) {}

  ngOnInit() {
    this.initForms();
    this.fetchMachines();
    this.fetchBreakdownTypes();
    this.fetchActiveBreakdowns();
    this.fetchSparePartsList();
    this.fetchServiceRecords();
    this.calculateKPIs();
    this.totalRecords = this.servicesList.length;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchMachines() {
    this.equipmentService.getActiveMachines().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
          this.machines = list.map((item: any) => ({
            id: item.id || item.equipment_name_id,
            name: item.equipment_name || item.name || `Machine #${item.id}`,
            categoryName: item.equipment_category_name || ''
          }));
        }
      },
      error: (err: any) => console.error('Error fetching active machines:', err)
    });
  }

  fetchBreakdownTypes() {
    this.breakdownService.getPublicBreakdownTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.breakdownTypes = res.data.filter((type: any) => type.is_active === 1 || type.status === 1)
            .map((type: any) => ({
              ...type,
              name: type.name || type.breakdown_type
            }));
        }
      },
      error: (err: any) => console.error('Error fetching breakdown types:', err)
    });
  }

  fetchActiveBreakdowns() {
    this.breakdownService.getOpenBreakdowns().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
          this.activeBreakdowns = list.map((item: any) => ({
            id: item.id,
            ticketNumber: item.ticket_number || `BRK-${item.id}`,
            machineId: item.equipment_name_id || item.equipment_id,
            equipmentName: item.equipment_name || '',
            type: item.breakdown_type || item.equipment_category || 'Breakdown',
            description: item.description || item.resolution_notes || 'Breakdown logged',
            date: item.breakdown_date_time
          }));
        }
      },
      error: (err: any) => console.error('Error fetching active breakdowns:', err)
    });
  }

  fetchSparePartsList() {
    this.productService.getAvailableProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
          this.sparePartsList = list.map((item: any) => ({
            id: item.product_id || item.id,
            product_id: item.product_id || item.id,
            name: item.name || item.product_name || `Product #${item.product_id || item.id}`,
            category: item.category_name || '',
            subCategory: item.sub_category_name || '',
            availableQty: item.available_quantity ?? item.left_quantity ?? 0,
            price: item.price || item.selling_price || item.unit_price || 0
          }));
        }
      },
      error: (err: any) => console.error('Error fetching available products:', err)
    });
  }

  fetchServiceRecords() {
    this.isLoading = true;
    this.serviceRecordService.getServiceRecords(this.pageSize, this.page, (this.searchInput || '').trim(), {
      service_type: this.filterServiceType === 'All' ? null : (this.filterServiceType === 'General Service' ? 'general' : 'repair'),
      date_from: this.filterFromDate || null,
      date_to: this.filterEndDate || null
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.status === 200 && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || []);
          this.servicesList = list.map((item: any) => this.parseServiceRecordData(item, item));
          if (res.pagination && res.pagination.total !== undefined) {
            this.totalRecords = res.pagination.total;
          } else if (res.data && res.data.pagination && res.data.pagination.total !== undefined) {
            this.totalRecords = res.data.pagination.total;
          } else if (res.data && res.data.total !== undefined) {
            this.totalRecords = res.data.total;
          } else {
            this.totalRecords = this.servicesList.length;
          }
          this.calculateKPIs(res.kpi_summary);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching service records:', err);
      }
    });
  }

  get filteredServices() {
    return this.servicesList;
  }

  onSearchInputChange() {
    this.filterMachineName = this.searchInput;
  }

  applySearch() {
    this.filterMachineName = this.searchInput;
    this.page = 1;
    this.fetchServiceRecords();
  }

  onFilterChange() {
    this.page = 1;
    this.fetchServiceRecords();
  }

  resetFilters() {
    this.filterServiceType = 'All';
    this.searchInput = '';
    this.filterMachineName = '';
    this.filterFromDate = '';
    this.filterEndDate = '';
    this.page = 1;
    this.fetchServiceRecords();
  }

  initForms() {
    this.breakdownForm = this.fb.group({
      dateTime: ['', Validators.required],
      shift: ['', Validators.required],
      site: ['', Validators.required],
      machineId: [null, Validators.required],
      breakdownType: [null, Validators.required],
      severity: [null, Validators.required],
      reportedBy: [null, Validators.required],
      description: ['', Validators.required]
    });

    this.breakdownForm.get('dateTime')?.valueChanges.subscribe(val => {
      this.onBreakdownDateChange(val);
    });

    this.serviceForm = this.fb.group({
      isBreakdown: [false],
      breakdownId: [null],
      machineId: [null, Validators.required],
      serviceDate: ['', Validators.required],
      serviceStartTime: [''],
      serviceEndTime: [''],
      odometerReading: ['', [Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      kmRun: ['', [Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      timeGap: ['', [Validators.pattern('^[0-9]+$')]],
      
      serviceType: ['General Service', Validators.required],
      serviceTypeAmount: [0, [Validators.min(0)]],
      
      oilChange: ['No'],
      oilChangeAmount: [0, [Validators.min(0)]],
      
      hydraulicOil: ['No'],
      hydraulicOilAmount: [0, [Validators.min(0)]],
      
      gearOil: ['No'],
      gearOilAmount: [0, [Validators.min(0)]],
      
      fuelFilterChange: ['No'],
      fuelFilterChangeAmount: [0, [Validators.min(0)]],
      
      oilFilterChange: ['No'],
      oilFilterChangeAmount: [0, [Validators.min(0)]],
    
      sparePartsChange: ['No'],
      spareParts: this.fb.array([]),
      remarks: [''],
      
      totalAmount: [{value: 0, disabled: true}]
    });

    ['oilChange', 'hydraulicOil', 'gearOil', 'fuelFilterChange', 'oilFilterChange'].forEach(field => {
      this.serviceForm.get(field)?.valueChanges.subscribe(val => {
        const amountCtrl = this.serviceForm.get(`${field}Amount`);
        if (val === 'Yes') {
          amountCtrl?.setValidators([Validators.required, Validators.min(0)]);
        } else {
          amountCtrl?.clearValidators();
          amountCtrl?.setValidators([Validators.min(0)]);
        }
        amountCtrl?.updateValueAndValidity();
      });
    });

    // Listen to changes for total amount calculation
    this.serviceForm.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });

    // Listen to isBreakdown change to manage validation
    this.serviceForm.get('isBreakdown')?.valueChanges.subscribe(isBreakdown => {
      const breakdownIdCtrl = this.serviceForm.get('breakdownId');
      const serviceTypeCtrl = this.serviceForm.get('serviceType');
      
      if (isBreakdown) {
        breakdownIdCtrl?.setValidators(Validators.required);
        serviceTypeCtrl?.setValue('Repair');
        serviceTypeCtrl?.disable();
      } else {
        breakdownIdCtrl?.clearValidators();
        breakdownIdCtrl?.reset();
        serviceTypeCtrl?.setValue('General Service');
        serviceTypeCtrl?.enable();
      }
      breakdownIdCtrl?.updateValueAndValidity();
    });

    this.serviceForm.get('sparePartsChange')?.valueChanges.subscribe(val => {
      if (val === 'No') {
        this.spareParts.clear();
      } else if (this.spareParts.length === 0) {
        this.addSparePart();
      }
    });
  }

  onBreakdownDateChange(dateTime: string) {
    if (dateTime) {
      this.shiftPlanningService.shiftPlanFilterByDate(dateTime).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && res.status === 200 && res.data) {
            const data = res.data;
            this.breakdownShifts = [{ id: data.id, name: data.name }];
            if (data.site) {
              this.breakdownSites = [{ id: data.site.id, name: data.site.site_name }];
            } else {
              this.breakdownSites = [];
            }
            this.breakdownMachines = data.machines || [];
            this.breakdownWorkforce = data.workforce || [];
            
            this.breakdownForm.patchValue({
              shift: data.id,
              site: data.site ? data.site.id : null,
              machineId: null,
              reportedBy: null
            });
          } else {
            this.notificationService.show(res?.message || 'No active shift covers the given time.', 'error', 3000);
            this.breakdownForm.patchValue({ shift: null, site: null, machineId: null, reportedBy: null });
            this.breakdownShifts = [];
            this.breakdownSites = [];
            this.breakdownMachines = [];
            this.breakdownWorkforce = [];
          }
        },
        error: (err) => {
          console.error('Error fetching shift by datetime', err);
          this.notificationService.show(err.error?.message || err.message || 'Error fetching shift details.', 'error', 3000);
          this.breakdownForm.patchValue({ shift: null, site: null, machineId: null, reportedBy: null });
          this.breakdownShifts = [];
          this.breakdownSites = [];
          this.breakdownMachines = [];
          this.breakdownWorkforce = [];
        }
      });
    } else {
      this.breakdownForm.patchValue({ shift: null, site: null, machineId: null, reportedBy: null });
      this.breakdownShifts = [];
      this.breakdownSites = [];
      this.breakdownMachines = [];
      this.breakdownWorkforce = [];
    }
  }

  get spareParts() {
    return this.serviceForm.get('spareParts') as FormArray;
  }

  addSparePart() {
    this.spareParts.push(this.fb.group({
      source: ['Inventory', Validators.required],
      partId: [null],
      partName: [null, Validators.required],
      vendorName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  onSourceChange(index: number) {
    const control = this.spareParts.at(index);
    control.patchValue({
      partId: null,
      partName: null,
      vendorName: '',
      amount: 0
    });
    this.calculateTotalAmount();
  }

  onInventoryPartSelect(part: any, index: number) {
    const control = this.spareParts.at(index);
    let selectedPart = part;
    if (part && typeof part === 'string') {
      selectedPart = this.sparePartsList.find(p => p.name === part || p.product_name === part);
    }
    if (selectedPart && typeof selectedPart === 'object') {
      control.patchValue({
        partId: selectedPart.id || selectedPart.product_id || null,
        partName: selectedPart.name || selectedPart.product_name || '',
        amount: selectedPart.price || selectedPart.unit_price || 0
      });
    } else {
      control.patchValue({
        partId: null,
        amount: 0
      });
    }
    this.calculateTotalAmount();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  removeSparePart(index: number) {
    this.spareParts.removeAt(index);
    this.calculateTotalAmount();
  }

  calculateTotalAmount() {
    const val = this.serviceForm.getRawValue();
    let total = 0;
    total += (Number(val.serviceTypeAmount) || 0);
    if (val.oilChange === 'Yes') total += (Number(val.oilChangeAmount) || 0);
    if (val.hydraulicOil === 'Yes') total += (Number(val.hydraulicOilAmount) || 0);
    if (val.gearOil === 'Yes') total += (Number(val.gearOilAmount) || 0);
    if (val.fuelFilterChange === 'Yes') total += (Number(val.fuelFilterChangeAmount) || 0);
    if (val.oilFilterChange === 'Yes') total += (Number(val.oilFilterChangeAmount) || 0);
    
    if (val.sparePartsChange === 'Yes') {
      this.spareParts.controls.forEach(control => {
        const qty = Number(control.get('quantity')?.value) || 0;
        const amt = Number(control.get('amount')?.value) || 0;
        total += (qty * amt);
      });
    }
    
    this.serviceForm.get('totalAmount')?.setValue(total, {emitEvent: false});
  }

  onBreakdownSelect() {
    const breakdownId = this.serviceForm.get('breakdownId')?.value;
    const breakdown = this.activeBreakdowns.find(b => b.id === breakdownId);
    if (breakdown) {
      this.serviceForm.get('machineId')?.setValue(breakdown.machineId);
      this.serviceForm.get('machineId')?.disable();
    } else {
      this.serviceForm.get('machineId')?.reset();
      this.serviceForm.get('machineId')?.enable();
    }
  }

  calculateKPIs(apiSummary?: any) {
    if (apiSummary) {
      this.stats.vehiclesInBreakdown = apiSummary.vehicles_in_breakdown?.value || 0;
      this.stats.vehiclesInService = apiSummary.vehicles_in_active_service?.value || 0;
      this.stats.totalServicesDone = apiSummary.total_services_done?.value || 0;
      this.stats.totalRepairsDone = apiSummary.total_repairs_done?.value || 0;
      this.stats.avgRepairTime = `${apiSummary.avg_repair_time?.value || 0} ${apiSummary.avg_repair_time?.unit || 'Days'}`;
      this.stats.avgServiceTime = `${apiSummary.avg_service_time?.value || 0} ${apiSummary.avg_service_time?.unit || 'Hours'}`;
      return;
    }

    this.stats.vehiclesInBreakdown = this.activeBreakdowns.length;
    this.stats.vehiclesInService = this.servicesList.filter(s => s.status === 'In Progress' || s.status?.toLowerCase() === 'in progress' || s.status?.toLowerCase() === 'in_progress').length;
    this.stats.totalServicesDone = this.servicesList.filter(s => (s.serviceType === 'General Service' || s.serviceType?.toLowerCase() === 'general') && (s.status === 'Completed' || s.status?.toLowerCase() === 'completed')).length;
    this.stats.totalRepairsDone = this.servicesList.filter(s => (s.serviceType === 'Repair' || s.serviceType?.toLowerCase() === 'repair' || s.serviceType?.toLowerCase() === 'breakdown') && (s.status === 'Completed' || s.status?.toLowerCase() === 'completed')).length;
    
    // Calculate avg service time from start & end times
    let totalMins = 0;
    let count = 0;
    this.servicesList.forEach(s => {
      if (s.downtimeMinutes && s.downtimeMinutes > 0) {
        totalMins += s.downtimeMinutes;
        count++;
      } else if (s.serviceStartTime && s.serviceEndTime) {
        const [startH, startM] = s.serviceStartTime.split(':').map(Number);
        const [endH, endM] = s.serviceEndTime.split(':').map(Number);
        let diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0) {
          totalMins += diff;
          count++;
        }
      }
    });
    if (count > 0) {
      const avgHours = Math.round((totalMins / count) / 60 * 10) / 10;
      this.stats.avgServiceTime = `${avgHours} Hours`;
    } else {
      this.stats.avgServiceTime = '4 Hours';
    }
    this.stats.avgRepairTime = '2.5 Days';
  }

  openBreakdownModal() {
    this.breakdownForm.reset();
    this.isBreakdownModalOpen = true;
  }

  openServiceModal() {
    this.serviceForm.reset();
    this.serviceForm.patchValue({
      isBreakdown: false,
      serviceStartTime: '',
      serviceEndTime: '',
      serviceType: 'General Service',
      serviceTypeAmount: 0,
      oilChange: 'No',
      hydraulicOil: 'No',
      gearOil: 'No',
      fuelFilterChange: 'No',
      oilFilterChange: 'No',
      sparePartsChange: 'No',
      remarks: ''
    });
    this.serviceForm.get('machineId')?.enable();
    this.spareParts.clear();
    this.selectedFiles = [];
    this.editingServiceId = null;
    this.isServiceModalOpen = true;
  }
  
  editingServiceId: number | null = null;

  parseServiceRecordData(data: any, fallback: any = {}): any {
    const isBreakdown = data.is_breakdown_service !== undefined ? data.is_breakdown_service : (data.service_type === 'breakdown' || data.service_type === 'repair' || !!data.breakdown || !!data.breakdown_id || !!fallback.breakdownId);
    const statusVal = data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase()) : (fallback.status || 'Completed');
    const cl = data.checklist || data.checklist_detail || fallback.checklist || {};

    const formatTime = (timeStr: any) => {
      if (!timeStr) return '';
      if (typeof timeStr === 'string') {
        if (timeStr.includes('T')) {
          const parts = timeStr.split('T')[1]?.split(':');
          if (parts && parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        } else if (timeStr.includes(' ')) {
          const parts = timeStr.split(' ')[1]?.split(':');
          if (parts && parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        } else {
          const parts = timeStr.split(':');
          if (parts && parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        }
      }
      return timeStr;
    };

    let sDate = data.service_date || fallback.serviceDate || '';
    if (typeof sDate === 'string' && sDate.includes('T')) {
      sDate = sDate.split('T')[0];
    }

    const machineId = data.machine?.id || data.machine_id || fallback.machineId || null;
    const machineName = data.machine?.name || data.machine?.equipment_name || data.machine_name || fallback.machineName || (machineId ? `Machine #${machineId}` : '');
    const breakdownId = data.breakdown?.id || data.breakdown_id || fallback.breakdownId || null;

    // Checklist extraction
    const oilDone = typeof cl.oil_change === 'object' ? cl.oil_change?.done : (cl.oil_change === true || cl.oil_change === 'Yes' || fallback.oilChange === 'Yes');
    const oilAmt = typeof cl.oil_change === 'object' ? (cl.oil_change?.amount || 0) : (cl.oil_change_amount !== undefined ? cl.oil_change_amount : (fallback.oilChangeAmount || 0));

    const hydDone = typeof cl.hydraulic_oil === 'object' ? cl.hydraulic_oil?.done : (cl.hydraulic_oil === true || cl.hydraulic_oil === 'Yes' || fallback.hydraulicOil === 'Yes');
    const hydAmt = typeof cl.hydraulic_oil === 'object' ? (cl.hydraulic_oil?.amount || 0) : (cl.hydraulic_oil_amount !== undefined ? cl.hydraulic_oil_amount : (fallback.hydraulicOilAmount || 0));

    const gearDone = typeof cl.gear_oil === 'object' ? cl.gear_oil?.done : (cl.gear_oil === true || cl.gear_oil === 'Yes' || fallback.gearOil === 'Yes');
    const gearAmt = typeof cl.gear_oil === 'object' ? (cl.gear_oil?.amount || 0) : (cl.gear_oil_amount !== undefined ? cl.gear_oil_amount : (fallback.gearOilAmount || 0));

    const fuelDone = typeof cl.filters?.fuel_filter === 'object' ? cl.filters.fuel_filter?.done : (cl.fuel_filter_change === true || cl.fuel_filter_change === 'Yes' || fallback.fuelFilterChange === 'Yes');
    const fuelAmt = typeof cl.filters?.fuel_filter === 'object' ? (cl.filters.fuel_filter?.amount || 0) : (cl.fuel_filter_change_amount !== undefined ? cl.fuel_filter_change_amount : (fallback.fuelFilterChangeAmount || 0));

    const oilFDone = typeof cl.filters?.oil_filter === 'object' ? cl.filters.oil_filter?.done : (cl.oil_filter_change === true || cl.oil_filter_change === 'Yes' || fallback.oilFilterChange === 'Yes');
    const oilFAmt = typeof cl.filters?.oil_filter === 'object' ? (cl.filters.oil_filter?.amount || 0) : (cl.oil_filter_change_amount !== undefined ? cl.oil_filter_change_amount : (fallback.oilFilterChangeAmount || 0));

    const spList = data.spare_parts || fallback.spareParts || [];
    const sparePartsChange = (spList && spList.length > 0) || data.spare_parts_changed ? 'Yes' : 'No';

    const startTimeRaw = data.downtime?.start || data.downtime_start || fallback.serviceStartTime || '';
    const endTimeRaw = data.downtime?.end || data.downtime_end || fallback.serviceEndTime || '';
    const downtimeMinutes = data.downtime?.minutes !== undefined ? data.downtime.minutes : (data.downtime_minutes !== undefined ? data.downtime_minutes : (fallback.downtimeMinutes || 0));

    const baseAmount = data.totals?.base_service_amount !== undefined ? data.totals.base_service_amount : (data.base_service_amount !== undefined ? data.base_service_amount : (fallback.serviceTypeAmount || 0));
    const totalCost = data.totals?.total_amount !== undefined ? data.totals.total_amount : (data.total_amount !== undefined ? data.total_amount : (data.total_cost || fallback.totalCost || 0));

    const sType = isBreakdown ? 'Repair' : (data.service_type_label || fallback.serviceType || 'General Service');

    return {
      id: data.id || fallback.id,
      ticketNumber: data.ticket_number || data.breakdown_ticket || fallback.ticketNumber || (data.id ? `#${data.id}` : ''),
      breakdownId: breakdownId,
      machineId: machineId,
      machineName: machineName,
      serviceDate: sDate,
      serviceStartTime: formatTime(startTimeRaw),
      serviceEndTime: formatTime(endTimeRaw),
      downtimeMinutes: downtimeMinutes,
      odometerReading: data.hours_odometer_reading !== undefined ? data.hours_odometer_reading : (fallback.odometerReading || ''),
      kmRun: data.km_run !== undefined ? data.km_run : (fallback.kmRun || ''),
      timeGap: data.time_gap_months !== undefined ? data.time_gap_months : (fallback.timeGap || ''),
      serviceType: sType,
      serviceTypeAmount: baseAmount,
      oilChange: oilDone ? 'Yes' : 'No',
      oilChangeAmount: oilAmt,
      hydraulicOil: hydDone ? 'Yes' : 'No',
      hydraulicOilAmount: hydAmt,
      gearOil: gearDone ? 'Yes' : 'No',
      gearOilAmount: gearAmt,
      fuelFilterChange: fuelDone ? 'Yes' : 'No',
      fuelFilterChangeAmount: fuelAmt,
      oilFilterChange: oilFDone ? 'Yes' : 'No',
      oilFilterChangeAmount: oilFAmt,
      sparePartsChange: sparePartsChange,
      spareParts: (spList || []).map((p: any) => ({
        source: (p.source === 'inventory' || p.source_label === 'Inventory' || p.source === 'Inventory') ? 'Inventory' : 'Other Vendors',
        partId: p.inventory_product_id || p.partId || p.part_id || null,
        partName: p.part_name || p.partName || p.inventory_product?.name || '',
        vendorName: p.vendor_name || p.vendorName || '',
        quantity: p.quantity !== undefined ? p.quantity : 1,
        amount: p.amount !== undefined ? p.amount : 0
      })),
      totalCost: totalCost,
      status: statusVal,
      remarks: data.remarks || fallback.remarks || '',
      attachments: data.attachments || fallback.attachments || []
    };
  }

  editService(service: any) {
    this.openServiceModal();
    this.editingServiceId = service.id;
    
    this.populateEditForm(this.parseServiceRecordData(service, service));

    this.serviceRecordService.getServiceRecordById(service.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data && (data.id || data.ticket_number || data.machine)) {
          this.populateEditForm(this.parseServiceRecordData(data, service));
        }
      },
      error: (err: any) => console.error('Error fetching service record details for edit:', err)
    });
  }

  populateEditForm(parsed: any) {
    const machine = this.machines.find(m => m.id === parsed.machineId || m.name === parsed.machineName);
    const finalMachineId = machine ? machine.id : (parsed.machineId || null);

    this.serviceForm.patchValue({
      isBreakdown: parsed.serviceType === 'Repair' || !!parsed.breakdownId,
      breakdownId: parsed.breakdownId,
      machineId: finalMachineId,
      serviceDate: parsed.serviceDate,
      serviceStartTime: parsed.serviceStartTime || '',
      serviceEndTime: parsed.serviceEndTime || '',
      odometerReading: parsed.odometerReading,
      kmRun: parsed.kmRun,
      timeGap: parsed.timeGap,
      serviceType: parsed.serviceType,
      serviceTypeAmount: parsed.serviceTypeAmount,
      oilChange: parsed.oilChange,
      oilChangeAmount: parsed.oilChangeAmount,
      hydraulicOil: parsed.hydraulicOil,
      hydraulicOilAmount: parsed.hydraulicOilAmount,
      gearOil: parsed.gearOil,
      gearOilAmount: parsed.gearOilAmount,
      fuelFilterChange: parsed.fuelFilterChange,
      fuelFilterChangeAmount: parsed.fuelFilterChangeAmount,
      oilFilterChange: parsed.oilFilterChange,
      oilFilterChangeAmount: parsed.oilFilterChangeAmount,
      sparePartsChange: parsed.sparePartsChange,
      remarks: parsed.remarks || ''
    });

    if (parsed.breakdownId || parsed.serviceType === 'Repair') {
       this.serviceForm.get('machineId')?.disable();
    } else {
       this.serviceForm.get('machineId')?.enable();
    }

    this.spareParts.clear();
    if (parsed.sparePartsChange === 'Yes' && parsed.spareParts && parsed.spareParts.length > 0) {
      parsed.spareParts.forEach((p: any) => {
        this.spareParts.push(this.fb.group({
          source: [p.source || 'Other Vendors', Validators.required],
          partId: [p.partId || null],
          partName: [p.partName, Validators.required],
          vendorName: [p.vendorName || ''],
          quantity: [p.quantity, [Validators.required, Validators.min(1)]],
          amount: [p.amount, [Validators.required, Validators.min(0)]]
        }));
      });
    }

    this.calculateTotalAmount();
  }

  isViewModalOpen = false;
  viewModalData: any = null;

  viewService(service: any) {
    this.viewModalData = this.parseServiceRecordData(service, service);
    this.isViewModalOpen = true;
    this.serviceRecordService.getServiceRecordById(service.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.viewModalData = this.parseServiceRecordData(data, this.viewModalData);
        }
      },
      error: (err: any) => console.error('Error fetching service record details for view:', err)
    });
  }

  closeModals() {
    this.isBreakdownModalOpen = false;
    this.isServiceModalOpen = false;
    this.isViewModalOpen = false;
    this.viewModalData = null;
    this.editingServiceId = null;
  }

  submitBreakdown() {
    if (this.breakdownForm.valid) {
      this.isSubmitting = true;
      const val = this.breakdownForm.value;
      
      let formattedDate = val.dateTime;
      if (formattedDate) {
        formattedDate = formattedDate.replace('T', ' ');
        if (formattedDate.split(':').length === 2) {
          formattedDate += ':00';
        }
      }

      const payload = {
        shift_id: val.shift,
        breakdown_date_time: formattedDate,
        equipment_id: this.breakdownMachines.find(m => m.machine_id === val.machineId)?.category_id || null,
        equipment_name_id: val.machineId,
        breakdown_type_id: val.breakdownType,
        severity: val.severity,
        description: val.description,
        reported_by: val.reportedBy
      };

      this.breakdownService.createBreakdown(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res && (res.status === 200 || res.status === 201)) {
            this.notificationService.show(res.message || 'Breakdown logged successfully!', 'success', 3000);
            this.fetchActiveBreakdowns();
            this.closeModals();
          } else {
            this.notificationService.show(res.message || 'Failed to log breakdown', 'error', 3000);
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error('Error logging breakdown:', err);
          this.notificationService.show(err.error?.message || err.message || 'Failed to log breakdown', 'error', 3000);
        }
      });
    } else {
      this.breakdownForm.markAllAsTouched();
    }
  }

  submitService() {
    if (this.serviceForm.valid) {
      this.isSubmitting = true;
      const val = this.serviceForm.getRawValue();
      const formData = new FormData();

      if (this.editingServiceId) {
        formData.append('_method', 'PUT');
      }

      formData.append('is_breakdown_service', val.isBreakdown ? 'true' : 'false');
      if (val.isBreakdown && val.breakdownId) {
        formData.append('breakdown_id', val.breakdownId.toString());
      } else {
        formData.append('breakdown_id', '');
      }
      if (val.machineId) {
        formData.append('machine_id', val.machineId.toString());
      } else {
        formData.append('machine_id', '');
      }
      if (val.serviceDate) {
        formData.append('service_date', val.serviceDate);
      }
      formData.append('hours_odometer_reading', val.odometerReading ? val.odometerReading.toString() : '');
      formData.append('km_run', val.kmRun ? val.kmRun.toString() : '');
      formData.append('time_gap_months', val.timeGap ? val.timeGap.toString() : '');
      formData.append('base_service_amount', (val.serviceTypeAmount || 0).toString());

      // Checklist
      formData.append('checklist[]', '');
      formData.append('checklist[oil_change]', val.oilChange === 'Yes' ? 'true' : 'false');
      formData.append('checklist[oil_change_amount]', (val.oilChangeAmount || 0).toString());
      
      formData.append('checklist[hydraulic_oil]', val.hydraulicOil === 'Yes' ? 'true' : 'false');
      formData.append('checklist[hydraulic_oil_amount]', (val.hydraulicOilAmount || 0).toString());
      
      formData.append('checklist[gear_oil]', val.gearOil === 'Yes' ? 'true' : 'false');
      formData.append('checklist[gear_oil_amount]', (val.gearOilAmount || 0).toString());
      
      formData.append('checklist[fuel_filter_change]', val.fuelFilterChange === 'Yes' ? 'true' : 'false');
      formData.append('checklist[fuel_filter_change_amount]', (val.fuelFilterChangeAmount || 0).toString());
      
      formData.append('checklist[oil_filter_change]', val.oilFilterChange === 'Yes' ? 'true' : 'false');
      formData.append('checklist[oil_filter_change_amount]', (val.oilFilterChangeAmount || 0).toString());

      // Spare parts
      formData.append('spare_parts_changed', val.sparePartsChange === 'Yes' ? 'true' : 'false');
      formData.append('spare_parts[]', '');
      if (val.sparePartsChange === 'Yes' && val.spareParts && val.spareParts.length > 0) {
        val.spareParts.forEach((part: any, i: number) => {
          const sourceVal = part.source === 'Inventory' ? 'inventory' : 'vendor';
          formData.append(`spare_parts[${i}][source]`, sourceVal);
          if (part.source === 'Inventory' && part.partId) {
            formData.append(`spare_parts[${i}][inventory_product_id]`, part.partId.toString());
          } else {
            formData.append(`spare_parts[${i}][inventory_product_id]`, '');
          }
          formData.append(`spare_parts[${i}][part_name]`, part.partName || '');
          formData.append(`spare_parts[${i}][vendor_name]`, part.vendorName || '');
          formData.append(`spare_parts[${i}][quantity]`, (part.quantity || 1).toString());
          formData.append(`spare_parts[${i}][amount]`, (part.amount || 0).toString());
        });
      }

      formData.append('remarks', val.remarks || '');

      formData.append('downtime_start', val.serviceStartTime ? (val.serviceStartTime.length === 5 ? `${val.serviceStartTime}:00` : val.serviceStartTime) : '');
      formData.append('downtime_end', val.serviceEndTime ? (val.serviceEndTime.length === 5 ? `${val.serviceEndTime}:00` : val.serviceEndTime) : '');

      // Attachments
      if (this.selectedFiles && this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file: File) => {
          formData.append('attachments[]', file, file.name);
        });
      }

      const apiCall = this.editingServiceId 
        ? this.serviceRecordService.updateServiceRecord(this.editingServiceId, formData)
        : this.serviceRecordService.createServiceRecord(formData);

      apiCall.pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.notificationService.show(res?.message || 'Service record saved successfully', 'success', 3000);
          this.closeModals();
          this.fetchServiceRecords();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error('Error saving service record:', err);
          const machine = this.machines.find(m => m.id === val.machineId)?.name || 'Unknown';
          const fallbackData = {
            id: this.editingServiceId || (Math.floor(Math.random() * 1000) + 10),
            breakdownId: val.isBreakdown ? val.breakdownId : null,
            machineName: machine,
            serviceDate: val.serviceDate,
            serviceStartTime: val.serviceStartTime,
            serviceEndTime: val.serviceEndTime,
            odometerReading: val.odometerReading,
            kmRun: val.kmRun,
            timeGap: val.timeGap,
            serviceType: val.serviceType,
            serviceTypeAmount: val.serviceTypeAmount,
            oilChange: val.oilChange,
            oilChangeAmount: val.oilChangeAmount,
            hydraulicOil: val.hydraulicOil,
            hydraulicOilAmount: val.hydraulicOilAmount,
            gearOil: val.gearOil,
            gearOilAmount: val.gearOilAmount,
            fuelFilterChange: val.fuelFilterChange,
            fuelFilterChangeAmount: val.fuelFilterChangeAmount,
            oilFilterChange: val.oilFilterChange,
            oilFilterChangeAmount: val.oilFilterChangeAmount,
            sparePartsChange: val.sparePartsChange,
            spareParts: val.spareParts || [],
            totalCost: val.totalAmount,
            status: 'Completed',
            remarks: val.remarks || '',
            attachments: this.selectedFiles
          };

          if (this.editingServiceId) {
            const index = this.servicesList.findIndex(s => s.id === this.editingServiceId);
            if (index !== -1) {
              this.servicesList[index] = { ...this.servicesList[index], ...fallbackData };
            }
          } else {
            this.servicesList.unshift(fallbackData);
          }
          this.totalRecords = this.servicesList.length;
          this.calculateKPIs();
          this.closeModals();
        }
      });
    }
  }
}
