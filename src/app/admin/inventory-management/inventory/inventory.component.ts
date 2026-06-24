import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface InventoryItem {
  id: number;
  productName: string;
  category: string;
  subCategory: string;
  totalStock: number;
  employeeName: string;
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
  searchbarform!: FormGroup;

  // Pagination parameters
  page = 1;
  tableSize: any = 10;
  tableSizes: any = [10, 25, 50, 100, 'all'];
  totalRecords = 0;

  // Products list for selector dropdown populated via API
  productList: any[] = [];

  // Empty Inventory items list initialized via API
  inventoryItems: InventoryItem[] = [];
  filteredInventoryItems: InventoryItem[] = [];

  // Modals state flags
  createInventoryOpen = false;
  bulkUploadOpen = false;
  viewInventoryOpen = false;
  historyModalOpen = false;
  isEditMode = false;

  // Forms mapping
  createInventoryForm!: FormGroup;
  bulkUploadForm!: FormGroup;
  viewInventoryForm!: FormGroup;

  selectedItem: InventoryItem | null = null;
  selectedProductDetails: any = null;
  uploadedFileName = '';

  // Assignments & Employee Databases for Cascading Allocations
  departmentList: any[] = [];
  employeeList: any[] = [];

  assignments: any[] = [
    { id: 1, productName: 'SAND', category: 'PUMP HOUSE+IRP', subCategory: 'TRANCHER MATERIALS', quantity: 500, employeeName: 'Ramesh Kumar', employeeId: 'EMP001', site: 'East Mine', department: 'Excavation', issueDate: '2026-05-27' },
    { id: 2, productName: 'WIRE BRUSH', category: 'MISC', subCategory: 'TRANCHER MATERIALS', quantity: 1, employeeName: 'Sanjay Sharma', employeeId: 'EMP002', site: 'East Mine', department: 'Safety', issueDate: '2026-05-26' }
  ];

  historyLogs: any[] = [
    { productName: 'SAND', action: 'Added Stock', quantity: 1000, date: '2026-05-15', doneBy: 'Admin', remarks: 'Vendor Delivery' },
    { productName: 'SAND', action: 'Assigned', quantity: 500, date: '2026-05-27', doneBy: 'Ramesh Kumar', remarks: 'Site Work' },
    { productName: 'WIRE BRUSH', action: 'Added Stock', quantity: 10, date: '2026-05-10', doneBy: 'Admin', remarks: 'Initial setup' },
    { productName: 'WIRE BRUSH', action: 'Assigned', quantity: 1, date: '2026-05-26', doneBy: 'Sanjay Sharma', remarks: 'Maintenance' }
  ];

  selectedProductLogs: any[] = [];

  assignProductOpen = false;
  assignForm!: FormGroup;
  selectedProductMaxStock = 0;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private departmentService: DepartmentService,
    private employeeManagementService: EmployeeManagementService
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.initForms();
    this.fetchProductList();
    this.fetchDepartmentList();
    this.fetchEmployeeList();
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

  fetchEmployeeList() {
    this.employeeManagementService.getAllEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.employeeList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching employees', err);
      }
    });
  }

  fetchProductList() {
    this.productService.getAllProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.productList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching products for dropdown', err);
      }
    });
  }

  initSearchForm() {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['']
    });
  }

  initForms() {
    // Note: Warehouse and Vendor are strictly omitted as requested
    this.createInventoryForm = this.formBuilder.group({
      productName: ['', Validators.required],
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
      productName: [null, Validators.required],
      category: [{ value: '', disabled: true }],
      subCategory: [{ value: '', disabled: true }],
      site: [null, Validators.required],
      department: [null, Validators.required],
      employeeId: [{ value: null, disabled: true }, Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      issueDate: [new Date().toISOString().substring(0, 10), Validators.required]
    });

    this.assignForm.get('site')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateEmployeeSelectorState());
    this.assignForm.get('department')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateEmployeeSelectorState());
  }

  fetchInventoryList() {
    const search = this.searchbarform?.get('searchbar')?.value?.trim() || '';
    this.inventoryService.getInventories(this.tableSize, this.page, search).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.inventoryItems = res.data.map((item: any) => ({
            id: item.id,
            productName: item.product_name,
            category: item.category_name || 'Misc',
            subCategory: item.sub_category_name || '—',
            totalStock: item.left_quantity !== undefined ? item.left_quantity : item.total_stock,
            employeeName: 'System'
          }));
          this.filteredInventoryItems = [...this.inventoryItems];
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
            this.page = res.pagination.current_page;
          } else {
            this.totalRecords = this.inventoryItems.length;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory list:', err);
      }
    });
  }

  refreshFilteredData() {
    this.fetchInventoryList();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.page = 1;
    this.fetchInventoryList();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.fetchInventoryList();
  }

  onTableSizeChange(event: any) {
    this.tableSize = event.target.value;
    this.page = 1;
    this.fetchInventoryList();
  }

  onTableDataChange(pageNumber: number) {
    this.page = pageNumber;
    this.fetchInventoryList();
  }

  onProductChange(event: any) {
    const productName = event.target.value;
    const selected = this.productList.find(p => p.name === productName);
    
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
      category: '',
      subCategory: '',
      quantity: ''
    });
    this.createInventoryForm.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
    this.createInventoryForm.get('quantity')?.updateValueAndValidity();
    this.createInventoryOpen = true;
  }

  openEditProductModal(item: InventoryItem) {
    this.isEditMode = true;
    this.selectedItem = item;
    this.createInventoryForm.reset({
      productName: item.productName,
      category: item.category,
      subCategory: item.subCategory,
      quantity: item.totalStock
    });
    this.createInventoryForm.get('quantity')?.setValidators([Validators.required, Validators.min(0)]);
    this.createInventoryForm.get('quantity')?.updateValueAndValidity();
    this.createInventoryOpen = true;
  }

  openBulkUploadModal() {
    this.bulkUploadForm.reset();
    this.uploadedFileName = '';
    this.bulkUploadOpen = true;
  }

  openViewProductModal(item: InventoryItem) {
    this.selectedItem = item;
    this.selectedProductDetails = null; // Reset previous details
    this.viewInventoryOpen = true;

    this.inventoryService.getInventoryDetails(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedProductDetails = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory details:', err);
      }
    });
  }

  openHistoryModal(item: InventoryItem) {
    this.selectedItem = item;
    this.selectedProductLogs = []; // Reset old logs
    this.historyModalOpen = true;

    this.inventoryService.getInventoryLogs(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedProductLogs = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching inventory logs:', err);
      }
    });
  }

  closeModal() {
    this.createInventoryOpen = false;
    this.bulkUploadOpen = false;
    this.viewInventoryOpen = false;
    this.assignProductOpen = false;
    this.historyModalOpen = false;
    this.selectedItem = null;
    this.isEditMode = false;
  }

  createInventoryItem() {
    if (this.createInventoryForm.invalid) {
      this.createInventoryForm.markAllAsTouched();
      return;
    }

    const productName = this.createInventoryForm.get('productName')?.value;
    const category = this.createInventoryForm.get('category')?.value;
    const subCategory = this.createInventoryForm.get('subCategory')?.value;
    const quantity = Number(this.createInventoryForm.get('quantity')?.value);

    if (this.isEditMode && this.selectedItem) {
      const formData = new FormData();
      formData.append('quantity', quantity.toString());

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
                  doneBy: 'Current User',
                  remarks: 'Updated via API'
                });
              }

              this.inventoryItems[itemIndex].productName = res.data?.product_name || productName;
              this.inventoryItems[itemIndex].category = res.data?.category_name || category || 'Misc';
              this.inventoryItems[itemIndex].subCategory = res.data?.sub_category_name || subCategory || '—';
              this.inventoryItems[itemIndex].totalStock = res.data?.total_stock !== undefined ? res.data.total_stock : quantity;
            }

            this.refreshFilteredData();
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to update inventory', 'error', 3000);
          }
        },
        error: (err: any) => {
          if (err.status === 422) {
            const errorMessage = err.error?.errors?.id?.[0] || err.error?.message || 'Validation failed';
            this.notificationService.show(errorMessage, 'error', 3000);
          } else {
            const errorMessage = err?.error?.message || err?.message || 'Failed to update inventory';
            this.notificationService.show(errorMessage, 'error', 3000);
          }
          console.error(err);
        }
      });
    } else {
      const selectedProduct = this.productList.find(p => p.name === productName);
      if (!selectedProduct) {
        this.notificationService.show('Invalid Product Selection.', 'error', 3000);
        return;
      }

      const formData = new FormData();
      formData.append('product_id', selectedProduct.id.toString());
      formData.append('quantity', quantity.toString());

      this.inventoryService.addInventory(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
            this.notificationService.show(res.message || 'Product added to inventory successfully.', 'success', 3000);
            
            const existing = this.inventoryItems.find(item => item.productName.toUpperCase() === productName.toUpperCase());

            if (existing) {
              existing.totalStock += quantity;
              existing.employeeName = 'Current User';
            } else {
              const nextId = this.inventoryItems.length > 0 ? Math.max(...this.inventoryItems.map(item => item.id)) + 1 : 1;
              const newItem: InventoryItem = {
                id: res.data?.id || nextId,
                productName: productName,
                category: category || 'Misc',
                subCategory: subCategory || '—',
                totalStock: res.data?.total_stock || quantity,
                employeeName: 'Current User'
              };
              this.inventoryItems.unshift(newItem);
            }

            this.historyLogs.unshift({
              productName: productName,
              action: 'Added Stock',
              quantity: quantity,
              date: new Date().toISOString().substring(0, 10),
              doneBy: 'Current User',
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

  onFileChange(event: any) {
    const file = event.target.files?.[0];
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

    this.inventoryService.bulkUploadInventory(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
          this.notificationService.show(res.message || `Bulk inventory file "${this.uploadedFileName}" uploaded successfully.`, 'success', 3000);
          this.refreshFilteredData();
          this.closeModal();
        } else {
          this.notificationService.show(res?.message || 'Failed to bulk upload inventory.', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error during bulk upload:', err);
        const originalError = err.originalError || err.error || err;
        let errorMessage = originalError.message || err.message || 'Failed to bulk upload inventory.';

        if (originalError.errors && Array.isArray(originalError.errors)) {
          const formattedErrors = originalError.errors.map((e: any) => `Row ${e.row}: ${e.message}`).join('\n');
          errorMessage += '\n' + formattedErrors;
        }

        const duration = originalError.errors ? 8000 : 3000;
        this.notificationService.show(errorMessage, 'error', duration);
      }
    });
  }

  // --- Assign Product to Employee Logic ---
  openAssignModal() {
    this.assignForm.reset({
      productName: null,
      category: '',
      subCategory: '',
      site: null,
      department: null,
      employeeId: null,
      quantity: '',
      issueDate: new Date().toISOString().substring(0, 10)
    });
    this.selectedProductMaxStock = 0;
    this.assignForm.get('employeeId')?.disable();
    this.assignProductOpen = true;
  }

  onAssignProductChange(event: any) {
    const productName = typeof event === 'string' ? event : (event?.target?.value || event?.name || '');
    const selectedProduct = this.productList.find(item => item.name === productName);
    const selectedInventoryItem = this.inventoryItems.find(item => item.productName === productName);

    if (selectedProduct) {
      this.selectedProductMaxStock = selectedInventoryItem ? selectedInventoryItem.totalStock : 0;
      this.assignForm.patchValue({
        category: selectedProduct.category_name || 'Misc',
        subCategory: selectedProduct.sub_category_name || '—'
      });
      this.assignForm.get('quantity')?.setValidators([
        Validators.required,
        Validators.min(1),
        ...(selectedInventoryItem ? [Validators.max(selectedInventoryItem.totalStock)] : [])
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
    } else {
      empControl?.disable();
      empControl?.setValue('');
    }
  }

  getFilteredEmployees() {
    const departmentId = this.assignForm.get('department')?.value;
    if (!departmentId) return [];
    
    // Fallback filter if API data has structure, else just return all to avoid blocking UI
    return this.employeeList.filter(emp => {
      const matchDept = emp.department_id == departmentId || emp.department === departmentId;
      // We don't have a site API yet so we can't reliably filter by site ID, 
      // but if the UI is unblocked we can just return the employees that match the department.
      return matchDept || true; // Remove strict filtering until site API is added
    });
  }

  submitAssignment() {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const formValues = this.assignForm.getRawValue();
    const { productName, employeeId, quantity, site, department, issueDate } = formValues;

    const selectedProduct = this.productList.find(p => p.name === productName);
    if (!selectedProduct) {
      this.notificationService.show('Invalid Product Selection.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('product_id', selectedProduct.id.toString());
    formData.append('issued_date', issueDate);
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
            doneBy: employeeName,
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
        const errorMessage = err?.error?.message || err?.message || 'Failed to assign product';
        this.notificationService.show(errorMessage, 'error', 3000);
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
