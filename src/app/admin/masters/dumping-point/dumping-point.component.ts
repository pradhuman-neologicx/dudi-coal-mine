import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DumpingPointService } from '../../../core/services/dumping-point.service';


export interface SiteItem {
  id: string | number;
  name: string;
  siteName?: string;
  [key: string]: any;
}

export interface DumpingPoint {
  id: string;
  site_id: string;
  site_name: string;
  type: string;
  name: string;
  is_active: number | boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-dumping-point',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './dumping-point.component.html',
  styleUrl: './dumping-point.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class DumpingPointComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dumpingPoints: DumpingPoint[] = [];
  displayPoints: DumpingPoint[] = [];
  sites: SiteItem[] = [];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];

  searchbarform!: FormGroup;
  filterStatus: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewModalOpen: boolean = false;
  typeForm!: FormGroup;
  selectedPoint: DumpingPoint | null = null;
  selectedViewPoint: DumpingPoint | null = null;

  constructor(
    private fb: FormBuilder,
    private dumpingPointService: DumpingPointService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.searchbarform = this.fb.group({
      searchbar: ['']
    });
    this.typeForm = this.fb.group({
      site_id: ['', Validators.required],
      type: ['', Validators.required],
      name: ['', Validators.required],
    });
    this.GetSitesFun();
    this.GetDumpingPointsFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  GetSitesFun(): void {
    this.dumpingPointService.getSites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.sites = response.data;
          }
        },
        error: (error: any) => {
          console.error('Error fetching sites:', error);
        }
      });
  }

  GetDumpingPointsFun(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.dumpingPointService.getDumpingPoints(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.dumpingPoints = response.data.map((item: any) => ({
              ...item,
              name: item.name,
              type: item.type,
              site_id: item.site_id,
              site_name: item.site?.name || item.site_name || 'N/A',
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.filterData();
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch dumping points:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching dumping points:', error);
        }
      });
  }

  filterData(): void {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    this.displayPoints = this.dumpingPoints.filter((t) => {
      const matchStatus = this.filterStatus === '' ||
        (this.filterStatus === 'Active' && t.is_active === 1) ||
        (this.filterStatus === 'Inactive' && t.is_active === 0);
      return matchStatus;
    });
    this.showreset = searchText !== '' || this.filterStatus !== '';
  }

  searchfun(): void {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetDumpingPointsFun();
  }

  resetsearchbar(): void {
    this.searchbarform.get('searchbar')?.reset();
    this.filterStatus = '';
    this.showreset = false;
    this.page = 1;
    this.GetDumpingPointsFun();
  }

  onTableDataChange(event: number): void {
    this.page = event;
    this.GetDumpingPointsFun();
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      const value = (event.target as HTMLInputElement).value;
      this.tableSize = value === 'all' ? 1000 : Number(value); // Default to a large number for 'all' or fix pagination
    }
    this.page = 1;
    this.GetDumpingPointsFun();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedPoint = null;
    this.typeForm.reset();
    this.typeForm.patchValue({ type: 'Dumping', site_id: '' });
    this.modalOpen = true;
  }

  openEditModal(point: DumpingPoint): void {
    this.isEditMode = true;
    this.selectedPoint = point;
    this.typeForm.patchValue({
      site_id: point.site_id,
      type: point.type,
      name: point.name
    });
    this.modalOpen = true;

    this.dumpingPointService.getDumpingPointById(point.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const freshData = response.data;
            this.typeForm.patchValue({
              site_id: freshData.site_id,
              type: freshData.type,
              name: freshData.name
            });
          }
        },
        error: (error: any) => {
          console.error('Error fetching details for edit:', error);
        }
      });
  }

  openviewModal(point: DumpingPoint): void {
    this.viewModalOpen = true;
    this.selectedViewPoint = null;

    this.dumpingPointService.getDumpingPointById(point.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const data = response.data;
            this.selectedViewPoint = {
              ...data,
              name: data.name,
              type: data.type,
              site_name: data.site?.name || data.site_name || 'N/A',
              is_active: data.status !== undefined ? data.status : data.is_active
            };
          }
        },
        error: (error: any) => {
          console.error('Error fetching details:', error);
        }
      });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewModalOpen = false;
    this.selectedViewPoint = null;
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const val = this.typeForm.value;
    if (this.isEditMode && this.selectedPoint) {
      const formData = new FormData();
      formData.append('site_id', val.site_id);
      formData.append('type', val.type.toLowerCase());
      formData.append('name', val.name);
      formData.append('_method', 'PUT');

      this.dumpingPointService.updateDumpingPoint(this.selectedPoint.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Dumping Point updated successfully',
                'success',
                3000,
              );
              this.GetDumpingPointsFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Update failed:', error);
            this.handleApiError(error);
          }
        });
    } else {
      const formData = new FormData();
      formData.append('site_id', val.site_id);
      formData.append('type', val.type.toLowerCase());
      formData.append('name', val.name);

      this.dumpingPointService.createDumpingPoint(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.closeModal();
              this.notificationService.show(
                response.message || 'Dumping Point created successfully',
                'success',
                3000,
              );
              this.page = 1;
              this.GetDumpingPointsFun();
            } else {
              this.notificationService.show(
                response.message || 'Something went wrong',
                'error',
                3000,
              );
            }
          },
          error: (error: any) => {
            console.error('Create failed:', error);
            this.handleApiError(error);
          }
        });
    }
  }

  toggleStatus(point: DumpingPoint, status: number): void {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.dumpingPointService.updateDumpingPointStatus(point.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(
              response.message || 'Status updated successfully',
              'success',
              3000,
            );
            this.GetDumpingPointsFun();
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Status update failed:', error);
          this.handleApiError(error);
        }
      });
  }

  private handleApiError(error: any, defaultMessage: string = 'Something went wrong'): void {
    let errorMsg = defaultMessage;

    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (error?.error) {
      if (error.error.errors) {
        const errorKeys = Object.keys(error.error.errors);
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0];
          const messages = error.error.errors[firstKey];
          if (Array.isArray(messages) && messages.length > 0) {
            errorMsg = messages[0];
          } else if (typeof messages === 'string') {
            errorMsg = messages;
          }
        }
      } else if (error.error.message) {
        errorMsg = error.error.message;
      }
    } else if (error?.message) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
    }

    this.notificationService.show(errorMsg, 'error', 3000);
  }
}
