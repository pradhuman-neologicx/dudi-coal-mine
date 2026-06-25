import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class SafetyService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getShifts(): Observable<any> {
    return this.apiService.get('v1/shifts', this.getHeaders());
  }

  getSites(): Observable<any> {
    return this.apiService.get('v1/sites', this.getHeaders());
  }

  getPublicIncidentTypes(): Observable<any> {
    return this.apiService.get('v1/incident-types', this.getHeaders());
  }

  getEmployees(): Observable<any> {
    return this.apiService.get('v1/employees', this.getHeaders());
  }

  getIncidents(params: HttpParams): Observable<any> {
    return this.apiService.get('v1/admin/incidents', this.getHeaders(), params);
  }

  getIncidentById(id: string | number): Observable<any> {
    return this.apiService.get(`v1/admin/incidents/${id}`, this.getHeaders());
  }

  addIncident(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/incidents', formData, this.getHeaders());
  }

  updateIncident(id: string | number, formData: FormData): Observable<any> {
    return this.apiService.post(`v1/admin/incidents/${id}`, formData, this.getHeaders());
  }

  closeIncident(id: string | number, formData: FormData): Observable<any> {
    return this.apiService.post(`v1/admin/incidents/${id}`, formData, this.getHeaders());
  }

  getMachineCategories(): Observable<any> {
    return this.apiService.get('v1/machine-categories', this.getHeaders());
  }

  getMachineNames(categoryId: string | number): Observable<any> {
    return this.apiService.get(`v1/machine-names/${categoryId}`, this.getHeaders());
  }

}
