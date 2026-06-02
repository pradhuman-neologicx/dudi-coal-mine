import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  createDepartment(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/departments`, requestbody, headers);
  }

  getDepartments(tableSize: any, page: any, search: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = '';
    if (tableSize !== 'all') {
      url = `v1/admin/departments?limit=${tableSize}&page=${page}`;
    } else {
      url = `v1/admin/departments`;
    }

    if (search && search.length > 0) {
      url += (url.includes('?') ? '&' : '?') + `search=${search}`;
    }

    return this.apiservice.get(url, headers);
  }

  getDepartmentById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get(`v1/admin/departments/${id}`, headers);
  }

  updateDepartment(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/departments/${id}`, body, headers);
  }

  updateDepartmentStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/departments/${id}/status`, body, headers);
  }

  deleteDepartment(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.apiservice.deleteFun(`v1/admin/departments/${id}`, { headers });
  }
}
