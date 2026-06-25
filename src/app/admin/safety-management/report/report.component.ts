import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPrintModule } from 'ngx-print';
import { SafetyService } from '../../../core/services/safety.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPrintModule]
})
export class ReportComponent implements OnInit {

  fromDate = '';
  toDate = '';
  selectedShift = '';
  selectedLocation = '';
  selectedType = '';

  isReportGenerated = false;
  filteredIncidents: any[] = [];

  mockShifts: any[] = [];
  mockLocations: any[] = [];
  mockIncidentTypes: any[] = [];

  constructor(private safetyService: SafetyService) { }

  ngOnInit() {
    this.safetyService.getShifts().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) this.mockShifts = res.data;
      }
    });

    this.safetyService.getSites().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) this.mockLocations = res.data;
      }
    });

    this.safetyService.getPublicIncidentTypes().subscribe({
      next: (res: any) => {
        if (res && res.status === 200) this.mockIncidentTypes = res.data;
      }
    });
  }

  formatDate(date: string) {
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  }

  resetFilters() {
    this.fromDate = '';
    this.toDate = '';
    this.selectedShift = '';
    this.selectedLocation = '';
    this.selectedType = '';
    this.isReportGenerated = false;
    this.filteredIncidents = [];
  }

  generateReport() {
    this.isReportGenerated = true;
    //  let params = new HttpParams()
    //   .set('page', '1')
    //   .set('limit', '1000'); 
    let params = new HttpParams();

    if (this.selectedShift) params = params.set('shift_id', this.selectedShift);
    if (this.selectedLocation) params = params.set('location_id', this.selectedLocation);
    if (this.selectedType) params = params.set('incident_type_id', this.selectedType);
    if (this.fromDate) params = params.set('date_from', this.formatDate(this.fromDate));
    if (this.toDate) params = params.set('date_to', this.formatDate(this.toDate));

    this.safetyService.getIncidents(params).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.filteredIncidents = (res.data || []).map((inc: any) => ({
            date: inc.incident_date,
            shift: inc.shift_name,
            type: inc.incident_type,
            severity: inc.severity,
            location: inc.location_name,
            reporter: inc.person_involved_name || inc.employee_name || 'N/A'
          }));
        }
      },
      error: (err: any) => {
        console.error('Error fetching report data', err);
      }
    });
  }

}
