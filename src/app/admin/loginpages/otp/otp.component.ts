import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  AbstractControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SendOtp, OtpVerify, ChangePassword, ChangePasswordresponse } from 'src/app/core/model-class/login-signup';
import { Validations } from 'src/app/core/model-class/validations';
import { ApiService } from 'src/app/core/services/api.service';
import { DataService } from 'src/app/core/services/data.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { LoginService } from 'src/app/core/services/login.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})

  export class OtpComponent implements OnInit {
    activeLink: string = 'Login';
    url1: any;
    userId: any;

    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

    toggleNewPasswordVisibility(): void {
      this.showNewPassword = !this.showNewPassword;
    }

    toggleConfirmPasswordVisibility(): void {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
    constructor(
      private formBuilder: FormBuilder,
      private router: Router,
      private apiservice: ApiService,
      private dataService: DataService,
      private jwtService: JwtService,
      private loginService: LoginService,
      private route: ActivatedRoute) {
      // this.dataService.changeMessage({ message: "reset" });
      // const urlDelimitators = new RegExp(/[?//,;&:#$+=%]/);
      // this.url1 = router.url.slice(0).split(urlDelimitators)[3];
      // this.userId = router.url.slice(0).split(urlDelimitators)[2];
      // console.log(this.userId);
      // console.log(this.url1);
    }
  
    ResetPassword!: FormGroup;
    Token: any;
    ngOnInit() {
      // this.userId = this.jwtService.getpanelUserId();
      this.route.url.subscribe(segments => {
        // Access the last segment which contains the token
        this.userId = segments[segments.length - 2].path;
        this.Token = segments[segments.length - 1].path;
        console.log('Extracted userId:', this.userId);
        console.log('Extracted Token:', this.Token);
      });
  
      this.ResetPassword = this.formBuilder.group({
        otp: ['', [Validators.required]],
        NewPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(16),
          ],
        ],
        confirmPassword: ['', Validators.required],
      }, { validator: this.passwordMatchValidator }
      );
    }
  
  
    passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
      const newPassword = control.get('NewPassword');
      const confirmPassword = control.get('confirmPassword');
  
      if (newPassword?.value !== confirmPassword?.value) {
        control.get('confirmPassword')?.setErrors({ 'passwordMismatch': true });
        return { 'passwordMismatch': true };
      }
  
      return null;
    }
  
    openSecondsuccess: boolean = false;
    successName: any = "";
    // reset pasword code
    ChangePassword: ChangePassword = new ChangePassword();
    ChangePasswordresponse: ChangePasswordresponse = new ChangePasswordresponse();
    errorMessage: any;
    submitted!: boolean;
    erroroutput: boolean = false;
  
  
    // changePassword(){
  
    // }
  
    changePassword() {
      this.errorMessage = '';
      if (this.ResetPassword.valid) {
        // Mock successful password reset flow directly for seamless local visual testing
        this.submitted = true;
        console.log("Success: Password reset locally");
        this.successName = 'Reset Password';
        
        setTimeout(() => {
          this.openSecondsuccess = true;
          setTimeout(() => {
            this.openSecondsuccess = false;
            this.ngOnInit();
            this.router.navigate(['/sign_in']);
          }, 1800);
        }, 200);
      } else {
        this.submitted = false;
        this.errorMessage = 'please Enter All The Details';
        this.ResetPassword.markAllAsTouched();
        console.log(this.findInvalidControls(this.ResetPassword));
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
  
    markAllAsTouched() {
      for (const control in this.ResetPassword.controls) {
        if (this.ResetPassword.controls.hasOwnProperty(control)) {
          this.ResetPassword.controls[control].markAsTouched();
        }
      }
    }
  
    isreset: boolean = false;
    closeModal() {
      this.openSecondsuccess = false;
    }
  }