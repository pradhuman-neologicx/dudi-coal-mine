import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceRecordService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getServiceRecords(limit: any = 10, page: any = 1, search?: string, filters?: any): Observable<any> {
    let params = new HttpParams();
    if (limit !== 'all') {
      params = params.set('limit', limit.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.apiService.get('v1/admin/service-records', this.getHeaders(), params);
  }

  getServiceRecordById(id: any): Observable<any> {
    return this.apiService.get(`v1/admin/service-records/${id}`, this.getHeaders());
  }

  createServiceRecord(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/service-records', formData, this.getHeaders());
  }

  updateServiceRecord(id: any, formData: FormData): Observable<any> {
    return this.apiService.post(`v1/admin/service-records/${id}`, formData, this.getHeaders());
  }

  deleteServiceRecord(id: any): Observable<any> {
    return this.apiService.delete(`v1/admin/service-records/${id}`);
  }
}
