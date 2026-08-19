import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private approvalStageMessage = new BehaviorSubject('');
  currentApprovalStageMessage = this.approvalStageMessage.asObservable();
  GetBatches: any;
  updateBatches: any;
  GetCourseType: any;

  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService,
    private router: Router,
  ) { }

  changestatus(unit_id: string, status: any): Observable<any> {
    var user = this.jwtService.getpanelUserId();
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const body = {
      unit_id: unit_id,
      status: status,
    };
    return this.apiservice.post(`change-unit-status`, body, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  GetState() {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get('states', headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getCity(state_id: any): Observable<any> {
    const token = this.jwtService.getToken(); // Get the token for authorization
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const body = {
      state_id: state_id,
    };

    // Make the POST request to the server
    return this.apiservice.post(`cities`, body, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  GetRoles(departmentId: any): Observable<any> {
    const token = this.jwtService.getToken(); // Get the token for authorization
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Make the POST request to the server
    return this.apiservice.get(`roles/` + departmentId, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  // USer management APIs start
  GetStaff(tableSize: any, page: any, search: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    var url = '';
    if (tableSize != 'all') {
      url = `users?limit=${tableSize}&page=${page}`;
      if (search != undefined) {
        if (search.length > 0) {
          url = url + '&search=' + search;
        }
      }
    } else {
      url = `users`;
      if (search != undefined) {
        if (search.length > 0) {
          url = url + '&search=' + search;
        }
      }
    }

    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }
  GetStaffByDepartment(
    tableSize: any,
    page: any,
    search: any,
    departmentId: any,
  ) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = '';

    if (tableSize !== 'all') {
      url = `users?limit=${tableSize}&page=${page}`;
    } else {
      url = `users?`;
    }

    // Add search if present
    if (search && search.length > 0) {
      url += `&search=${search}`;
    }

    // Add departmentId if present
    if (departmentId) {
      url += `&department_id=${departmentId}`;
    }

    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getStaffById(user_id: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // var url = `app-users?user_id=${user_id}`;
    const url = `users/${user_id}`;
    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  createStaff(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // 'Content-Type': 'application/json',
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    // Make the POST request to the server
    return this.apiservice.post(`users`, requestbody, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  updateStaff(body: any, userId: any): Observable<any> {
    // const user = this.jwtService.getpanelUserId();
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Only set Content-Type if body is NOT FormData
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return this.apiservice.post(`users/` + userId, body, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  uploadStaffFile(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // 'Content-Type': 'application/json',
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    // Make the POST request to the server
    return this.apiservice.post(`users-bulk-upload`, requestbody, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }
  // USer management APIs end

  // Department APIs start
  GetDepartmentAPi(tableSize: any, page: any, search: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    var url = '';
    if (tableSize != 'all') {
      url = `departments?limit=${tableSize}&page=${page}`;
      if (search != undefined) {
        if (search.length > 0) {
          url = url + '&search=' + search;
        }
      }
    } else {
      url = `departments`;
      if (search != undefined) {
        if (search.length > 0) {
          url = url + '&search=' + search;
        }
      }
    }

    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  createDepartment(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // 'Content-Type': 'application/json',
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    // Make the POST request to the server
    return this.apiservice.post(`departments`, requestbody, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }
  getDepartmentbyID(user_id: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // var url = `app-users?user_id=${user_id}`;
    const url = `departments/${user_id}`;
    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  updateDepartment(body: any, userId: any): Observable<any> {
    // const user = this.jwtService.getpanelUserId();
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Only set Content-Type if body is NOT FormData
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return this.apiservice.post(`departments/` + userId, body, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }
  // Department APIs end

  // Dashboard APIs start
  // GetDashboardData() {
  //   const token = this.jwtService.getToken();
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //   });

  //   var url = 'dashboard/summary';

  //   return this.apiservice.get(url, headers).pipe(
  //     tap((error: any) => {
  //       console.log('Response received:', error);
  //       this.erromessagefunction(error);
  //     }),
  //   );
  // }

  GetDashboardData(queryParams?: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let httpParams = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
          httpParams = httpParams.append(key, queryParams[key]);
        }
      });
    }

    var url = 'v1/dashboard/summary'; // updated to v1/dashboard/summary

    return this.apiservice.get(url, headers, httpParams).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }



  erromessagefunction(error: any) {
    console.log('Response received:', error);
    var response = error;
    var errorMessage;
    if (
      typeof response.message === 'object' &&
      response.message !== null &&
      !Array.isArray(response.message)
    ) {
      errorMessage = JSON.stringify(response.message);
    } else {
      errorMessage = response.message;
    }
    console.log(response);
    if (
      error.status === 422 &&
      error.message &&
      (errorMessage.includes('The selected user id is invalid') ||
        errorMessage.includes('Your account has been deactivated') ||
        errorMessage.includes('Your token has been expired') ||
        errorMessage.includes(
          'Your token has been expired. Please login again.',
        ))
    ) {
      // Log the user out and navigate to sign-in page
      this.jwtService.clearStorage(); // Clear token (implement this method in your JwtService)
      this.router.navigate(['/sign_in']); // Navigate to home route
      alert(errorMessage); // Show alert with error message
    } else if (error && error.message) {
      // Display error message
      // alert(errorMessage);
    }
  }

  checkSalaryGenerated(month: number, year: number) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    let httpParams = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    var url = 'v1/admin/wage-register/check';

    return this.http.get(`${environment.api_url}${url}`, {
      headers: headers,
      params: httpParams,
      observe: 'response',
      responseType: 'blob'
    });
  }

  importSalaryFile(month: number, year: number, file: File) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const formData = new FormData();
    formData.append('month', month.toString());
    formData.append('year', year.toString());
    formData.append('file', file);
    return this.apiservice.post(`v1/admin/wage-register/import`, formData, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getUpdatedPreviewData() {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const url = `v1/admin/wage-register/import`;
    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getWageRegisterReports(year?: number): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.set('year', year.toString());
    }

    const url = `v1/admin/wage-register/reports`;
    return this.apiservice.get(url, headers, httpParams).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  exportWageRegisterReports(year?: number): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.set('year', year.toString());
    }

    const url = `v1/admin/wage-register/reports/export`;
    return this.http.get(`${environment.api_url}${url}`, {
      headers: headers,
      params: httpParams,
      observe: 'response',
      responseType: 'blob'
    });
  }

  exportAttendanceRegister(month?: number, year?: number): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    let httpParams = new HttpParams();
    if (month) {
      httpParams = httpParams.set('month', month.toString());
    }
    if (year) {
      httpParams = httpParams.set('year', year.toString());
    }

    const url = `v1/admin/attendance/register/export`;
    return this.http.get(`${environment.api_url}${url}`, {
      headers: headers,
      params: httpParams,
      observe: 'response',
      responseType: 'blob'
    });
  }

  exportWageRegisterReportDetail(reportId: number | string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const url = `v1/admin/wage-register/reports/${reportId}/export`;
    return this.http.get(`${environment.api_url}${url}`, {
      headers: headers,
      observe: 'response',
      responseType: 'blob'
    });
  }

  getWageRegisterPreviewDetails(uploadId: number | string, page: number = 1, limit: number = 25): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    const url = `v1/admin/wage-register/import/${uploadId}`;
    return this.apiservice.get(url, headers, httpParams).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  updateWageRegisterRowField(uploadId: number | string, excelRow: number | string, updatedData: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const url = `v1/admin/wage-register/import/${uploadId}/rows/${excelRow}`;
    return this.apiservice.patch(url, updatedData, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  submitWageRegister(uploadId: number | string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const url = `v1/admin/wage-register/import/${uploadId}/submit`;
    return this.apiservice.post(url, {}, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getWageRegisterReportDetails(reportId: number | string, page: number = 1, limit: number = 25, search?: string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim().length > 0) {
      httpParams = httpParams.set('search', search.trim());
    }

    const url = `v1/admin/wage-register/reports/${reportId}`;
    return this.apiservice.get(url, headers, httpParams).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  // Salary Wages master APIs start
  getWagesMasterData(tableSize: any, page: any) {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = `v1/admin/employee-wages`;
    if (tableSize !== 'all') {
      url = `v1/admin/employee-wages?per_page=${tableSize}&page=${page}`;
    }

    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getEmployeeWageByEmployeeId(employeeId: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const url = `v1/admin/employee-wages/employee/${employeeId}`;
    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  getWagesMatrixData(effectiveDate: string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const url = `v1/admin/employee-wages/matrix?effective_on=${effectiveDate}`;
    return this.apiservice.get(url, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }

  createSalaryWagesMaster(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      // 'Content-Type': 'application/json',
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    // Make the POST request to the server
    return this.apiservice.post(`v1/admin/employee-wages/bulk`, requestbody, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      }),
    );
  }
}



