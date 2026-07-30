import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CategoryService } from 'src/app/core/services/category.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';

interface Category {
  id: number;
  categoryName: string;
  is_active: number;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  is_active: number;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
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
export class CategoriesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  activeTab: 'Categories' | 'Sub Categories' = 'Categories';
  
  // Search parameters
  searchbarform!: FormGroup;
  showreset = false;

  // Pagination parameters
  page = 1;
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100];
  totalRecords = 0;

  // Categories Datasets
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  allCategories: Category[] = []; // For dropdowns and lookups

  // Sub Categories Datasets
  subCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];

  // Modals state management
  createCategoryOpen = false;
  updateCategoryOpen = false;
  viewCategoryOpen = false;

  createSubCategoryOpen = false;
  updateSubCategoryOpen = false;
  viewSubCategoryOpen = false;

  // Reactives Form Groups
  createCategoryForm!: FormGroup;
  updateCategoryForm!: FormGroup;
  viewCategoryForm!: FormGroup;

  createSubCategoryForm!: FormGroup;
  updateSubCategoryForm!: FormGroup;
  viewSubCategoryForm!: FormGroup;

  // Trackers
  selectedCategory: Category | null = null;
  selectedCategoryDetails: any = null;
  selectedSubCategory: SubCategory | null = null;
  selectedSubCategoryDetails: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.initForms();
    this.fetchAllCategoriesForDropdown();
    this.refreshFilteredData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Active Tab Toggling
  setActiveTab(tab: 'Categories' | 'Sub Categories') {
    this.activeTab = tab;
    this.page = 1;
    this.searchbarform.reset({ searchbar: '' }, { emitEvent: false });
    this.showreset = false;
    this.refreshFilteredData();
  }

  // Search logic init
  initSearchForm() {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['']
    });

    // Realtime search query value changes subscription
    this.searchbarform.get('searchbar')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.showreset = !!val;
      // Search is now triggered exclusively via the search button
    });
  }

  initForms() {
    // Categories Forms
    this.createCategoryForm = this.formBuilder.group({
      categoryName: ['', Validators.required]
    });
    this.updateCategoryForm = this.formBuilder.group({
      categoryName: ['', Validators.required]
    });
    this.viewCategoryForm = this.formBuilder.group({
      categoryName: [''],
      status: ['']
    });

    // Sub Categories Forms
    this.createSubCategoryForm = this.formBuilder.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
    this.updateSubCategoryForm = this.formBuilder.group({
      name: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
    this.viewSubCategoryForm = this.formBuilder.group({
      name: [''],
      categoryId: [''],
      status: ['']
    });
  }

  refreshFilteredData() {
    if (this.activeTab === 'Categories') {
      this.fetchCategories();
    } else {
      this.fetchSubCategories();
    }
  }

  fetchCategories() {
    const query = this.searchbarform?.get('searchbar')?.value?.trim();
    this.categoryService.getCategories(this.page, this.tableSize, query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.categories = res.data.map((c: any) => ({
            id: c.id,
            categoryName: c.name,
            is_active: c.status
          }));
          this.filteredCategories = [...this.categories];
          
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
          } else {
            this.totalRecords = this.categories.length;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching categories', err);
      }
    });
  }

  fetchSubCategories() {
    const query = this.searchbarform?.get('searchbar')?.value?.trim();
    this.categoryService.getSubCategories(this.page, this.tableSize, query).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.subCategories = res.data.map((sc: any) => ({
            id: sc.id,
            name: sc.name,
            categoryId: sc.category_id,
            is_active: sc.status
          }));
          this.filteredSubCategories = [...this.subCategories];
          
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
          } else {
            this.totalRecords = this.subCategories.length;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching sub categories', err);
      }
    });
  }

  fetchAllCategoriesForDropdown() {
    this.categoryService.getAllCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.allCategories = res.data.map((c: any) => ({
            id: c.id,
            categoryName: c.name,
            is_active: c.status
          }));
        }
      },
      error: (err: any) => console.error('Error fetching all categories', err)
    });
  }

  // Filtering lists dynamically
  searchfun() {
    const query = this.searchbarform.get('searchbar')?.value?.trim().toLowerCase();
    
    this.page = 1;
    if (this.activeTab === 'Categories') {
      this.fetchCategories();
    } else {
      this.fetchSubCategories();
    }
  }

  resetsearchbar() {
    this.searchbarform.patchValue({ searchbar: '' }, { emitEvent: false });
    this.showreset = false;
    this.refreshFilteredData();
  }

  // Slices table data based on current page and table size limits
  getPaginatedCategories(): Category[] {
    const start = (this.page - 1) * this.tableSize;
    return this.filteredCategories.slice(start, start + this.tableSize);
  }

  getPaginatedSubCategories(): SubCategory[] {
    const start = (this.page - 1) * this.tableSize;
    return this.filteredSubCategories.slice(start, start + this.tableSize);
  }

  // Sizing changes
  onTableSizeChange(event: any) {
    this.tableSize = event.target ? event.target.value : event;
    this.page = 1;
    if (this.activeTab === 'Categories') {
      this.fetchCategories();
    } else {
      this.fetchSubCategories();
    }
  }

  onTableDataChange(pageNumber: number) {
    this.page = pageNumber;
    if (this.activeTab === 'Categories') {
      this.fetchCategories();
    } else {
      this.fetchSubCategories();
    }
  }

  getCategoryName(categoryId?: number | null): string {
    if (categoryId === undefined || categoryId === null) return '—';
    const cat = this.allCategories.find(c => c.id === Number(categoryId));
    return cat ? cat.categoryName : '—';
  }

  // Status triggers
  toggleCategoryStatus(cat: Category) {
    const newStatus = cat.is_active === 1 ? 0 : 1;
    this.categoryService.updateCategoryStatus(cat.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          cat.is_active = newStatus;
          this.notificationService.show(
            res.message || `Category status changed to ${newStatus === 1 ? 'Active' : 'Inactive'} successfully.`,
            'success',
            3000
          );
        } else {
          this.notificationService.show(res?.message || 'Failed to update category status', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'Failed to update category status';
        this.notificationService.show(errorMessage, 'error', 3000);
        console.error(err);
      }
    });
  }

  toggleSubCategoryStatus(sub: SubCategory) {
    const newStatus = sub.is_active === 1 ? 0 : 1;
    this.categoryService.updateSubCategoryStatus(sub.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          sub.is_active = newStatus;
          this.notificationService.show(
            res.message || `Sub Category status changed to ${newStatus === 1 ? 'Active' : 'Inactive'} successfully.`,
            'success',
            3000
          );
        } else {
          this.notificationService.show(res?.message || 'Failed to update sub category status', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'Failed to update sub category status';
        this.notificationService.show(errorMessage, 'error', 3000);
        console.error(err);
      }
    });
  }

  // Categories Modals triggers
  openAddCategoryModal() {
    this.createCategoryForm.reset({ categoryName: '' });
    this.createCategoryOpen = true;
  }

  openEditCategoryModal(cat: Category) {
    this.selectedCategory = cat;
    this.updateCategoryForm.patchValue({
      categoryName: cat.categoryName
    });
    this.updateCategoryOpen = true;
  }

  openViewCategoryModal(cat: Category) {
    this.selectedCategory = cat;
    this.selectedCategoryDetails = null; // reset old details
    this.viewCategoryOpen = true;

    this.categoryService.getCategoryById(cat.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedCategoryDetails = res.data;
        }
      },
      error: (err: any) => console.error('Error fetching category details', err)
    });
  }

  closeModal() {
    this.createCategoryOpen = false;
    this.updateCategoryOpen = false;
    this.viewCategoryOpen = false;

    this.createSubCategoryOpen = false;
    this.updateSubCategoryOpen = false;
    this.viewSubCategoryOpen = false;

    this.selectedCategory = null;
    this.selectedCategoryDetails = null;
    this.selectedSubCategory = null;
    this.selectedSubCategoryDetails = null;
  }

  // Categories Transactions
  createCategory() {
    if (this.createCategoryForm.invalid) {
      this.createCategoryForm.markAllAsTouched();
      return;
    }
    const name = this.createCategoryForm.get('categoryName')?.value.trim();
    
    const formData = new FormData();
    formData.append('name', name);

    this.categoryService.createCategory(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success')) {
          this.notificationService.show(res.message || 'Category created successfully.', 'success', 3000);
          
          if (res.data) {
            this.categories.unshift({
              id: res.data.id,
              categoryName: res.data.name,
              is_active: res.data.status
            });
            this.refreshFilteredData();
          }
          this.closeModal();
        } else {
          this.notificationService.show(res?.message || 'Failed to create category', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'Failed to create category';
        this.notificationService.show(errorMessage, 'error', 3000);
        console.error(err);
      }
    });
  }

  updateCategory() {
    if (this.updateCategoryForm.invalid) {
      this.updateCategoryForm.markAllAsTouched();
      return;
    }
    const name = this.updateCategoryForm.get('categoryName')?.value.trim();

    if (this.selectedCategory) {
      // Duplicate check (excluding self)
      const duplicate = this.categories.some(c => 
        c.categoryName.toUpperCase() === name.toUpperCase() && c.id !== this.selectedCategory?.id
      );
      if (duplicate) {
        this.notificationService.show('Category Name already exists.', 'error', 3000);
        return;
      }

      const formData = new FormData();
      formData.append('name', name);

      this.categoryService.updateCategory(this.selectedCategory.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Category updated successfully.', 'success', 3000);
            
            if (this.selectedCategory) {
              this.selectedCategory.categoryName = name;
              this.refreshFilteredData();
            }
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to update category', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errorMessage = err?.message || 'Failed to update category';
          this.notificationService.show(errorMessage, 'error', 3000);
          console.error(err);
        }
      });
    }
  }

  // Sub Categories Modals triggers
  openAddSubCategoryModal() {
    this.createSubCategoryForm.reset({
      name: '',
      categoryId: ''
    });
    this.createSubCategoryOpen = true;
  }

  openEditSubCategoryModal(sub: SubCategory) {
    this.selectedSubCategory = sub;
    this.updateSubCategoryForm.patchValue({
      name: sub.name,
      categoryId: sub.categoryId
    });
    this.updateSubCategoryOpen = true;
  }

  openViewSubCategoryModal(sub: SubCategory) {
    this.selectedSubCategory = sub;
    this.selectedSubCategoryDetails = null; // reset old details
    this.viewSubCategoryOpen = true;

    this.categoryService.getSubCategoryById(sub.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.selectedSubCategoryDetails = res.data;
        }
      },
      error: (err: any) => console.error('Error fetching sub category details', err)
    });
  }

  // Sub Categories Transactions
  createSubCategory() {
    if (this.createSubCategoryForm.invalid) {
      this.createSubCategoryForm.markAllAsTouched();
      return;
    }
    const name = this.createSubCategoryForm.get('name')?.value.trim();
    const categoryId = this.createSubCategoryForm.get('categoryId')?.value;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId.toString());

    this.categoryService.createSubCategory(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 'success' || res.status === 201)) {
          this.notificationService.show(res.message || 'Sub Category created successfully.', 'success', 3000);
          
          if (res.data) {
            const newSub: SubCategory = {
              id: res.data.id,
              name: res.data.name,
              categoryId: res.data.category_id || categoryId,
              is_active: res.data.status !== undefined ? res.data.status : 1
            };
            this.subCategories.unshift(newSub);
            this.refreshFilteredData();
          }
          this.closeModal();
        } else {
          this.notificationService.show(res?.message || 'Failed to create sub category', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'Failed to create sub category';
        this.notificationService.show(errorMessage, 'error', 3000);
        console.error(err);
      }
    });
  }

  updateSubCategory() {
    if (this.updateSubCategoryForm.invalid) {
      this.updateSubCategoryForm.markAllAsTouched();
      return;
    }
    const name = this.updateSubCategoryForm.get('name')?.value.trim();
    const categoryId = this.updateSubCategoryForm.get('categoryId')?.value;

    if (this.selectedSubCategory) {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category_id', categoryId.toString());

      this.categoryService.updateSubCategory(this.selectedSubCategory.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 'success')) {
            this.notificationService.show(res.message || 'Sub Category updated successfully.', 'success', 3000);
            
            if (this.selectedSubCategory) {
              this.selectedSubCategory.name = name;
              this.selectedSubCategory.categoryId = Number(categoryId);
              this.refreshFilteredData();
            }
            this.closeModal();
          } else {
            this.notificationService.show(res?.message || 'Failed to update sub category', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errorMessage = err?.message || 'Failed to update sub category';
          this.notificationService.show(errorMessage, 'error', 3000);
          console.error(err);
        }
      });
    }
  }
}
