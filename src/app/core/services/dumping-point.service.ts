import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DumpingPointService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createDumpingPoint(requestbody: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/site-points`, requestbody, headers);
  }

  getDumpingPoints(tableSize: any, page: any, search: any): Observable<any> {
    const headers = this.getHeaders();

    let params = new HttpParams();
    if (tableSize !== 'all') {
      params = params.set('limit', tableSize.toString());
      params = params.set('page', page.toString());
    }

    if (search && search.length > 0) {
      params = params.set('search', search);
    }

    return this.apiservice.get(`v1/admin/site-points`, headers, params);
  }

  getDumpingPointById(id: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.get(`v1/admin/site-points/${id}`, headers);
  }

  updateDumpingPoint(id: any, body: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/site-points/${id}`, body, headers);
  }

  updateDumpingPointStatus(id: any, body: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/site-points/${id}/status`, body, headers);
  }

  // public apis

  getShifts(): Observable<any> {
    return this.apiservice.get('v1/shifts', this.getHeaders());
  }

  getSites(): Observable<any> {
    return this.apiservice.get('v1/sites', this.getHeaders());
  }

  getSitePointsBySiteId(siteId: any): Observable<any> {
    return this.apiservice.get(`v1/site-points?site_id=${siteId}`, this.getHeaders());
  }
}
