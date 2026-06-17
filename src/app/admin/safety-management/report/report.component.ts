import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule]
})
export class ReportComponent {

  fromDate = '';
  toDate = '';
  selectedShift = '';
  selectedLocation = '';

  isReportGenerated = false;

  allIncidents = [
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

  filteredIncidents: any[] = [];

  generateReport() {
    this.isReportGenerated = true;
    
    // Simple filter logic
    this.filteredIncidents = this.allIncidents.filter(inc => {
      let matchShift = this.selectedShift ? inc.shift.includes(this.selectedShift) : true;
      let matchLocation = this.selectedLocation ? inc.location.includes(this.selectedLocation) : true;
      let matchDate = true;
      
      if (this.fromDate && this.toDate) {
        let incDate = new Date(inc.date);
        let start = new Date(this.fromDate);
        let end = new Date(this.toDate);
        matchDate = incDate >= start && incDate <= end;
      }
      
      return matchShift && matchLocation && matchDate;
    });
  }

}
