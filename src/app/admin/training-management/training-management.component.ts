import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TrainingManagementService } from '../../core/services/training-management.service';
import { NotificationService } from '../../core/services/notificationnew.service';

export interface TrainingSession {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  supervisor: string;
  employeeIds: string[];
  employees?: any[];
  startDate: string;
  endDate: string;
  status?: number;
}

export interface TrainingTypeOption {
  id: string;
  name: string;
  is_active: number;
}

export interface TrainingEmployeeOption {
  id: string;
  name: string;
  department?: string;
  employee_code?: string;
}

@Component({
  selector: 'app-training-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './training-management.component.html',
  styleUrls: ['./training-management.component.scss'],
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
export class TrainingManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  trainingSessions: TrainingSession[] = [];
  displaySessions: TrainingSession[] = [];

  mockTypes: TrainingTypeOption[] = [];

  mockEmployees: TrainingEmployeeOption[] = [];
  mockSupervisors: any[] = [];

  todayDate: string = '';
  minEndDate: string = '';

  page: number = 1;
  totalRecords: number = 0;
  tableSize: any = 10;
  tableSizes: any[] = [10, 20, 50, 100];

  filterSearch: string = '';
  filterStatus: string = '';
  filterSupervisorId: string = '';
  filterTypeId: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewTrainingOpen: boolean = false;
  trainingForm!: FormGroup;
  selectedSession: TrainingSession | null = null;
  selectedViewSession: TrainingSession | null = null;

  constructor(
    private fb: FormBuilder,
    private trainingService: TrainingManagementService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.todayDate = `${yyyy}-${mm}-${dd}`;
    this.minEndDate = this.todayDate;

    this.trainingForm = this.fb.group({
      name: ['', Validators.required],
      typeId: [null, Validators.required],
      employeeIds: [[], [Validators.required, Validators.minLength(1)]],
      supervisor: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
    this.loadTrainingTypes();
    this.loadTrainings();
    this.loadSupervisors();
    this.loadEmployees();
  }

  loadTrainingTypes(): void {
    this.trainingService.getTrainingTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const types = Array.isArray(res.data) ? res.data : (res.data.data || []);
          this.mockTypes = types.map((t: any) => ({
            id: t.id,
            name: t.name,
            is_active: t.status !== undefined ? t.status : 1
          }));
        }
      },
      error: (err: any) => console.error('Failed to load training types', err)
    });
  }

  loadTrainings(): void {
    const params = [];
    if (this.filterSearch) params.push(`search=${encodeURIComponent(this.filterSearch)}`);
    if (this.filterSupervisorId) params.push(`supervisor_id=${this.filterSupervisorId}`);
    if (this.filterTypeId) params.push(`training_type_id=${this.filterTypeId}`);
    if (this.filterDateFrom) params.push(`date_from=${this.filterDateFrom}`);
    if (this.filterDateTo) params.push(`date_to=${this.filterDateTo}`);
    
    params.push(`page=${this.page}`);
    if (this.tableSize !== 'all') {
      params.push(`limit=${this.tableSize}`);
    } else {
      params.push(`limit=1000`);
    }

    const queryString = params.length ? '?' + params.join('&') : '';

    this.trainingService.getTrainings(queryString).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const trainings = Array.isArray(res.data) ? res.data : (res.data.data || []);
          this.trainingSessions = trainings.map((t: any) => ({
            id: t.id,
            name: t.training_name,
            typeId: t.training_type_id,
            typeName: t.training_type,
            supervisor: t.supervisor_name,
            employeeIds: t.employees?.map((e: any) => e.id) || [],
            employees: t.employees || [],
            startDate: t.start_date,
            endDate: t.end_date,
            status: t.status !== undefined ? t.status : 1
          }));
          
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
            this.page = res.pagination.current_page;
          } else {
            this.totalRecords = trainings.length;
          }
          
          this.filterData();
        }
      },
      error: (err: any) => console.error('Failed to load trainings', err)
    });
  }

  onStartDateChange(): void {
    const startDate = this.trainingForm.get('startDate')?.value;
    if (startDate) {
      this.minEndDate = startDate;
      const endDate = this.trainingForm.get('endDate')?.value;
      if (endDate && endDate < startDate) {
        this.trainingForm.get('endDate')?.setValue('');
      }
    } else {
      this.minEndDate = this.todayDate;
    }
  }

  loadSupervisors(): void {
    this.trainingService.getSupervisors().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          let supervisors = Array.isArray(res.data) ? res.data : (res.data.data || []);
          this.mockSupervisors = supervisors.map((s: any) => ({
            id: s.id,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown'
          }));
        }
      },
      error: (err) => console.error('Failed to load supervisors', err)
    });
  }

  loadEmployees(): void {
    this.trainingService.getEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          let employees = Array.isArray(res.data) ? res.data : (res.data.data || []);
          this.mockEmployees = employees.map((e: any) => ({
            id: e.id,
            name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Unknown',
            department: e.department?.name || e.department || '—',
            employee_code: e.employee_code || ''
          }));
        }
      },
      error: (err) => console.error('Failed to load employees', err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterData(): void {
    this.displaySessions = [...this.trainingSessions];
    // Removed client-side totalRecords update so it uses server-provided total
    this.showreset = this.filterSearch !== '' || this.filterSupervisorId !== '' || this.filterTypeId !== '' || this.filterDateFrom !== '' || this.filterDateTo !== '';
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTrainings(); // Trigger API call with filters
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterSupervisorId = '';
    this.filterTypeId = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 1;
    this.loadTrainings(); // Refresh from API
  }

  onTableDataChange(pageNumber: number): void {
    this.page = pageNumber;
    this.loadTrainings();
  }

  onTableSizeChange(event: Event | number): void {
    const target = (event as Event).target as HTMLSelectElement | null;
    this.tableSize = target ? Number(target.value) : Number(event);
    this.page = 1;
    this.loadTrainings();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedSession = null;
    this.trainingForm.reset({ employeeIds: [] });
    this.modalOpen = true;
  }

  toggleStatus(session: TrainingSession): void {
    const newStatus = session.status === 1 ? 0 : 1;
    this.trainingService.updateTrainingStatus(session.id, { status: newStatus }).subscribe({
      next: (res: any) => {
        session.status = newStatus;
        this.notificationService.show(res?.message || 'Status updated successfully', 'success', 3000);
      },
      error: (err: any) => {
        this.notificationService.show(err?.error?.message || err.message || 'Failed to update status', 'error', 3000);
      }
    });
  }

  openEditModal(session: TrainingSession): void {
    this.isEditMode = true;
    this.selectedSession = session;
    this.trainingForm.reset();
    
    // Fetch latest data by ID
    this.trainingService.getTrainingById(session.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const t = res.data;
          this.trainingForm.patchValue({
            name: t.training_name || t.name,
            typeId: t.training_type_id || t.typeId,
            supervisor: t.supervisor_id || t.supervisor,
            employeeIds: t.employees?.map((e: any) => e.id) || t.employee_ids || [],
            startDate: t.start_date || t.startDate,
            endDate: t.end_date || t.endDate
          });
          this.onStartDateChange();
        }
      },
      error: (err: any) => {
        this.notificationService.show('Failed to fetch training details', 'error', 3000);
      }
    });

    this.modalOpen = true;
  }

  openViewModal(session: TrainingSession): void {
    this.viewTrainingOpen = true;
    this.selectedViewSession = session;
  }

  getEmployeeNameById(id: string): string {
    return this.mockEmployees.find(e => e.id === id)?.name || 'Unknown';
  }

  getEmployeeDeptById(id: string): string {
    return this.mockEmployees.find(e => e.id === id)?.department || '—';
  }

  closeModal(): void {
    this.modalOpen = false;
    this.viewTrainingOpen = false;
    this.selectedViewSession = null;
    this.trainingForm.reset({ employeeIds: [] });
  }

  saveTraining(): void {
    if (this.trainingForm.invalid) {
      this.trainingForm.markAllAsTouched();
      return;
    }
    const val = this.trainingForm.value;

    if (this.isEditMode) {
      if (this.selectedSession) {
        const payload = {
          training_name: val.name,
          training_type_id: val.typeId,
          supervisor_id: val.supervisor,
          start_date: val.startDate,
          end_date: val.endDate,
          employee_ids: val.employeeIds
        };

        this.trainingService.updateTraining(this.selectedSession.id, payload).subscribe({
          next: (res: any) => {
            this.notificationService.show(res?.message || 'Training updated successfully', 'success', 3000);
            this.closeModal();
            this.loadTrainings();
          },
          error: (err: any) => {
            this.notificationService.show(err?.error?.message || err.message || 'Failed to update training', 'error', 3000);
          }
        });
      }
    } else {
      const payload = {
        training_name: val.name,
        training_type_id: val.typeId,
        supervisor_id: val.supervisor,
        start_date: val.startDate,
        end_date: val.endDate,
        employee_ids: val.employeeIds
      };

      this.trainingService.createTraining(payload).subscribe({
        next: (res: any) => {
          this.notificationService.show(res?.message || 'Training created successfully', 'success', 3000);
          this.closeModal();
          this.loadTrainings();
        },
        error: (err: any) => {
          // this.notificationService.show(err?.error?.message || err.message || 'Failed to create training', 'error', 3000);
        }
      });
    }
  }

  getEmployeeNames(session: TrainingSession): string {
    if (session.employees && session.employees.length > 0) {
      const names = session.employees.map(e => e.name);
      if (names.length <= 2) return names.join(', ');
      return `${names[0]}, ${names[1]} +${names.length - 2} more`;
    }
    const ids = session.employeeIds;
    if (!ids || ids.length === 0) return '—';
    const names = ids.map(id => this.mockEmployees.find(e => String(e.id) === String(id))?.name || id);
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  }
}
