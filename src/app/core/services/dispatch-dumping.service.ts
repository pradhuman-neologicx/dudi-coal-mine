import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DispatchDumpingService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  logTrip(requestbody: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/dispatch/trips`, requestbody, headers);
  }

  updateTrip(id: any, requestbody: any): Observable<any> {
    const headers = this.getHeaders();
    requestbody._method = 'PUT';
    return this.apiservice.post(`v1/dispatch/trips/${id}`, requestbody, headers);
  }

  getTrips(tableSize: any, page: any, search: any, filters?: any): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (tableSize !== 'all') {
      params = params.set('limit', tableSize.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.length > 0) {
      params = params.set('search', search);
    }
    if (filters) {
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.shift_id) params = params.set('shift_id', filters.shift_id);
    }
    return this.apiservice.get(`v1/dispatch/trips`, headers, params);
  }

  getDumperSummary(): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.get(`v1/dispatch/trips/summary`, headers);
  }

  getTripById(id: string): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.get(`v1/dispatch/trips/${id}`, headers);
  }

  getDrivers(): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.get(`v1/employees?role=driver`, headers);
  }

  importTrips(formData: FormData): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/dispatch/trips/import`, formData, headers);
  }
}
