import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-safety-management',
  templateUrl: './safety-management.component.html',
  styleUrls: ['./safety-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule, NgxPaginationModule, NgSelectModule]
})
export class SafetyManagementComponent {
  
  isModalOpen = false;
  isDetailsPanelOpen = false;
  isFilterOpen = false;
  p: number = 1;
  selectedIncident: any = null;
  isEditMode = false;
  
  mockEmployees = [
    { id: 1, name: 'John Doe (Operator)' },
    { id: 2, name: 'Sarah Smith (Supervisor)' },
    { id: 3, name: 'David Chen (Foreman)' },
    { id: 4, name: 'Marcus Johnson (Technician)' }
  ];

  mockLocations = [
    { id: 1, name: 'Block-04 West / Bench-120' },
    { id: 2, name: 'Block-02 North / Bench-140' },
    { id: 3, name: 'Block-05 East / Bench-105' },
    { id: 4, name: 'Haul Road 3A' },
    { id: 5, name: 'Crusher Plant' },
    { id: 6, name: 'Workshop' }
  ];

  mockShifts = [
    { id: 'A', name: 'Shift A' },
    { id: 'B', name: 'Shift B' },
    { id: 'C', name: 'Shift C' }
  ];

  mockIncidentTypes = [
    { id: 'Near Miss', name: 'Near Miss' },
    { id: 'Property Damage', name: 'Property Damage' },
    { id: 'Injury', name: 'Injury' }
  ];

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

  clearFilters() {
    this.selectedType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterShift = '';
    this.filterLocation = '';
  }

  get filteredIncidents() {
    return this.incidents.filter(inc => {
      const matchType = this.selectedType ? inc.type.includes(this.selectedType) : true;
      const matchShift = this.filterShift ? inc.shift === this.filterShift : true;
      const matchLocation = this.filterLocation ? inc.location.includes(this.filterLocation) : true;
      
      let matchDate = true;
      if (this.filterDateFrom && this.filterDateTo) {
        matchDate = inc.date >= this.filterDateFrom && inc.date <= this.filterDateTo;
      } else if (this.filterDateFrom) {
        matchDate = inc.date >= this.filterDateFrom;
      } else if (this.filterDateTo) {
        matchDate = inc.date <= this.filterDateTo;
      }
      
      return matchType && matchShift && matchLocation && matchDate;
    });
  }

  closeCase() {
    if (this.selectedIncident) {
      this.selectedIncident.status = 'Investigation Closed';
      alert('Case status updated to "Investigation Closed"');
      this.closeDetailsPanel();
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
    if (event.target.files && event.target.files.length > 0) {
      alert(event.target.files.length + " file(s) selected for upload.");
    }
  }

  incidents = [
    {
      id: 'INC-2024-086',
      date: '2024-05-12',
      shift: 'B (Night)',
      type: 'Near Miss',
      severity: 'LOW',
      location: 'Crushing Plant - Conveyor 3',
      status: 'Under Review',
      reporter: 'John Doe (Operator)'
    },
    {
      id: 'INC-2024-085',
      date: '2024-05-10',
      shift: 'A (Day)',
      type: 'Property Damage',
      severity: 'MEDIUM',
      location: 'East Pit - Bench 420',
      status: 'Action Required',
      reporter: 'Sarah Smith (Supervisor)'
    },
    {
      id: 'INC-2024-084',
      date: '2024-05-08',
      shift: 'C (Swing)',
      type: 'Injury (First Aid)',
      severity: 'HIGH',
      location: 'Maintenance Workshop',
      status: 'Investigation Closed',
      reporter: 'David Chen (Foreman)'
    }
  ];

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  viewDetails(incident: any) {
    this.selectedIncident = incident;
    this.isEditMode = false;
    this.isDetailsPanelOpen = true;
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  closeDetailsPanel() {
    this.isDetailsPanelOpen = false;
    setTimeout(() => {
      this.selectedIncident = null;
    }, 300);
  }
}
