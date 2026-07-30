import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DelayTypeService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createDelayType(requestbody: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/delay-categories`, requestbody, headers);
  }

  getDelayTypes(tableSize: any, page: any, search: any): Observable<any> {
    const headers = this.getHeaders();

    let params = new HttpParams();
    if (tableSize !== 'all') {
      params = params.set('limit', tableSize.toString());
      params = params.set('page', page.toString());
    }

    if (search && search.length > 0) {
      params = params.set('search', search);
    }

    return this.apiservice.get(`v1/admin/delay-categories`, headers, params);
  }

  getDelayTypeById(id: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.get(`v1/admin/delay-categories/${id}`, headers);
  }

  updateDelayType(id: any, body: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/delay-categories/${id}`, body, headers);
  }

  updateDelayTypeStatus(id: any, body: any): Observable<any> {
    const headers = this.getHeaders();
    return this.apiservice.post(`v1/admin/delay-categories/${id}/status`, body, headers);
  }
}
