import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createRelay(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/relays`, requestbody, this.getHeaders());
  }

  getRelays(page: number, limit: any, search?: string): Observable<any> {
    let params = new HttpParams();
    
    if (limit !== 'all') {
      params = params.set('limit', String(limit)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.apiservice.get(`v1/admin/relays`, this.getHeaders(), params);
  }

  updateRelayStatus(id: any): Observable<any> {
    return this.apiservice.patch(`v1/admin/relays/${id}/status`, {}, this.getHeaders());
  }

  updateRelay(id: any, requestbody: any): Observable<any> {
    return this.apiservice.put(`v1/admin/relays/${id}`, requestbody, this.getHeaders());
  }

  getRelayById(id: any): Observable<any> {
    return this.apiservice.get(`v1/admin/relays/${id}`, this.getHeaders());
  }

  getAllRelays(): Observable<any> {
    return this.apiservice.get(`v1/relays`, this.getHeaders());
  }
}
