import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductService } from 'src/app/core/services/product.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
import { DepartmentService } from 'src/app/core/services/department.service';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';
import { StoreService } from 'src/app/core/services/store.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface InventoryItem {
  id: number;
  productName: string;
  category: string;
  subCategory: string;
  totalStock: number;
  availableQuantity?: number;
  employeeName: string;
  storeName?: string;
  store_id?: number | string;
  stockStatus?: string;
  stockStatusLabel?: string;
}

export interface InventoryProductOption {
  id: number | string;
  name: string;
  category_name?: string;
  sub_category_name?: string;
  category_id?: number | string;
  sub_category_id?: number | string;
  [key: string]: any;
}

export interface InventoryDepartmentOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface InventoryEmployeeOption {
  id: number | string;
  name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

export interface InventoryAssignmentLog {
  id: number;
  productName: string;
  category: string;
  subCategory: string;
  quantity: number;
  employeeName: string;
  employeeId: string | number;
  site: string;
  department: string;
  issueDate: string;
}

export interface InventoryHistoryLog {
  productName: string;
  category?: string;
  subCategory?: string;
  quantity: number;
  remarks: string;
  type?: string;
  done_by?: string;
  created_at?: string;
  action?: string;
  date?: string;
}

export interface UploadResult {
  status: number | string;
  message: string;
  errors: string[];
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition(':enter', [
        animate('0.25s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('0.15s ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class InventoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showreset = false;
  filterForm!: FormGroup;

  // Pagination parameters
  page = 1;
  tableSize: any = 10;
  tableSizes: any[] = [10, 20, 50, 100];
  totalRecords = 0;

  // Products list for selector dropdown populated via API
  productList: InventoryProductOption[] = [];
  
  // Master products list for Add Product modal
  masterProductList: any[] = [];

  // Products list for Assign modal populated based on selected store
  assignProductList: any[] = [];

  // Inventory items list initialized via API
  inventoryItems: InventoryItem[] = [];
  filteredInventoryItems: InventoryItem[] = [];

  storeList: any[] = [];
  categoryList: any[] = [];

  // Modals state flags
  createInventoryOpen = false;
  bulkUploadOpen = false;
  viewInventoryOpen = false;
  historyModalOpen = false;
  isConfirmModalOpen = false;
  isHistoryLoading = false;
  isViewLoading = false;
  isEditMode = false;
  
  isUploading = false;
  uploadResult: UploadResult | null = null;

  // Forms mapping
  createInventoryForm!: FormGroup;
  bulkUploadForm!: FormGroup;
  viewInventoryForm!: FormGroup;

  selectedItem: InventoryItem | null = null;
  selectedProductDetails: any = null;
  uploadedFileName = '';

  // Assignments & Employee Databases for Cascading Allocations
  departmentList: InventoryDepartmentOption[] = [];
  employeeList: InventoryEmployeeOption[] = [];

  assignments: InventoryAssignmentLog[] = [
    { id: 1, productName: 'SAND', category: 'PUMP HOUSE+IRP', subCategory: 'TRANCHER MATERIALS', quantity: 500, employeeName: 'Ramesh Kumar', employeeId: 'EMP001', site: 'East Mine', department: 'Excavation', issueDate: '2026-05-27' },
    { id: 2, productName: 'WIRE BRUSH', category: 'MISC', subCategory: 'TRANCHER MATERIALS', quantity: 1, employeeName: 'Sanjay Sharma', employeeId: 'EMP002', site: 'East Mine', department: 'Safety', issueDate: '2026-05-26' }
  ];

  historyLogs: InventoryHistoryLog[] = [
    { productName: 'SAND', action: 'Added Stock', quantity: 1000, date: '2026-05-15', done_by: 'Admin', remarks: 'Vendor Delivery' },
    { productName: 'SAND', action: 'Assigned', quantity: 500, date: '2026-05-27', done_by: 'Ramesh Kumar', remarks: 'Site Work' },
    { productName: 'WIRE BRUSH', action: 'Added Stock', quantity: 10, date: '2026-05-10', done_by: 'Admin', remarks: 'Initial setup' },
    { productName: 'WIRE BRUSH', action: 'Assigned', quantity: 1, date: '2026-05-26', done_by: 'Sanjay Sharma', remarks: 'Maintenance' }
  ];

  selectedProductLogs: InventoryHistoryLog[] = [];

  assignProductOpen = false;
  assignForm!: FormGroup;
  selectedProductMaxStock = 0;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private departmentService: DepartmentService,
    private employeeManagementService: EmployeeManagementService,
    private storeService: StoreService,
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.initForms();
    this.fetchMasterProductList();
    this.fetchProductList();
    this.fetchDepartmentList();
    this.fetchEmployeeList();
    this.fetchStoreList();
    this.fetchCategoryList();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      let shouldRefresh = false;
      if (params['store_id']) {
        this.filterForm.patchValue({ store_id: Number(params['store_id']) }, { emitEvent: false });
        shouldRefresh = true;
      }
      if (params['product_id']) {
        this.filterForm.patchValue({ product_id: Number(params['product_id']) }, { emitEvent: false });
        shouldRefresh = true;
      }
      
      // We still need to call refreshFilteredData once all the fetching is done, 
      // but calling it here directly will apply the query parameters immediately.
      if (shouldRefresh) {
        this.refreshFilteredData();
      }
    });

    this.refreshFilteredData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchDepartmentList() {
    this.departmentService.getAllDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.departmentList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching departments', err);
      }
    });
  }

  fetchEmployeeList(departmentId?: any) {
    this.employeeManagementService.getActiveEmployees(departmentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.employeeList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching active employees', err);
      }
    });
  }

  fetchProductList(storeId?: string | number) {
    this.inventoryService.getInventoryProducts(storeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.productList = res.data.map((item: any) => ({
            ...item,
            id: item.product_id ? item.product_id : item.id
          }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory products for dropdown', err);
      }
    });
  }

  fetchMasterProductList() {
    this.productService.getAllProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.masterProductList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching master products list', err);
      }
    });
  }

  fetchAssignProductList(storeId: string | number) {
    this.inventoryService.getInventoryProducts(storeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.assignProductList = res.data.map((item: any) => ({
            ...item,
            id: item.product_id ? item.product_id : item.id
          }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching assign products list', err);
      }
    });
  }

  fetchStoreList() {
    this.storeService.getAllStores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.storeList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching stores', err);
      }
    });
  }

  fetchCategoryList() {
    this.categoryService.getAllCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.categoryList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching categories', err);
      }
    });
  }

  initSearchForm() {
    // Replaced by initForms filterForm
  }

  initForms() {
    this.filterForm = this.formBuilder.group({
      searchbar: [''],
      store_id: [null],
      product_id: [null],
      category_id: [null]
    });

    // Note: Warehouse and Vendor are strictly omitted as requested
    this.createInventoryForm = this.formBuilder.group({
      productName: ['', Validators.required],
      store_id: ['', Validators.required],
      category: [{ value: '', disabled: true }],
      subCategory: [{ value: '', disabled: true }],
      quantity: ['', [Validators.required, Validators.min(1)]]
    });

    this.bulkUploadForm = this.formBuilder.group({
      file: [null, Validators.required]
    });

    this.viewInventoryForm = this.formBuilder.group({
      productName: [''],
      employeeName: [''],
      category: [''],
      totalStock: ['']
    });

    this.assignForm = this.formBuilder.group({
      store_id: [null, Validators.required],
      productName: [null, Validators.required],
      category: [{ value: '', disabled: true }],
      subCategory: [{ value: '', disabled: true }],
      site: [null],
      department: [null, Validators.required],
      employeeId: [{ value: null, disabled: true }, Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      issueDate: [new Date().toISOString().substring(0, 10), Validators.required]
    });

    this.assignForm.get('store_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((storeId) => {
      // Reset product selection when store changes
      this.assignForm.patchValue({
        productName: null,
        category: '',
        subCategory: ''
      });
      this.selectedProductMaxStock = 0;
      
      if (storeId) {
        this.fetchAssignProductList(storeId);
      } else {
        this.assignProductList = [];
      }
    });

    this.assignForm.get('site')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateEmployeeSelectorState());
    this.assignForm.get('department')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateEmployeeSelectorState());
  }

  fetchInventoryList() {
    const search = this.filterForm?.get('searchbar')?.value || '';
    const filters = this.filterForm?.value || {};

    this.inventoryService.getInventories(this.tableSize, this.page, search, filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.inventoryItems = res.data.map((item: any) => ({
            id: item.id,
            productName: item.product_name,
            category: item.category_name || 'Misc',
            subCategory: item.sub_category_name || '—',
            totalStock: item.total_stock !== undefined ? item.total_stock : 0,
            availableQuantity: item.available_quantity !== undefined ? item.available_quantity : (item.left_quantity !== undefined ? item.left_quantity : item.total_stock),
            employeeName: 'System',
            storeName: item.store?.name || item.store_name || '—',
            store_id: item.store_id || item.store?.id || null,
            stockStatus: item.stock_status,
            stockStatusLabel: item.stock_status_label
          }));
          
          this.filteredInventoryItems = this.inventoryItems;
          
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
          } else {
            this.totalRecords = this.inventoryItems.length;
          }

          this.showreset = Object.values(this.filterForm?.value || {}).some(v => v !== null && v !== '');
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory list:', err);
      }
    });
  }

  refreshFilteredData() {
    this.page = 1;
    this.fetchInventoryList();
  }


  onStoreFilterChange(event: any) {
    const storeId = typeof event === 'object' ? event?.id : event;
    
    // Reset dependent dropdowns to prevent orphaned values
    this.filterForm.patchValue({
      product_id: null
    });

    // Fetch the specific products available ONLY in this store
    this.fetchProductList(storeId || undefined);

    this.page = 1;
    this.fetchInventoryList();
  }

  onProductFilterChange(event: any) {
    if (!event) {
      this.page = 1;
      this.fetchInventoryList();
      return;
    }

    const productId = typeof event === 'object' ? event.id : event;
    
    if (productId) {
      const selected = this.productList.find(p => p.id == productId || p.name === productId);
      if (selected) {
        // Just select the product without patching categories
      }
    }
    this.page = 1;
    this.fetchInventoryList();
  }



  searchfun() {
    this.page = 1;
    this.fetchInventoryList();
  }

  onCategoryFilterChange(event: any) {
    this.page = 1;
    this.fetchInventoryList();
  }

  applyFilters() {
    this.searchfun();
  }

  resetsearchbar() {
    this.filterForm.reset({
      searchbar: '',
      store_id: null,
      product_id: null
    });
    this.page = 1;
    this.fetchInventoryList();
  }

  onTableSizeChange(event: Event | number) {
    const target = (event as Event).target as HTMLSelectElement | null;
    this.tableSize = target ? Number(target.value) : Number(event);
    this.page = 1;
    this.fetchInventoryList();
  }

  onTableDataChange(pageNumber: number) {
    this.page = pageNumber;
    this.fetchInventoryList();
  }

  onProductChange(event: any) {
    if (!event) {
      this.createInventoryForm.patchValue({ category: 'Misc', subCategory: '—' });
      return;
    }

    const productName = typeof event === 'string' ? event : (event?.target?.value || event?.name || '');
    const selected = typeof event === 'object' && event.category_name ? event : this.masterProductList.find(p => p.name === productName);
    
    if (selected) {
      this.createInventoryForm.patchValue({
        category: selected.category_name || 'Misc',
        subCategory: selected.sub_category_name || '—'
      });
    } else {
      this.createInventoryForm.patchValue({
        category: 'Misc',
        subCategory: '—'
      });
    }
  }

  openAddProductModal() {
    this.isEditMode = false;
    this.selectedItem = null;
    this.createInventoryForm.reset({
      productName: '',
      store_id: '',
      category: '',
      subCategory: '',
      quantity: ''
    });
    this.createInventoryForm.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
    this.createInventoryForm.get('quantity')?.updateValueAndValidity();
    this.createInventoryOpen = true;
  }

  // openEditProductModal(item: InventoryItem) {
  //   this.isEditMode = true;
  //   this.selectedItem = item;
  //   this.createInventoryForm.reset({
  //     productName: item.productName,
  //     store_id: (item as any).store_id || '',
  //     category: item.category,
  //     subCategory: item.subCategory,
  //     quantity: item.totalStock
  //   });
  //   this.createInventoryForm.get('quantity')?.setValidators([Validators.required, Validators.min(0)]);
  //   this.createInventoryForm.get('quantity')?.updateValueAndValidity();
  //   this.createInventoryOpen = true;
  // }

  openBulkUploadModal() {
    this.bulkUploadForm.reset();
    this.uploadedFileName = '';
    this.uploadResult = null;
    this.isUploading = false;
    this.bulkUploadOpen = true;
  }

  openViewProductModal(item: InventoryItem) {
    this.selectedItem = item;
    this.selectedProductDetails = null; // Reset previous details
    this.viewInventoryOpen = true;
    this.isViewLoading = true;

    this.inventoryService.getInventoryDetails(item.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isViewLoading = false)
    ).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedProductDetails = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory details:', err);
        this.notificationService.show('Failed to fetch product details.', 'error', 3000);
      }
    });
  }

  openHistoryModal(item: InventoryItem) {
    this.selectedItem = item;
    this.selectedProductLogs = []; // Reset old logs
    this.historyModalOpen = true;
    this.isHistoryLoading = true;

    this.inventoryService.getInventoryLogs(item.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isHistoryLoading = false)
    ).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedProductLogs = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory logs:', err);
        this.notificationService.show('Failed to fetch history logs.', 'error', 3000);
      }
    });
  }

  closeModal() {
    this.createInventoryOpen = false;
    this.bulkUploadOpen = false;
    this.viewInventoryOpen = false;
    this.assignProductOpen = false;
    this.historyModalOpen = false;
    this.isConfirmModalOpen = false;
    this.isHistoryLoading = false;
    this.isViewLoading = false;
    this.selectedItem = null;
    this.isEditMode = false;
  }

  openConfirmModal() {
    if (this.createInventoryForm.invalid) {
      this.createInventoryForm.markAllAsTouched();
      return;
    }
    this.isConfirmModalOpen = true;
  }

  createInventoryItem() {
    if (this.createInventoryForm.invalid) {
      this.createInventoryForm.markAllAsTouched();
      return;
    }

    const productName = this.createInventoryForm.get('productName')?.value;
    const store_id = this.createInventoryForm.get('store_id')?.value;
    const category = this.createInventoryForm.get('category')?.value;
    const subCategory = this.createInventoryForm.get('subCategory')?.value;
    const quantity = Number(this.createInventoryForm.get('quantity')?.value);

    if (this.isEditMode && this.selectedItem) {
      const formData = new FormData();
      formData.append('quantity', quantity.toString());
      if (store_id) formData.append('store_id', store_id);

      this.inventoryService.updateInventoryQuantity(this.selectedItem.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Product quantity updated successfully.', 'success', 3000);
            
            const itemIndex = this.inventoryItems.findIndex(i => i.id === this.selectedItem!.id);
            if (itemIndex > -1) {
              if (quantity !== this.inventoryItems[itemIndex].totalStock) {
                const diff = quantity - this.inventoryItems[itemIndex].totalStock;
                this.historyLogs.unshift({
                  productName: productName,
                  action: diff > 0 ? 'Added Stock' : 'Stock Adjusted',
                  quantity: Math.abs(diff),
                  date: new Date().toISOString().substring(0, 10),
                  done_by: 'Current User',
                  remarks: 'Updated via API'
                });
              }

              this.inventoryItems[itemIndex].productName = res.data?.product_name || productName;
              this.inventoryItems[itemIndex].category = res.data?.category_name || category || 'Misc';
              this.inventoryItems[itemIndex].subCategory = res.data?.sub_category_name || subCategory || '—';
              this.inventoryItems[itemIndex].totalStock = res.data?.total_stock !== undefined ? res.data.total_stock : quantity;
              if (res.data?.available_quantity !== undefined) {
                this.inventoryItems[itemIndex].availableQuantity = res.data.left_quantity !== undefined ? res.data.left_quantity : res.data.available_quantity;
              }
            }

            this.refreshFilteredData();
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to update inventory', 'error', 3000);
          }
        },
        error: (err: any) => {
          let errorMessage = 'Failed to update inventory';
          if (err.status === 422 && err.error?.errors) {
            // Extract the first error message dynamically regardless of the key (e.g. quantity, id, etc.)
            const errorKeys = Object.keys(err.error.errors);
            if (errorKeys.length > 0) {
              errorMessage = err.error.errors[errorKeys[0]][0];
            } else {
              errorMessage = err.error.message || errorMessage;
            }
          } else {
            errorMessage = err?.error?.message || err?.message || errorMessage;
          }
          
          this.notificationService.show(errorMessage, 'error', 4000);
          console.error(err);
        }
      });
    } else {
      const selectedProduct = this.masterProductList.find(p => p.name === productName);
      if (!selectedProduct) {
        this.notificationService.show('Invalid Product Selection.', 'error', 3000);
        return;
      }

      const formData = new FormData();
      formData.append('product_id', selectedProduct.id.toString());
      formData.append('quantity', quantity.toString());
      if (store_id) formData.append('store_id', store_id);

      this.inventoryService.addInventory(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
            this.notificationService.show(res.message || 'Product added to inventory successfully.', 'success', 3000);
            
            const existingIndex = this.inventoryItems.findIndex(
              item => item.productName.toUpperCase() === productName.toUpperCase() && String(item.store_id) === String(store_id)
            );

            if (existingIndex > -1) {
              // Update existing record using response data if available
              this.inventoryItems[existingIndex].totalStock = res.data?.total_stock !== undefined ? res.data.total_stock : (this.inventoryItems[existingIndex].totalStock + quantity);
              this.inventoryItems[existingIndex].availableQuantity = res.data?.left_quantity !== undefined ? res.data.left_quantity : (res.data?.available_quantity !== undefined ? res.data.available_quantity : (res.data?.total_stock || this.inventoryItems[existingIndex].totalStock + quantity));
              this.inventoryItems[existingIndex].category = res.data?.category_name || this.inventoryItems[existingIndex].category;
              this.inventoryItems[existingIndex].subCategory = res.data?.sub_category_name || this.inventoryItems[existingIndex].subCategory;
              this.inventoryItems[existingIndex].storeName = res.data?.store_name || this.inventoryItems[existingIndex].storeName;
              this.inventoryItems[existingIndex].employeeName = 'System';
            } else {
              const nextId = this.inventoryItems.length > 0 ? Math.max(...this.inventoryItems.map(item => item.id)) + 1 : 1;
              const newItem: InventoryItem = {
                id: res.data?.id || nextId,
                productName: res.data?.product_name || productName,
                category: res.data?.category_name || category || 'Misc',
                subCategory: res.data?.sub_category_name || subCategory || '—',
                totalStock: res.data?.total_stock !== undefined ? res.data.total_stock : quantity,
                availableQuantity: res.data?.left_quantity !== undefined ? res.data.left_quantity : (res.data?.available_quantity !== undefined ? res.data.available_quantity : (res.data?.total_stock || quantity)),
                employeeName: 'System',
                storeName: res.data?.store_name || undefined,
                store_id: res.data?.store_id || store_id || undefined
              };
              this.inventoryItems.unshift(newItem);
            }

            this.historyLogs.unshift({
              productName: productName,
              action: 'Added Stock',
              quantity: quantity,
              date: new Date().toISOString().substring(0, 10),
              done_by: 'Current User',
              remarks: 'Added via API'
            });

            this.refreshFilteredData();
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to add inventory', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errorMessage = err?.error?.message || err?.message || 'Failed to add inventory';
          this.notificationService.show(errorMessage, 'error', 3000);
          console.error(err);
        }
      });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      this.uploadedFileName = file.name;
      this.bulkUploadForm.patchValue({ file: file });
    }
  }

  uploadBulkFile() {
    if (this.bulkUploadForm.invalid) {
      this.bulkUploadForm.markAllAsTouched();
      return;
    }

    const file = this.bulkUploadForm.get('file')?.value;
    if (!file) {
      this.notificationService.show('Please select a file to upload.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    this.isUploading = true;
    this.uploadResult = null;

    this.inventoryService.bulkUploadInventory(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
          this.uploadResult = null;
          this.notificationService.show(res.message || `Bulk inventory file "${this.uploadedFileName}" uploaded successfully.`, 'success', 3000);
          this.refreshFilteredData();
          this.closeModal();
        } else {
          this.uploadResult = {
            status: res.status || 422,
            message: res.message || 'Import process completed with errors.',
            errors: res.errors || []
          };
        }
      },
      error: (err: any) => {
        this.isUploading = false;
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

        this.uploadResult = {
          status: err.status || errObj.status || 422,
          message: errObj.message || err.message || 'Failed to import.',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
      }
    });
  }

  // --- Assign Product to Employee Logic ---
  openAssignModal() {
    this.assignForm.reset({
      store_id: null,
      productName: null,
      category: '',
      subCategory: '',
      site: null,
      department: null,
      employeeId: null,
      quantity: '',
      issueDate: new Date().toISOString().substring(0, 10)
    });
    this.assignProductList = [];
    this.selectedProductMaxStock = 0;
    this.assignForm.get('employeeId')?.disable();
    this.assignProductOpen = true;
  }

  onAssignProductChange(event: any) {
    const productName = typeof event === 'string' ? event : (event?.target?.value || event?.name || '');
    const selectedProduct = this.assignProductList.find(item => item.name === productName);
    const selectedInventoryItem = this.inventoryItems.find(item => item.productName === productName);

    if (selectedProduct) {
      this.selectedProductMaxStock = selectedProduct.available_quantity !== undefined ? selectedProduct.available_quantity : (selectedProduct.left_quantity !== undefined ? selectedProduct.left_quantity : 0);
      this.assignForm.patchValue({
        category: selectedProduct.category_name || 'Misc',
        subCategory: selectedProduct.sub_category_name || '—'
      });
      this.assignForm.get('quantity')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.selectedProductMaxStock)
      ]);
      this.assignForm.get('quantity')?.updateValueAndValidity();
    } else {
      this.selectedProductMaxStock = 0;
      this.assignForm.patchValue({
        category: '',
        subCategory: ''
      });
      this.assignForm.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
      this.assignForm.get('quantity')?.updateValueAndValidity();
    }
  }

  updateEmployeeSelectorState() {
    const department = this.assignForm.get('department')?.value;
    const empControl = this.assignForm.get('employeeId');
    if (department) {
      empControl?.enable();
      this.fetchEmployeeList(department);
    } else {
      empControl?.disable();
      empControl?.setValue(null);
      this.employeeList = [];
    }
  }

  getFilteredEmployees() {
    return this.employeeList;
  }

  submitAssignment() {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const formValues = this.assignForm.getRawValue();
    const { store_id, productName, employeeId, quantity, site, department, issueDate } = formValues;

    const selectedProduct = this.assignProductList.find(p => p.name === productName);
    if (!selectedProduct) {
      this.notificationService.show('Invalid Product Selection.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('product_id', selectedProduct.id.toString());
    formData.append('store_id', store_id.toString());
    formData.append('issued_date', issueDate);
    formData.append('site_id', site ? site.toString() : '');
    formData.append('department_id', department.toString());
    formData.append('employee_id', employeeId.toString());
    formData.append('quantity', quantity.toString());

    this.inventoryService.assignInventory(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
          // Deduct stock in real-time locally
          const selectedItem = this.inventoryItems.find(item => item.productName === productName);
          if (selectedItem) {
            selectedItem.totalStock -= quantity;
          }

          // Find Employee details
          const emp = this.employeeList.find(e => e.id == employeeId);
          const employeeName = emp ? (emp.name || emp.first_name + ' ' + emp.last_name) : 'Unknown';
          const dept = this.departmentList.find(d => d.id == department);
          const departmentName = dept ? dept.name : 'Unknown';

          // Store in assignments log locally
          const nextId = this.assignments.length > 0 ? Math.max(...this.assignments.map(a => a.id)) + 1 : 1;
          const newAssignment = {
            id: nextId,
            productName,
            category: selectedItem?.category || 'Misc',
            subCategory: selectedItem?.subCategory || '—',
            quantity,
            employeeName,
            employeeId,
            site: site || '',
            department: departmentName,
            issueDate
          };
          this.assignments.unshift(newAssignment);

          this.historyLogs.unshift({
            productName: productName,
            action: 'Assigned',
            quantity: quantity,
            date: issueDate,
            done_by: employeeName,
            remarks: `Assigned to ${employeeName}`
          });

          this.refreshFilteredData();
          this.notificationService.show(`Successfully assigned ${quantity} unit(s) of ${productName} to ${employeeName}.`, 'success', 3000);
          this.closeModal();
        } else {
          this.notificationService.show(res?.message || 'Failed to assign product', 'error', 3000);
        }
      },
      error: (err: any) => {
        let errorMessage = 'Failed to assign product';
        if (err.status === 422 && err.error?.errors) {
            // Extract the first error message from the object
            const errorKeys = Object.keys(err.error.errors);
            if (errorKeys.length > 0) {
                errorMessage = err.error.errors[errorKeys[0]][0];
            } else {
                errorMessage = err.error.message || errorMessage;
            }
        } else {
            errorMessage = err?.error?.message || err?.message || errorMessage;
        }
        
        this.notificationService.show(errorMessage, 'error', 4000);
        console.error(err);
      }
    });
  }

  getProductAssignments(productName: string): any[] {
    return this.assignments.filter(a => a.productName === productName);
  }

  getProductHistory(productName: string): any[] {
    return this.historyLogs.filter(h => h.productName === productName);
  }
}
