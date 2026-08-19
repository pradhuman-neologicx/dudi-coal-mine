import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { SafetyService } from '../../core/services/safety.service';
import { IncidentTypeService } from '../../core/services/incident-type.service';
import { NotificationService } from '../../core/services/notificationnew.service';
import { ShiftPlanningService } from '../../core/services/shift-planning.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface IncidentItem {
  id: number | string;
  incident_date?: string;
  shift_id?: number | string;
  shift_name?: string;
  incident_type_id?: number | string;
  severity?: string;
  location_id?: number | string;
  person_involved_id?: number | string;
  person_involved_name?: string;
  person_involved_employee_code?: string;
  incident_type?: string;
  location_name?: string;
  incident_no?: string;
  incident_description?: string;
  action_taken?: string;
  preventive_measures?: string;
  equipment_id?: number | string;
  equipment_name_id?: number | string;
  status?: string;
  notes?: string[];
  media?: any[];
  [key: string]: any;
}

export interface IncidentTypeOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface EmployeeOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface LocationOption {
  id: number | string;
  name: string;
  site_name?: string;
  [key: string]: any;
}

export interface MachineCategoryOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

export interface ImportResult {
  status: number | string;
  message: string;
  errors: string[];
}

@Component({
  selector: 'app-safety-management',
  templateUrl: './safety-management.component.html',
  styleUrls: ['./safety-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule, NgxPaginationModule, NgSelectModule]
})
export class SafetyManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isModalOpen = false;
  isDetailsPanelOpen = false;
  isFilterOpen = false;
  p: number = 1;
  selectedIncident: IncidentItem | null = null;
  isEditMode = false;
  
  isImportModalOpen = false;
  isImporting = false;
  importResult: ImportResult | null = null;
  
  mockEmployees: EmployeeOption[] = [];

  mockLocations: LocationOption[] = [];
  mockShifts: any[] = [];
  mockIncidentTypes: IncidentTypeOption[] = [];
  machineCategories: MachineCategoryOption[] = [];
  machineNames: any[] = [];
  shiftMachines: any[] = [];
  activeShiftEmployees: any[] = [];

  newIncidentForm: any = {
    incident_date: '',
    shift_id: null,
    incident_type_id: null,
    severity: null,
    location_id: null,
    person_involved_id: null,
    incident_description: '',
    action_taken: '',
    preventive_measures: '',
    equipment_id: null,
    equipment_name_id: null,
    shift_name: '' // added for readonly shift field
  };

  incidents: IncidentItem[] = [];
  dashboardStats: any = {};
  pagination: any = {
    current_page: 1,
    per_page: 10,
    total: 0
  };
  limit: number | string = 10;
  tableSizes: number[] = [10, 20, 50, 100];
  searchQuery = '';

  constructor(
    private safetyService: SafetyService,
    private incidentTypeService: IncidentTypeService,
    private notificationService: NotificationService,
    private shiftPlanningService: ShiftPlanningService
  ) {}

  ngOnInit() {
    this.loadDropdowns();
    this.loadIncidents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDropdowns() {
    this.safetyService.getShifts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockShifts = res.data;
        }
      }
    });

    this.safetyService.getSites().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockLocations = res.data;
        }
      }
    });

    this.safetyService.getPublicIncidentTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockIncidentTypes = res.data;
        }
      }
    });

    this.safetyService.getEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockEmployees = res.data;
        }
      }
    });

    this.safetyService.getMachineCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.machineCategories = res.data.map((c: any) => ({
            id: c.category_id || c.id,
            name: c.category_name || c.name
          }));
        }
      }
    });
  }

  onMachineCategoryChange(categoryId: any) {
    this.newIncidentForm.equipment_name_id = null;
    this.machineNames = [];
    if (categoryId) {
      if (this.shiftMachines && this.shiftMachines.length > 0) {
        this.machineNames = this.shiftMachines
          .filter((m: any) => m.category_id === categoryId)
          .map((m: any) => ({ id: m.machine_id, name: m.machine_name }));
      } else {
        this.safetyService.getMachineNames(categoryId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            if (res && res.status === 200) {
              this.machineNames = res.data.map((m: any) => ({
                id: m.id || m.equipment_id,
                name: m.equipment_name || m.name
              }));
            }
          }
        });
      }
    }
  }

  mockSeverities = [
    { id: 'LOW', name: 'LOW' },
    { id: 'MEDIUM', name: 'MEDIUM' },
    { id: 'HIGH', name: 'HIGH' },
    { id: 'CRITICAL', name: 'CRITICAL' }
  ];

  selectedType: any = null;
  filterDateFrom = '';
  filterDateTo = '';
  filterShift: any = null;
  selectedDateRange = '';
  filterLocation: any = null;

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onDateRangeChange() {
    const today = new Date();
    
    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (this.selectedDateRange === 'today') {
      const todayStr = toYMD(today);
      this.filterDateFrom = todayStr;
      this.filterDateTo = todayStr;
    } else if (this.selectedDateRange === 'last7days') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      this.filterDateFrom = toYMD(last7);
      this.filterDateTo = toYMD(today);
    } else if (this.selectedDateRange === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.filterDateFrom = toYMD(firstDay);
      this.filterDateTo = toYMD(today);
    } else {
      this.filterDateFrom = '';
      this.filterDateTo = '';
    }
    
    this.p = 1;
    this.loadIncidents();
  }

  get incidentDistributionTotal(): number {
    if (!this.dashboardStats || !this.dashboardStats.incident_distribution) return 0;
    let total = 0;
    for (const key in this.dashboardStats.incident_distribution) {
      if (this.dashboardStats.incident_distribution[key]?.count) {
        total += this.dashboardStats.incident_distribution[key].count;
      }
    }
    return total;
  }

  clearFilters() {
    this.selectedType = null;
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterShift = null;
    this.filterLocation = null;
    this.searchQuery = '';
    this.p = 1;
    this.loadIncidents();
  }

  onFilterChange() {
    this.pagination.current_page = 1;
    this.loadIncidents();
  }

  onDateChange() {
    if (!this.newIncidentForm.incident_date) {
      this.newIncidentForm.shift_id = null;
      this.newIncidentForm.shift_name = '';
      return;
    }

    this.shiftPlanningService.shiftPlanFilterByDate(this.newIncidentForm.incident_date).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.newIncidentForm.shift_id = res.data.id || res.data.shift_id || res.data;
          this.newIncidentForm.shift_name = res.data.name;

          if (res.data.site && res.data.site.id) {
            this.newIncidentForm.location_id = res.data.site.id;
          }

          let shiftEmployees: any[] = [];
          if (res.data.workforce && res.data.workforce.length > 0) {
            shiftEmployees = [...res.data.workforce];
          }
          if (res.data.drivers && res.data.drivers.length > 0) {
            res.data.drivers.forEach((d: any) => {
              if (!shiftEmployees.find(e => e.id === d.id)) {
                shiftEmployees.push(d);
              }
            });
          }
          this.activeShiftEmployees = shiftEmployees;

          if (res.data.machines && res.data.machines.length > 0) {
            const uniqueCategories = new Map();
            res.data.machines.forEach((m: any) => {
              if (!uniqueCategories.has(m.category_id)) {
                uniqueCategories.set(m.category_id, {
                  id: m.category_id,
                  name: m.category_name
                });
              }
            });
            this.machineCategories = Array.from(uniqueCategories.values());
            this.shiftMachines = res.data.machines;
          }
        } else {
          this.notificationService.show(res?.message || 'No shift plan found for the selected date.', 'error');
          this.newIncidentForm.shift_id = null;
          this.newIncidentForm.shift_name = 'No data found for this date';
          this.activeShiftEmployees = [];
        }
      },
      error: (err: any) => {
        console.error('Error fetching shift by datetime', err);
        this.notificationService.show(err.error?.message || err.message || 'Error fetching shift details.', 'error');
        this.newIncidentForm.shift_id = null;
        this.newIncidentForm.shift_name = 'No data found for this date';
        this.activeShiftEmployees = [];
      }
    });
  }

  onLimitChange() {
    this.p = 1;
    this.loadIncidents();
  }

  onSearch() {
    this.p = 1;
    this.loadIncidents();
  }
  
  onPageChange(page: number) {
    this.p = page;
    this.loadIncidents();
  }

  formatDate(date: string) {
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  }

  loadIncidents() {
    if (this.filterDateFrom && this.filterDateTo) {
      if (new Date(this.filterDateTo) < new Date(this.filterDateFrom)) {
        this.notificationService.show('End date cannot be earlier than start date.', 'error', 3000);
        this.filterDateTo = this.filterDateFrom;
      }
    }

    let params = new HttpParams();
    
    if (this.limit !== 'All') {
      params = params.set('page', this.p.toString())
                     .set('limit', this.limit.toString());
    }

    if (this.selectedType) params = params.set('incident_type_id', this.selectedType);
    if (this.filterShift) params = params.set('shift_id', this.filterShift);
    if (this.filterLocation) params = params.set('location_id', this.filterLocation);
    if (this.searchQuery && this.searchQuery.trim() !== '') params = params.set('search', this.searchQuery.trim());
    if (this.filterDateFrom) params = params.set('date_from', this.formatDate(this.filterDateFrom));
    if (this.filterDateTo) params = params.set('date_to', this.formatDate(this.filterDateTo));

    this.safetyService.getIncidents(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.incidents = res.data || [];
          this.dashboardStats = res.dashboard || {};
          if (res.pagination) {
            this.pagination = res.pagination;
            this.p = res.pagination.current_page;
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading incidents', err);
      }
    });
  }

  closeCase() {
    if (this.selectedIncident) {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      
      this.safetyService.closeIncident(this.selectedIncident.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 201)) {
            if (this.selectedIncident) this.selectedIncident.status = 'Investigation Closed';
            this.notificationService.show(res.message || 'Case status updated to "Investigation Closed"', 'success', 3000);
            this.closeDetailsPanel();
            this.loadIncidents();
          } else {
            this.notificationService.show(res.message || 'Failed to close case', 'error', 3000);
          }
        },
        error: (err: any) => {
          const errorMsg = err?.error?.message || err?.message || 'An error occurred while closing the case.';
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    }
  }

  addNote() {
    if (!this.selectedIncident) return;
    const note = prompt("Enter investigation note:");
    if (note) {
      if (!this.selectedIncident.notes) {
        this.selectedIncident.notes = [];
      }
      this.selectedIncident.notes.push(note);
    }
  }

  onFileSelected(event: any) {
    // Kept for backward compatibility if used elsewhere, otherwise handled by onEditFileSelected
  }

  editIncidentFiles: { file: File, preview: string | ArrayBuffer | null }[] = [];

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: FileList | null = input.files;
    if (files && files.length > 0) {
      const existingMediaCount = this.selectedIncident?.media ? this.selectedIncident.media.length : 0;
      const currentNewFilesCount = this.editIncidentFiles.length;
      const remainingSlots = 3 - (existingMediaCount + currentNewFilesCount);

      if (remainingSlots <= 0) {
        this.notificationService.show('You can only have a maximum of 3 files.', 'error', 3000);
        (event.target as HTMLInputElement).value = '';
        return;
      }

      const filesToProcess = Math.min(files.length, remainingSlots);
      if (files.length > remainingSlots) {
        this.notificationService.show(`You can only have a maximum of 3 files. Only the first ${remainingSlots} file(s) will be added.`, 'error', 3000);
      }

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = e => {
          this.editIncidentFiles.push({
            file: file,
            preview: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeEditFile(index: number) {
    this.editIncidentFiles.splice(index, 1);
  }

  updateIncident() {
    if (!this.selectedIncident) return;
    
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    const fieldsToUpdate = [
      'incident_date', 'shift_id', 'incident_type_id', 'severity',
      'location_id', 'person_involved_id', 'incident_description',
      'action_taken', 'preventive_measures', 'equipment_id', 'equipment_name_id'
    ];

    fieldsToUpdate.forEach(key => {
      let value = this.selectedIncident![key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'incident_date' && value) {
          if (value.includes('T')) {
            value = value.replace('T', ' ');
            if (value.length === 16) {
              value += ':00';
            }
          }
        }
        formData.append(key, value);
      }
    });

    if (this.editIncidentFiles && this.editIncidentFiles.length > 0) {
      this.editIncidentFiles.forEach(item => {
        formData.append('media[]', item.file);
      });
    }

    this.safetyService.updateIncident(this.selectedIncident.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 201)) {
          this.notificationService.show(res.message || 'Incident updated successfully!', 'success', 3000);
          this.isEditMode = false;
          this.viewDetails(this.selectedIncident);
          this.loadIncidents();
        } else {
          this.notificationService.show(res.message || 'Failed to update incident', 'error', 3000);
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'An error occurred while updating the incident.';
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }

  openModal() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);

    this.newIncidentForm = {
      incident_date: localISOTime,
      shift_id: null,
      incident_type_id: null,
      severity: null,
      location_id: null,
      person_involved_id: null,
      incident_description: '',
      action_taken: '',
      preventive_measures: '',
      equipment_id: null,
      equipment_name_id: null,
      shift_name: ''
    };
    this.newIncidentFiles = [];
    this.isModalOpen = true;
    this.onDateChange();
  }

  closeModal() {
    this.isModalOpen = false;
  }

  get isFormValid(): boolean {
    return !!(
      this.newIncidentForm.incident_date &&
      this.newIncidentForm.shift_id &&
      this.newIncidentForm.incident_type_id &&
      this.newIncidentForm.severity &&
      this.newIncidentForm.location_id &&
      this.newIncidentForm.incident_description &&
      this.newIncidentForm.incident_description.trim() !== '' &&
      this.newIncidentForm.action_taken &&
      this.newIncidentForm.action_taken.trim() !== ''
    );
  }

  saveIncident() {
    if (!this.isFormValid) {
      this.notificationService.show('Please fill all mandatory fields before saving.', 'error');
      return;
    }

    const formData = new FormData();
    
    // Append text fields
    Object.keys(this.newIncidentForm).forEach(key => {
      if (this.newIncidentForm[key] !== null && this.newIncidentForm[key] !== '') {
        let value = this.newIncidentForm[key];
        
        // Format date to YYYY-MM-DD HH:mm:ss for backend
        if (key === 'incident_date' && value) {
          if (value.includes('T')) {
            value = value.replace('T', ' ');
            if (value.length === 16) {
              value += ':00';
            }
          }
        }
        
        formData.append(key, value);
      }
    });

    // Append files
    if (this.newIncidentFiles && this.newIncidentFiles.length > 0) {
      this.newIncidentFiles.forEach(item => {
        formData.append('media[]', item.file);
      });
    }

    this.safetyService.addIncident(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === 201)) {
          this.notificationService.show(res.message || 'Incident logged successfully!', 'success', 3000);
          this.closeModal();
          this.p = 1;
          this.loadIncidents();
        } else {
          this.notificationService.show(res.message || 'Failed to log incident', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Error saving incident', err);
        const errorMsg = err?.error?.message || err?.message || 'An error occurred while saving the incident.';
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }

  viewDetails(incident: any) {
    this.safetyService.getIncidentById(incident.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.selectedIncident = res.data;
          this.isEditMode = false;
          this.isDetailsPanelOpen = true;
        } else {
          this.notificationService.show(res?.message || 'Failed to fetch incident details.', 'error');
        }
      },
      error: (err: any) => {
        console.error('Error fetching incident details', err);
        this.notificationService.show('Error fetching incident details.', 'error');
      }
    });
  }

  newIncidentFiles: { file: File, preview: string | ArrayBuffer | null }[] = [];

  onNewIncidentFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: FileList | null = input.files;
    if (files && files.length > 0) {
      const remainingSlots = 3 - this.newIncidentFiles.length;
      if (remainingSlots <= 0) {
        this.notificationService.show('You can only upload a maximum of 3 files.', 'error', 3000);
        (event.target as HTMLInputElement).value = '';
        return;
      }
      
      const filesToProcess = Math.min(files.length, remainingSlots);
      if (files.length > remainingSlots) {
        this.notificationService.show(`You can only upload a maximum of 3 files. Only the first ${remainingSlots} file(s) will be added.`, 'error', 3000);
      }

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = e => {
          this.newIncidentFiles.push({
            file: file,
            preview: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
    }
    (event.target as HTMLInputElement).value = ''; // Reset input to allow selecting same files again
  }

  removeNewIncidentFile(index: number) {
    this.newIncidentFiles.splice(index, 1);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.editIncidentFiles = [];
    }
  }

  closeDetailsPanel() {
    this.isDetailsPanelOpen = false;
    setTimeout(() => {
      this.selectedIncident = null;
    }, 300);
  }

  openImportModal() {
    this.importResult = null;
    this.isImportModalOpen = true;
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.isImporting = true;
    this.importResult = null;
    this.safetyService.importIncidents(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isImporting = false;
        if (res && (res.status === 200 || res.status === 201 || res.status === 'success') && (!res.errors || res.errors.length === 0)) {
          this.importResult = null;
          this.notificationService.show(res.message || 'Incidents imported successfully!', 'success', 3000);
          this.closeImportModal();
          this.loadIncidents();
        } else {
          this.importResult = {
            status: res.status || 422,
            message: res.message || 'Import process completed with errors.',
            errors: res.errors || []
          };
        }
        (event.target as HTMLInputElement).value = '';
      },
      error: (err: any) => {
        this.isImporting = false;
        const errObj = err.originalError || err.error || err;
        let formattedErrors: string[] = [];

        if (errObj.errors) {
          if (Array.isArray(errObj.errors)) {
            formattedErrors = errObj.errors.map((e: any) => {
              if (typeof e === 'object' && e !== null) {
                 const col = e.column ? ` [${e.column}]` : '';
                 const msg = Array.isArray(e.errors) ? e.errors.join(', ') : (e.message || 'Unknown error');
                 return `Row ${e.row || 'N/A'}${col}: ${msg}`;
              }
              return String(e);
            });
          } else if (typeof errObj.errors === 'object') {
             Object.values(errObj.errors).forEach((errArray: any) => {
                if (Array.isArray(errArray)) {
                  formattedErrors.push(...errArray);
                } else if (typeof errArray === 'string') {
                  formattedErrors.push(errArray);
                }
             });
          }
        }

        this.importResult = {
          status: err.status || errObj.status || 422,
          message: errObj.message || err.message || 'Failed to import.',
          errors: formattedErrors.length > 0 ? formattedErrors : (errObj.errors || [])
        };
        (event.target as HTMLInputElement).value = '';
      }
    });
  }

  closeImportModal() {
    this.isImportModalOpen = false;
    this.importResult = null;
    this.loadIncidents();
  }
}
