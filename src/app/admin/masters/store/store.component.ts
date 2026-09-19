import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { StoreService } from 'src/app/core/services/store.service';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

export interface StoreItem {
  id: number | string;
  name: string;
  description?: string;
  status?: boolean | number | string;
  updated_at?: string;
  is_active?: boolean | number | string;
  [key: string]: any;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    NgSelectModule,
  ],
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss',
  animations: [
    trigger('succesfullyMesaage', [
      state(
        'void',
        style({
          transform: 'translateX(-30%)',
          opacity: 0,
        }),
      ),
      transition(':enter, :leave', [
        animate('0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'),
      ]),
    ]),
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            transform: 'translateX(0)', // Final position for slide-in effect
            opacity: 1, // Final opacity
          }),
        ),
      ]),
    ]),

    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)', // Start with smaller size
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)', // Final size
          }),
        ),
      ]),
    ]),
  ],
})
export class StoreComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false; // Reintroduced for reset button visibility
  searchbarform!: FormGroup;
  createStoreForm!: FormGroup;
  updateStoreForm!: FormGroup;
  viewStoreForm!: FormGroup;
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  createStoreOpen: boolean = false;
  updateStoreOpen: boolean = false;
  viewStoreOpen: boolean = false;
  selectedStore: StoreItem | null = null;
  storeList: StoreItem[] = [];

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      this.tableSize = Number((event.target as HTMLInputElement).value);
    }
    this.page = 1;
    this.GetStoreFun();
  }

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private storeService: StoreService,
  ) {}

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetStoreFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset(); // Clear the search input
    this.showreset = false; // Hide reset button
    this.page = 1; // Reset to first page
    this.GetStoreFun(); // Reload data without search
  }

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createStoreForm = this.formBuilder.group({
      Name: ['', [Validators.required]],
      Description: [''],
    });

    this.updateStoreForm = this.formBuilder.group({
      Name: ['', [Validators.required, Validators.minLength(2)]],
      Description: [''],
    });

    this.viewStoreForm = this.formBuilder.group({
      Name: [''],
      Description: [''],
    });
    this.GetStoreFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Name',
      heading2: 'Status',
      heading3: 'Action',
    },
  ];

  currentStoreId: any;

  OpenEditModal(user: any): void {
    this.currentStoreId = user.id;
    this.updateStoreOpen = true;
    this.GetupdateStorebyid(this.currentStoreId);
  }

  openviewModal(user: any): void {
    this.viewStoreOpen = true;
    this.currentStoreId = user.id;
    this.selectedStore = null;

    this.storeService.getStoreById(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === true || response.data) {
          const data = response.data || response;
          this.selectedStore = data;
          this.viewStoreForm.patchValue({ Name: data.name, Description: data.description });
        }
      },
      error: (error: any) => {
        console.error('Error fetching store details:', error);
      }
    });
  }


  GetupdateStorebyid(userId: any) {
    this.storeService.getStoreById(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === true || response.data) {
          this.fillformdate(response.data || response);
        }
      },
      error: (error: any) => {
        console.error('Error fetching store details:', error);
      }
    });
  }

  fillformdate(response: any) {
    if (this.updateStoreForm) {
      this.updateStoreForm.patchValue({
        Name: response.name,
        Description: response.description
      });
    }
  }
  updateStore() {
    if (this.updateStoreForm.valid) {
      const payload = {
        name: this.updateStoreForm.get('Name')?.value,
        description: this.updateStoreForm.get('Description')?.value
      };

      this.storeService.updateStore(this.currentStoreId, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201 || response.status === true || response.message) {
            this.closeModal();
            this.notificationService.show(response.message || 'Store updated successfully', 'success', 3000);
            this.GetStoreFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Store failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.updateStoreForm.markAllAsTouched();
    }
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.GetStoreFun();
  }

  closeModal() {
    this.updateStoreOpen = false;
    this.createStoreOpen = false;
    this.viewStoreOpen = false;
    this.selectedStore = null;
    this.createStoreForm.reset();
  }

  openAddModal() {
    this.createStoreOpen = true;
  }
  errorMessage: any;
  createStore() {
    if (this.createStoreForm.valid) {
      const payload = {
        name: this.createStoreForm.get('Name')?.value,
        description: this.createStoreForm.get('Description')?.value
      };

      this.storeService.createStore(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201 || response.status === true || response.message) {
            this.closeModal();
            this.notificationService.show(response.message || 'Store created successfully', 'success', 3000);
            this.GetStoreFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Create Store failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.errorMessage = errorMsg; // Display error message
          this.notificationService.show(this.errorMessage, 'error', 3000);
        },
      });
    } else {
      this.createStoreForm.markAllAsTouched();
    }
  }

  GetStoreFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.storeService
      .getStores(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === true || response.data) {
            const data = response.data?.data || response.data || [];
            this.storeList = data;
            this.totalRecords = response.data?.total || response.pagination?.total || data.length;
          } else {
            console.error('Failed to fetch stores:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching stores:', error);
        }
      });
  }

  async Status(id: number | string, status: boolean | number | string) {
    const store = this.storeList?.find((d: StoreItem) => d.id === id);
    if (!store) return;

    const payload = {
      status: status.toString()
    };

    this.storeService.updateStoreStatus(id, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201 || response.status === true || response.message) {
          this.notificationService.show(
            response.message || `Store status updated successfully`,
            'success',
            3000
          );
          this.GetStoreFun();
        } else {
          this.notificationService.show(
            response.message || response.error || 'Failed to update status',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        let errorMsg = '';
        if (typeof error === 'string') {
          errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
        } else {
          errorMsg = error.message || error.error?.message || 'Something went wrong';
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
