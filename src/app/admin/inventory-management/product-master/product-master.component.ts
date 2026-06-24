import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { CategoryService } from 'src/app/core/services/category.service';
import { ProductService } from 'src/app/core/services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Product {
  id: number;
  name: string;
  category: string;
  minStock: number;
  is_active: number;
}

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, NgxPaginationModule],
  templateUrl: './product-master.component.html',
  styleUrl: './product-master.component.scss',
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
export class ProductMasterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showreset = false;
  searchbarform!: FormGroup;

  // Pagination parameters
  page = 1;
  tableSize: any = 10;
  tableSizes: any = [10, 25, 50, 100, 'all'];
  totalRecords = 0;

  // Mock Categories list with Subcategories grouped under them
  categories: { name: string; subcategories: string[] }[] = [
    {
      name: 'Pump House',
      subcategories: ['Pump House', 'Pump House Fitting', 'Water Pump', 'Sump Pump']
    },
    {
      name: 'IRP',
      subcategories: ['IRP', 'IRP Valve', 'Pressure Gauge', 'Agitator Motor', 'Air Blower']
    },
    {
      name: 'Pump House+IRP',
      subcategories: ['Pump House+IRP', 'Integrated Pump', 'Flow Meter']
    },
    {
      name: 'JCB',
      subcategories: ['JCB', 'JCB Bucket', 'Hydraulic Hose']
    },
    {
      name: 'Misc',
      subcategories: ['Misc', 'General Tools', 'Safety Gear']
    },
    {
      name: 'RMC/Road Work',
      subcategories: ['RMC/Road Work', 'Admixture', 'Aggregate (10 MM)', 'Aggregate (20 MM)']
    },
    {
      name: 'Civil Work',
      subcategories: ['Civil Work', 'Cement Bags', 'Steel Rods']
    },
    {
      name: 'Combine',
      subcategories: ['Combine', 'Cut Off Machine', 'Harvester Blade']
    },
    {
      name: 'Road Work',
      subcategories: ['Road Work', 'Adjustable Props', 'Asphalt Mix']
    }
  ];

  // Flat Categories list with group mapping for ng-select
  categoriesGrouped: any[] = [
    { name: 'Pump House', category: 'Pump House' },
    { name: 'Pump House Fitting', category: 'Pump House' },
    { name: 'Water Pump', category: 'Pump House' },
    { name: 'Sump Pump', category: 'Pump House' },
    
    { name: 'IRP', category: 'IRP' },
    { name: 'IRP Valve', category: 'IRP' },
    { name: 'Pressure Gauge', category: 'IRP' },
    { name: 'Agitator Motor', category: 'IRP' },
    { name: 'Air Blower', category: 'IRP' },

    { name: 'Pump House+IRP', category: 'Pump House+IRP' },
    { name: 'Integrated Pump', category: 'Pump House+IRP' },
    { name: 'Flow Meter', category: 'Pump House+IRP' },

    { name: 'JCB', category: 'JCB' },
    { name: 'JCB Bucket', category: 'JCB' },
    { name: 'Hydraulic Hose', category: 'JCB' },

    { name: 'Misc', category: 'Misc' },
    { name: 'General Tools', category: 'Misc' },
    { name: 'Safety Gear', category: 'Misc' },

    { name: 'RMC/Road Work', category: 'RMC/Road Work' },
    { name: 'Admixture', category: 'RMC/Road Work' },
    { name: 'Aggregate (10 MM)', category: 'RMC/Road Work' },
    { name: 'Aggregate (20 MM)', category: 'RMC/Road Work' },

    { name: 'Civil Work', category: 'Civil Work' },
    { name: 'Cement Bags', category: 'Civil Work' },
    { name: 'Steel Rods', category: 'Civil Work' },

    { name: 'Combine', category: 'Combine' },
    { name: 'Cut Off Machine', category: 'Combine' },
    { name: 'Harvester Blade', category: 'Combine' },

    { name: 'Road Work', category: 'Road Work' },
    { name: 'Adjustable Props', category: 'Road Work' },
    { name: 'Asphalt Mix', category: 'Road Work' }
  ];

  // Mock Products list removed, will be populated via API
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Modals state flags
  createProductOpen = false;
  updateProductOpen = false;
  viewProductOpen = false;

  // Forms mapping
  createProductForm!: FormGroup;
  updateProductForm!: FormGroup;
  viewProductForm!: FormGroup;

  selectedProduct: Product | null = null;
  selectedProductDetails: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.initForms();
    this.fetchSubCategories();
    this.refreshFilteredData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchSubCategories() {
    this.categoryService.getAllSubCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.categoriesGrouped = res.data.map((sc: any) => ({
             id: sc.id,
             name: sc.name,
             category: sc.category_name || 'Sub Categories'
          }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching subcategories', err);
      }
    });
  }

  initSearchForm() {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['']
    });
  }

  initForms() {
    // Note: Company and UOM fields are strictly omitted as requested
    this.createProductForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      minStock: ['', [Validators.required, Validators.min(0)]]
    });

    this.updateProductForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      minStock: ['', [Validators.required, Validators.min(0)]]
    });

    this.viewProductForm = this.formBuilder.group({
      name: [''],
      category: [''],
      minStock: [''],
      status: ['']
    });
  }

  refreshFilteredData() {
    const query = this.searchbarform?.get('searchbar')?.value?.trim();
    this.productService.getProducts(this.page, this.tableSize, query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.filteredProducts = res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.sub_category_name || p.category_name || 'Uncategorized',
            minStock: p.min_stock,
            is_active: p.status
          }));
          
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
          } else {
            this.totalRecords = this.filteredProducts.length;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching products', err);
      }
    });
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.page = 1;
    this.refreshFilteredData();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.refreshFilteredData();
  }

  onTableSizeChange(event: any) {
    this.tableSize = event.target.value;
    this.page = 1;
    this.refreshFilteredData();
  }

  onTableDataChange(pageNumber: number) {
    this.page = pageNumber;
    this.refreshFilteredData();
  }

  toggleProductStatus(prod: Product) {
    const newStatus = prod.is_active === 1 ? 0 : 1;
    this.productService.updateProductStatus(prod.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          prod.is_active = newStatus;
          this.notificationService.show(
            res.message || `Product status changed to ${newStatus === 1 ? 'Active' : 'Inactive'} successfully.`,
            'success',
            3000
          );
        } else {
          this.notificationService.show(res?.message || 'Failed to update product status', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'Failed to update product status';
        this.notificationService.show(errorMessage, 'error', 3000);
        console.error(err);
      }
    });
  }

  openAddProductModal() {
    this.createProductForm.reset({
      name: '',
      category: '',
      minStock: ''
    });
    this.createProductOpen = true;
  }

  openEditProductModal(prod: Product) {
    this.selectedProduct = prod;
    this.productService.getProductById(prod.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          const data = res.data;
          this.updateProductForm.patchValue({
            name: data.name,
            category: data.sub_category_name || data.category_name,
            minStock: data.min_stock
          });
          this.updateProductOpen = true;
        } else {
          this.notificationService.show('Failed to fetch product details', 'error', 3000);
        }
      },
      error: (err: any) => {
        this.notificationService.show('Failed to fetch product details', 'error', 3000);
        console.error(err);
      }
    });
  }

  openViewProductModal(prod: Product) {
    this.selectedProduct = prod;
    this.selectedProductDetails = null;
    this.viewProductOpen = true;

    this.productService.getProductById(prod.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedProductDetails = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error fetching product details:', err);
      }
    });
  }

  closeModal() {
    this.createProductOpen = false;
    this.updateProductOpen = false;
    this.viewProductOpen = false;
    this.selectedProduct = null;
  }

  createProduct() {
    if (this.createProductForm.invalid) {
      this.createProductForm.markAllAsTouched();
      return;
    }

    const name = this.createProductForm.get('name')?.value.trim();
    const subCategoryName = this.createProductForm.get('category')?.value;
    const minStock = Number(this.createProductForm.get('minStock')?.value);

    // Find the sub_category_id from the categoriesGrouped array
    const selectedSubCategory = this.categoriesGrouped.find(c => c.name === subCategoryName);
    const subCategoryId = selectedSubCategory ? selectedSubCategory.id : '';

    if (!subCategoryId) {
      this.notificationService.show('Invalid Category Selection.', 'error', 3000);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sub_category_id', subCategoryId.toString());
    formData.append('min_stock', minStock.toString());

    this.productService.createProduct(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
          this.notificationService.show(res.message || 'Product created successfully.', 'success', 3000);
          
          if (res.data) {
            this.refreshFilteredData();
          }
          this.closeModal();
        } else {
          this.notificationService.show(res?.message || 'Failed to create product', 'error', 3000);
        }
      },
      error: (err: any) => {
        if (err.status === 422) {
          const errorMessage = err.error?.errors?.name?.[0] || err.error?.message || 'Validation failed';
          this.notificationService.show(errorMessage, 'error', 3000);
        } else {
          const errorMessage = err?.message || 'Failed to create product';
          this.notificationService.show(errorMessage, 'error', 3000);
        }
        console.error(err);
      }
    });
  }

  updateProduct() {
    if (this.updateProductForm.invalid) {
      this.updateProductForm.markAllAsTouched();
      return;
    }

    const name = this.updateProductForm.get('name')?.value.trim();
    const subCategoryName = this.updateProductForm.get('category')?.value;
    const minStock = Number(this.updateProductForm.get('minStock')?.value);

    if (this.selectedProduct) {
      // Find the sub_category_id from the categoriesGrouped array
      const selectedSubCategory = this.categoriesGrouped.find(c => c.name === subCategoryName);
      const subCategoryId = selectedSubCategory ? selectedSubCategory.id : '';

      if (!subCategoryId) {
        this.notificationService.show('Invalid Category Selection.', 'error', 3000);
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('sub_category_id', subCategoryId.toString());
      formData.append('min_stock', minStock.toString());

      this.productService.updateProduct(this.selectedProduct.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Product updated successfully.', 'success', 3000);
            
            if (this.selectedProduct) {
              this.refreshFilteredData();
            }
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to update product', 'error', 3000);
          }
        },
        error: (err: any) => {
          if (err.status === 422) {
            const errorMessage = err.error?.errors?.name?.[0] || err.error?.message || 'Validation failed';
            this.notificationService.show(errorMessage, 'error', 3000);
          } else {
            const errorMessage = err?.message || 'Failed to update product';
            this.notificationService.show(errorMessage, 'error', 3000);
          }
          console.error(err);
        }
      });
    }
  }
}
