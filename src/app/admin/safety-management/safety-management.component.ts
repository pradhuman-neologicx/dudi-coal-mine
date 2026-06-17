import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';

@Component({
  selector: 'app-safety-management',
  templateUrl: './safety-management.component.html',
  styleUrls: ['./safety-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule]
})
export class SafetyManagementComponent {
  
  isModalOpen = false;
  isDetailsPanelOpen = false;
  isFilterOpen = false;
  selectedIncident: any = null;

  selectedSeverity = '';
  selectedType = '';

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters() {
    this.selectedSeverity = '';
    this.selectedType = '';
  }

  get filteredIncidents() {
    return this.incidents.filter(inc => {
      const matchSeverity = this.selectedSeverity ? inc.severity === this.selectedSeverity : true;
      const matchType = this.selectedType ? inc.type.includes(this.selectedType) : true;
      return matchSeverity && matchType;
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
    this.isDetailsPanelOpen = true;
  }

  closeDetailsPanel() {
    this.isDetailsPanelOpen = false;
    setTimeout(() => {
      this.selectedIncident = null;
    }, 300);
  }
}
