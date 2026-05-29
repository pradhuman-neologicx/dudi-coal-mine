import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SendOtp, OtpVerify } from '../../../core/model-class/login-signup';
import { Validations } from '../../../core/model-class/validations';
import { ApiService } from '../../../core/services/api.service';
import { DataService } from '../../../core/services/data.service';
import { JwtService } from '../../../core/services/jwt.service';
import { LoginService } from '../../../core/services/login.service';


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
    // NewOTP: SendOtp = new SendOtp();
    // OtpVerify: OtpVerify = new OtpVerify();
    // validation: Validations = new Validations();
  
    onSubmit() {
      if (this.ForgotForm.valid) {
        // Handle form submission here
        console.log(this.ForgotForm.value);
      }
      // You can perform form submission and validation here.
      if (this.Email && this.otp) {
        // Perform the action when both mobile number and OTP are provided.
        // For example, you can send the data to the server or navigate to the next page.
        console.log(
          'Form submitted with mobile number:',
          this.Email,
          'and OTP:',
          this.otp
        );
      } else {
        // Handle the case where either the mobile number or OTP is missing.
        console.log('Please fill in both mobile number and OTP fields.');
      }
    }
  
    ForgotForm!: FormGroup;
    loginAS!: number;
    email_pattern = "^[A-Za-z0-9_.]+@[a-zA-Z]+(\\.[a-zA-Z]{2,4})+$";
    constructor(
  
      private formBuilder: FormBuilder,
      private router: Router,
      private apiservice: ApiService,
      private dataService: DataService,
      private jwtService: JwtService,
      private loginService: LoginService
    ) { }
    ngOnInit() {
      // this.loginAS = this.jwtService.getLoginAs();
      this.ForgotForm = this.formBuilder.group({
        Email: ['', [Validators.required, Validators.email]],
      });
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
        // Bypass backend email checking API and navigate directly to OTP/Reset Password screen
        this.router.navigate(['/reset-password/1/dummy-token']);
      } else {
        this.submitted = false;
        this.errorMessage = 'please Enter All The Details';
        this.ForgotForm.markAllAsTouched();
        console.log(this.findInvalidControls(this.ForgotForm));
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