import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-safety-management',
  templateUrl: './safety-management.component.html',
  styleUrls: ['./safety-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule, NgxPaginationModule, NgSelectModule]
})
export class SafetyManagementComponent implements OnInit {
  
  isModalOpen = false;
  isDetailsPanelOpen = false;
  isFilterOpen = false;
  p: number = 1;
  selectedIncident: any = null;
  isEditMode = false;
  
  mockEmployees: any[] = [];

  mockLocations: any[] = [];
  mockShifts: any[] = [];
  mockIncidentTypes: any[] = [];
  machineCategories: any[] = [];
  machineNames: any[] = [];

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
    equipment_name_id: null
  };

  incidents: any[] = [];
  dashboardStats: any = {};
  pagination: any = {
    current_page: 1,
    per_page: 10,
    total: 0
  };
  limit = 10;
  searchQuery = '';

  constructor(
    private safetyService: SafetyService,
    private incidentTypeService: IncidentTypeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadDropdowns();
    this.loadIncidents();
  }

  loadDropdowns() {
    this.safetyService.getShifts().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockShifts = res.data;
        }
      }
    });

    this.safetyService.getSites().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockLocations = res.data;
        }
      }
    });

    this.safetyService.getPublicIncidentTypes().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockIncidentTypes = res.data;
        }
      }
    });

    this.safetyService.getEmployees().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.mockEmployees = res.data;
        }
      }
    });

    this.safetyService.getMachineCategories().subscribe({
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
      this.safetyService.getMachineNames(categoryId).subscribe({
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

  mockSeverities = [
    { id: 'LOW', name: 'LOW' },
    { id: 'MEDIUM', name: 'MEDIUM' },
    { id: 'HIGH', name: 'HIGH' },
    { id: 'CRITICAL', name: 'CRITICAL' }
  ];

  selectedType = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterShift = '';
  filterLocation = '';

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
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
    this.selectedType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterShift = '';
    this.filterLocation = '';
    this.searchQuery = '';
    this.p = 1;
    this.loadIncidents();
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
    let params = new HttpParams()
      .set('page', this.p.toString())
      .set('limit', this.limit.toString());

    if (this.selectedType) params = params.set('incident_type_id', this.selectedType);
    if (this.filterShift) params = params.set('shift_id', this.filterShift);
    if (this.filterLocation) params = params.set('location_id', this.filterLocation);
    if (this.searchQuery && this.searchQuery.trim() !== '') params = params.set('search', this.searchQuery.trim());
    if (this.filterDateFrom) params = params.set('date_from', this.formatDate(this.filterDateFrom));
    if (this.filterDateTo) params = params.set('date_to', this.formatDate(this.filterDateTo));

    this.safetyService.getIncidents(params).subscribe({
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
      
      this.safetyService.closeIncident(this.selectedIncident.id, formData).subscribe({
        next: (res: any) => {
          if (res && (res.status === 200 || res.status === 201)) {
            this.selectedIncident.status = 'Investigation Closed';
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

  onEditFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const existingMediaCount = this.selectedIncident?.media ? this.selectedIncident.media.length : 0;
      const currentNewFilesCount = this.editIncidentFiles.length;
      const remainingSlots = 3 - (existingMediaCount + currentNewFilesCount);

      if (remainingSlots <= 0) {
        this.notificationService.show('You can only have a maximum of 3 files.', 'error', 3000);
        event.target.value = '';
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
    event.target.value = '';
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
      let value = this.selectedIncident[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'incident_date' && value && value.includes('-')) {
          const parts = value.split('-');
          if (parts.length === 3) {
            value = `${parts[2]}/${parts[1]}/${parts[0]}`;
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

    this.safetyService.updateIncident(this.selectedIncident.id, formData).subscribe({
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
    this.newIncidentForm = {
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
      equipment_name_id: null
    };
    this.newIncidentFiles = [];
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveIncident() {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(this.newIncidentForm).forEach(key => {
      if (this.newIncidentForm[key] !== null && this.newIncidentForm[key] !== '') {
        let value = this.newIncidentForm[key];
        
        // Format date to DD/MM/YYYY
        if (key === 'incident_date' && value) {
          const parts = value.split('-');
          if (parts.length === 3) {
            value = `${parts[2]}/${parts[1]}/${parts[0]}`;
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

    this.safetyService.addIncident(formData).subscribe({
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
    this.safetyService.getIncidentById(incident.id).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.selectedIncident = res.data;
          this.isEditMode = false;
          this.isDetailsPanelOpen = true;
        }
      },
      error: (err: any) => {
        console.error('Error fetching incident details', err);
      }
    });
  }

  newIncidentFiles: { file: File, preview: string | ArrayBuffer | null }[] = [];

  onNewIncidentFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 3 - this.newIncidentFiles.length;
      if (remainingSlots <= 0) {
        this.notificationService.show('You can only upload a maximum of 3 files.', 'error', 3000);
        event.target.value = '';
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
    event.target.value = ''; // Reset input to allow selecting same files again
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
}
