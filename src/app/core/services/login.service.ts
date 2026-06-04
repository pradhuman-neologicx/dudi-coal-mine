import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NotificationService } from './notificationnew.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private approvalStageMessage = new BehaviorSubject('');
  currentApprovalStageMessage = this.approvalStageMessage.asObservable();

  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService,
    private notificationService: NotificationService
  ) { }

  AdminLoginapi(body: any): Observable<any> {
    return this.apiservice.postWithoutHeader(`v1/auth/login`, body);
  }

  AdminForgetPasswordApi(body: any): Observable<any> {
    return this.apiservice.postWithoutHeader(`v1/auth/password/request`, body).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      })
    );
  }
  AdminVerifyOtpApi(body: any): Observable<any> {
    return this.apiservice.postWithoutHeader(`v1/auth/password/verify`, body).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      })
    );
  }

  AdminResetPasswordV1(body: any): Observable<any> {
    return this.apiservice.postWithoutHeader(`v1/auth/password/reset`, body);
  }

  VerifyOTPApi(body: any): Observable<any> {
    return this.apiservice.postWithoutHeader(`v1/auth/password/verify`, body).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      })
    );
  }

  AdminResetPassword(body: any, headers: any): Observable<any> {
    return this.apiservice.post(`reset-password`, body, headers).pipe(
      tap((error: any) => {
        console.log('Response received:', error);
        this.erromessagefunction(error);
      })
    );
  }

  Adminlogout(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(`${environment.api_url}v1/logout`, {}, { headers });
  }
  Emailverify(formData: any, headers: any) {
    return this.apiservice.post('login', formData, headers);
  }

  VerifyOTP(formData: any, headers: any) {
    return this.apiservice.post('verifyOtp', formData, headers);
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
          'Your token has been expired. Please login again.'
        ))
    ) {
      // Log the user out and navigate to sign-in page
      this.jwtService.clearStorage(); // Clear token (implement this method in your JwtService)
      // this.router.navigate(['/sign_in']); // Navigate to home route
      this.notificationService.show(errorMessage, 'error', 3000);
    } else if (error.status === 422 && error.errors) {
      if (
        typeof response.errors === 'object' &&
        response.errors !== null &&
        !Array.isArray(response.errors)
      ) {
        errorMessage = JSON.stringify(response.errors);
      } else {
        errorMessage = response.errors;
      }
      this.notificationService.show(errorMessage, 'error', 3000);
    } else if (error && error.message) {
      // Display error message
      const isSuccess = error.status === 200 || error.status === 201 || error.status === true || error.success === true;
      if (!isSuccess && !errorMessage.includes('success')) {
        this.notificationService.show(errorMessage, 'error', 3000);
      }
    }
  }
}
