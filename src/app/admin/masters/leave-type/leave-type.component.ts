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

  mockLeaveTypes: any[] = [
    { id: '1', leaveName: 'Casual Leave', isPaid: true, annualLimit: 12, is_active: 1 },
    { id: '2', leaveName: 'Sick Leave', isPaid: true, annualLimit: 10, is_active: 1 },
    { id: '3', leaveName: 'Leave Without Pay', isPaid: false, annualLimit: 365, is_active: 1 },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
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
    if (this.searchbarform.valid) {
      this.showreset = true;
      this.GetLeaveTypeFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
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
    this.selectedLeaveType = leaveType;
    this.viewLeaveTypeForm.patchValue({ 
      leaveName: leaveType.leaveName,
      isPaid: leaveType.isPaid ? 'Paid' : 'Unpaid',
      annualLimit: leaveType.annualLimit,
    });
  }

  GetupdateLeaveTypebyid(leaveTypeId: any) {
    const leaveType = this.mockLeaveTypes.find((d) => d.id === leaveTypeId);
    if (leaveType) {
      this.updateLeaveTypeForm.patchValue({
        leaveName: leaveType.leaveName,
        isPaid: leaveType.isPaid,
        annualLimit: leaveType.annualLimit,
      });
    }
  }

  createLeaveType() {
    if (this.createLeaveTypeForm.valid) {
      const leaveData = this.createLeaveTypeForm.value;
      
      // Convert string "true"/"false" back to boolean if select gives string
      if (typeof leaveData.isPaid === 'string') {
        leaveData.isPaid = leaveData.isPaid === 'true';
      }

      const newId = (this.mockLeaveTypes.length + 1).toString();
      this.mockLeaveTypes.unshift({ 
        id: newId, 
        ...leaveData, 
        is_active: 1 
      });
      
      this.closeModal();
      this.notificationService.show(
        'Leave Type created successfully',
        'success',
        3000,
      );
      this.GetLeaveTypeFun();
    } else {
      this.createLeaveTypeForm.markAllAsTouched();
    }
  }

  updateLeaveType() {
    if (this.updateLeaveTypeForm.valid) {
      const leaveData = this.updateLeaveTypeForm.value;

      if (typeof leaveData.isPaid === 'string') {
        leaveData.isPaid = leaveData.isPaid === 'true';
      }

      const index = this.mockLeaveTypes.findIndex((d) => d.id === this.currentLeaveTypeId);
      if (index !== -1) {
        this.mockLeaveTypes[index] = { ...this.mockLeaveTypes[index], ...leaveData };
        this.closeModal();
        this.notificationService.show(
          'Leave Type updated successfully',
          'success',
          3000,
        );
        this.GetLeaveTypeFun();
      }
    } else {
      this.updateLeaveTypeForm.markAllAsTouched();
    }
  }

  GetLeaveTypeFun() {
    const searchText = this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockLeaveTypes;

    if (searchText) {
      filteredData = this.mockLeaveTypes.filter((d) =>
        d.leaveName.toLowerCase().includes(searchText)
      );
    }

    this.totalRecords = filteredData.length;

    if (this.tableSize === 'all') {
      this.leaveTypeList = filteredData;
    } else {
      const startIndex = (this.page - 1) * this.tableSize;
      const endIndex = startIndex + this.tableSize;
      this.leaveTypeList = filteredData.slice(startIndex, endIndex);
    }
  }

  async Status(id: string, status: any) {
    const index = this.mockLeaveTypes.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.mockLeaveTypes[index].is_active = status;
      this.notificationService.show(
        `Leave Type ${status ? 'activated' : 'deactivated'} successfully`,
        'success',
        2000,
      );
      this.GetLeaveTypeFun();
    }
  }
}
