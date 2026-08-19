import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DesignationService } from 'src/app/core/services/designation.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

export interface DesignationItem {
  id: number | string;
  name?: string;
  designation_name?: string;
  status?: boolean | number | string;
  updated_at?: string;
  is_active?: boolean | number | string;
  [key: string]: any;
}

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgxPaginationModule,
    NgSelectModule,
  ],
  templateUrl: './designation.component.html',
  styleUrl: './designation.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.95)',
        }),
      ),
      transition(':enter', [
        animate(
          '0.3s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)',
          }),
        ),
      ]),
      transition(':leave', [
        animate(
          '0.2s ease-in',
          style({
            opacity: 0,
            transform: 'scale(0.95)',
          }),
        ),
      ]),
    ]),
  ],
})
export class DesignationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false;
  searchbarform!: FormGroup;
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  viewDesignationOpen: boolean = false;
  selectedDesignation: DesignationItem | null = null;

  designationList: DesignationItem[] = [];
  table_heading = ['Serial No.', 'Designation Name', 'Status', 'Action'];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private designationService: DesignationService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['']
    });
    this.GetDesignationFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      this.tableSize = Number((event.target as HTMLInputElement).value);
    }
    this.page = 1;
    this.GetDesignationFun();
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.GetDesignationFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetDesignationFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetDesignationFun();
  }

  openviewModal(designation: DesignationItem): void {
    this.viewDesignationOpen = true;
    this.selectedDesignation = null;

    this.designationService.getDesignationById(designation.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.selectedDesignation = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error fetching designation details:', error);
      }
    });
  }

  closeModal() {
    this.viewDesignationOpen = false;
    this.selectedDesignation = null;
  }

  GetDesignationFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.designationService
      .getDesignations(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.designationList = response.data;
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch designations:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching designations:', error);
        }
      });
  }

  async Status(id: number | string, status: boolean | number | string) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.designationService.updateDesignationStatus(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Role status updated successfully`,
            'success',
            3000
          );
          this.GetDesignationFun();
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
