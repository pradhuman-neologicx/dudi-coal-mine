import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { IncidentTypeService } from 'src/app/core/services/incident-type.service';

export interface IncidentTypeItem {
  id: number | string;
  name?: string;
  incident_type?: string;
  description?: string;
  is_active?: number | boolean;
  status?: number | boolean | string;
  [key: string]: any;
}

@Component({
  selector: 'app-incident-type',
  templateUrl: './incident-type.component.html',
  styleUrl: './incident-type.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.5)' })),
      transition(':enter', [animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))]),
    ]),
  ],
})
export class IncidentTypeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false;
  searchbarform!: FormGroup;
  createForm!: FormGroup;
  updateForm!: FormGroup;
  viewForm!: FormGroup;
  
  tableSize: number = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  totalRecords: number = 0;
  page: number = 1;
  
  createModalOpen: boolean = false;
  updateModalOpen: boolean = false;
  viewModalOpen: boolean = false;
  selectedItem: IncidentTypeItem | null = null;
  currentId: number | string | null = null;

  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Incident Type',
      heading2: 'Status',
      heading3: 'Action',
    },
  ];

  // MOCK DATA
  masterList: IncidentTypeItem[] = [
    { id: 1, name: 'Fire', is_active: 1 },
    { id: 2, name: 'Spill', is_active: 1 },
    { id: 3, name: 'Equipment Failure', is_active: 1 },
    { id: 4, name: 'Accident', is_active: 0 },
    { id: 5, name: 'Medical Emergency', is_active: 1 }
  ];
  filteredList: IncidentTypeItem[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private incidentTypeService: IncidentTypeService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createForm = this.formBuilder.group({
      Name: ['', [Validators.required]],
    });

    this.updateForm = this.formBuilder.group({
      Name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.viewForm = this.formBuilder.group({
      Name: [''],
    });
    
    this.GetListFun();
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
    this.GetListFun();
  }

  onTableDataChange(event: number) {
    this.page = event;
    this.GetListFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetListFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetListFun();
  }

  GetListFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';
    
    this.incidentTypeService.getIncidentTypes(this.tableSize, this.page, searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            this.filteredList = response.data.map((item: any) => ({
              id: item.id,
              name: item.incident_type,
              description: item.description,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.totalRecords = response.pagination?.total || this.filteredList.length;
          } else {
            this.notificationService.show(response.message || 'Failed to load incident types', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error loading incident types:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  openAddModal() {
    this.createModalOpen = true;
    this.createForm.reset();
  }

  closeModal() {
    this.updateModalOpen = false;
    this.createModalOpen = false;
    this.viewModalOpen = false;
    this.selectedItem = null;
    this.createForm.reset();
    this.updateForm.reset();
  }

  OpenEditModal(user: IncidentTypeItem): void {
    this.currentId = user.id;
    this.incidentTypeService.getIncidentTypeById(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            this.updateForm.patchValue({ Name: response.data.incident_type || response.data.name });
            this.updateModalOpen = true;
          } else {
            this.notificationService.show(response.message || 'Failed to load details', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error fetching details:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }

  openviewModal(user: IncidentTypeItem): void {
    this.viewModalOpen = true;
    this.currentId = user.id;
    this.selectedItem = user;
    this.viewForm.patchValue({ Name: user.name || user.incident_type });
  }

  createItem() {
    if (this.createForm.valid) {
      const name = this.createForm.get('Name')?.value;
      const formData = new FormData();
      formData.append('incident_type', name);

      this.incidentTypeService.createIncidentType(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Incident Type created successfully', 'success', 3000);
              this.closeModal();
              this.GetListFun();
            } else {
              this.notificationService.show(response.message || 'Failed to create incident type', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error creating incident type:', error);
            this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      this.createForm.markAllAsTouched();
    }
  }

  updateItem() {
    if (this.updateForm.valid) {
      const name = this.updateForm.get('Name')?.value;
      const formData = new FormData();
      formData.append('incident_type', name);
      formData.append('_method', 'PUT');

      this.incidentTypeService.updateIncidentType(this.currentId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 || response.status === 201) {
              this.notificationService.show(response.message || 'Incident Type updated successfully', 'success', 3000);
              this.closeModal();
              this.GetListFun();
            } else {
              this.notificationService.show(response.message || 'Failed to update incident type', 'error', 3000);
            }
          },
          error: (error: any) => {
            console.error('Error updating incident type:', error);
            this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
          }
        });
    } else {
      this.updateForm.markAllAsTouched();
    }
  }

  Status(id: number | string, status: boolean | number | string) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.incidentTypeService.updateIncidentTypeStatus(id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.notificationService.show(response.message || 'Status updated successfully', 'success', 3000);
            this.GetListFun();
          } else {
            this.notificationService.show(response.message || 'Failed to update status', 'error', 3000);
          }
        },
        error: (error: any) => {
          console.error('Error updating status:', error);
          this.notificationService.show(error.message || 'Something went wrong', 'error', 3000);
        }
      });
  }
}
