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
  selector: 'app-shift',
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
  templateUrl: './shift.component.html',
  styleUrl: './shift.component.scss',
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
export class ShiftComponent implements OnInit {
  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createShiftForm!: FormGroup;
  updateShiftForm!: FormGroup;
  viewShiftForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createShiftOpen: boolean = false;
  updateShiftOpen: boolean = false;
  viewShiftOpen: boolean = false;
  currentShiftId: any;
  selectedShift: any = null;
  
  shiftList: any[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Shift Name',
      heading2: 'Timing',
      heading3: 'Min Hrs',
      heading4: 'Status',
      heading5: 'Action',
    },
  ];

  mockShifts: any[] = [
    { id: '1', shiftName: 'Shift A', startTime: '06:00', endTime: '14:00', minWorkingHours: 8, graceTime: 15, is_active: 1 },
    { id: '2', shiftName: 'Shift B', startTime: '14:00', endTime: '22:00', minWorkingHours: 8, graceTime: 15, is_active: 1 },
    { id: '3', shiftName: 'Shift C', startTime: '22:00', endTime: '06:00', minWorkingHours: 8, graceTime: 15, is_active: 1 },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
    });

    this.createShiftForm = this.formBuilder.group({
      shiftName: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      minWorkingHours: ['', [Validators.required, Validators.min(1)]],
      // graceTime: ['', [Validators.required, Validators.min(0)]],
    });

    this.updateShiftForm = this.formBuilder.group({
      shiftName: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      minWorkingHours: ['', [Validators.required, Validators.min(1)]],
      // graceTime: ['', [Validators.required, Validators.min(0)]],
    });

    this.viewShiftForm = this.formBuilder.group({
      shiftName: [''],
      startTime: [''],
      endTime: [''],
      minWorkingHours: [''],
      // graceTime: [''],
    });
    
    this.GetShiftFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetShiftFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetShiftFun();
  }

  searchfun() {
    if (this.searchbarform.valid) {
      this.showreset = true;
      this.GetShiftFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetShiftFun();
  }

  openAddModal() {
    this.createShiftOpen = true;
  }

  closeModal() {
    this.updateShiftOpen = false;
    this.createShiftOpen = false;
    this.viewShiftOpen = false;
    this.selectedShift = null;
    this.createShiftForm.reset();
  }

  OpenEditModal(shift: any): void {
    this.currentShiftId = shift.id;
    this.updateShiftOpen = true;
    this.GetupdateShiftbyid(this.currentShiftId);
  }

  openviewModal(shift: any): void {
    this.viewShiftOpen = true;
    this.currentShiftId = shift.id;
    this.selectedShift = shift;
    this.viewShiftForm.patchValue({ 
      shiftName: shift.shiftName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      minWorkingHours: shift.minWorkingHours,
      // graceTime: shift.graceTime,
    });
  }

  GetupdateShiftbyid(shiftId: any) {
    const shift = this.mockShifts.find((d) => d.id === shiftId);
    if (shift) {
      this.updateShiftForm.patchValue({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        minWorkingHours: shift.minWorkingHours,
        // graceTime: shift.graceTime,
      });
    }
  }

  createShift() {
    if (this.createShiftForm.valid) {
      const shiftData = this.createShiftForm.value;
      const newId = (this.mockShifts.length + 1).toString();
      
      this.mockShifts.unshift({ 
        id: newId, 
        ...shiftData, 
        is_active: 1 
      });
      
      this.closeModal();
      this.notificationService.show(
        'Shift created successfully',
        'success',
        3000,
      );
      this.GetShiftFun();
    } else {
      this.createShiftForm.markAllAsTouched();
    }
  }

  updateShift() {
    if (this.updateShiftForm.valid) {
      const shiftData = this.updateShiftForm.value;
      const index = this.mockShifts.findIndex((d) => d.id === this.currentShiftId);
      
      if (index !== -1) {
        this.mockShifts[index] = { ...this.mockShifts[index], ...shiftData };
        this.closeModal();
        this.notificationService.show(
          'Shift updated successfully',
          'success',
          3000,
        );
        this.GetShiftFun();
      }
    } else {
      this.updateShiftForm.markAllAsTouched();
    }
  }

  GetShiftFun() {
    const searchText = this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockShifts;

    if (searchText) {
      filteredData = this.mockShifts.filter((d) =>
        d.shiftName.toLowerCase().includes(searchText)
      );
    }

    this.totalRecords = filteredData.length;

    if (this.tableSize === 'all') {
      this.shiftList = filteredData;
    } else {
      const startIndex = (this.page - 1) * this.tableSize;
      const endIndex = startIndex + this.tableSize;
      this.shiftList = filteredData.slice(startIndex, endIndex);
    }
  }

  async Status(id: string, status: any) {
    const index = this.mockShifts.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.mockShifts[index].is_active = status;
      this.notificationService.show(
        `Shift ${status ? 'activated' : 'deactivated'} successfully`,
        'success',
        2000,
      );
      this.GetShiftFun();
    }
  }
}
