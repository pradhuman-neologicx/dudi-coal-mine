import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';

export interface TrainingSession {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  supervisor: string;
  employeeIds: string[];
  startDate: string;
  endDate: string;
}

export interface TrainingTypeOption {
  id: string;
  name: string;
  is_active: number;
}

export interface TrainingEmployeeOption {
  id: string;
  name: string;
  department: string;
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

  trainingSessions: TrainingSession[] = [
    {
      id: 'TRN-001',
      name: 'Monthly Safety Drill',
      typeId: 'TT-001',
      typeName: 'Safety Training',
      supervisor: 'John Doe',
      employeeIds: ['E001', 'E002'],
      startDate: '2025-06-01',
      endDate: '2025-06-02'
    }
  ];
  displaySessions: TrainingSession[] = [];

  mockTypes: TrainingTypeOption[] = [
    { id: 'TT-001', name: 'Safety Training', is_active: 1 },
    { id: 'TT-002', name: 'Equipment Operations', is_active: 1 },
    { id: 'TT-003', name: 'Emergency Response', is_active: 1 },
  ];

  mockEmployees: TrainingEmployeeOption[] = [
    { id: 'E001', name: 'Ramesh Kumar', department: 'Mining' },
    { id: 'E002', name: 'Suresh Singh', department: 'Operations' },
    { id: 'E003', name: 'Amit Patel', department: 'Maintenance' },
    { id: 'E004', name: 'Vikas Yadav', department: 'Safety' },
  ];

  mockSupervisors: string[] = ['John Doe', 'Jane Smith', 'Robert Brown', 'Emily Davis'];

  page: number = 1;
  totalRecords: number = 0;
  tableSize: any = 10;
  tableSizes: any[] = [10, 20, 50, 100];

  filterSearch: string = '';
  filterStatus: string = '';
  showreset: boolean = false;

  modalOpen: boolean = false;
  isEditMode: boolean = false;
  viewTrainingOpen: boolean = false;
  trainingForm!: FormGroup;
  selectedSession: TrainingSession | null = null;
  selectedViewSession: TrainingSession | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.trainingForm = this.fb.group({
      name: ['', Validators.required],
      typeId: [null, Validators.required],
      employeeIds: [[], [Validators.required, Validators.minLength(1)]],
      supervisor: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
    this.filterData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterData(): void {
    this.displaySessions = this.trainingSessions.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(this.filterSearch.toLowerCase()) || 
                          s.supervisor.toLowerCase().includes(this.filterSearch.toLowerCase());
      return matchSearch;
    });
    this.totalRecords = this.displaySessions.length;
    this.showreset = this.filterSearch !== '';
  }

  onFilterChange(): void {
    this.page = 1;
    this.filterData();
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterStatus = '';
    this.page = 1;
    this.filterData();
  }

  onTableDataChange(pageNumber: number): void {
    this.page = pageNumber;
  }

  onTableSizeChange(event: Event | number): void {
    const target = (event as Event).target as HTMLSelectElement | null;
    this.tableSize = target ? Number(target.value) : Number(event);
    this.page = 1;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedSession = null;
    this.trainingForm.reset({ employeeIds: [] });
    this.modalOpen = true;
  }

  openEditModal(session: TrainingSession): void {
    this.isEditMode = true;
    this.selectedSession = session;
    this.trainingForm.patchValue({
      name: session.name,
      typeId: session.typeId,
      employeeIds: session.employeeIds,
      supervisor: session.supervisor,
      startDate: session.startDate,
      endDate: session.endDate
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
  }

  saveTraining(): void {
    if (this.trainingForm.invalid) {
      this.trainingForm.markAllAsTouched();
      return;
    }
    const val = this.trainingForm.value;
    const typeName = this.mockTypes.find(t => t.id === val.typeId)?.name || 'Unknown';

    if (this.isEditMode && this.selectedSession) {
      this.selectedSession.name = val.name;
      this.selectedSession.typeId = val.typeId;
      this.selectedSession.typeName = typeName;
      this.selectedSession.employeeIds = val.employeeIds;
      this.selectedSession.supervisor = val.supervisor;
      this.selectedSession.startDate = val.startDate;
      this.selectedSession.endDate = val.endDate;
    } else {
      const newId = 'TRN-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.trainingSessions.unshift({
        id: newId,
        name: val.name,
        typeId: val.typeId,
        typeName: typeName,
        employeeIds: val.employeeIds,
        supervisor: val.supervisor,
        startDate: val.startDate,
        endDate: val.endDate
      });
    }
    this.closeModal();
    this.filterData();
  }

  getEmployeeNames(ids: string[]): string {
    if (!ids || ids.length === 0) return '—';
    const names = ids.map(id => this.mockEmployees.find(e => e.id === id)?.name || id);
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  }
}
