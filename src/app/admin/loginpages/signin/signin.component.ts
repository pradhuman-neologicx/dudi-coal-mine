import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { JwtService } from 'src/app/core/services/jwt.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { LoginService } from 'src/app/core/services/login.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  animations: [
    trigger('succesfullyMesaage', [
      state(
        'void',
        style({
          transform: 'translateX(-30%)',
          opacity: 0,
        }),
      ),
      transition(':enter, :leave', [
        animate('0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'),
      ]),
    ]),
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            transform: 'translateX(0)', // Final position for slide-in effect
            opacity: 1, // Final opacity
          }),
        ),
      ]),
    ]),
  ],
})
export class SigninComponent implements OnInit {
  title = 'Login';
  signIn!: FormGroup;
  openSecondsuccess: boolean = false;
  successName: any = '';

  errorMessage: any;
  emailBackendError: string = '';
  passwordBackendError: string = '';
  submitted: boolean = false;
  showPassword: boolean = false;

  email_pattern = '^[A-Za-z0-9_.]+@[a-zA-Z]+(\\.[a-zA-Z]{2,4})+$';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private loginService: LoginService,
  ) { }

  ngOnInit(): void {
    this.signIn = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(this.email_pattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.signIn.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  closeModal() {
    this.openSecondsuccess = false;
  }

  onSignIn() {
    this.errorMessage = '';
    this.emailBackendError = '';
    this.passwordBackendError = '';
    this.submitted = true;

    if (this.signIn.valid) {
      const email = this.signIn.get('email')?.value;
      const password = this.signIn.get('password')?.value;

      const body = new FormData();
      body.append('email', email);
      body.append('password', password);

      this.loginService.AdminLoginapi(body).subscribe({
        next: (response: any) => {
          if (response && response.access_token) {
            this.successName = 'Login';
            this.openSecondsuccess = true;

            this.jwtService.savepanelUserId(response.user.id.toString());
            this.jwtService.saveadminame(response.user.email || 'Admin User');
            this.jwtService.saveAdminToken(response.access_token);
            this.jwtService.saveAdminRole(response.role);
            this.jwtService.isLoggedIn(true);

            setTimeout(() => {
              this.openSecondsuccess = false;
              this.router.navigate(['admin/dashboard']);
            }, 1500);
          } else if (response && (response.status === 422 || response.status === 401)) {
            const errorMsg = response.message || 'Invalid credentials';
            this.errorMessage = 'Invalid credentials';
            this.notificationService.show(errorMsg, 'error', 3000);
            this.signIn.markAllAsTouched();
          } else {
            const errorMsg = response?.message || 'Login failed. Please try again.';
            this.errorMessage = 'Invalid credentials';
            this.notificationService.show(errorMsg, 'error', 3000);
            this.signIn.markAllAsTouched();
          }
        },
        error: (err: any) => {
          console.log('Login error received:', err);

          let errorMsg = '';

          if (typeof err === 'string') {
            if (err.includes('Message:')) {
              errorMsg = err.split('Message:')[1].trim();
            } else {
              errorMsg = err;
            }
          } else if (err && err.message) {
            errorMsg = err.message;
          } else if (err && err.error && err.error.message) {
            errorMsg = err.error.message;
          } else {
            errorMsg = 'Invalid email or password';
          }

          this.errorMessage = 'Invalid credentials';
          this.notificationService.show(errorMsg, 'error', 3000);
          this.signIn.markAllAsTouched();
        }
      });
    } else {
      this.errorMessage = 'Please fill out all required fields correctly';
      this.signIn.markAllAsTouched();
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot_password']);
  }
}
