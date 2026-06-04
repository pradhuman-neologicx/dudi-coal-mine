import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { LeaveTypeService } from 'src/app/core/services/leave-type.service';

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
export class LeaveTypeComponent implements OnInit {
  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createLeaveTypeForm!: FormGroup;
  updateLeaveTypeForm!: FormGroup;
  viewLeaveTypeForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createLeaveTypeOpen: boolean = false;
  updateLeaveTypeOpen: boolean = false;
  viewLeaveTypeOpen: boolean = false;
  currentLeaveTypeId: any;
  selectedLeaveType: any = null;
  
  leaveTypeList: any[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Leave Name',
      heading2: 'Paid/Unpaid',
      heading3: 'Annual Limit',
      heading4: 'Status',
      heading5: 'Action',
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
    });

    this.updateLeaveTypeForm = this.formBuilder.group({
      leaveName: ['', [Validators.required]],
      isPaid: [true, [Validators.required]],
      annualLimit: ['', [Validators.required, Validators.min(0)]],
    });

    this.viewLeaveTypeForm = this.formBuilder.group({
      leaveName: [''],
      isPaid: [''],
      annualLimit: [''],
    });
    
    this.GetLeaveTypeFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetLeaveTypeFun();
  }

  onTableDataChange(event: any) {
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

  OpenEditModal(leaveType: any): void {
    this.currentLeaveTypeId = leaveType.id;
    this.updateLeaveTypeOpen = true;
    this.GetupdateLeaveTypebyid(this.currentLeaveTypeId);
  }

  openviewModal(leaveType: any): void {
    this.viewLeaveTypeOpen = true;
    this.currentLeaveTypeId = leaveType.id;
    this.selectedLeaveType = null;

    this.leaveTypeService.getLeaveTypeById(leaveType.id).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const resLeave = response.data;
          this.selectedLeaveType = {
            ...resLeave,
            leaveName: resLeave.name,
            isPaid: resLeave.leave_category === 'paid',
            annualLimit: resLeave.Annual_limit,
            is_active: resLeave.status !== undefined ? resLeave.status : resLeave.is_active
          };
          this.viewLeaveTypeForm.patchValue({ 
            leaveName: resLeave.name,
            isPaid: resLeave.leave_category === 'paid' ? 'Paid' : 'Unpaid',
            annualLimit: resLeave.Annual_limit,
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching leave type details:', error);
      }
    });
  }

  GetupdateLeaveTypebyid(leaveTypeId: any) {
    this.leaveTypeService.getLeaveTypeById(leaveTypeId).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const leaveType = response.data;
          this.updateLeaveTypeForm.patchValue({
            leaveName: leaveType.name,
            isPaid: leaveType.leave_category === 'paid',
            annualLimit: leaveType.Annual_limit,
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

      const formData = new FormData();
      formData.append('name', leaveName);
      formData.append('leave_category', isPaid ? 'paid' : 'unpaid');
      formData.append('Annual_limit', annualLimit.toString());

      this.leaveTypeService.createLeaveType(formData).subscribe({
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

      const formData = new FormData();
      formData.append('name', leaveName);
      formData.append('leave_category', isPaid ? 'paid' : 'unpaid');
      formData.append('Annual_limit', annualLimit.toString());
      formData.append('_method', 'PUT');

      this.leaveTypeService.updateLeaveType(this.currentLeaveTypeId, formData).subscribe({
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
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.leaveTypeList = response.data.map((item: any) => ({
              ...item,
              leaveName: item.name,
              isPaid: item.leave_category === 'paid',
              annualLimit: item.Annual_limit,
              is_active: item.status !== undefined ? item.status : item.is_active
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

  async Status(id: string, status: any) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.leaveTypeService.updateLeaveTypeStatus(id, formData).subscribe({
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
