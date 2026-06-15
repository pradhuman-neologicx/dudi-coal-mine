import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class LeaveManagementService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  applyLeave(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/leaves`, formData, this.getHeaders());
  }

  getLeaves(limit: any, page: any, search: string, filters?: { employee_id?: string, status?: string, month_year?: string }): Observable<any> {
    let params = new HttpParams();
    if (limit !== 'all') {
      params = params.set('limit', limit.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.length > 0) {
      params = params.set('search', search);
    }
    if (filters?.employee_id) {
      params = params.set('employee_id', filters.employee_id);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.month_year) {
      params = params.set('month_year', filters.month_year);
    }
    
    // Yahan URL build hota hai, e.g., /v1/admin/leaves?search=...&status=pending&month_year=2026-06
    return this.apiservice.get(`v1/admin/leaves`, this.getHeaders(), params);
  }

  updateLeaveStatus(leaveId: string | number, status: string): Observable<any> {
    const payload = { status: status };
    return this.apiservice.post(`v1/admin/leaves/${leaveId}/approve-reject`, payload, this.getHeaders());
  }

  getEmployees(): Observable<any> {
    return this.apiservice.get(`v1/admin/employees`, this.getHeaders());
  }

  getActiveEmployees(): Observable<any> {
    return this.apiservice.get(`v1/active-employees`, this.getHeaders());
  }

  uploadBulkLeaves(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/leaves/bulk-upload`, formData, this.getHeaders());
  }
}
