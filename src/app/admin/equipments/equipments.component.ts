import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

export interface Equipment {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-equipments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './equipments.component.html',
  styleUrl: './equipments.component.scss'
})
export class EquipmentsComponent implements OnInit, OnDestroy {
  equipments: Equipment[] = [];
  filteredEquipments: Equipment[] = [];
  categories: {id: number, name: string}[] = [];
  activeCategories: {id: number, name: string}[] = [];
  private destroy$ = new Subject<void>();

  // Pagination
  page: number = 1;
  tableSize: any = 10;
  totalRecords: number = 0;
  tableSizes: any = [10, 25, 50, 'all'];

  // Filters
  filterSearch: string = '';
  filterCategory: any = null;

  // Modal
  isModalOpen = false;
  isEditMode = false;
  equipmentForm!: FormGroup;
  selectedEquipmentId: number | null = null;

  // History View State
  selectedEquipmentHistory: any = null;
  equipmentServicesList: any[] = [];
  equipmentStats: any = null;
  
  historyPage = 1;
  historyPageSize = 5;

  // View Modal state for specific service detail inside History
  isServiceViewModalOpen = false;
  viewServiceModalData: any = null;

  // Mock data template for services (to be replaced by API later)
  mockServicesTemplate = [
    {
      id: 1,
      serviceType: 'Repair',
      totalCost: 15800,
      serviceDate: '2026-07-10',
      status: 'Completed',
      serviceTypeAmount: 15800,
      oilChange: 'Yes',
      oilChangeAmount: 0,
      hydraulicOil: 'No',
      hydraulicOilAmount: 0,
      gearOil: 'No',
      gearOilAmount: 0,
      fuelFilterChange: 'No',
      fuelFilterChangeAmount: 0,
      oilFilterChange: 'No',
      oilFilterChangeAmount: 0,
      sparePartsChange: 'No',
      spareParts: [],
      odometerReading: '12000'
    },
    {
      id: 2,
      serviceType: 'General Service',
      totalCost: 4500,
      serviceDate: '2026-07-16',
      status: 'In Progress',
      serviceTypeAmount: 4500,
      oilChange: 'No',
      oilChangeAmount: 0,
      hydraulicOil: 'No',
      hydraulicOilAmount: 0,
      gearOil: 'No',
      gearOilAmount: 0,
      fuelFilterChange: 'No',
      fuelFilterChangeAmount: 0,
      oilFilterChange: 'No',
      oilFilterChangeAmount: 0,
      sparePartsChange: 'No',
      spareParts: [],
      odometerReading: '5000'
    },
    {
      id: 3,
      serviceType: 'Repair',
      totalCost: 10200,
      serviceDate: '2026-07-20',
      status: 'Completed',
      serviceTypeAmount: 5000,
      oilChange: 'No',
      oilChangeAmount: 0,
      hydraulicOil: 'No',
      hydraulicOilAmount: 0,
      gearOil: 'No',
      gearOilAmount: 0,
      fuelFilterChange: 'No',
      fuelFilterChangeAmount: 0,
      oilFilterChange: 'No',
      oilFilterChangeAmount: 0,
      sparePartsChange: 'Yes',
      spareParts: [
        { source: 'Inventory', partName: 'Hydraulic Hose', quantity: 2, amount: 0 },
        { source: 'Other Vendors', partName: 'Custom Valve', quantity: 1, amount: 5200 }
      ],
      odometerReading: '450'
    },
    {
      id: 4,
      serviceType: 'General Service',
      totalCost: 3500,
      serviceDate: '2026-06-15',
      status: 'Completed',
      serviceTypeAmount: 1500,
      oilChange: 'Yes',
      oilChangeAmount: 2000,
      hydraulicOil: 'No',
      hydraulicOilAmount: 0,
      gearOil: 'No',
      gearOilAmount: 0,
      fuelFilterChange: 'No',
      fuelFilterChangeAmount: 0,
      oilFilterChange: 'No',
      oilFilterChangeAmount: 0,
      sparePartsChange: 'No',
      spareParts: [],
      odometerReading: '11500'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.equipmentForm = this.fb.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      isActive: [true]
    });
    this.loadData();
    this.loadActiveCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActiveCategories() {
    this.equipmentService.getMachineCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            this.activeCategories = res.data.map((c: any) => ({
              id: c.category_id,
              name: c.category_name
            }));
          }
        },
        error: (err: any) => {
          console.error('Error loading active categories:', err);
        }
      });
  }

  loadData() {
    // Fetch categories first if not fetched
    if (this.categories.length === 0) {
      this.equipmentService.getEquipments('all', 1)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 && res.data) {
              this.categories = res.data.map((c: any) => ({
                id: c.id,
                name: c.equipment_category
              }));
            }
          },
          error: (err: any) => {
            console.error('Error loading categories:', err);
          }
        });
    }

    // Fetch equipments
    this.equipmentService.getEquipmentNames(this.tableSize, this.page, this.filterSearch, this.filterCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            this.filteredEquipments = response.data.map((item: any) => ({
              id: item.id,
              name: item.equipment_name,
              categoryId: item.equipment_category_id,
              categoryName: item.equipment_category_name,
              isActive: item.status === 1 || item.status === true
            }));
            this.totalRecords = response.pagination?.total || this.filteredEquipments.length;
          } else {
            this.notificationService.show(response.message || 'Failed to load equipments', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error loading equipments:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  onFilterChange() {
    this.page = 1; // Reset to first page
    this.loadData();
  }

  resetFilter() {
    this.filterSearch = '';
    this.filterCategory = null;
    this.onFilterChange();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.loadData();
  }

  onTableSizeChange(event: any) {
    this.tableSize = event.target.value === 'all' ? 'all' : parseInt(event.target.value);
    this.page = 1;
    this.loadData();
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedEquipmentId = null;
    this.equipmentForm.reset({ isActive: true, categoryId: '' });
    this.isModalOpen = true;
  }

  openEditModal(equipment: Equipment) {
    this.isEditMode = true;
    this.selectedEquipmentId = equipment.id;
    this.equipmentForm.patchValue({
      name: equipment.name,
      categoryId: equipment.categoryId,
      isActive: equipment.isActive
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveEquipment() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.equipmentForm.value;
    const formData = new FormData();
    formData.append('equipment_name', formValue.name);
    formData.append('equipment_id', formValue.categoryId.toString());

    if (this.isEditMode && this.selectedEquipmentId !== null) {
      formData.append('_method', 'PUT');
      this.equipmentService.updateEquipmentName(this.selectedEquipmentId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 || res.status === 201) {
              this.notificationService.show(res.message || 'Equipment updated successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(res.message || 'Failed to update equipment', 'error', 3000);
            }
          },
          error: (err: any) => {
            console.error('Error updating equipment:', err);
            this.notificationService.show(err.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      this.equipmentService.createEquipmentName(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 200 || res.status === 201) {
              this.notificationService.show(res.message || 'Equipment created successfully', 'success', 3000);
              this.closeModal();
              this.loadData();
            } else {
              this.notificationService.show(res.message || 'Failed to create equipment', 'error', 3000);
            }
          },
          error: (err: any) => {
            console.error('Error creating equipment:', err);
            this.notificationService.show(err.message || 'Something went wrong', 'error', 3000);
          }
        });
    }
  }

  toggleActiveStatus(equipment: Equipment) {
    const nextStatus = equipment.isActive ? 0 : 1;
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', nextStatus.toString());

    this.equipmentService.updateEquipmentNameStatus(equipment.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(response.message || 'Status updated successfully', 'success', 3000);
            this.loadData();
          } else {
            this.notificationService.show(response.message || 'Failed to update status', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error toggling status:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  // --- History Logic ---

  viewHistory(equipment: Equipment) {
    this.selectedEquipmentHistory = equipment;
    
    // Assign the generic mock data to the clicked machine so there is always data to view
    const services = this.mockServicesTemplate.map(s => ({
      ...s,
      machineName: equipment.name
    }));
    
    this.equipmentServicesList = services.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
    
    const totalCost = services.reduce((sum, s) => sum + s.totalCost, 0);
    this.equipmentStats = {
      totalServices: services.length,
      totalExpenses: totalCost,
      generalServicesCount: services.filter(s => s.serviceType === 'General Service').length,
      repairServicesCount: services.filter(s => s.serviceType === 'Repair').length
    };
    
    this.historyPage = 1;
  }

  backToEquipments() {
    this.selectedEquipmentHistory = null;
    this.equipmentServicesList = [];
    this.equipmentStats = null;
  }

  openServiceDetails(service: any) {
    this.viewServiceModalData = service;
    this.isServiceViewModalOpen = true;
  }

  closeServiceModal() {
    this.isServiceViewModalOpen = false;
    this.viewServiceModalData = null;
  }

}

