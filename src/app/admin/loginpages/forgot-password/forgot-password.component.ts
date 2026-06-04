import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DataService } from '../../../core/services/data.service';
import { JwtService } from '../../../core/services/jwt.service';
import { LoginService } from '../../../core/services/login.service';
import { NotificationService } from '../../../core/services/notificationnew.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
    title = "Forgot Password";
    Email: string = '';
    activeLink: string = 'Login';
    isEmailCorrect: boolean = false;
    otp: string = '';
    isOtpSent: boolean = false;
    isOtpVerified: boolean = false;
    showPassword1: boolean = false;
    showPassword2: boolean = false;
  
    ForgotForm!: FormGroup;
    OtpForm!: FormGroup;
    ResetForm!: FormGroup;
    loginAS!: number;
    email_pattern = "^[A-Za-z0-9_.]+@[a-zA-Z]+(\\.[a-zA-Z]{2,4})+$";
    
    constructor(
      private formBuilder: FormBuilder,
      private router: Router,
      private apiservice: ApiService,
      private dataService: DataService,
      private jwtService: JwtService,
      private loginService: LoginService,
      private notificationService: NotificationService
    ) { }

    ngOnInit() {
      // this.loginAS = this.jwtService.getLoginAs();
      this.ForgotForm = this.formBuilder.group({
        Email: ['', [Validators.required, Validators.pattern(this.email_pattern)]],
      });

      this.OtpForm = this.formBuilder.group({
        otp: ['', [Validators.required]],
      });

      this.ResetForm = this.formBuilder.group({
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        new_password_confirmation: ['', [Validators.required]]
      }, { validator: this.passwordMatchValidator });
    }

    passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
      const newPassword = control.get('new_password');
      const confirmPassword = control.get('new_password_confirmation');
  
      if (newPassword?.value !== confirmPassword?.value) {
        control.get('new_password_confirmation')?.setErrors({ 'passwordMismatch': true });
        return { 'passwordMismatch': true };
      }
      return null;
    }

    openSecondsuccess: boolean = false;
    successName: any = "";
    errorMessage: any;
    submitted!: boolean;
    closeModal() {
      this.openSecondsuccess = false;
    }

    ForgetPasswordfun() {
      this.errorMessage = '';
      if (this.ForgotForm.valid) {
        this.submitted = true;
        const formData: FormData = new FormData();
        formData.append('email', this.ForgotForm.get('Email')?.value);
        
        this.loginService.AdminForgetPasswordApi(formData).subscribe({
          next: (response: any) => {
            if (response && (response.status === 200 || response.status === 201 || response.status === true || response.message)) {
              this.notificationService.show(response.message || 'OTP sent successfully.', 'success');
              // Switch to the Reset Password form
              this.isOtpSent = true;
              this.submitted = false;
            } else {
              this.errorMessage = response.message || 'Failed to send request';
              this.submitted = false;
            }
          },
          error: (err: any) => {
            console.error(err);
            this.errorMessage = err?.message || err?.error?.message || 'Request failed';
            this.submitted = false;
          }
        });
      } else {
        this.submitted = false;
        this.errorMessage = 'Please Enter All The Details';
        this.ForgotForm.markAllAsTouched();
        console.log(this.findInvalidControls(this.ForgotForm));
      }
    }

    VerifyOtpfun() {
      this.errorMessage = '';
      if (this.OtpForm.valid) {
        this.submitted = true;
        const formData: FormData = new FormData();
        formData.append('email', this.ForgotForm.get('Email')?.value);
        formData.append('otp', this.OtpForm.get('otp')?.value);
        
        this.loginService.AdminVerifyOtpApi(formData).subscribe({
          next: (response: any) => {
            if (response && (response.status === 200 || response.status === 201 || response.status === true || response.message)) {
              this.notificationService.show(response.message || 'OTP verified successfully.', 'success');
              this.isOtpVerified = true;
              this.submitted = false;
            } else {
              this.errorMessage = response.message || 'Failed to verify OTP';
              this.submitted = false;
            }
          },
          error: (err: any) => {
            console.error(err);
            this.errorMessage = err?.message || err?.error?.message || 'Request failed';
            this.submitted = false;
          }
        });
      } else {
        this.submitted = false;
        this.errorMessage = 'Please Enter OTP';
        this.OtpForm.markAllAsTouched();
      }
    }

    ResetPasswordfun() {
      this.errorMessage = '';
      if (this.ResetForm.valid) {
        this.submitted = true;
        const formData: FormData = new FormData();
        formData.append('email', this.ForgotForm.get('Email')?.value);
        formData.append('new_password', this.ResetForm.get('new_password')?.value);
        formData.append('new_password_confirmation', this.ResetForm.get('new_password_confirmation')?.value);
        
        this.loginService.AdminResetPasswordV1(formData).subscribe({
          next: (response: any) => {
            if (response && (response.status === 200 || response.status === 201 || response.status === true || response.message)) {
              this.notificationService.show(response.message || 'Password reset successfully.', 'success');
              // Wait briefly for the user to see the success toast before redirecting
              setTimeout(() => {
                this.router.navigate(['/sign_in']);
              }, 2000);
            } else {
              this.errorMessage = response.message || 'Failed to reset password';
              this.submitted = false;
            }
          },
          error: (err: any) => {
            console.error(err);
            this.errorMessage = err?.message || err?.error?.message || 'Request failed';
            this.submitted = false;
          }
        });
      } else {
        this.submitted = false;
        this.errorMessage = 'Please Enter All The Details correctly';
        this.ResetForm.markAllAsTouched();
      }
    }
  
  
  
  
    findInvalidControls(formName: any) {
      const invalid = [];
      const controls = formName.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }
      }
      console.log(invalid);
      return invalid;
    }
  
  }