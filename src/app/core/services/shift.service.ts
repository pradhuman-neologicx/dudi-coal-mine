import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  createShift(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift`, requestbody, headers);
  }

  getShifts(tableSize: any, page: any, search: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = '';
    if (tableSize !== 'all') {
      url = `v1/admin/shift?limit=${tableSize}&page=${page}`;
    } else {
      url = `v1/admin/shift`;
    }

    if (search && search.length > 0) {
      url += (url.includes('?') ? '&' : '?') + `search=${search}`;
    }

    return this.apiservice.get(url, headers);
  }

  getShiftById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get(`v1/admin/shift/${id}`, headers);
  }

  updateShift(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift/${id}`, body, headers);
  }

  updateShiftStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift/${id}/status`, body, headers);
  }
}
