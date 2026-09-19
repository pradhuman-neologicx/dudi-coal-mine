import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  getFleetSummary(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.apiservice.get(`v1/dashboard/fleet/summary`, headers, params).pipe(
      map((res: any) => {
        if (res && res.data) {
          const apiTime = res.data?.last_refreshed_at || res.data?.generated_at || 
                          res.last_updated_at || res.timestamp || res.created_at || 
                          res.data?.last_updated_at || res.data?.timestamp || res.data?.created_at || res.data?.updated_at;
          
          if (apiTime) {
            const parsedStr = String(apiTime).replace(' ', 'T');
            const parsedDate = new Date(parsedStr);
            res.parsedSyncTime = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
          } else {
            res.parsedSyncTime = new Date();
          }
        }
        return res;
      })
    );
  }

  getFleetVehicles(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    let params = new HttpParams();
    if (filters) {
      if (filters.range) params = params.set('range', filters.range);
      if (filters.from) params = params.set('from', filters.from);
      if (filters.to) params = params.set('to', filters.to);
      if (filters.machine_id) params = params.set('machine_id', filters.machine_id);
      if (filters.connectivity) params = params.set('connectivity', filters.connectivity);
      if (filters.operational_status) params = params.set('operational_status', filters.operational_status);
      if (filters.fuel_status) params = params.set('fuel_status', filters.fuel_status);
      if (filters.source) params = params.set('source', filters.source);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.limit) params = params.set('limit', filters.limit);
      if (filters.page) params = params.set('page', filters.page);
    }
    
    return this.apiservice.get(`v1/dashboard/fleet/vehicles`, headers, params);
  }

  getFleetFuel(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    
    return this.apiservice.get(`v1/dashboard/fleet/fuel`, headers, params);
  }

  getFleetOperations(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    
    return this.apiservice.get(`v1/dashboard/fleet/operations`, headers, params);
  }

  getFleetAlerts(filters?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    
    return this.apiservice.get(`v1/dashboard/fleet/alerts`, headers, params);
  }

  triggerFleetRefresh(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.post(`v1/dashboard/fleet/refresh`, {}, headers);
  }

  getFleetRefreshStatus(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ 
      Authorization: `Bearer ${token}`,
      'X-Skip-Loader': 'true'
    });
    return this.apiservice.get(`v1/dashboard/fleet/refresh-status`, headers);
  }

  getActiveMachines(search?: string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let params = new HttpParams().set('has_telematics', '1');
    if (search) {
      params = params.set('search', search);
    }
    return this.apiservice.get(`v1/active-machines`, headers, params);
  }
}
