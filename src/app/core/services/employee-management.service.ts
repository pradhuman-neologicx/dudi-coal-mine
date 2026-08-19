import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeManagementService {
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createEmployee(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employees`, requestbody, this.getHeaders());
  }

  updateEmployee(id: any, requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employees/${id}`, requestbody, this.getHeaders());
  }

  getEmployees(tableSize: any, page: any, search?: string, departmentId?: any, siteId?: any, designationId?: any): Observable<any> {
    let params = new HttpParams();

    if (tableSize !== 'all') {
      params = params.set('limit', String(tableSize)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (departmentId) {
      params = params.set('department_id', String(departmentId));
    }
    if (siteId) {
      params = params.set('site_id', String(siteId));
    }
    if (designationId) {
      params = params.set('designation_id', String(designationId));
    }

    return this.apiservice.get(`v1/admin/employees`, this.getHeaders(), params);
  }

  getEmployeePayrolls(tableSize: any, page: any, search?: string, departmentId?: any, employeeId?: any): Observable<any> {
    let params = new HttpParams();

    if (tableSize !== 'all') {
      params = params.set('limit', String(tableSize)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (departmentId) {
      params = params.set('department_id', String(departmentId));
    }
    if (employeeId) {
      params = params.set('employee_id', String(employeeId));
    }

    return this.apiservice.get(`v1/admin/employees/details`, this.getHeaders(), params);
  }

  getEmployeePayrollsList(tableSize: any, page: any, search?: string, departmentId?: any, employeeId?: any): Observable<any> {
    let params = new HttpParams();

    if (tableSize !== 'all') {
      params = params.set('limit', String(tableSize)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (departmentId) {
      params = params.set('department_id', String(departmentId));
    }
    if (employeeId) {
      params = params.set('employee_id', String(employeeId));
    }

    return this.apiservice.get(`v1/admin/employee-payrolls`, this.getHeaders(), params);
  }

  getAllEmployees(departmentId?: any): Observable<any> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('department_id', String(departmentId));
    }
    return this.apiservice.get(`v1/employees`, this.getHeaders(), params);
  }

  getActiveEmployees(): Observable<any> {
    return this.apiservice.get(`v1/active-employees`, this.getHeaders());
  }

  getEmployeeById(id: any): Observable<any> {
    return this.apiservice.get(`v1/admin/employees/${id}`, this.getHeaders());
  }

  getEmployeeWageByEmployeeId(employeeId: any, silent: boolean = false): Observable<any> {
    if (silent) {
      return this.http.get(`${environment.api_url}v1/admin/employee-wages/employee/${employeeId}`, { headers: this.getHeaders() });
    }
    return this.apiservice.get(`v1/admin/employee-wages/employee/${employeeId}`, this.getHeaders());
  }

  getEmployeePayrollById(id: any): Observable<any> {
    return this.apiservice.get(`v1/admin/employee-payrolls/${id}`, this.getHeaders());
  }

  updateEmployeeStatus(id: any, body: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employees/${id}/status`, body, this.getHeaders());
  }

  bulkUploadEmployees(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employees/bulk-upload`, requestbody, this.getHeaders());
  }

  createEmployeePayroll(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employee-payrolls`, requestbody, this.getHeaders());
  }

  updateEmployeePayroll(id: any, requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/employee-payrolls/${id}`, requestbody, this.getHeaders());
  }

  getPayroll(month?: any, year?: any, limit?: any, page?: any, search?: string, departmentId?: any, siteId?: any): Observable<any> {
    let params = new HttpParams();
    if (month) params = params.set('month', String(month));
    if (year) params = params.set('year', String(year));
    if (limit && limit !== 'all') {
      params = params.set('limit', String(limit)).set('page', String(page));
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (departmentId) {
      params = params.set('department_id', String(departmentId));
    }
    if (siteId) {
      params = params.set('site_id', String(siteId));
    }

    return this.apiservice.get(`v1/admin/payroll`, this.getHeaders(), params);
  }

  addPenalty(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/penalties`, requestbody, this.getHeaders());
  }

  previewPenaltySchedule(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/penalties/preview-schedule`, requestbody, this.getHeaders());
  }

  uploadBulkPenalties(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/penalties/bulk-upload`, formData, this.getHeaders());
  }

  uploadBulkRecoveries(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/recoveries/bulk-upload`, formData, this.getHeaders());
  }

  getRecoveryUploads(year?: any, page?: any, limit?: any, search?: string): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', String(year));
    if (limit && limit !== 'all') {
      params = params.set('limit', String(limit)).set('page', String(page || 1));
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiservice.get(`v1/admin/recoveries`, this.getHeaders(), params);
  }

  getRecoveryRegister(year?: any, page?: any, limit?: any, search?: string): Observable<any> {
    return this.getRecoveryUploads(year, page, limit, search);
  }

  getRecoveryUploadsLog(year?: any, page?: any, limit?: any, search?: string): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', String(year));
    if (limit && limit !== 'all') {
      params = params.set('limit', String(limit)).set('page', String(page || 1));
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiservice.get(`v1/admin/recoveries/recovery-uploads`, this.getHeaders(), params);
  }

  getRecoveryPreviewDetails(uploadId: number | string, page: number = 1, limit: number = 25): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.apiservice.get(`v1/admin/recoveries/uploads/${uploadId}/preview`, this.getHeaders(), params);
  }

  getRecoveryUploadRows(uploadId: number | string, page: number = 1, limit: number = 25, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiservice.get(`v1/admin/recoveries/uploads/${uploadId}/rows`, this.getHeaders(), params);
  }

  updateRecoveryRow(rowId: number | string, payload: any): Observable<any> {
    return this.apiservice.post(`v1/admin/recoveries/uploads/rows/${rowId}`, payload, this.getHeaders());
  }

  updateRecoveryPreviewRow(uploadId: number | string, rowId: number | string, updatedData: any): Observable<any> {
    return this.updateRecoveryRow(rowId, updatedData);
  }

  deleteRecoveryPreviewRow(uploadId: number | string, rowId: number | string): Observable<any> {
    return this.apiservice.deleteFun(`v1/admin/recoveries/preview/${uploadId}/rows/${rowId}`, { headers: this.getHeaders() });
  }

  submitRecoveryUpload(uploadId: number | string): Observable<any> {
    return this.apiservice.post(`v1/admin/recoveries/uploads/${uploadId}/submit`, {}, this.getHeaders());
  }

  getRecoveryReportDetails(reportId: number | string, page: number = 1, limit: number = 25, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiservice.get(`v1/admin/recoveries/reports/${reportId}`, this.getHeaders(), params);
  }

  getSingleRecoveryDetail(id: number | string): Observable<any> {
    return this.apiservice.get(`v1/admin/recoveries/${id}/details`, this.getHeaders());
  }

  getEmployeePenalties(employeeId: any, month: any, year: any): Observable<any> {
    let params = new HttpParams().set('month', String(month)).set('year', String(year));
    return this.apiservice.get(`v1/admin/payroll/${employeeId}/penalties`, this.getHeaders(), params);
  }

  getPayrollDetail(employeeId: any, month: any, year: any): Observable<any> {
    let params = new HttpParams().set('month', String(month)).set('year', String(year));
    return this.apiservice.get(`v1/admin/payroll/${employeeId}/detail`, this.getHeaders(), params);
  }

}
