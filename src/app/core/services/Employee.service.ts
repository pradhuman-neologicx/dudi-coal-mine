import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
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
  GetDashboardData() {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    var url = 'dashboard/summary';

    return this.apiservice.get(url, headers).pipe(
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


}
