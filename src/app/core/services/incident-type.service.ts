import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class IncidentTypeService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getIncidentTypes(limit: any, page: any, search?: string): Observable<any> {
    let params = new HttpParams();
    if (limit !== 'all') {
      params = params.set('limit', limit.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiService.get('v1/admin/incident-types', this.getHeaders(), params);
  }

  createIncidentType(body: any): Observable<any> {
    return this.apiService.post('v1/admin/incident-types', body, this.getHeaders());
  }

  updateIncidentType(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/incident-types/${id}`, body, this.getHeaders());
  }

  updateIncidentTypeStatus(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/incident-types/${id}/status`, body, this.getHeaders());
  }
}
