import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { ShiftService } from 'src/app/core/services/shift.service';

export interface ShiftMasterItem {
  id: number | string;
  name?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  minWorkingHours?: number | string;
  is_night_shift?: number | boolean;
  status?: boolean | number | string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean | number | string;
  [key: string]: any;
}

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
    NgSelectModule,
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
export class ShiftComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createShiftForm!: FormGroup;
  updateShiftForm!: FormGroup;
  viewShiftForm!: FormGroup;
  
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  
  createShiftOpen: boolean = false;
  updateShiftOpen: boolean = false;
  viewShiftOpen: boolean = false;
  currentShiftId: number | string | null = null;
  selectedShift: ShiftMasterItem | null = null;
  
  shiftList: ShiftMasterItem[] = [];
  originalStartTime: string = '';
  originalEndTime: string = '';
  originalIsNightShift: boolean = false;
  

  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Shift Name',
      heading2: 'Shift Type',
      heading3: 'Timing',
      heading4: 'Min Hrs',
      heading5: 'Status',
      heading6: 'Action',
    },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private shiftService: ShiftService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createShiftForm = this.formBuilder.group({
      shiftName: ['', [Validators.required]],
      startTime: ['', [Validators.required, this.nightShiftValidator()]],
      endTime: ['', [Validators.required, this.nightShiftEndValidator()]],
      minWorkingHours: ['', [Validators.required, Validators.min(1)]],
      isNightShift: [false]
    });

    this.updateShiftForm = this.formBuilder.group({
      shiftName: ['', [Validators.required]],
      startTime: ['', [Validators.required, this.nightShiftValidator()]],
      endTime: ['', [Validators.required, this.nightShiftEndValidator()]],
      minWorkingHours: ['', [Validators.required, Validators.min(1)]],
      isNightShift: [false]
    });

    this.viewShiftForm = this.formBuilder.group({
      shiftName: [''],
      startTime: [''],
      endTime: [''],
      minWorkingHours: [''],
    });

    // Subscribe to Create Form Night Shift Checkbox Changes
    this.createShiftForm.get('isNightShift')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isChecked) => {
      if (isChecked) {
        this.createShiftForm.patchValue({
          startTime: '20:00',
          endTime: '08:00'
        }, { emitEvent: false });
      } else {
        this.createShiftForm.patchValue({
          startTime: '',
          endTime: ''
        }, { emitEvent: false });
      }
      this.createShiftForm.get('startTime')?.updateValueAndValidity();
      this.createShiftForm.get('endTime')?.updateValueAndValidity();
    });

    // Subscribe to Update Form Night Shift Checkbox Changes
    this.updateShiftForm.get('isNightShift')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isChecked) => {
      if (isChecked) {
        if (this.originalIsNightShift) {
          this.updateShiftForm.patchValue({
            startTime: this.originalStartTime || '20:00',
            endTime: this.originalEndTime || '08:00'
          }, { emitEvent: false });
        } else {
          this.updateShiftForm.patchValue({
            startTime: '20:00',
            endTime: '08:00'
          }, { emitEvent: false });
        }
      } else {
        if (!this.originalIsNightShift) {
          this.updateShiftForm.patchValue({
            startTime: this.originalStartTime || '',
            endTime: this.originalEndTime || ''
          }, { emitEvent: false });
        } else {
          this.updateShiftForm.patchValue({
            startTime: '',
            endTime: ''
          }, { emitEvent: false });
        }
      }
      this.updateShiftForm.get('startTime')?.updateValueAndValidity();
      this.updateShiftForm.get('endTime')?.updateValueAndValidity();
    });

    // Subscribe to Create Form Time Changes
    this.createShiftForm.get('startTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.createShiftForm.get('endTime')?.updateValueAndValidity({ emitEvent: false });
    });
    this.createShiftForm.get('endTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.createShiftForm.get('startTime')?.updateValueAndValidity({ emitEvent: false });
    });

    // Subscribe to Update Form Time Changes
    this.updateShiftForm.get('startTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateShiftForm.get('endTime')?.updateValueAndValidity({ emitEvent: false });
    });
    this.updateShiftForm.get('endTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateShiftForm.get('startTime')?.updateValueAndValidity({ emitEvent: false });
    });
    
    this.GetShiftFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nightShiftValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const isNight = control.parent.get('isNightShift')?.value;
      const startTime = control.value;
      const endTime = control.parent.get('endTime')?.value;

      if (!startTime || !endTime) return null;

      if (isNight) {
        if (startTime <= endTime) {
          return { invalidNightRange: true };
        }
      } else {
        if (startTime >= endTime) {
          return { invalidDayRange: true };
        }
      }
      return null;
    };
  }

  nightShiftEndValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const isNight = control.parent.get('isNightShift')?.value;
      const endTime = control.value;
      const startTime = control.parent.get('startTime')?.value;

      if (!startTime || !endTime) return null;

      if (isNight) {
        if (startTime <= endTime) {
          return { invalidNightRange: true };
        }
      } else {
        if (startTime >= endTime) {
          return { invalidDayRange: true };
        }
      }
      return null;
    };
  }

  onTableSizeChange(event: Event | number): void {
    if (typeof event === 'number') {
      this.tableSize = event;
    } else if (event && event.target) {
      this.tableSize = Number((event.target as HTMLInputElement).value);
    }
    this.page = 1;
    this.GetShiftFun();
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.GetShiftFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetShiftFun();
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

  OpenEditModal(shift: ShiftMasterItem): void {
    this.currentShiftId = shift.id;
    this.updateShiftOpen = true;
    this.GetupdateShiftbyid(this.currentShiftId);
  }

  openviewModal(shift: ShiftMasterItem): void {
    this.viewShiftOpen = true;
    this.currentShiftId = shift.id;
    this.selectedShift = null;

    this.shiftService.getShiftById(shift.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.selectedShift = response.data;
          this.viewShiftForm.patchValue({ 
            shiftName: response.data.shiftName || response.data.name,
            startTime: response.data.startTime,
            endTime: response.data.endTime,
            minWorkingHours: response.data.minWorkingHours
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching shift details:', error);
      }
    });
  }

  GetupdateShiftbyid(shiftId: number | string) {
    this.shiftService.getShiftById(shiftId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const shift = response.data;
          this.originalStartTime = shift.startTime || '';
          this.originalEndTime = shift.endTime || '';
          this.originalIsNightShift = shift.is_night_shift == 1;
          
          this.updateShiftForm.patchValue({
            shiftName: shift.shiftName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            minWorkingHours: shift.minWorkingHours,
            isNightShift: shift.is_night_shift == 1
          }, { emitEvent: false });
          this.updateShiftForm.get('startTime')?.updateValueAndValidity();
          this.updateShiftForm.get('endTime')?.updateValueAndValidity();
        }
      },
      error: (error: any) => {
        console.error('Error fetching shift details:', error);
      }
    });
  }

  errorMessage: any;
  createShift() {
    if (this.createShiftForm.valid) {
      const shiftName = this.createShiftForm.get('shiftName')?.value;
      const startTime = this.createShiftForm.get('startTime')?.value;
      const endTime = this.createShiftForm.get('endTime')?.value;
      const minWorkingHours = this.createShiftForm.get('minWorkingHours')?.value;
      const isNightShift = this.createShiftForm.get('isNightShift')?.value ? 1 : 0;

      const formData = new FormData();
      formData.append('name', shiftName);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('minimum_working_hours', minWorkingHours.toString());
      formData.append('is_night_shift', isNightShift.toString());

      this.shiftService.createShift(formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Shift created successfully', 'success', 3000);
            this.GetShiftFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error) => {
          console.error('Create Shift failed:', error);
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
      this.createShiftForm.markAllAsTouched();
    }
  }

  updateShift() {
    if (this.updateShiftForm.valid) {
      const shiftName = this.updateShiftForm.get('shiftName')?.value;
      const startTime = this.updateShiftForm.get('startTime')?.value;
      const endTime = this.updateShiftForm.get('endTime')?.value;
      const minWorkingHours = this.updateShiftForm.get('minWorkingHours')?.value;
      const isNightShift = this.updateShiftForm.get('isNightShift')?.value ? 1 : 0;

      const formData = new FormData();
      formData.append('name', shiftName);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('minimum_working_hours', minWorkingHours.toString());
      formData.append('is_night_shift', isNightShift.toString());
      formData.append('_method', 'PUT');

      this.shiftService.updateShift(this.currentShiftId, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Shift updated successfully', 'success', 3000);
            this.GetShiftFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Shift failed:', error);
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
      this.updateShiftForm.markAllAsTouched();
    }
  }

  GetShiftFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.shiftService
      .getShifts(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.shiftList = response.data;
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch shifts:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching shifts:', error);
        }
      });
  }

  async Status(id: number | string, status: boolean | number | string) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.shiftService.updateShiftStatus(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Shift status updated successfully`,
            'success',
            3000
          );
          this.GetShiftFun();
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
