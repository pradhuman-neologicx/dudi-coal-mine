import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

@Component({
  selector: 'app-equipment-category',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgxPaginationModule,
    NgSelectModule
  ],
  templateUrl: './equipment-category.component.html',
  styleUrl: './equipment-category.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.5)' })),
      transition(':enter', [
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class EquipmentCategoryComponent implements OnInit {
  showreset = false;
  searchbarform!: FormGroup;
  createCategoryForm!: FormGroup;
  updateCategoryForm!: FormGroup;
  viewCategoryForm!: FormGroup;

  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100];
  totalRecords: any;
  page = 1;

  createCategoryOpen = false;
  updateCategoryOpen = false;
  viewCategoryOpen = false;
  currentCategoryId: any;

  categoryList: any[] = [];

  table_heading = [
    {
      heading0: 'Sr. No.',
      heading1: 'Category Name',
      heading2: 'Description',
      heading4: 'Status',
      heading5: 'Action',
    },
  ];

  mockCategories: any[] = [
    {
      id: '1',
      categoryName: 'Mining Machinery',
      description: 'Heavy equipment used directly in coal extraction',
      itemsCount: 8,
      is_active: 1,
    },
    {
      id: '2',
      categoryName: 'Safety Equipment (PPE)',
      description: 'Personal protective equipment for worker safety',
      itemsCount: 12,
      is_active: 1,
    },
    {
      id: '3',
      categoryName: 'Transport',
      description: 'Vehicles and locomotives used for underground transport',
      itemsCount: 4,
      is_active: 1,
    },
    {
      id: '4',
      categoryName: 'Electrical',
      description: 'Electrical panels, cables, transformers and accessories',
      itemsCount: 6,
      is_active: 1,
    },
    {
      id: '5',
      categoryName: 'Hydraulic',
      description: 'Hydraulic systems and support equipment',
      itemsCount: 3,
      is_active: 1,
    },
    {
      id: '6',
      categoryName: 'Drilling Equipment',
      description: 'Rock drills, drill rigs and accessories',
      itemsCount: 5,
      is_active: 1,
    },
    {
      id: '7',
      categoryName: 'Ventilation',
      description: 'Fans and ducting for underground air circulation',
      itemsCount: 3,
      is_active: 1,
    },
    {
      id: '8',
      categoryName: 'Measurement & Monitoring',
      description: 'Gas detectors, sensors and monitoring instruments',
      itemsCount: 7,
      is_active: 0,
    },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
    });

    this.createCategoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required]],
      description: [''],
    });

    this.updateCategoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required]],
      description: [''],
    });

    this.viewCategoryForm = this.formBuilder.group({
      categoryName: [''],
      description: [''],
    });

    this.GetCategoryFun();
  }

  onTableSizeChange(): void {
    this.page = 1;
    this.GetCategoryFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetCategoryFun();
  }

  searchfun() {
    if (this.searchbarform.valid) {
      this.showreset = true;
      this.GetCategoryFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetCategoryFun();
  }

  openAddModal() {
    this.createCategoryForm.reset();
    this.createCategoryOpen = true;
  }

  closeModal() {
    this.createCategoryOpen = false;
    this.updateCategoryOpen = false;
    this.viewCategoryOpen = false;
    this.createCategoryForm.reset();
  }

  OpenEditModal(category: any): void {
    this.currentCategoryId = category.id;
    this.updateCategoryOpen = true;
    this.updateCategoryForm.patchValue({
      categoryName: category.categoryName,
      description: category.description,
    });
  }

  openViewModal(category: any): void {
    this.viewCategoryOpen = true;
    this.currentCategoryId = category.id;
    this.viewCategoryForm.patchValue({
      categoryName: category.categoryName,
      description: category.description,
    });
  }

  createCategory() {
    if (this.createCategoryForm.valid) {
      const { categoryName, description } = this.createCategoryForm.value;
      const newId = (
        Math.max(...this.mockCategories.map((c) => +c.id), 0) + 1
      ).toString();
      this.mockCategories.unshift({
        id: newId,
        categoryName,
        description: description || '',
        itemsCount: 0,
        is_active: 1,
      });
      this.closeModal();
      this.notificationService.show(
        'Category created successfully',
        'success',
        3000
      );
      this.GetCategoryFun();
    } else {
      this.createCategoryForm.markAllAsTouched();
    }
  }

  updateCategory() {
    if (this.updateCategoryForm.valid) {
      const { categoryName, description } = this.updateCategoryForm.value;
      const index = this.mockCategories.findIndex(
        (c) => c.id === this.currentCategoryId
      );
      if (index !== -1) {
        this.mockCategories[index].categoryName = categoryName;
        this.mockCategories[index].description = description || '';
        this.closeModal();
        this.notificationService.show(
          'Category updated successfully',
          'success',
          3000
        );
        this.GetCategoryFun();
      }
    } else {
      this.updateCategoryForm.markAllAsTouched();
    }
  }

  GetCategoryFun() {
    const searchText =
      this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockCategories;

    if (searchText) {
      filteredData = this.mockCategories.filter(
        (c) =>
          c.categoryName.toLowerCase().includes(searchText) ||
          (c.description && c.description.toLowerCase().includes(searchText))
      );
    }

    this.totalRecords = filteredData.length;

    if (this.tableSize === 'all') {
      this.categoryList = filteredData;
    } else {
      const startIndex = (this.page - 1) * this.tableSize;
      this.categoryList = filteredData.slice(
        startIndex,
        startIndex + Number(this.tableSize)
      );
    }
  }

  async Status(id: string, status: any) {
    const index = this.mockCategories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.mockCategories[index].is_active = status;
      this.notificationService.show(
        `Category ${status ? 'activated' : 'deactivated'} successfully`,
        'success',
        2000
      );
      this.GetCategoryFun();
    }
  }

  get totalActive(): number {
    return this.mockCategories.filter((c) => c.is_active === 1).length;
  }

  get totalItems(): number {
    return this.mockCategories.reduce((sum, c) => sum + (c.itemsCount || 0), 0);
  }
}
