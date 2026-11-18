import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DesignationService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  getDesignations(tableSize: any, page: any, search: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let params = new HttpParams();
    if (tableSize !== 'all') {
      params = params.set('limit', tableSize.toString());
      params = params.set('page', page.toString());
    }

    if (search && search.length > 0) {
      params = params.set('search', search);
    }

    return this.apiservice.get(`v1/admin/designation`, headers, params).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = response.data.map((item: any) => ({
            ...item,
            is_active: item.status !== undefined ? item.status : item.is_active
          }));
        }
        return response;
      })
    );
  }

  getDesignationById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/admin/designation/${id}`, headers).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = {
            ...response.data,
            is_active: response.data.status !== undefined ? response.data.status : response.data.is_active
          };
        }
        return response;
      })
    );
  }

  updateDesignationStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.post(`v1/admin/designation/${id}/status`, body, headers);
  }

  getDesignationPublic(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/designations`, headers);
  }
}
