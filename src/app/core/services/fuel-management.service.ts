import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class FuelManagementService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  getFuelEntries(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let params = new HttpParams();
    if (filters) {
      if (filters.range) params = params.set('range', filters.range);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.equipment_id) params = params.set('equipment_id', filters.equipment_id);
      if (filters.shift_id) params = params.set('shift_id', filters.shift_id);
      if (filters.page) params = params.set('page', filters.page);
      if (filters.limit) params = params.set('limit', filters.limit);
    }

    return this.apiservice.get(`v1/admin/fuel-entries`, headers, params);
  }

  getShifts(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/shifts`, headers);
  }

  getMachineCategories(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/machine-categories`, headers);
  }

  getFuelEntryById(id: number | string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/admin/fuel-entries/${id}`, headers);
  }

  createFuelEntry(data: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.post(`v1/admin/fuel-entries/`, data, headers);
  }

  updateFuelEntry(id: number | string, data: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.post(`v1/admin/fuel-entries/${id}`, data, headers);
  }

  importFuelEntries(file: File): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.apiservice.post(`v1/admin/fuel-entries/import`, formData, headers);
  }
}
