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
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { LeaveTypeService } from 'src/app/core/services/leave-type.service';

export interface LeaveTypeItem {
  id: number | string;
  name?: string;
  leaveName?: string;
  leave_category?: string;
  isPaid?: boolean;
  Annual_limit?: number | string;
  annualLimit?: number | string;
  isCarryForward?: boolean | number;
  maxAccumulation?: number | string;
  formEMapping?: string;
  status?: boolean | number | string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-leave-type',
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
  templateUrl: './leave-type.component.html',
  styleUrl: './leave-type.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)', 
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)', 
          }),
        ),
      ]),
    ]),
  ],
})
export class LeaveTypeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createLeaveTypeForm!: FormGroup;
  updateLeaveTypeForm!: FormGroup;
  viewLeaveTypeForm!: FormGroup;
  
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  
  createLeaveTypeOpen: boolean = false;
  updateLeaveTypeOpen: boolean = false;
  viewLeaveTypeOpen: boolean = false;
  currentLeaveTypeId: number | string | null = null;
  selectedLeaveType: LeaveTypeItem | null = null;
  
  leaveTypeList: LeaveTypeItem[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Leave Name',
      heading2: 'Paid/Unpaid',
      heading3: 'Annual Limit',
      heading4: 'Form E Mapping',
      heading5: 'Status',
      heading6: 'Action',
    },
  ];

  errorMessage: any;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private leaveTypeService: LeaveTypeService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createLeaveTypeForm = this.formBuilder.group({
      leaveName: ['', [Validators.required]],
      isPaid: [true, [Validators.required]],
      annualLimit: ['', [Validators.required, Validators.min(0)]],
      isCarryForward: [false],
      maxAccumulation: [''],
      formEMapping: ['EXCLUDED', [Validators.required]]
    });

    this.createLeaveTypeForm.get('isCarryForward')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      const maxAccControl = this.createLeaveTypeForm.get('maxAccumulation');
      if (value) {
        maxAccControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        maxAccControl?.clearValidators();
      }
      maxAccControl?.updateValueAndValidity();
    });

    this.updateLeaveTypeForm = this.formBuilder.group({
      leaveName: ['', [Validators.required]],
      isPaid: [true, [Validators.required]],
      annualLimit: ['', [Validators.required, Validators.min(0)]],
      isCarryForward: [false],
      maxAccumulation: [''],
      formEMapping: ['EXCLUDED', [Validators.required]]
    });

    this.updateLeaveTypeForm.get('isCarryForward')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      const maxAccControl = this.updateLeaveTypeForm.get('maxAccumulation');
      if (value) {
        maxAccControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        maxAccControl?.clearValidators();
      }
      maxAccControl?.updateValueAndValidity();
    });

    this.viewLeaveTypeForm = this.formBuilder.group({
      leaveName: [''],
      isPaid: [''],
      annualLimit: [''],
      isCarryForward: [''],
      maxAccumulation: [''],
      formEMapping: ['']
    });
    
    this.GetLeaveTypeFun();
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
    this.GetLeaveTypeFun();
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.GetLeaveTypeFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetLeaveTypeFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetLeaveTypeFun();
  }

  openAddModal() {
    this.createLeaveTypeOpen = true;
  }

  closeModal() {
    this.updateLeaveTypeOpen = false;
    this.createLeaveTypeOpen = false;
    this.viewLeaveTypeOpen = false;
    this.selectedLeaveType = null;
    this.createLeaveTypeForm.reset({ isPaid: true });
  }

  OpenEditModal(leaveType: LeaveTypeItem): void {
    this.currentLeaveTypeId = leaveType.id;
    this.updateLeaveTypeOpen = true;
    this.GetupdateLeaveTypebyid(this.currentLeaveTypeId);
  }

  openviewModal(leaveType: LeaveTypeItem): void {
    this.viewLeaveTypeOpen = true;
    this.currentLeaveTypeId = leaveType.id;
    this.selectedLeaveType = null;

    this.leaveTypeService.getLeaveTypeById(leaveType.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.selectedLeaveType = response.data;
          this.viewLeaveTypeForm.patchValue({ 
            leaveName: response.data.name || response.data.leaveName,
            isPaid: response.data.leave_category === 'paid' ? 'Paid' : 'Unpaid',
            annualLimit: response.data.Annual_limit || response.data.annualLimit,
            isCarryForward: response.data.isCarryForward ? 'Yes' : 'No',
            maxAccumulation: response.data.maxAccumulation || 'N/A',
            formEMapping: response.data.formEMapping || 'N/A'
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching leave type details:', error);
      }
    });
  }

  GetupdateLeaveTypebyid(leaveTypeId: number | string) {
    this.leaveTypeService.getLeaveTypeById(leaveTypeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const leaveType = response.data;
          this.updateLeaveTypeForm.patchValue({
            leaveName: leaveType.name,
            isPaid: leaveType.leave_category === 'paid',
            annualLimit: leaveType.Annual_limit,
            isCarryForward: leaveType.isCarryForward || false,
            maxAccumulation: leaveType.maxAccumulation || '',
            formEMapping: leaveType.formEMapping || 'EXCLUDED'
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching leave type details:', error);
      }
    });
  }

  createLeaveType() {
    if (this.createLeaveTypeForm.valid) {
      const leaveName = this.createLeaveTypeForm.get('leaveName')?.value;
      const isPaid = this.createLeaveTypeForm.get('isPaid')?.value;
      const annualLimit = this.createLeaveTypeForm.get('annualLimit')?.value;
      const isCarryForward = this.createLeaveTypeForm.get('isCarryForward')?.value;
      const maxAccumulation = this.createLeaveTypeForm.get('maxAccumulation')?.value;
      const formEMapping = this.createLeaveTypeForm.get('formEMapping')?.value;

      const formData = new FormData();
      formData.append('name', leaveName);
      formData.append('leave_category', isPaid ? 'paid' : 'unpaid');
      formData.append('Annual_limit', annualLimit.toString());
      formData.append('isCarryForward', isCarryForward ? '1' : '0');
      if (isCarryForward && maxAccumulation) {
        formData.append('maxAccumulation', maxAccumulation.toString());
      }
      formData.append('formEMapping', formEMapping);

      this.leaveTypeService.createLeaveType(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Leave Type created successfully', 'success', 3000);
            this.GetLeaveTypeFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error) => {
          console.error('Create Leave Type failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.errorMessage = errorMsg;
          this.notificationService.show(this.errorMessage, 'error', 3000);
        },
      });
    } else {
      this.createLeaveTypeForm.markAllAsTouched();
    }
  }

  updateLeaveType() {
    if (this.updateLeaveTypeForm.valid) {
      const leaveName = this.updateLeaveTypeForm.get('leaveName')?.value;
      const isPaid = this.updateLeaveTypeForm.get('isPaid')?.value;
      const annualLimit = this.updateLeaveTypeForm.get('annualLimit')?.value;
      const isCarryForward = this.updateLeaveTypeForm.get('isCarryForward')?.value;
      const maxAccumulation = this.updateLeaveTypeForm.get('maxAccumulation')?.value;
      const formEMapping = this.updateLeaveTypeForm.get('formEMapping')?.value;

      const formData = new FormData();
      formData.append('name', leaveName);
      formData.append('leave_category', isPaid ? 'paid' : 'unpaid');
      formData.append('Annual_limit', annualLimit.toString());
      formData.append('isCarryForward', isCarryForward ? '1' : '0');
      if (isCarryForward && maxAccumulation) {
        formData.append('maxAccumulation', maxAccumulation.toString());
      }
      formData.append('formEMapping', formEMapping);
      formData.append('_method', 'PUT');

      this.leaveTypeService.updateLeaveType(this.currentLeaveTypeId, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Leave Type updated successfully', 'success', 3000);
            this.GetLeaveTypeFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Leave Type failed:', error);
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
      this.updateLeaveTypeForm.markAllAsTouched();
    }
  }

  GetLeaveTypeFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.leaveTypeService
      .getLeaveTypes(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            // Map backend keys to frontend expected keys
            this.leaveTypeList = (response.data || []).map((item: any) => ({
              ...item,
              leaveName: item.name,
              isPaid: item.leave_category === 'paid',
              annualLimit: item.Annual_limit,
              is_active: item.status ? 1 : 0,
            }));
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch leave types:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching leave types:', error);
        }
      });
  }

  async Status(id: number | string, status: boolean | number | string) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.leaveTypeService.updateLeaveTypeStatus(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Leave Type status updated successfully`,
            'success',
            3000
          );
          this.GetLeaveTypeFun();
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
