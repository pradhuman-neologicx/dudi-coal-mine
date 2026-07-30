import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { RelayService } from '../../../core/services/relay.service';
import { NotificationService } from '../../../core/services/notificationnew.service';
import { ShiftService } from '../../../core/services/shift.service';

@Component({
  selector: 'app-relay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './relay.component.html',
  styleUrl: './relay.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition(':enter', [animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' }))]),
    ]),
  ],
})
export class RelayComponent implements OnInit {
  // Form Groups
  createRelayForm!: FormGroup;
  updateRelayForm!: FormGroup;

  // Modals state
  createRelayOpen: boolean = false;
  updateRelayOpen: boolean = false;
  viewRelayOpen: boolean = false;
  
  // Data state
  relayList: any[] = [];
  selectedRelay: any = null;
  currentRelayId: any = null;
  
  // Shift Dropdown Data
  shiftList: any[] = [];
  
  // Pagination
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  searchQuery: string = '';

  table_heading = [
    { heading0: 'Serial No.', heading1: 'Relay Name', heading2: 'Rotation Type', heading3: 'Current Shift', heading4: 'Status', heading5: 'Action' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private relayService: RelayService,
    private notificationService: NotificationService,
    private shiftService: ShiftService
  ) {}

  ngOnInit(): void {
    this.createRelayForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      is_rotating: [true], // Default is rotating
      current_shift_id: [null, [Validators.required]]
    });

    this.updateRelayForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      is_rotating: [true],
      current_shift_id: [null, [Validators.required]]
    });

    this.loadShifts();
    this.loadRelays();
  }

  loadShifts() {
    this.shiftService.getAllShifts().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          // Filter to only include active shifts (status == 1 or is_active == 1)
          this.shiftList = (res.data || []).filter(
            (shift: any) => shift.status == 1 || shift.is_active == 1
          );
        }
      },
      error: (err: any) => {
        console.error('Error fetching shifts', err);
      }
    });
  }

  loadRelays() {
    this.relayService.getRelays(this.page, this.tableSize, this.searchQuery).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.relayList = res.data.map((r: any) => ({
            ...r,
            is_active: r.status ? 1 : 0,
            is_rotating: r.is_rotating ? 1 : 0,
            current_shift_name: r.shift_name,
            current_shift_id: r.shift_id
          }));
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
            this.page = res.pagination.current_page;
          } else {
            this.totalRecords = res.data.length;
          }
        } else {
          this.relayList = [];
          this.totalRecords = 0;
        }
      },
      error: (err: any) => {
        this.relayList = [];
        this.totalRecords = 0;
        this.notificationService.show('Failed to fetch relays', 'error');
      }
    });
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event && event.target ? event.target.value : event;
    this.page = 1;
    this.loadRelays();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.loadRelays();
  }

  onSearch() {
    this.page = 1;
    this.loadRelays();
  }

  openAddModal() {
    this.createRelayForm.reset({ is_rotating: true, current_shift_id: null });
    this.createRelayOpen = true;
  }

  OpenEditModal(relay: any): void {
    this.currentRelayId = relay.id;
    this.relayService.getRelayById(relay.id).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.updateRelayForm.patchValue({
            name: res.data.name,
            is_rotating: res.data.is_rotating === true || res.data.is_rotating === 1,
            current_shift_id: res.data.shift_id
          });
          this.updateRelayOpen = true;
        } else {
          this.notificationService.show('Failed to fetch relay details', 'error');
        }
      },
      error: (err: any) => {
        // this.notificationService.show('Something went wrong', 'error');
      }
    });
  }

  openviewModal(relay: any): void {
    this.selectedRelay = null;
    this.viewRelayOpen = true;
    
    this.relayService.getRelayById(relay.id).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.selectedRelay = {
            ...res.data,
            is_active: res.data.status ? 1 : 0,
            is_rotating: res.data.is_rotating ? 1 : 0,
            current_shift_name: res.data.shift_name,
            current_shift_id: res.data.shift_id
          };
        } else {
          this.notificationService.show('Failed to fetch relay details', 'error');
          this.viewRelayOpen = false;
        }
      },
      error: (err: any) => {
        // this.notificationService.show('Something went wrong', 'error');
        this.viewRelayOpen = false;
      }
    });
  }

  closeModal() {
    this.createRelayOpen = false;
    this.updateRelayOpen = false;
    this.viewRelayOpen = false;
    this.selectedRelay = null;
  }

  createRelay() {
    if (this.createRelayForm.valid) {
      const val = this.createRelayForm.value;
      const payload = {
        name: val.name,
        is_rotating: val.is_rotating ? 1 : 0,
        shift_id: val.current_shift_id
      };

      this.relayService.createRelay(payload).subscribe({
        next: (res: any) => {
          if (res && res.status === 200) {
            this.notificationService.show(res.message || 'Relay created successfully', 'success');
            const shiftName = this.shiftList.find(s => s.id === val.current_shift_id)?.shift_name || 'Unknown';
            const newRelay = {
              ...res.data,
              current_shift_name: shiftName,
              current_shift_id: val.current_shift_id,
              is_active: res.data.status ? 1 : 0
            };
            this.relayList.unshift(newRelay);
            this.totalRecords = this.relayList.length;
            this.closeModal();
          } else {
            this.notificationService.show(res.message || 'Failed to create relay', 'error');
          }
        },
        error: (err: any) => {
          // this.notificationService.show(err?.error?.message || 'Something went wrong', 'error');
        }
      });
    } else {
      this.createRelayForm.markAllAsTouched();
    }
  }

  updateRelay() {
    if (this.updateRelayForm.valid) {
      const val = this.updateRelayForm.value;
      const payload = {
        name: val.name,
        is_rotating: val.is_rotating ? 1 : 0,
        shift_id: val.current_shift_id
      };

      this.relayService.updateRelay(this.currentRelayId, payload).subscribe({
        next: (res: any) => {
          if (res && res.status === 200) {
            this.notificationService.show(res.message || 'Relay updated successfully', 'success');
            const idx = this.relayList.findIndex(r => r.id === this.currentRelayId);
            if(idx > -1) {
              this.relayList[idx].name = val.name;
              this.relayList[idx].is_rotating = val.is_rotating ? 1 : 0;
              this.relayList[idx].current_shift_id = val.current_shift_id;
              this.relayList[idx].current_shift_name = this.shiftList.find(s => s.id === val.current_shift_id)?.shift_name || 'Unknown';
            }
            this.closeModal();
          } else {
            this.notificationService.show(res.message || 'Failed to update relay', 'error');
          }
        },
        error: (err: any) => {
          // this.notificationService.show(err?.error?.message || 'Something went wrong', 'error');
        }
      });
    } else {
      this.updateRelayForm.markAllAsTouched();
    }
  }

  toggleStatus(id: number, currentStatus: number) {
    this.relayService.updateRelayStatus(id).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.notificationService.show(res.message || 'Status updated successfully', 'success');
          const idx = this.relayList.findIndex(r => r.id === id);
          if (idx > -1) {
            this.relayList[idx].is_active = currentStatus === 1 ? 0 : 1;
            this.relayList[idx].status = currentStatus === 1 ? false : true;
          }
        } else {
          this.notificationService.show(res.message || 'Failed to update status', 'error');
        }
      },
      error: (err: any) => {
        // this.notificationService.show(err?.error?.message || 'Something went wrong', 'error');
      }
    });
  }
}
