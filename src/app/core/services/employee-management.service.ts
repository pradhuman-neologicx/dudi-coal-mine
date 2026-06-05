import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class EmployeeManagementService {
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  createEmployee(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.apiservice.post(`v1/admin/employees`, requestbody, headers);
  }

  updateEmployee(id: any, requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.apiservice.post(`v1/admin/employees/${id}`, requestbody, headers);
  }

  getEmployees(tableSize: any, page: any, search?: string, departmentId?: any, siteId?: any, designationId?: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = '';
    if (tableSize !== 'all') {
      url = `v1/admin/employees?limit=${tableSize}&page=${page}`;
    } else {
      url = `v1/admin/employees`;
    }

    if (search && search.length > 0) {
      url += (url.includes('?') ? '&' : '?') + `search=${search}`;
    }
    if (departmentId) {
      url += (url.includes('?') ? '&' : '?') + `department_id=${departmentId}`;
    }
    if (siteId) {
      url += (url.includes('?') ? '&' : '?') + `site_id=${siteId}`;
    }
    if (designationId) {
      url += (url.includes('?') ? '&' : '?') + `designation_id=${designationId}`;
    }

    return this.apiservice.get(url, headers);
  }

  getEmployeeById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get(`v1/admin/employees/${id}`, headers);
  }

  updateEmployeeStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.apiservice.post(`v1/admin/employees/${id}/status`, body, headers);
  }

  bulkUploadEmployees(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.apiservice.post(`v1/admin/employees/bulk-upload`, requestbody, headers);
  }
}
